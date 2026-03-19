/**
 * @jest-environment jsdom
 */
import { renderHook, waitFor, act } from "@testing-library/react";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import type { AnalyticsFilterState } from "@/lib/analyticsTypes";

const mockData = {
  totalMatches: 100,
  filledCount: 80,
  overallFillRate: 80,
  avgPerWeek: 5,
  topVenue: "Padel FC",
  earliestDate: "2025-01-01",
  latestDate: "2026-03-01",
  venuePopularity: [],
  peakMatchTimes: [],
  levelDistribution: [],
  fillRate: [],
  matchesPerWeek: [],
  outcomeByMonth: [],
  outcomeSummary: [],
  averageLeadTime: [],
};

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

describe("useAnalyticsData", () => {
  it("fetches from /api/analytics with filter params on mount", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    renderHook(() => useAnalyticsData(defaultFilters));

    // Flush debounce
    act(() => { jest.advanceTimersByTime(200); });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/analytics?period=30d"),
        expect.objectContaining({ signal: expect.anything() }),
      );
    });
  });

  it("re-fetches when filters change", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { rerender } = renderHook(
      ({ filters }) => useAnalyticsData(filters),
      { initialProps: { filters: defaultFilters } },
    );

    act(() => { jest.advanceTimersByTime(200); });
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    rerender({ filters: { ...defaultFilters, period: "90d" } });
    act(() => { jest.advanceTimersByTime(200); });

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2));
  });

  it("debounces rapid filter changes (200ms)", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { rerender } = renderHook(
      ({ filters }) => useAnalyticsData(filters),
      { initialProps: { filters: defaultFilters } },
    );

    // Rapid changes within 200ms
    rerender({ filters: { ...defaultFilters, period: "90d" } });
    act(() => { jest.advanceTimersByTime(50); });
    rerender({ filters: { ...defaultFilters, period: "6m" } });
    act(() => { jest.advanceTimersByTime(50); });
    rerender({ filters: { ...defaultFilters, period: "1y" } });
    act(() => { jest.advanceTimersByTime(200); });

    await waitFor(() => {
      // Should only fetch once with the final value
      const calls = (global.fetch as jest.Mock).mock.calls;
      const lastCall = calls[calls.length - 1][0] as string;
      expect(lastCall).toContain("period=1y");
    });
  });

  it("returns { data, isLoading, error } states correctly", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result } = renderHook(() => useAnalyticsData(defaultFilters));

    // Initially loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();

    act(() => { jest.advanceTimersByTime(200); });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
    });
  });

  it("does not clear existing data on refetch (dim-on-refetch)", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result, rerender } = renderHook(
      ({ filters }) => useAnalyticsData(filters),
      { initialProps: { filters: defaultFilters } },
    );

    act(() => { jest.advanceTimersByTime(200); });
    await waitFor(() => expect(result.current.data).toEqual(mockData));

    // Change filters — should set isLoading but keep data
    const newMock = { ...mockData, totalMatches: 200 };
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(newMock),
    });

    rerender({ filters: { ...defaultFilters, period: "90d" } });
    act(() => { jest.advanceTimersByTime(200); });

    // Data should still be present while loading
    expect(result.current.data).toEqual(mockData);
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.data).toEqual(newMock);
      expect(result.current.isLoading).toBe(false);
    });
  });
});
