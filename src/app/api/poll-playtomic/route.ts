import { NextResponse } from "next/server";
import { fetchBerlinVenues, fetchOpenMatches } from "@/lib/playtomic/client";
import { mapToMatch } from "@/lib/playtomic/mapToMatch";
import { upsertMatch } from "@/lib/db/matches";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  const fromDate = new Date().toISOString().split("T")[0];

  let venues;
  try {
    venues = await fetchBerlinVenues();
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to fetch venues: ${String(err)}` },
      { status: 502 }
    );
  }

  const results = await Promise.allSettled(
    venues.map(async (venue) => {
      const matches = await fetchOpenMatches(venue.tenant_id, fromDate);
      let count = 0;
      for (const m of matches) {
        const confirmedPlayers = m.teams.reduce((sum, t) => sum + t.players.length, 0);
        const maxPlayers = m.teams.reduce((sum, t) => sum + t.max_players, 0);
        if (confirmedPlayers === 0 || confirmedPlayers >= maxPlayers) continue;
        const parsed = mapToMatch(m);
        await upsertMatch(supabase, parsed, null, "playtomic_api");
        count++;
      }
      return count;
    })
  );

  const errors: string[] = [];
  let upserted = 0;

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (r.status === "fulfilled") {
      upserted += r.value;
    } else {
      errors.push(`${venues[i].tenant_name}: ${String(r.reason)}`);
    }
  }

  return NextResponse.json({ ok: true, upserted, errors });
}
