import type { PlaytomicMatch } from "./types";
import { fetchBerlinVenues, fetchOpenMatches } from "./client";
import { mapToMatch } from "./mapToMatch";
import { upsertMatch } from "@/lib/db/matches";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { updatePollStatus } from "@/lib/db/pollStatus";

export async function pollAndCleanup() {
  const supabase = getSupabaseAdminClient();
  const now = new Date();
  const fromDate = now.toISOString().split("T")[0];

  // 1. Soft-delete matches that have already happened
  const { count: expired } = await supabase
    .from("matches")
    .update({ archived_at: now.toISOString() })
    .is("archived_at", null)
    .lt("match_time", now.toISOString());

  // 2. Fetch all Berlin venues
  const venues = await fetchBerlinVenues();

  // 3. Fetch open matches per venue in parallel, collect valid ones
  const validPlaytomicIds = new Set<string>();
  const errors: string[] = [];
  let upserted = 0;

  const allValid: { match: PlaytomicMatch; parsed: ReturnType<typeof mapToMatch> }[] = [];

  const fetchResults = await Promise.allSettled(
    venues.map(async (venue) => {
      const matches = await fetchOpenMatches(venue.tenant_id, fromDate);
      const valid: typeof allValid = [];
      for (const m of matches) {
        const confirmedPlayers = m.teams.reduce((sum: number, t) => sum + t.players.length, 0);
        const maxPlayers = m.teams.reduce((sum: number, t) => sum + t.max_players, 0);
        const isCanceled = m.status !== "PENDING";
        const isFull = confirmedPlayers >= maxPlayers;
        const isEmpty = confirmedPlayers === 0;
        if (isCanceled || isFull || isEmpty) continue;
        validPlaytomicIds.add(m.match_id);
        valid.push({ match: m, parsed: mapToMatch(m) });
      }
      return valid;
    })
  );

  for (const r of fetchResults) {
    if (r.status === "fulfilled") allValid.push(...r.value);
    else errors.push(String(r.reason));
  }

  // 4. Upsert valid matches in parallel batches
  const BATCH_SIZE = 20;
  for (let i = 0; i < allValid.length; i += BATCH_SIZE) {
    const batch = allValid.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(({ parsed }) => upsertMatch(supabase, parsed, null, "playtomic_api"))
    );
    for (const r of results) {
      if (r.status === "fulfilled") upserted++;
      else errors.push(String(r.reason));
    }
  }

  // 4. Delete any DB match that wasn't in the fresh Playtomic data
  // (canceled, full, or otherwise gone).
  // We diff in JS to avoid a huge NOT IN (...) URL that exceeds HTTP limits.
  let stale = 0;
  const { data: existingRows } = await supabase
    .from("matches")
    .select("id, playtomic_id")
    .eq("source_group", "playtomic_api")
    .is("archived_at", null)
    .gt("match_time", now.toISOString());

  const staleIds = (existingRows ?? [])
    .filter((r) => r.playtomic_id && !validPlaytomicIds.has(r.playtomic_id))
    .map((r) => r.id as string);

  if (staleIds.length > 0) {
    const { count: archived } = await supabase
      .from("matches")
      .update({ archived_at: now.toISOString() })
      .in("id", staleIds);
    stale = archived ?? 0;
  }

  const result = {
    ok: true,
    expired: expired ?? 0,
    upserted,
    stale: stale ?? 0,
    errors,
  };

  await updatePollStatus(supabase, result);

  return result;
}
