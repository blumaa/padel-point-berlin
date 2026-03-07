import type { Match } from "@/lib/types";

export interface VenueCount { venue: string; count: number }
export interface PeakTimeRow { weekday: string; slots: { morning: number; afternoon: number; evening: number } }
export interface LevelBucket { label: string; count: number }
export interface FillRateRow { venue: string; percentage: number; filled: number; total: number }
export interface WeekCount { week: string; count: number }
export interface CategoryCount { category: string; count: number }
export interface IndoorOutdoorMonth { month: string; indoor: number; outdoor: number }
export interface LeadTimeRow { venue: string; avgDays: number }
export interface CompetitiveMonth { month: string; friendly: number; competitive: number }
export interface OutcomeMonth { month: string; filled: number; canceled: number; empty: number; expired: number; stale: number; pending: number }
export interface OutcomeSummary { reason: string; count: number }

export interface AnalyticsData {
  totalMatches: number;
  earliestDate: string | null;
  latestDate: string | null;
  venuePopularity: VenueCount[];
  peakMatchTimes: PeakTimeRow[];
  levelDistribution: LevelBucket[];
  fillRate: FillRateRow[];
  matchesPerWeek: WeekCount[];
  categoryBreakdown: CategoryCount[];
  indoorOutdoorByMonth: IndoorOutdoorMonth[];
  averageLeadTime: LeadTimeRow[];
  friendlyVsCompetitive: CompetitiveMonth[];
  outcomeByMonth: OutcomeMonth[];
  outcomeSummary: OutcomeSummary[];
}

// Monday-first for Berlin audience
const WEEKDAYS_MONDAY = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function getMonthKey(dt: Date): string {
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, "0")}`;
}

function getWeekKey(dt: Date): string {
  const d = new Date(dt);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay() + 1); // Monday
  return d.toISOString().split("T")[0];
}

function getTimeSlot(hour: number): "morning" | "afternoon" | "evening" {
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

// Convert JS getUTCDay() (0=Sun) to Monday-first index (0=Mon)
function toMondayIndex(jsDay: number): number {
  return (jsDay + 6) % 7;
}

export function aggregateAnalytics(matches: Match[]): AnalyticsData {
  if (matches.length === 0) {
    return {
      totalMatches: 0,
      earliestDate: null,
      latestDate: null,
      venuePopularity: [],
      peakMatchTimes: WEEKDAYS_MONDAY.map(w => ({ weekday: w, slots: { morning: 0, afternoon: 0, evening: 0 } })),
      levelDistribution: [],
      fillRate: [],
      matchesPerWeek: [],
      categoryBreakdown: [],
      indoorOutdoorByMonth: [],
      averageLeadTime: [],
      friendlyVsCompetitive: [],
      outcomeByMonth: [],
      outcomeSummary: [],
    };
  }

  // Summary metadata
  const times = matches.map(m => m.match_time).sort();
  const earliestDate = times[0];
  const latestDate = times[times.length - 1];

  // Venue Popularity
  const venueCounts = new Map<string, number>();
  for (const m of matches) {
    const v = m.venue ?? "Unknown";
    venueCounts.set(v, (venueCounts.get(v) ?? 0) + 1);
  }
  const venuePopularity = [...venueCounts.entries()]
    .map(([venue, count]) => ({ venue, count }))
    .sort((a, b) => b.count - a.count);

  // Peak Match Times
  const peakGrid = WEEKDAYS_MONDAY.map(() => ({ morning: 0, afternoon: 0, evening: 0 }));
  for (const m of matches) {
    const dt = new Date(m.match_time);
    const dow = toMondayIndex(dt.getUTCDay());
    const slot = getTimeSlot(dt.getUTCHours());
    peakGrid[dow][slot]++;
  }
  const peakMatchTimes = WEEKDAYS_MONDAY.map((weekday, i) => ({ weekday, slots: peakGrid[i] }));

  // Level Distribution
  const levelBuckets = new Map<string, number>();
  for (const m of matches) {
    if (m.level_min == null) continue;
    const bucket = `${Math.floor(m.level_min)}-${Math.floor(m.level_min) + 1}`;
    levelBuckets.set(bucket, (levelBuckets.get(bucket) ?? 0) + 1);
  }
  const levelDistribution = [...levelBuckets.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => a.label.localeCompare(b.label));

  // Fill Rate by Venue — average confirmed-player ratio per match (4 slots max)
  const venueFill = new Map<string, { confirmedSlots: number; totalMatches: number }>();
  for (const m of matches) {
    const v = m.venue ?? "Unknown";
    if (!venueFill.has(v)) venueFill.set(v, { confirmedSlots: 0, totalMatches: 0 });
    const entry = venueFill.get(v)!;
    entry.totalMatches++;
    const confirmed = m.match_players.filter(p => p.status === "confirmed").length;
    entry.confirmedSlots += confirmed;
  }
  const fillRate = [...venueFill.entries()]
    .map(([venue, { confirmedSlots, totalMatches }]) => ({
      venue,
      percentage: Math.round((confirmedSlots / (totalMatches * 4)) * 100),
      filled: confirmedSlots,
      total: totalMatches * 4,
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // Matches Per Week (or Month if range > 16 weeks)
  const earliestMs = new Date(earliestDate).getTime();
  const latestMs = new Date(latestDate).getTime();
  const rangeWeeks = (latestMs - earliestMs) / (7 * 24 * 60 * 60 * 1000);
  const useMonthly = rangeWeeks > 16;

  let matchesPerWeek: WeekCount[];
  if (useMonthly) {
    const monthCounts = new Map<string, number>();
    for (const m of matches) {
      const month = getMonthKey(new Date(m.match_time));
      monthCounts.set(month, (monthCounts.get(month) ?? 0) + 1);
    }
    matchesPerWeek = [...monthCounts.entries()]
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-12);
  } else {
    const weekCounts = new Map<string, number>();
    for (const m of matches) {
      const week = getWeekKey(new Date(m.match_time));
      weekCounts.set(week, (weekCounts.get(week) ?? 0) + 1);
    }
    matchesPerWeek = [...weekCounts.entries()]
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-12);
  }

  // Category Breakdown
  const categoryCounts = new Map<string, number>();
  for (const m of matches) {
    categoryCounts.set(m.category, (categoryCounts.get(m.category) ?? 0) + 1);
  }
  const categoryBreakdown = [...categoryCounts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  // Indoor vs Outdoor by Month
  const ioMonths = new Map<string, { indoor: number; outdoor: number }>();
  for (const m of matches) {
    if (m.indoor !== "indoor" && m.indoor !== "outdoor") continue;
    const month = getMonthKey(new Date(m.match_time));
    if (!ioMonths.has(month)) ioMonths.set(month, { indoor: 0, outdoor: 0 });
    ioMonths.get(month)![m.indoor]++;
  }
  const indoorOutdoorByMonth = [...ioMonths.entries()]
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Average Lead Time
  const leadTimes = new Map<string, number[]>();
  for (const m of matches) {
    const v = m.venue ?? "Unknown";
    const matchDt = new Date(m.match_time).getTime();
    const createdDt = new Date(m.created_at).getTime();
    const days = Math.round((matchDt - createdDt) / (1000 * 60 * 60 * 24));
    if (!leadTimes.has(v)) leadTimes.set(v, []);
    leadTimes.get(v)!.push(days);
  }
  const averageLeadTime = [...leadTimes.entries()]
    .map(([venue, days]) => ({
      venue,
      avgDays: Math.round(days.reduce((a, b) => a + b, 0) / days.length),
    }))
    .sort((a, b) => b.avgDays - a.avgDays);

  // Friendly vs Competitive Over Time
  const compMonths = new Map<string, { friendly: number; competitive: number }>();
  for (const m of matches) {
    if (!m.competition_mode) continue;
    const month = getMonthKey(new Date(m.match_time));
    if (!compMonths.has(month)) compMonths.set(month, { friendly: 0, competitive: 0 });
    const key = m.competition_mode as "friendly" | "competitive";
    compMonths.get(month)![key]++;
  }
  const friendlyVsCompetitive = [...compMonths.entries()]
    .map(([month, data]) => ({ month, ...data }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Outcome by Month
  const outcomeMonths = new Map<string, Record<string, number>>();
  for (const m of matches) {
    const month = getMonthKey(new Date(m.match_time));
    if (!outcomeMonths.has(month)) {
      outcomeMonths.set(month, { filled: 0, canceled: 0, empty: 0, expired: 0, stale: 0, pending: 0 });
    }
    const reason = m.archive_reason ?? "pending";
    const bucket = outcomeMonths.get(month)!;
    if (reason in bucket) bucket[reason]++;
    else bucket.pending++;
  }
  const outcomeByMonth = [...outcomeMonths.entries()]
    .map(([month, counts]) => ({ month, ...counts } as OutcomeMonth))
    .sort((a, b) => a.month.localeCompare(b.month));

  // Outcome Summary
  const outcomeTotals = new Map<string, number>();
  for (const m of matches) {
    const reason = m.archive_reason ?? "pending";
    outcomeTotals.set(reason, (outcomeTotals.get(reason) ?? 0) + 1);
  }
  const outcomeSummary = [...outcomeTotals.entries()]
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalMatches: matches.length,
    earliestDate,
    latestDate,
    venuePopularity,
    peakMatchTimes,
    levelDistribution,
    fillRate,
    matchesPerWeek,
    categoryBreakdown,
    indoorOutdoorByMonth,
    averageLeadTime,
    friendlyVsCompetitive,
    outcomeByMonth,
    outcomeSummary,
  };
}
