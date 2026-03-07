import { fetchBerlinVenues, fetchOpenMatches } from "./client";
import { mapToMatch } from "./mapToMatch";
import { bulkUpsertMatches } from "@/lib/db/matches";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { updatePollStatus } from "@/lib/db/pollStatus";

export async function pollAndCleanup() {
  const supabase = getSupabaseAdminClient();
  const now = new Date();
  const fromDate = now.toISOString().split("T")[0];

  // 1. Soft-delete matches that have already happened
  const { count: expired } = await supabase
    .from("matches")
    .update({ archived_at: now.toISOString(), archive_reason: "expired" })
    .is("archived_at", null)
    .lt("match_time", now.toISOString());

  // 2. Fetch all Berlin venues
  const venues = await fetchBerlinVenues();

  // 3. Fetch all matches per venue in parallel, classify them
  const validPlaytomicIds = new Set<string>();
  const errors: string[] = [];

  type ArchiveEntry = { parsed: ReturnType<typeof mapToMatch>; reason: string };
  const openParsed: ReturnType<typeof mapToMatch>[] = [];
  const archiveEntries: ArchiveEntry[] = [];

  const fetchResults = await Promise.allSettled(
    venues.map(async (venue) => {
      const matches = await fetchOpenMatches(venue.tenant_id, fromDate);
      const open: ReturnType<typeof mapToMatch>[] = [];
      const archive: ArchiveEntry[] = [];
      for (const m of matches) {
        const confirmedPlayers = m.teams.reduce((sum: number, t) => sum + t.players.length, 0);
        const maxPlayers = m.teams.reduce((sum: number, t) => sum + t.max_players, 0);
        const isCanceled = m.status !== "PENDING";
        const isFull = confirmedPlayers >= maxPlayers;
        const isEmpty = confirmedPlayers === 0;
        const parsed = mapToMatch(m);
        if (isFull) {
          archive.push({ parsed, reason: "filled" });
        } else if (isCanceled) {
          archive.push({ parsed, reason: "canceled" });
        } else if (isEmpty) {
          archive.push({ parsed, reason: "empty" });
        } else {
          validPlaytomicIds.add(m.match_id);
          open.push(parsed);
        }
      }
      return { open, archive };
    })
  );

  for (const r of fetchResults) {
    if (r.status === "fulfilled") {
      openParsed.push(...r.value.open);
      archiveEntries.push(...r.value.archive);
    } else {
      errors.push(String(r.reason));
    }
  }

  // 4. Bulk upsert all matches (open + archived for analytics)
  const allParsed = [...openParsed, ...archiveEntries.map((e) => e.parsed)];
  const bulkResult = await bulkUpsertMatches(supabase, allParsed, "playtomic_api");
  errors.push(...bulkResult.errors);

  // 5. Archive full/canceled/empty matches with reason
  const reasonsByPlaytomicId = new Map<string, string>();
  for (const entry of archiveEntries) {
    if (entry.parsed.playtomicId) {
      reasonsByPlaytomicId.set(entry.parsed.playtomicId, entry.reason);
    }
  }

  // Group by reason to batch updates
  const idsByReason = new Map<string, string[]>();
  for (const [playtomicId, reason] of reasonsByPlaytomicId) {
    if (!idsByReason.has(reason)) idsByReason.set(reason, []);
    idsByReason.get(reason)!.push(playtomicId);
  }

  const CHUNK = 500;
  for (const [reason, ids] of idsByReason) {
    for (let i = 0; i < ids.length; i += CHUNK) {
      await supabase
        .from("matches")
        .update({ archived_at: now.toISOString(), archive_reason: reason })
        .in("playtomic_id", ids.slice(i, i + CHUNK));
    }
  }

  // 6. Archive stale DB matches not in fresh Playtomic data
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
      .update({ archived_at: now.toISOString(), archive_reason: "stale" })
      .in("id", staleIds);
    stale = archived ?? 0;
  }

  const result = {
    ok: true,
    expired: expired ?? 0,
    upserted: bulkResult.upserted,
    stale: stale ?? 0,
    errors,
  };

  await updatePollStatus(supabase, result);

  return result;
}
