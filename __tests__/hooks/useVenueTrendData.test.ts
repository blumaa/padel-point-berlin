/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor, act } from "@testing-library/react";
import { useVenueTrendData } from "@/hooks/useVenueTrendData";
import type { AnalyticsFilterState, TrendGranularity } from "@/lib/analyticsTypes";

const mockData = [
  { bucket: "2026-01-05", venue: "Padel FC", count: 4 },
  { bucket: "2026-01-12", venue: "Padel FC", count: 6 },
];

const defaultFilters: AnalyticsFilterState = {
  period: "30d",
  venues: [],
  outcomes: [],
  categories: [],
};

beforeEach(() => {
  jest.useFakeTimers();
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe("useVenueTrendData", () => {
  it("fetches from /api/analytics/venue-trend with correct params", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    renderHook(() => useVenueTrendData(defaultFilters, "week"));

    act(() => { jest.advanceTimersByTime(200); });

    await waitFor(() => {
      const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain("/api/analytics/venue-trend");
      expect(url).toContain("period=30d");
      expect(url).toContain("granularity=week");
    });
  });

  it("includes venue and outcome filters in URL", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    const filters: AnalyticsFilterState = {
      ...defaultFilters,
      venues: ["Padel FC", "Urban Padel"],
      outcomes: ["filled"],
    };

    renderHook(() => useVenueTrendData(filters, "month"));

    act(() => { jest.advanceTimersByTime(200); });

    await waitFor(() => {
      const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
      expect(url).toContain("venues=Padel+FC%2CUrban+Padel");
      expect(url).toContain("outcomes=filled");
      expect(url).toContain("granularity=month");
    });
  });

  it("returns { data, isLoading } states correctly", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result } = renderHook(() => useVenueTrendData(defaultFilters, "week"));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toEqual([]);

    act(() => { jest.advanceTimersByTime(200); });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual(mockData);
    });
  });

  it("re-fetches when granularity changes", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { rerender } = renderHook(
      ({ filters, granularity }) => useVenueTrendData(filters, granularity),
      { initialProps: { filters: defaultFilters, granularity: "week" as TrendGranularity } },
    );

    act(() => { jest.advanceTimersByTime(200); });
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    rerender({ filters: defaultFilters, granularity: "day" as TrendGranularity });
    act(() => { jest.advanceTimersByTime(200); });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
      const url = (global.fetch as jest.Mock).mock.calls[1][0] as string;
      expect(url).toContain("granularity=day");
    });
  });

  it("returns empty array on non-ok response", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "fail" }),
    });

    const { result } = renderHook(() => useVenueTrendData(defaultFilters, "week"));

    act(() => { jest.advanceTimersByTime(200); });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual([]);
    });
  });

  it("debounces rapid changes (200ms)", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { rerender } = renderHook(
      ({ filters, granularity }) => useVenueTrendData(filters, granularity),
      { initialProps: { filters: defaultFilters, granularity: "week" as TrendGranularity } },
    );

    rerender({ filters: defaultFilters, granularity: "day" as TrendGranularity });
    act(() => { jest.advanceTimersByTime(50); });
    rerender({ filters: defaultFilters, granularity: "month" as TrendGranularity });
    act(() => { jest.advanceTimersByTime(200); });

    await waitFor(() => {
      const calls = (global.fetch as jest.Mock).mock.calls;
      const lastUrl = calls[calls.length - 1][0] as string;
      expect(lastUrl).toContain("granularity=month");
    });
  });
});
