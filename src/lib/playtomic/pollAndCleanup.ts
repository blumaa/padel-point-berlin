import { fetchBerlinVenues, fetchOpenMatches } from "./client";
import { mapToMatch } from "./mapToMatch";
import { upsertMatch } from "@/lib/db/matches";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function pollAndCleanup() {
  const supabase = getSupabaseAdminClient();
  const now = new Date();
  const fromDate = now.toISOString().split("T")[0];
  const toDate = new Date(now);
  toDate.setDate(toDate.getDate() + 14);
  const toDateStr = toDate.toISOString().split("T")[0];

  // 1. Delete matches that have already happened
  const { count: expired } = await supabase
    .from("matches")
    .delete({ count: "exact" })
    .lt("match_time", now.toISOString());

  // 2. Fetch all Berlin venues
  const venues = await fetchBerlinVenues();

  // 3. Fetch open matches per venue, upsert valid ones, collect valid IDs
  // Only track tenant IDs that successfully returned data — so we don't
  // accidentally delete matches from a venue whose API call failed.
  const validPlaytomicIds = new Set<string>();
  const successfulTenantIds = new Set<string>();
  const errors: string[] = [];
  let upserted = 0;

  const results = await Promise.allSettled(
    venues.map(async (venue) => {
      const matches = await fetchOpenMatches(venue.tenant_id, fromDate);
      successfulTenantIds.add(venue.tenant_id);
      let count = 0;
      for (const m of matches) {
        const confirmedPlayers = m.teams.reduce((sum: number, t) => sum + t.players.length, 0);
        const maxPlayers = m.teams.reduce((sum: number, t) => sum + t.max_players, 0);
        if (confirmedPlayers === 0 || confirmedPlayers >= maxPlayers) continue;
        validPlaytomicIds.add(m.match_id);
        const parsed = mapToMatch(m);
        await upsertMatch(supabase, parsed, null, "playtomic_api");
        count++;
      }
      return { venue: venue.tenant_name, count };
    })
  );

  for (const r of results) {
    if (r.status === "fulfilled") {
      upserted += r.value.count;
    } else {
      errors.push(String(r.reason));
    }
  }

  // 4. Remove stale future matches (canceled, full, or disappeared from API),
  // scoped to venues that successfully responded so a failed API call
  // doesn't wipe out that venue's matches.
  const successfulVenueNames = venues
    .filter((v) => successfulTenantIds.has(v.tenant_id))
    .map((v) => v.tenant_name);

  let stale = 0;
  if (successfulVenueNames.length > 0) {
    let q = supabase
      .from("matches")
      .delete({ count: "exact" })
      .eq("source_group", "playtomic_api")
      .in("venue", successfulVenueNames)
      .gte("match_time", `${fromDate}T00:00:00Z`)
      .lt("match_time", `${toDateStr}T00:00:00Z`);

    if (validPlaytomicIds.size > 0) {
      q = q.not("playtomic_id", "in", `(${[...validPlaytomicIds].join(",")})`);
    }

    const { count: deleted } = await q;
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
