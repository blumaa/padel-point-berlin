import {
  validateAnalyticsResponse,
  emptyAnalyticsData,
  type AnalyticsData,
} from "@/lib/analyticsTypes";

describe("AnalyticsData type contract", () => {
  it("emptyAnalyticsData includes all KPI fields with safe defaults", () => {
    const empty = emptyAnalyticsData();
    expect(empty.totalMatches).toBe(0);
    expect(empty.filledCount).toBe(0);
    expect(empty.overallFillRate).toBe(0);
    expect(empty.avgPerWeek).toBe(0);
    expect(empty.topVenue).toBeNull();
    expect(empty.earliestDate).toBeNull();
    expect(empty.latestDate).toBeNull();
    expect(empty.venuePopularity).toEqual([]);
    expect(empty.peakMatchTimes).toEqual([]);
    expect(empty.levelDistribution).toEqual([]);
    expect(empty.fillRate).toEqual([]);
    expect(empty.matchesPerWeek).toEqual([]);
    expect(empty.outcomeByMonth).toEqual([]);
    expect(empty.outcomeSummary).toEqual([]);
    expect(empty.averageLeadTime).toEqual([]);
  });

  it("validateAnalyticsResponse returns true for valid shape", () => {
    const valid: AnalyticsData = {
      totalMatches: 100,
      filledCount: 80,
      overallFillRate: 80,
      avgPerWeek: 5.2,
      topVenue: "Padel FC Berlin",
      earliestDate: "2025-01-01",
      latestDate: "2026-03-01",
      venuePopularity: [{ venue: "Padel FC Berlin", count: 50 }],
      peakMatchTimes: [
        { weekday: "Monday", slots: { morning: 1, afternoon: 2, evening: 3 } },
      ],
      levelDistribution: [{ label: "2-3", count: 10 }],
      fillRate: [{ venue: "Padel FC Berlin", percentage: 80, filled: 160, total: 200 }],
      matchesPerWeek: [{ week: "2026-03-02", count: 5 }],
      outcomeByMonth: [
        { month: "2026-01", filled: 10, canceled: 5, empty: 2, expired: 1, stale: 0, pending: 3 },
      ],
      outcomeSummary: [{ reason: "filled", count: 80 }],
      averageLeadTime: [{ venue: "Padel FC Berlin", avgDays: 4 }],
    };
    expect(validateAnalyticsResponse(valid)).toBe(true);
  });

  it("validateAnalyticsResponse returns false for null", () => {
    expect(validateAnalyticsResponse(null)).toBe(false);
  });

  it("validateAnalyticsResponse returns false for undefined", () => {
    expect(validateAnalyticsResponse(undefined)).toBe(false);
  });

  it("validateAnalyticsResponse returns false for missing fields", () => {
    expect(validateAnalyticsResponse({ totalMatches: 5 })).toBe(false);
  });

  it("validateAnalyticsResponse returns false for non-object", () => {
    expect(validateAnalyticsResponse("string")).toBe(false);
    expect(validateAnalyticsResponse(42)).toBe(false);
  });
});
