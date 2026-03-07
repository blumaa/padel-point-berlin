import { filterMatches, type TimePeriod, type AnalyticsFilterState, DEFAULT_ANALYTICS_FILTERS } from "@/lib/analyticsFilters";
import type { Match } from "@/lib/types";

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: "m1",
    title: "Padel Match",
    match_type: "match",
    match_time: "2026-02-11T09:00:00+01:00",
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
    match_players: [],
    ...overrides,
  };
}

describe("filterMatches", () => {
  const now = new Date("2026-03-07T12:00:00Z");

  it("returns all matches when no filters applied", () => {
    const matches = [makeMatch({ id: "m1" }), makeMatch({ id: "m2" })];
    const result = filterMatches(matches, { period: "all", venues: [] }, now);
    expect(result).toHaveLength(2);
  });

  it("returns all matches with default filters (period=90d, venues=[])", () => {
    const matches = [
      makeMatch({ id: "m1", match_time: "2026-02-11T09:00:00Z" }), // ~24 days ago, within 90d
      makeMatch({ id: "m2", match_time: "2025-11-01T09:00:00Z" }), // ~126 days ago, outside 90d
    ];
    const result = filterMatches(matches, DEFAULT_ANALYTICS_FILTERS, now);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("m1");
  });

  it("filters to last 30 days", () => {
    const matches = [
      makeMatch({ id: "m1", match_time: "2026-03-01T10:00:00Z" }), // 6 days ago
      makeMatch({ id: "m2", match_time: "2026-01-15T10:00:00Z" }), // ~51 days ago
    ];
    const result = filterMatches(matches, { period: "30d", venues: [] }, now);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("m1");
  });

  it("filters to last 90 days", () => {
    const matches = [
      makeMatch({ id: "m1", match_time: "2026-02-01T10:00:00Z" }), // ~34 days ago
      makeMatch({ id: "m2", match_time: "2025-11-01T10:00:00Z" }), // ~126 days ago
    ];
    const result = filterMatches(matches, { period: "90d", venues: [] }, now);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("m1");
  });

  it("filters to last 6 months", () => {
    const matches = [
      makeMatch({ id: "m1", match_time: "2025-10-01T10:00:00Z" }), // ~5 months ago
      makeMatch({ id: "m2", match_time: "2025-06-01T10:00:00Z" }), // ~9 months ago
    ];
    const result = filterMatches(matches, { period: "6m", venues: [] }, now);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("m1");
  });

  it("filters to last 1 year", () => {
    const matches = [
      makeMatch({ id: "m1", match_time: "2025-06-01T10:00:00Z" }), // ~9 months ago
      makeMatch({ id: "m2", match_time: "2024-12-01T10:00:00Z" }), // ~15 months ago
    ];
    const result = filterMatches(matches, { period: "1y", venues: [] }, now);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("m1");
  });

  it("returns all matches when period is 'all'", () => {
    const matches = [
      makeMatch({ id: "m1", match_time: "2026-03-01T10:00:00Z" }),
      makeMatch({ id: "m2", match_time: "2020-01-01T10:00:00Z" }),
    ];
    const result = filterMatches(matches, { period: "all", venues: [] }, now);
    expect(result).toHaveLength(2);
  });

  it("filters by venue", () => {
    const matches = [
      makeMatch({ id: "m1", venue: "Urban Padel" }),
      makeMatch({ id: "m2", venue: "PadelBox" }),
      makeMatch({ id: "m3", venue: "Urban Padel" }),
    ];
    const result = filterMatches(matches, { period: "all", venues: ["Urban Padel"] }, now);
    expect(result).toHaveLength(2);
    expect(result.every((m) => m.venue === "Urban Padel")).toBe(true);
  });

  it("filters by multiple venues", () => {
    const matches = [
      makeMatch({ id: "m1", venue: "Urban Padel" }),
      makeMatch({ id: "m2", venue: "PadelBox" }),
      makeMatch({ id: "m3", venue: "Grenzallee" }),
    ];
    const result = filterMatches(matches, { period: "all", venues: ["Urban Padel", "PadelBox"] }, now);
    expect(result).toHaveLength(2);
  });

  it("returns all when venues array is empty (= all venues)", () => {
    const matches = [
      makeMatch({ id: "m1", venue: "A" }),
      makeMatch({ id: "m2", venue: "B" }),
    ];
    const result = filterMatches(matches, { period: "all", venues: [] }, now);
    expect(result).toHaveLength(2);
  });

  it("handles empty matches array", () => {
    const result = filterMatches([], { period: "30d", venues: ["X"] }, now);
    expect(result).toEqual([]);
  });

  it("handles unknown venue — returns nothing for that venue", () => {
    const matches = [makeMatch({ id: "m1", venue: "Real Club" })];
    const result = filterMatches(matches, { period: "all", venues: ["Nonexistent"] }, now);
    expect(result).toHaveLength(0);
  });

  it("combines period and venue filters", () => {
    const matches = [
      makeMatch({ id: "m1", venue: "A", match_time: "2026-03-01T10:00:00Z" }), // recent + venue A
      makeMatch({ id: "m2", venue: "B", match_time: "2026-03-01T10:00:00Z" }), // recent + venue B
      makeMatch({ id: "m3", venue: "A", match_time: "2025-01-01T10:00:00Z" }), // old + venue A
    ];
    const result = filterMatches(matches, { period: "90d", venues: ["A"] }, now);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("m1");
  });
});
