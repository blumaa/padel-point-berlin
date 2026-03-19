/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AnalyticsFilterBar } from "@/components/analytics/AnalyticsFilterBar";
import type { AnalyticsFilterState } from "@/lib/analyticsTypes";
import { DEFAULT_ANALYTICS_FILTERS } from "@/lib/analyticsTypes";

const venues = ["Padel FC Berlin", "Urban Padel", "Grenzallee"];

function renderBar(filtersOverride?: Partial<AnalyticsFilterState>) {
  const onChange = jest.fn();
  const filters = { ...DEFAULT_ANALYTICS_FILTERS, ...filtersOverride };
  render(
    <AnalyticsFilterBar filters={filters} venues={venues} onFiltersChange={onChange} />,
  );
  return { onChange };
}

/** Open the collapsible filter panel */
function expandFilters() {
  fireEvent.click(screen.getByRole("button", { name: /Filters/ }));
}

describe("AnalyticsFilterBar", () => {
  it("renders time period pills with default 30d active", () => {
    renderBar();
    expect(screen.getByRole("button", { name: "30d" })).toHaveClass("klimt-pill--active");
  });

  it("shows a Filters toggle button", () => {
    renderBar();
    expect(screen.getByRole("button", { name: /Filters/ })).toBeInTheDocument();
  });

  it("does not show outcome/venue/category pills until expanded", () => {
    renderBar();
    expect(screen.queryByRole("button", { name: "Filled" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Padel FC Berlin" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Women" })).not.toBeInTheDocument();
  });

  it("renders outcome toggles after expanding", () => {
    renderBar();
    expandFilters();
    expect(screen.getByRole("button", { name: "Filled" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Canceled" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pending" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Expired" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Empty" })).toBeInTheDocument();
  });

  it("renders venue chips after expanding", () => {
    renderBar();
    expandFilters();
    expect(screen.getByRole("button", { name: "Padel FC Berlin" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Urban Padel" })).toBeInTheDocument();
  });

  it("renders category chips after expanding", () => {
    renderBar();
    expandFilters();
    expect(screen.getByRole("button", { name: "Open" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Women" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Men" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Mixed" })).toBeInTheDocument();
  });

  it("calls onFiltersChange with updated period", () => {
    const { onChange } = renderBar();
    fireEvent.click(screen.getByRole("button", { name: "90d" }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ period: "90d" }));
  });

  it("multi-select works for outcomes", () => {
    const { onChange } = renderBar({ outcomes: ["filled"] });
    expandFilters();
    fireEvent.click(screen.getByRole("button", { name: "Canceled" }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ outcomes: ["filled", "canceled"] }),
    );
  });

  it("multi-select works for venues", () => {
    const { onChange } = renderBar();
    expandFilters();
    fireEvent.click(screen.getByRole("button", { name: "Padel FC Berlin" }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ venues: ["Padel FC Berlin"] }),
    );
  });

  it("multi-select works for categories", () => {
    const { onChange } = renderBar();
    expandFilters();
    fireEvent.click(screen.getByRole("button", { name: "Women" }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ categories: ["Women"] }),
    );
  });

  it("deselects when clicking an active outcome", () => {
    const { onChange } = renderBar({ outcomes: ["filled"] });
    expandFilters();
    fireEvent.click(screen.getByRole("button", { name: "Filled" }));
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ outcomes: [] }));
  });

  it("shows active filter count in toggle button", () => {
    renderBar({ outcomes: ["filled"], venues: ["Padel FC Berlin"] });
    expect(screen.getByRole("button", { name: "Filters (2)" })).toBeInTheDocument();
  });

  it("collapses when clicking Filters toggle again", () => {
    renderBar();
    expandFilters();
    expect(screen.getByRole("button", { name: "Filled" })).toBeInTheDocument();
    expandFilters(); // collapse
    expect(screen.queryByRole("button", { name: "Filled" })).not.toBeInTheDocument();
  });

  it("closes when clicking backdrop (click outside)", () => {
    const { container } = render(
      <AnalyticsFilterBar
        filters={DEFAULT_ANALYTICS_FILTERS}
        venues={venues}
        onFiltersChange={jest.fn()}
      />,
    );
    expandFilters();
    expect(screen.getByRole("button", { name: "Filled" })).toBeInTheDocument();

    const backdrop = container.querySelector(".klimt-filters-backdrop");
    expect(backdrop).toBeInTheDocument();
    fireEvent.click(backdrop!);
    expect(screen.queryByRole("button", { name: "Filled" })).not.toBeInTheDocument();
  });
});
