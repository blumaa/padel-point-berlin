/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { BarChart } from "@/components/analytics/BarChart";

describe("BarChart", () => {
  const items = [
    { label: "Padel FC", value: 100 },
    { label: "Urban Padel", value: 60 },
    { label: "Grenzallee", value: 30 },
  ];

  it("renders bar rows for each data item", () => {
    render(<BarChart items={items} />);
    expect(screen.getByText("Padel FC")).toBeInTheDocument();
    expect(screen.getByText("Urban Padel")).toBeInTheDocument();
    expect(screen.getByText("Grenzallee")).toBeInTheDocument();
  });

  it("calculates width percentages relative to max value", () => {
    const { container } = render(<BarChart items={items} />);
    const fills = container.querySelectorAll(".klimt-bar-fill");
    // First bar should be 100%
    expect((fills[0] as HTMLElement).style.width).toBe("100%");
    // Second bar should be 60%
    expect((fills[1] as HTMLElement).style.width).toBe("60%");
  });

  it("handles empty data array", () => {
    const { container } = render(<BarChart items={[]} />);
    expect(container.querySelectorAll(".klimt-bar-row")).toHaveLength(0);
  });

  it("renders labels and values", () => {
    render(<BarChart items={items} />);
    expect(screen.getByText("100")).toBeInTheDocument();
    expect(screen.getByText("60")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
  });

  it("applies custom variant class", () => {
    const { container } = render(<BarChart items={items} variant="match" />);
    const fill = container.querySelector(".klimt-bar-fill--match");
    expect(fill).toBeInTheDocument();
  });

  it("supports custom value formatter", () => {
    render(<BarChart items={items} formatValue={(v) => `${v}%`} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
