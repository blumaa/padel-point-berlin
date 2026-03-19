import { friendlyWeek, friendlyMonth, friendlyBucket } from "@/lib/formatters";

describe("friendlyWeek", () => {
  it("formats ISO date to short month + day", () => {
    expect(friendlyWeek("2026-03-02")).toBe("Mar 2");
  });

  it("handles single-digit day", () => {
    expect(friendlyWeek("2026-01-05")).toBe("Jan 5");
  });

  it("handles year boundary", () => {
    expect(friendlyWeek("2025-12-29")).toBe("Dec 29");
  });

  it("handles first day of year", () => {
    expect(friendlyWeek("2026-01-01")).toBe("Jan 1");
  });
});

describe("friendlyMonth", () => {
  it("formats YYYY-MM to short month + 2-digit year", () => {
    expect(friendlyMonth("2026-03")).toBe("Mar '26");
  });

  it("handles single-digit month", () => {
    expect(friendlyMonth("2026-01")).toBe("Jan '26");
  });

  it("handles year boundary", () => {
    expect(friendlyMonth("2025-12")).toBe("Dec '25");
  });

  it("handles different years", () => {
    expect(friendlyMonth("2024-06")).toBe("Jun '24");
  });
});

describe("friendlyBucket", () => {
  it("delegates to friendlyMonth for YYYY-MM format (7 chars)", () => {
    expect(friendlyBucket("2026-03")).toBe("Mar '26");
  });

  it("delegates to friendlyWeek for YYYY-MM-DD format (10 chars)", () => {
    expect(friendlyBucket("2026-03-02")).toBe("Mar 2");
  });
});
