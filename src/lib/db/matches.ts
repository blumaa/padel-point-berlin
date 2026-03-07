import type { SupabaseClient } from "@supabase/supabase-js";
import type { ParsedMatch } from "@/lib/types";
import { normalizeVenue } from "@/lib/parser/normalizeVenue";

function toMatchRow(match: ParsedMatch, rawMessageId: string | null, sourceGroup: string, communityName?: string | null, sharedInWhatsapp = false) {
  return {
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
    competition_mode: match.competitionMode ?? null,
    visibility: match.visibility ?? "VISIBLE",
    shared_in_whatsapp: sharedInWhatsapp,
  };
}

function deduplicatePlayers(players: ParsedMatch["players"]) {
  const seen = new Set<number>();
  return players.filter((p) => {
    if (seen.has(p.slotOrder)) return false;
    seen.add(p.slotOrder);
    return true;
  });
}

const CHUNK_SIZE = 500;

export async function bulkUpsertMatches(
  supabase: SupabaseClient,
  matches: ParsedMatch[],
  sourceGroup: string,
): Promise<{ upserted: number; errors: string[] }> {
  if (matches.length === 0) return { upserted: 0, errors: [] };

  const errors: string[] = [];
  const allMatchIds: string[] = [];

  // Preserve shared_in_whatsapp flag for matches already marked as shared
  const { data: sharedRows } = await supabase
    .from("matches")
    .select("playtomic_id")
    .eq("shared_in_whatsapp", true);
  const sharedIds = new Set((sharedRows ?? []).map((r: { playtomic_id: string }) => r.playtomic_id));

  // 1. Bulk upsert match rows in chunks
  const rows = matches.map((m) => ({
    ...toMatchRow(m, null, sourceGroup),
    shared_in_whatsapp: sharedIds.has(m.playtomicId!) || false,
  }));

  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE);
    const { data, error } = await supabase
      .from("matches")
      .upsert(chunk, { onConflict: "playtomic_id" })
      .select("id");

    if (error) {
      errors.push(`bulk upsert chunk ${i}: ${error.message}`);
      continue;
    }
    for (const row of data) allMatchIds.push(row.id as string);
  }

  if (allMatchIds.length === 0) return { upserted: 0, errors };

  // 2. Bulk delete existing players for all upserted matches
  for (let i = 0; i < allMatchIds.length; i += CHUNK_SIZE) {
    const chunk = allMatchIds.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase
      .from("match_players")
      .delete()
      .in("match_id", chunk);

    if (error) errors.push(`bulk delete players chunk ${i}: ${error.message}`);
  }

  // 3. Bulk insert all players
  // We need to map parsed players to their DB match IDs.
  // The upsert returned IDs in the same order as the input rows.
  const allPlayerRows: { match_id: string; name: string; level: number | null; status: string; slot_order: number }[] = [];

  for (let idx = 0; idx < allMatchIds.length; idx++) {
    const matchId = allMatchIds[idx];
    const players = deduplicatePlayers(matches[idx].players);
    for (const p of players) {
      allPlayerRows.push({
        match_id: matchId,
        name: p.name,
        level: p.level,
        status: p.status,
        slot_order: p.slotOrder,
      });
    }
  }

  for (let i = 0; i < allPlayerRows.length; i += CHUNK_SIZE) {
    const chunk = allPlayerRows.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase
      .from("match_players")
      .insert(chunk);

    if (error) errors.push(`bulk insert players chunk ${i}: ${error.message}`);
  }

  return { upserted: allMatchIds.length, errors };
}

export async function upsertMatch(
  supabase: SupabaseClient,
  match: ParsedMatch,
  rawMessageId: string | null,
  sourceGroup: string,
  communityName?: string | null,
  sharedInWhatsapp = false
) {
  // WhatsApp path: if match already exists (from API), keep API metadata
  // but update players (more real-time) and set the shared flag.
  if (sharedInWhatsapp && match.playtomicId) {
    const { data: existing } = await supabase
      .from("matches")
      .select("id")
      .eq("playtomic_id", match.playtomicId)
      .maybeSingle();

    if (existing) {
      const matchId = existing.id as string;

      const { error: flagError } = await supabase
        .from("matches")
        .update({
          shared_in_whatsapp: true,
          archived_at: null,
          archive_reason: null,
          raw_message_id: rawMessageId,
        })
        .eq("id", matchId);

      if (flagError) throw flagError;

      await replacePlayers(supabase, matchId, match.players);
      return matchId;
    }
  }

  // Match doesn't exist yet — full upsert
  const row = toMatchRow(match, rawMessageId, sourceGroup, communityName, sharedInWhatsapp);

  if (sharedInWhatsapp) {
    Object.assign(row, { archived_at: null, archive_reason: null });
  }

  const { data, error } = await supabase
    .from("matches")
    .upsert(row, { onConflict: "playtomic_id" })
    .select("id")
    .single();

  if (error) throw error;
  const matchId = data.id as string;

  await replacePlayers(supabase, matchId, match.players);
  return matchId;
}

async function replacePlayers(
  supabase: SupabaseClient,
  matchId: string,
  players: ParsedMatch["players"]
) {
  const { error: deleteError } = await supabase
    .from("match_players")
    .delete()
    .eq("match_id", matchId);

  if (deleteError) throw deleteError;

  if (players.length > 0) {
    const seen = new Set<number>();
    const uniquePlayers = players.filter((p) => {
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
  competitionMode?: "friendly" | "competitive" | null;
}

export async function getUpcomingMatches(
  supabase: SupabaseClient,
  query: MatchQuery = {}
) {
  let q = supabase
    .from("matches")
    .select("*, match_players(*)")
    .is("archived_at", null)
    .or("visibility.is.null,visibility.neq.HIDDEN,shared_in_whatsapp.eq.true")
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

  if (query.competitionMode != null) {
    q = q.eq("competition_mode", query.competitionMode);
  }

  const { data, error } = await q;
  if (error) throw error;
  return data;
}
