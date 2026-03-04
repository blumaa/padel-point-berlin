import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParsedMatch } from "@/lib/types";
import { normalizeVenue } from "@/lib/parser/normalizeVenue";

export async function upsertMatch(
  supabase: SupabaseClient,
  match: ParsedMatch,
  rawMessageId: string | null,
  sourceGroup: string,
  communityName?: string | null
) {
  const { data, error } = await supabase
    .from("matches")
    .upsert(
      {
        playtomic_id: match.playtomicId,
        raw_message_id: rawMessageId,
        title: match.title,
        match_type: match.matchType,
        match_time: match.matchTime.toISOString(),
        duration_min: match.durationMin,
        venue: normalizeVenue(match.venue) ?? normalizeVenue(communityName ?? null) ?? null,
        level_min: match.levelMin,
        level_max: match.levelMax,
        category: match.category,
        source_group: sourceGroup,
        playtomic_url: match.playtomicUrl,
        indoor: match.indoor ?? null,
      },
      { onConflict: "playtomic_id" }
    )
    .select("id")
    .single();

  if (error) throw error;
  const matchId = data.id as string;

  const { error: deleteError } = await supabase
    .from("match_players")
    .delete()
    .eq("match_id", matchId);

  if (deleteError) throw deleteError;

  if (match.players.length > 0) {
    // Deduplicate by slot_order before inserting (guards against replayed messages)
    const seen = new Set<number>();
    const uniquePlayers = match.players.filter((p) => {
      if (seen.has(p.slotOrder)) return false;
      seen.add(p.slotOrder);
      return true;
    });

    const { error: playersError } = await supabase
      .from("match_players")
      .insert(
        uniquePlayers.map((p) => ({
          match_id: matchId,
          name: p.name,
          level: p.level,
          status: p.status,
          slot_order: p.slotOrder,
        }))
      );

    if (playersError) throw playersError;
  }

  return matchId;
}

const TIME_SLOTS = {
  morning:   { start: "T06:00:00", end: "T11:59:59" },
  afternoon: { start: "T12:00:00", end: "T16:59:59" },
  evening:   { start: "T17:00:00", end: "T23:59:59" },
} as const;

export interface MatchQuery {
  dates?: string[];
  timeOfDay?: string[];
  levelMin?: number;
  levelMax?: number;
  venues?: string[];
  category?: string;
  indoor?: "indoor" | "outdoor" | null;
}

export async function getUpcomingMatches(
  supabase: SupabaseClient,
  query: MatchQuery = {}
) {
  let q = supabase
    .from("matches")
    .select("*, match_players(*)")
    .gte("match_time", new Date().toISOString())
    .order("match_time", { ascending: true })
    .limit(5000);

  if (query.dates && query.dates.length > 0) {
    const allSlots = Object.keys(TIME_SLOTS) as (keyof typeof TIME_SLOTS)[];
    const activeSlots = (query.timeOfDay && query.timeOfDay.length > 0
      ? query.timeOfDay.filter((t): t is keyof typeof TIME_SLOTS => t in TIME_SLOTS)
      : allSlots);

    const ranges: string[] = [];
    for (const d of query.dates) {
      for (const slot of activeSlots) {
        const { start, end } = TIME_SLOTS[slot];
        ranges.push(`and(match_time.gte.${d}${start},match_time.lte.${d}${end})`);
      }
    }
    if (ranges.length > 0) q = q.or(ranges.join(","));
  }

  if (query.levelMin != null) {
    q = q.gte("level_min", query.levelMin);
  }

  if (query.levelMax != null) {
    q = q.lte("level_max", query.levelMax);
  }

  if (query.venues && query.venues.length > 0) {
    q = q.in("venue", query.venues);
  }

  if (query.category) {
    q = q.eq("category", query.category);
  }

  if (query.indoor != null) {
    q = q.eq("indoor", query.indoor);
  }

  const { data, error } = await q;
  if (error) throw error;
  return data;
}
