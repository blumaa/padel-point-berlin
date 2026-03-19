/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { KPIRow } from "@/components/analytics/KPIRow";
import type { AnalyticsData } from "@/lib/analyticsTypes";
import { emptyAnalyticsData } from "@/lib/analyticsTypes";

const makeData = (overrides: Partial<AnalyticsData> = {}): AnalyticsData => ({
  ...emptyAnalyticsData(),
  totalMatches: 6000,
  filledCount: 3435,
  overallFillRate: 80,
  avgPerWeek: 12.5,
  topVenue: "Padel FC Berlin",
  outcomeSummary: [
    { reason: "filled", count: 3435 },
    { reason: "canceled", count: 2000 },
    { reason: "expired", count: 400 },
    { reason: "empty", count: 165 },
  ],
  ...overrides,
});

describe("KPIRow", () => {
  it("renders 3 KPI cards", () => {
    const { container } = render(<KPIRow data={makeData()} />);
    expect(container.querySelectorAll(".klimt-kpi-card")).toHaveLength(3);
  });

  it("shows filledCount as primary metric", () => {
    render(<KPIRow data={makeData()} />);
    expect(screen.getByText("3,435")).toBeInTheDocument();
  });

  it("shows 'Matches Played' label with posted count subtitle", () => {
    render(<KPIRow data={makeData()} />);
    expect(screen.getByText("Matches Played")).toBeInTheDocument();
    // totalMatches (6000) - canceled (2000) = 4000 posted
    expect(screen.getByText("of 4,000 posted")).toBeInTheDocument();
  });

  it("calculates success rate excluding canceled", () => {
    // filled=3435, expired=400, empty=165 → attempted=4000 → 3435/4000 = 86%
    render(<KPIRow data={makeData()} />);
    expect(screen.getByText("86%")).toBeInTheDocument();
    expect(screen.getByText("Success Rate")).toBeInTheDocument();
  });

  it("shows avg per week with subtitle", () => {
    render(<KPIRow data={makeData()} />);
    expect(screen.getByText("12.5")).toBeInTheDocument();
    expect(screen.getByText("filled matches avg.")).toBeInTheDocument();
  });
});
