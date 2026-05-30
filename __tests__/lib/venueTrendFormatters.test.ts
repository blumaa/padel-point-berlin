import { friendlyDay, friendlyTrendBucket } from "@/lib/formatters";

describe("friendlyDay", () => {
  it("formats ISO date to short month + day", () => {
    expect(friendlyDay("2026-03-15")).toBe("Mar 15");
  });

  it("handles single-digit day", () => {
    expect(friendlyDay("2026-01-05")).toBe("Jan 5");
  });

  it("handles year boundary", () => {
    expect(friendlyDay("2025-12-31")).toBe("Dec 31");
  });
});

describe("friendlyTrendBucket", () => {
  it("returns year as-is for year granularity", () => {
    expect(friendlyTrendBucket("2026", "year")).toBe("2026");
  });

  it("shows month with year by default", () => {
    expect(friendlyTrendBucket("2026-03", "month")).toBe("Mar '26");
  });

  it("shows full month name without year when omitYear is true", () => {
    expect(friendlyTrendBucket("2026-03", "month", true)).toBe("March");
    expect(friendlyTrendBucket("2026-01", "month", true)).toBe("January");
    expect(friendlyTrendBucket("2026-12", "month", true)).toBe("December");
  });

  it("delegates to friendlyWeek for week granularity", () => {
    expect(friendlyTrendBucket("2026-03-02", "week")).toBe("Mar 2");
  });

  it("delegates to friendlyDay for day granularity", () => {
    expect(friendlyTrendBucket("2026-03-15", "day")).toBe("Mar 15");
  });
});
