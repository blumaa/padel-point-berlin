import { aggregateAnalytics } from "@/lib/analytics";
import type { Match } from "@/lib/types";

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: "m1",
    title: "Padel Match",
    match_type: "match",
    match_time: "2026-02-11T09:00:00+01:00", // Wednesday morning
    duration_min: 90,
    venue: "Padel FC Berlin",
    level_min: 2.5,
    level_max: 4,
    category: "Open",
    indoor: "indoor",
    competition_mode: "friendly",
    source_group: "playtomic_api",
    playtomic_url: "https://app.playtomic.io/match/abc",
    visibility: "VISIBLE",
    archive_reason: null,
    created_at: "2026-02-07T10:00:00Z",
    match_players: [
      { id: "p1", match_id: "m1", name: "Alice", level: 3, status: "confirmed", slot_order: 1 },
      { id: "p2", match_id: "m1", name: "Bob", level: 2.5, status: "confirmed", slot_order: 2 },
      { id: "p3", match_id: "m1", name: "??", level: null, status: "open", slot_order: 3 },
      { id: "p4", match_id: "m1", name: "??", level: null, status: "open", slot_order: 4 },
    ],
    ...overrides,
  };
}

describe("aggregateAnalytics", () => {
  it("returns all analytics sections", () => {
    const result = aggregateAnalytics([makeMatch()]);
    expect(result).toHaveProperty("totalMatches");
    expect(result).toHaveProperty("earliestDate");
    expect(result).toHaveProperty("latestDate");
    expect(result).toHaveProperty("venuePopularity");
    expect(result).toHaveProperty("peakMatchTimes");
    expect(result).toHaveProperty("levelDistribution");
    expect(result).toHaveProperty("fillRate");
    expect(result).toHaveProperty("matchesPerWeek");
    expect(result).toHaveProperty("categoryBreakdown");
    expect(result).toHaveProperty("indoorOutdoorByMonth");
    expect(result).toHaveProperty("averageLeadTime");
    expect(result).toHaveProperty("friendlyVsCompetitive");
    expect(result).toHaveProperty("outcomeByMonth");
    expect(result).toHaveProperty("outcomeSummary");
  });

  it("returns metadata", () => {
    const result = aggregateAnalytics([makeMatch()]);
    expect(result.totalMatches).toBe(1);
    expect(result.earliestDate).toBeDefined();
    expect(result.latestDate).toBeDefined();
  });

  it("returns empty analytics for empty input", () => {
    const result = aggregateAnalytics([]);
    expect(result.totalMatches).toBe(0);
    expect(result.earliestDate).toBeNull();
    expect(result.latestDate).toBeNull();
    expect(result.venuePopularity).toEqual([]);
    expect(result.levelDistribution).toEqual([]);
    expect(result.fillRate).toEqual([]);
    expect(result.matchesPerWeek).toEqual([]);
    expect(result.categoryBreakdown).toEqual([]);
  });

  // Venue Popularity
  it("counts matches per venue", () => {
    const matches = [
      makeMatch({ id: "m1", venue: "Padel FC Berlin" }),
      makeMatch({ id: "m2", venue: "Padel FC Berlin" }),
      makeMatch({ id: "m3", venue: "Grenzallee Padel" }),
    ];
    const result = aggregateAnalytics(matches);
    expect(result.venuePopularity).toContainEqual({ venue: "Padel FC Berlin", count: 2 });
    expect(result.venuePopularity).toContainEqual({ venue: "Grenzallee Padel", count: 1 });
  });

  // Peak Match Times
  it("builds weekday x time-of-day grid", () => {
    const result = aggregateAnalytics([makeMatch()]);
    // Wednesday morning match
    expect(result.peakMatchTimes.length).toBe(7); // 7 weekdays
    expect(result.peakMatchTimes[0]).toHaveProperty("weekday");
    expect(result.peakMatchTimes[0]).toHaveProperty("slots");
  });

  // Level Distribution
  it("buckets matches by level range", () => {
    const matches = [
      makeMatch({ id: "m1", level_min: 1, level_max: 2 }),
      makeMatch({ id: "m2", level_min: 3, level_max: 4 }),
      makeMatch({ id: "m3", level_min: 3.5, level_max: 5 }),
    ];
    const result = aggregateAnalytics(matches);
    expect(result.levelDistribution.length).toBeGreaterThan(0);
    const bucket = result.levelDistribution.find((b: { label: string }) => b.label === "3-4");
    expect(bucket).toBeDefined();
    expect(bucket!.count).toBeGreaterThanOrEqual(1);
  });

  // Fill Rate
  it("calculates fill rate per venue", () => {
    const matches = [
      makeMatch({
        id: "m1",
        venue: "Full Club",
        match_players: [
          { id: "p1", match_id: "m1", name: "A", level: 3, status: "confirmed", slot_order: 1 },
          { id: "p2", match_id: "m1", name: "B", level: 3, status: "confirmed", slot_order: 2 },
          { id: "p3", match_id: "m1", name: "C", level: 3, status: "confirmed", slot_order: 3 },
          { id: "p4", match_id: "m1", name: "D", level: 3, status: "confirmed", slot_order: 4 },
        ],
      }),
      makeMatch({
        id: "m2",
        venue: "Full Club",
        match_players: [
          { id: "p1", match_id: "m2", name: "A", level: 3, status: "confirmed", slot_order: 1 },
          { id: "p2", match_id: "m2", name: "??", level: null, status: "open", slot_order: 2 },
          { id: "p3", match_id: "m2", name: "??", level: null, status: "open", slot_order: 3 },
          { id: "p4", match_id: "m2", name: "??", level: null, status: "open", slot_order: 4 },
        ],
      }),
    ];
    const result = aggregateAnalytics(matches);
    const venue = result.fillRate.find((v: { venue: string }) => v.venue === "Full Club");
    expect(venue).toBeDefined();
    expect(venue!.percentage).toBe(63); // 5 confirmed slots / 8 total slots
  });

  // Matches Per Week
  it("counts matches per week", () => {
    const matches = [
      makeMatch({ id: "m1", match_time: "2026-02-02T10:00:00Z" }),
      makeMatch({ id: "m2", match_time: "2026-02-03T10:00:00Z" }),
      makeMatch({ id: "m3", match_time: "2026-02-10T10:00:00Z" }),
    ];
    const result = aggregateAnalytics(matches);
    expect(result.matchesPerWeek.length).toBeGreaterThan(0);
  });

  // Category Breakdown
  it("counts categories", () => {
    const matches = [
      makeMatch({ id: "m1", category: "Open" }),
      makeMatch({ id: "m2", category: "Open" }),
      makeMatch({ id: "m3", category: "Women" }),
    ];
    const result = aggregateAnalytics(matches);
    expect(result.categoryBreakdown).toContainEqual({ category: "Open", count: 2 });
    expect(result.categoryBreakdown).toContainEqual({ category: "Women", count: 1 });
  });

  // Indoor vs Outdoor
  it("counts indoor vs outdoor by month", () => {
    const matches = [
      makeMatch({ id: "m1", indoor: "indoor", match_time: "2026-01-15T10:00:00Z" }),
      makeMatch({ id: "m2", indoor: "outdoor", match_time: "2026-01-20T10:00:00Z" }),
      makeMatch({ id: "m3", indoor: "indoor", match_time: "2026-02-15T10:00:00Z" }),
    ];
    const result = aggregateAnalytics(matches);
    expect(result.indoorOutdoorByMonth.length).toBeGreaterThan(0);
    const jan = result.indoorOutdoorByMonth.find((m: { month: string }) => m.month === "2026-01");
    expect(jan).toBeDefined();
    expect(jan!.indoor).toBe(1);
    expect(jan!.outdoor).toBe(1);
  });

  // Average Lead Time
  it("calculates average lead time per venue", () => {
    const matches = [
      makeMatch({
        id: "m1",
        venue: "Lead Club",
        match_time: "2026-02-14T10:00:00Z",
        created_at: "2026-02-10T10:00:00Z", // 4 days ahead
      }),
      makeMatch({
        id: "m2",
        venue: "Lead Club",
        match_time: "2026-02-16T10:00:00Z",
        created_at: "2026-02-10T10:00:00Z", // 6 days ahead
      }),
    ];
    const result = aggregateAnalytics(matches);
    const venue = result.averageLeadTime.find((v: { venue: string }) => v.venue === "Lead Club");
    expect(venue).toBeDefined();
    expect(venue!.avgDays).toBe(5);
  });

  // Friendly vs Competitive
  it("tracks friendly vs competitive over time", () => {
    const matches = [
      makeMatch({ id: "m1", competition_mode: "friendly", match_time: "2026-01-15T10:00:00Z" }),
      makeMatch({ id: "m2", competition_mode: "competitive", match_time: "2026-01-20T10:00:00Z" }),
      makeMatch({ id: "m3", competition_mode: "friendly", match_time: "2026-01-25T10:00:00Z" }),
    ];
    const result = aggregateAnalytics(matches);
    expect(result.friendlyVsCompetitive.length).toBeGreaterThan(0);
    const jan = result.friendlyVsCompetitive.find((m: { month: string }) => m.month === "2026-01");
    expect(jan).toBeDefined();
    expect(jan!.friendly).toBe(2);
    expect(jan!.competitive).toBe(1);
  });

  it("uses monthly buckets when range > 16 weeks", () => {
    // Create matches spanning ~6 months (> 16 weeks)
    const matches = [
      makeMatch({ id: "m1", match_time: "2025-09-15T10:00:00Z" }),
      makeMatch({ id: "m2", match_time: "2025-10-15T10:00:00Z" }),
      makeMatch({ id: "m3", match_time: "2025-11-15T10:00:00Z" }),
      makeMatch({ id: "m4", match_time: "2025-12-15T10:00:00Z" }),
      makeMatch({ id: "m5", match_time: "2026-01-15T10:00:00Z" }),
      makeMatch({ id: "m6", match_time: "2026-02-15T10:00:00Z" }),
    ];
    const result = aggregateAnalytics(matches);
    // Monthly buckets use YYYY-MM format
    expect(result.matchesPerWeek.length).toBe(6);
    expect(result.matchesPerWeek[0].week).toBe("2025-09");
    expect(result.matchesPerWeek[5].week).toBe("2026-02");
  });

  it("uses weekly buckets when range <= 16 weeks", () => {
    const matches = [
      makeMatch({ id: "m1", match_time: "2026-02-02T10:00:00Z" }),
      makeMatch({ id: "m2", match_time: "2026-02-09T10:00:00Z" }),
      makeMatch({ id: "m3", match_time: "2026-02-16T10:00:00Z" }),
    ];
    const result = aggregateAnalytics(matches);
    // Weekly buckets use YYYY-MM-DD format (Monday of the week)
    expect(result.matchesPerWeek.length).toBe(3);
    expect(result.matchesPerWeek[0].week).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("handles matches with null venue in venue popularity", () => {
    const matches = [
      makeMatch({ id: "m1", venue: null }),
      makeMatch({ id: "m2", venue: "Club A" }),
    ];
    const result = aggregateAnalytics(matches);
    expect(result.venuePopularity).toContainEqual({ venue: "Club A", count: 1 });
    expect(result.venuePopularity).toContainEqual({ venue: "Unknown", count: 1 });
  });

  // Outcome by Month
  it("counts outcomes by month", () => {
    const matches = [
      makeMatch({ id: "m1", archive_reason: "filled", match_time: "2026-01-15T10:00:00Z" }),
      makeMatch({ id: "m2", archive_reason: "canceled", match_time: "2026-01-20T10:00:00Z" }),
      makeMatch({ id: "m3", archive_reason: "filled", match_time: "2026-02-15T10:00:00Z" }),
      makeMatch({ id: "m4", archive_reason: null, match_time: "2026-02-20T10:00:00Z" }),
    ];
    const result = aggregateAnalytics(matches);
    expect(result.outcomeByMonth.length).toBe(2);
    const jan = result.outcomeByMonth.find((m) => m.month === "2026-01");
    expect(jan).toBeDefined();
    expect(jan!.filled).toBe(1);
    expect(jan!.canceled).toBe(1);
    const feb = result.outcomeByMonth.find((m) => m.month === "2026-02");
    expect(feb).toBeDefined();
    expect(feb!.filled).toBe(1);
    expect(feb!.pending).toBe(1);
  });

  // Outcome Summary
  it("aggregates outcome summary totals", () => {
    const matches = [
      makeMatch({ id: "m1", archive_reason: "filled" }),
      makeMatch({ id: "m2", archive_reason: "filled" }),
      makeMatch({ id: "m3", archive_reason: "expired" }),
      makeMatch({ id: "m4", archive_reason: null }),
    ];
    const result = aggregateAnalytics(matches);
    expect(result.outcomeSummary).toContainEqual({ reason: "filled", count: 2 });
    expect(result.outcomeSummary).toContainEqual({ reason: "expired", count: 1 });
    expect(result.outcomeSummary).toContainEqual({ reason: "pending", count: 1 });
  });

  it("returns empty outcome arrays for empty input", () => {
    const result = aggregateAnalytics([]);
    expect(result.outcomeByMonth).toEqual([]);
    expect(result.outcomeSummary).toEqual([]);
  });
});
