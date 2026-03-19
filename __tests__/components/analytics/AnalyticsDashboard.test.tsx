/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

const mockUseAnalyticsData = jest.fn();
jest.mock("@/hooks/useAnalyticsData", () => ({
  useAnalyticsData: (...args: unknown[]) => mockUseAnalyticsData(...args),
}));

const mockReplace = jest.fn();
const mockGet = jest.fn().mockReturnValue(null);
jest.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: mockGet }),
  useRouter: () => ({ replace: mockReplace }),
}));

beforeEach(() => {
  global.fetch = jest.fn().mockImplementation((url: string) => {
    if (url.includes("/api/analytics/venues")) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(["Padel FC Berlin", "Urban Padel"]),
      });
    }
    return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { emptyAnalyticsData } from "@/lib/analyticsTypes";

const mockData = {
  ...emptyAnalyticsData(),
  totalMatches: 100,
  filledCount: 80,
  overallFillRate: 80,
  avgPerWeek: 5,
  topVenue: "Padel FC Berlin",
  outcomeSummary: [
    { reason: "filled", count: 80 },
    { reason: "expired", count: 10 },
    { reason: "empty", count: 5 },
  ],
  peakMatchTimes: [
    { weekday: "Monday", slots: { morning: 1, afternoon: 2, evening: 3 } },
    { weekday: "Tuesday", slots: { morning: 0, afternoon: 0, evening: 0 } },
    { weekday: "Wednesday", slots: { morning: 0, afternoon: 0, evening: 0 } },
    { weekday: "Thursday", slots: { morning: 0, afternoon: 0, evening: 0 } },
    { weekday: "Friday", slots: { morning: 0, afternoon: 0, evening: 0 } },
    { weekday: "Saturday", slots: { morning: 0, afternoon: 0, evening: 0 } },
    { weekday: "Sunday", slots: { morning: 0, afternoon: 0, evening: 0 } },
  ],
};

describe("AnalyticsDashboard", () => {
  it("shows skeleton loading state on initial load", () => {
    mockUseAnalyticsData.mockReturnValue({ data: null, isLoading: true, error: null });
    const { container } = render(<AnalyticsDashboard />);
    expect(container.querySelector(".klimt-skeleton")).toBeInTheDocument();
  });

  it("renders KPIRow and scope subtitle when data loads", async () => {
    mockUseAnalyticsData.mockReturnValue({ data: mockData, isLoading: false, error: null });
    render(<AnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByText("80")).toBeInTheDocument();
      expect(screen.getByText(/matches played across/)).toBeInTheDocument();
    });
  });

  it("renders filter bar when data loads", async () => {
    mockUseAnalyticsData.mockReturnValue({ data: mockData, isLoading: false, error: null });
    render(<AnalyticsDashboard />);
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "30d" })).toBeInTheDocument();
    });
  });

  it("passes filter state to useAnalyticsData hook", () => {
    mockUseAnalyticsData.mockReturnValue({ data: null, isLoading: true, error: null });
    render(<AnalyticsDashboard />);
    expect(mockUseAnalyticsData).toHaveBeenCalledWith(
      expect.objectContaining({ period: "30d" }),
    );
  });

  it("URL search params hydrate initial filter state", () => {
    mockGet.mockImplementation((key: string) => {
      if (key === "period") return "90d";
      if (key === "venues") return "Padel FC Berlin";
      return null;
    });
    mockUseAnalyticsData.mockReturnValue({ data: null, isLoading: true, error: null });
    render(<AnalyticsDashboard />);
    expect(mockUseAnalyticsData).toHaveBeenCalledWith(
      expect.objectContaining({ period: "90d", venues: ["Padel FC Berlin"] }),
    );
  });
});
