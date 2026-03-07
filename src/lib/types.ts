export type MatchType = "match" | "class" | "unknown";
export type PlayerStatus = "confirmed" | "open";
export type MatchCategory = "Open" | "Women" | "Men" | "Mixed";

export interface Player {
  name: string;
  level: number | null;
  status: PlayerStatus;
  slotOrder: number;
}

export interface ParsedMatch {
  playtomicId: string | null;
  playtomicUrl: string | null;
  title: string;
  matchType: MatchType;
  matchTime: Date;
  durationMin: number | null;
  venue: string | null;
  levelMin: number | null;
  levelMax: number | null;
  category: MatchCategory;
  players: Player[];
  indoor?: "indoor" | "outdoor" | null;
  competitionMode?: "friendly" | "competitive" | null;
  visibility?: string | null;
}

export type MessageFormat = "formatA" | "formatB" | "formatC";

/** Shape returned by Supabase for a match row with match_players joined. */
export interface MatchPlayer {
  id: string;
  match_id: string;
  name: string;
  level: number | null;
  status: string;
  slot_order: number;
}

export interface Match {
  id: string;
  title: string;
  match_type: string;
  match_time: string;
  duration_min: number | null;
  venue: string | null;
  level_min: number | null;
  level_max: number | null;
  category: string;
  indoor: string | null;
  competition_mode: string | null;
  source_group: string | null;
  playtomic_url: string | null;
  visibility: string | null;
  created_at: string;
  match_players: MatchPlayer[];
}
