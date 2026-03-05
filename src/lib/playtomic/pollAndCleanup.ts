import { fetchBerlinVenues, fetchOpenMatches } from "./client";
import { mapToMatch } from "./mapToMatch";
import { upsertMatch } from "@/lib/db/matches";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function pollAndCleanup() {
  const supabase = getSupabaseAdminClient();
  const now = new Date();
  const fromDate = now.toISOString().split("T")[0];

  // 1. Delete matches that have already happened
  const { count: expired } = await supabase
    .from("matches")
    .delete({ count: "exact" })
    .lt("match_time", now.toISOString());

  // 2. Fetch all Berlin venues
  const venues = await fetchBerlinVenues();

  // 3. Fetch open matches per venue, upsert valid ones, collect valid IDs
  const validPlaytomicIds = new Set<string>();
  const errors: string[] = [];
  let upserted = 0;

  const results = await Promise.allSettled(
    venues.map(async (venue) => {
      const matches = await fetchOpenMatches(venue.tenant_id, fromDate);
      let count = 0;
      for (const m of matches) {
        const confirmedPlayers = m.teams.reduce((sum: number, t) => sum + t.players.length, 0);
        const maxPlayers = m.teams.reduce((sum: number, t) => sum + t.max_players, 0);
        const isCanceled = m.status !== "PENDING";
        const isFull = confirmedPlayers >= maxPlayers;
        const isEmpty = confirmedPlayers === 0;
        if (isCanceled || isFull || isEmpty) continue;
        validPlaytomicIds.add(m.match_id);
        const parsed = mapToMatch(m);
        await upsertMatch(supabase, parsed, null, "playtomic_api");
        count++;
      }
      return count;
    })
  );

  for (const r of results) {
    if (r.status === "fulfilled") upserted += r.value;
    else errors.push(String(r.reason));
  }

  // 4. Delete any DB match that wasn't in the fresh Playtomic data
  // (canceled, full, or otherwise gone).
  // We diff in JS to avoid a huge NOT IN (...) URL that exceeds HTTP limits.
  let stale = 0;
  const { data: existingRows } = await supabase
    .from("matches")
    .select("id, playtomic_id")
    .eq("source_group", "playtomic_api")
    .gt("match_time", now.toISOString());

  const staleIds = (existingRows ?? [])
    .filter((r) => r.playtomic_id && !validPlaytomicIds.has(r.playtomic_id))
    .map((r) => r.id as string);

  if (staleIds.length > 0) {
    const { count: deleted } = await supabase
      .from("matches")
      .delete({ count: "exact" })
      .in("id", staleIds);
    stale = deleted ?? 0;
  }

  return {
    ok: true,
    expired: expired ?? 0,
    upserted,
    stale: stale ?? 0,
    errors,
  };
}
