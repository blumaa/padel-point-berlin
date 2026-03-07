import type { Match } from "@/lib/types";

export type TimePeriod = "30d" | "90d" | "6m" | "1y" | "all";

export interface AnalyticsFilterState {
  period: TimePeriod;
  venues: string[];
}

export const DEFAULT_ANALYTICS_FILTERS: AnalyticsFilterState = {
  period: "90d",
  venues: [],
};

const PERIOD_MS: Record<Exclude<TimePeriod, "all">, number> = {
  "30d": 30 * 24 * 60 * 60 * 1000,
  "90d": 90 * 24 * 60 * 60 * 1000,
  "6m": 182 * 24 * 60 * 60 * 1000,
  "1y": 365 * 24 * 60 * 60 * 1000,
};

export function filterMatches(
  matches: Match[],
  filters: AnalyticsFilterState,
  now: Date = new Date(),
): Match[] {
  let result = matches;

  if (filters.period !== "all") {
    const cutoff = now.getTime() - PERIOD_MS[filters.period];
    result = result.filter((m) => new Date(m.match_time).getTime() >= cutoff);
  }

  if (filters.venues.length > 0) {
    const venueSet = new Set(filters.venues);
    result = result.filter((m) => m.venue !== null && venueSet.has(m.venue));
  }

  return result;
}
