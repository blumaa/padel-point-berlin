export interface VenueCount { venue: string; count: number }
export interface PeakTimeRow { weekday: string; slots: { morning: number; afternoon: number; evening: number } }
export interface LevelBucket { label: string; count: number }
export interface FillRateRow { venue: string; percentage: number; filled: number; total: number }
export interface WeekCount { week: string; count: number }
export interface OutcomeMonth { month: string; filled: number; canceled: number; empty: number; expired: number; stale: number; pending: number }
export interface OutcomeSummary { reason: string; count: number }
export interface LeadTimeRow { venue: string; avgDays: number }

export type TimePeriod = "30d" | "90d" | "6m" | "1y" | "all";
export type OutcomeFilter = "filled" | "canceled" | "pending" | "expired" | "empty";

export interface AnalyticsFilterState {
  period: TimePeriod;
  venues: string[];
  outcomes: OutcomeFilter[];
  categories: string[];
}

export const DEFAULT_ANALYTICS_FILTERS: AnalyticsFilterState = {
  period: "30d",
  venues: [],
  outcomes: [],
  categories: [],
};

export interface AnalyticsData {
  totalMatches: number;
  filledCount: number;
  overallFillRate: number;
  avgPerWeek: number;
  topVenue: string | null;
  earliestDate: string | null;
  latestDate: string | null;
  venuePopularity: VenueCount[];
  peakMatchTimes: PeakTimeRow[];
  levelDistribution: LevelBucket[];
  fillRate: FillRateRow[];
  matchesPerWeek: WeekCount[];
  outcomeByMonth: OutcomeMonth[];
  outcomeSummary: OutcomeSummary[];
  averageLeadTime: LeadTimeRow[];
}

export function emptyAnalyticsData(): AnalyticsData {
  return {
    totalMatches: 0,
    filledCount: 0,
    overallFillRate: 0,
    avgPerWeek: 0,
    topVenue: null,
    earliestDate: null,
    latestDate: null,
    venuePopularity: [],
    peakMatchTimes: [],
    levelDistribution: [],
    fillRate: [],
    matchesPerWeek: [],
    outcomeByMonth: [],
    outcomeSummary: [],
    averageLeadTime: [],
  };
}

const REQUIRED_FIELDS: (keyof AnalyticsData)[] = [
  "totalMatches",
  "filledCount",
  "overallFillRate",
  "avgPerWeek",
  "topVenue",
  "earliestDate",
  "latestDate",
  "venuePopularity",
  "peakMatchTimes",
  "levelDistribution",
  "fillRate",
  "matchesPerWeek",
  "outcomeByMonth",
  "outcomeSummary",
  "averageLeadTime",
];

export function validateAnalyticsResponse(data: unknown): data is AnalyticsData {
  if (data == null || typeof data !== "object") return false;
  const obj = data as Record<string, unknown>;
  return REQUIRED_FIELDS.every((field) => field in obj);
}
