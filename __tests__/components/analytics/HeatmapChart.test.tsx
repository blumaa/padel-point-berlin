/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { HeatmapChart } from "@/components/analytics/HeatmapChart";
import type { PeakTimeRow } from "@/lib/analyticsTypes";

function makeGrid(override?: Partial<PeakTimeRow["slots"]>): PeakTimeRow[] {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return days.map((weekday) => ({
    weekday,
    slots: { morning: 0, afternoon: 0, evening: 0, ...override },
  }));
}

describe("HeatmapChart", () => {
  it("renders 7 weekday rows", () => {
    render(<HeatmapChart data={makeGrid()} />);
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Tue")).toBeInTheDocument();
    expect(screen.getByText("Sun")).toBeInTheDocument();
  });

  it("renders readable time slot headers", () => {
    render(<HeatmapChart data={makeGrid()} />);
    expect(screen.getByText("Morning")).toBeInTheDocument();
    expect(screen.getByText("Afternoon")).toBeInTheDocument();
    expect(screen.getByText("Evening")).toBeInTheDocument();
  });

  it("renders hour range sub-labels", () => {
    render(<HeatmapChart data={makeGrid()} />);
    expect(screen.getByText("6–12h")).toBeInTheDocument();
    expect(screen.getByText("12–17h")).toBeInTheDocument();
    expect(screen.getByText("17h+")).toBeInTheDocument();
  });

  it("shows peak time callout when data has values", () => {
    const data = makeGrid();
    data[0].slots = { morning: 10, afternoon: 5, evening: 0 };
    render(<HeatmapChart data={data} />);
    expect(screen.getByText(/Peak time:/)).toBeInTheDocument();
    expect(screen.getByText(/Monday morning/)).toBeInTheDocument();
  });

  it("handles all-zero data without peak callout", () => {
    render(<HeatmapChart data={makeGrid()} />);
    expect(screen.queryByText(/Peak time:/)).not.toBeInTheDocument();
  });
});
