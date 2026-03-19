/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { KPICard } from "@/components/analytics/KPICard";

describe("KPICard", () => {
  it("renders label and formatted value", () => {
    render(<KPICard label="Matches Played" value="3,435" />);
    expect(screen.getByText("Matches Played")).toBeInTheDocument();
    expect(screen.getByText("3,435")).toBeInTheDocument();
  });

  it("handles null value gracefully", () => {
    render(<KPICard label="Top Venue" value={null} />);
    expect(screen.getByText("Top Venue")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("handles zero value", () => {
    render(<KPICard label="Fill Rate" value="0%" />);
    expect(screen.getByText("0%")).toBeInTheDocument();
  });

  it("renders subtitle when provided", () => {
    render(<KPICard label="Matches Played" value="3,435" subtitle="of 6,000 posted" />);
    expect(screen.getByText("of 6,000 posted")).toBeInTheDocument();
  });

  it("does not render subtitle element when not provided", () => {
    const { container } = render(<KPICard label="Test" value="1" />);
    expect(container.querySelector(".klimt-kpi-subtitle")).not.toBeInTheDocument();
  });
});
