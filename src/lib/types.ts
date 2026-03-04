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
}

export type MessageFormat = "formatA" | "formatB" | "formatC";
