/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { VenueTrendChart } from "@/components/analytics/VenueTrendChart";
import type { AnalyticsFilterState } from "@/lib/analyticsTypes";

const mockUseVenueTrendData = jest.fn();
jest.mock("@/hooks/useVenueTrendData", () => ({
  useVenueTrendData: (...args: unknown[]) => mockUseVenueTrendData(...args),
}));

const mockData = [
  { bucket: "2026-01-05", venue: "Padel FC", count: 4 },
  { bucket: "2026-01-05", venue: "Urban Padel", count: 2 },
  { bucket: "2026-01-12", venue: "Padel FC", count: 6 },
  { bucket: "2026-01-12", venue: "Urban Padel", count: 3 },
  { bucket: "2026-01-19", venue: "Padel FC", count: 5 },
  { bucket: "2026-01-19", venue: "Urban Padel", count: 7 },
];

const defaultFilters: AnalyticsFilterState = {
  period: "30d",
  venues: [],
  outcomes: [],
  categories: [],
};

beforeEach(() => {
  mockUseVenueTrendData.mockReturnValue({ data: mockData, isLoading: false });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("VenueTrendChart", () => {
  // --- Granularity controls ---

  it("always shows all four granularity buttons", () => {
    render(<VenueTrendChart filters={defaultFilters} />);

    expect(screen.getByText("Day")).toBeTruthy();
    expect(screen.getByText("Week")).toBeTruthy();
    expect(screen.getByText("Month")).toBeTruthy();
    expect(screen.getByText("Year")).toBeTruthy();
  });

  it("disables nonsensical granularities for the current period", () => {
    render(<VenueTrendChart filters={defaultFilters} />);

    expect(screen.getByText("Month").closest("button")!.hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("Year").closest("button")!.hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("Day").closest("button")!.hasAttribute("disabled")).toBe(false);
    expect(screen.getByText("Week").closest("button")!.hasAttribute("disabled")).toBe(false);
  });

  it("clicking a disabled granularity button does not change selection", () => {
    render(<VenueTrendChart filters={defaultFilters} />);
    fireEvent.click(screen.getByText("Month"));
    expect(mockUseVenueTrendData).toHaveBeenLastCalledWith(defaultFilters, "week");
  });

  it("passes filters and default granularity to hook", () => {
    render(<VenueTrendChart filters={defaultFilters} />);
    expect(mockUseVenueTrendData).toHaveBeenCalledWith(defaultFilters, "week");
  });

  it("updates granularity when an enabled button is clicked", () => {
    render(<VenueTrendChart filters={defaultFilters} />);
    fireEvent.click(screen.getByText("Day"));
    expect(mockUseVenueTrendData).toHaveBeenLastCalledWith(defaultFilters, "day");
  });

  it("falls back to default granularity when period changes and selection is unavailable", () => {
    const { rerender } = render(<VenueTrendChart filters={defaultFilters} />);
    fireEvent.click(screen.getByText("Day"));
    rerender(<VenueTrendChart filters={{ ...defaultFilters, period: "6m" }} />);
    expect(mockUseVenueTrendData).toHaveBeenLastCalledWith(
      { ...defaultFilters, period: "6m" },
      "month",
    );
  });

  // --- SVG rendering ---

  it("renders one venue group per venue", () => {
    const { container } = render(<VenueTrendChart filters={defaultFilters} />);
    const venueGroups = container.querySelectorAll(".klimt-trend-venue-group");
    expect(venueGroups.length).toBe(2);
  });

  it("each venue group has a distinct stroke-dasharray", () => {
    const { container } = render(<VenueTrendChart filters={defaultFilters} />);
    const groups = container.querySelectorAll(".klimt-trend-venue-group");
    const patterns = Array.from(groups).map((g) => {
      const visible = g.querySelectorAll("polyline")[1];
      return visible.getAttribute("stroke-dasharray") ?? "solid";
    });
    expect(new Set(patterns).size).toBe(patterns.length);
  });

  it("renders data point dots when bucket count is small", () => {
    const { container } = render(<VenueTrendChart filters={defaultFilters} />);
    expect(container.querySelectorAll("circle").length).toBeGreaterThan(0);
  });

  it("renders y-axis labels and grid lines", () => {
    const { container } = render(<VenueTrendChart filters={defaultFilters} />);
    expect(container.querySelectorAll(".klimt-trend-ylabel").length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".klimt-trend-grid").length).toBeGreaterThan(0);
  });

  // --- Legend toggle ---

  it("renders legend with venue names", () => {
    const { container } = render(<VenueTrendChart filters={defaultFilters} />);
    const legend = container.querySelector(".klimt-trend-legend");
    expect(legend!.textContent).toContain("Padel FC");
    expect(legend!.textContent).toContain("Urban Padel");
  });

  it("clicking a legend venue hides its line", () => {
    const { container } = render(<VenueTrendChart filters={defaultFilters} />);
    const padelFCItem = Array.from(container.querySelectorAll(".klimt-legend-item"))
      .find((el) => el.textContent?.includes("Padel FC"));
    fireEvent.click(padelFCItem!);
    expect(container.querySelectorAll(".klimt-trend-venue-group").length).toBe(1);
  });

  it("clicking a hidden legend venue shows its line again", () => {
    const { container } = render(<VenueTrendChart filters={defaultFilters} />);
    const padelFCItem = Array.from(container.querySelectorAll(".klimt-legend-item"))
      .find((el) => el.textContent?.includes("Padel FC"));
    fireEvent.click(padelFCItem!);
    fireEvent.click(padelFCItem!);
    expect(container.querySelectorAll(".klimt-trend-venue-group").length).toBe(2);
  });

  it("applies dimmed class to hidden venue legend items", () => {
    const { container } = render(<VenueTrendChart filters={defaultFilters} />);
    const padelFCItem = Array.from(container.querySelectorAll(".klimt-legend-item"))
      .find((el) => el.textContent?.includes("Padel FC"));
    fireEvent.click(padelFCItem!);
    expect(padelFCItem!.className).toContain("klimt-legend-item--hidden");
  });

  // --- Select all / deselect all ---

  it("renders select all and deselect all buttons", () => {
    render(<VenueTrendChart filters={defaultFilters} />);
    expect(screen.getByText("All")).toBeTruthy();
    expect(screen.getByText("None")).toBeTruthy();
  });

  it("deselect all hides all venue lines", () => {
    const { container } = render(<VenueTrendChart filters={defaultFilters} />);
    fireEvent.click(screen.getByText("None"));
    expect(container.querySelectorAll(".klimt-trend-venue-group").length).toBe(0);
  });

  it("select all restores all venue lines after deselect", () => {
    const { container } = render(<VenueTrendChart filters={defaultFilters} />);
    fireEvent.click(screen.getByText("None"));
    fireEvent.click(screen.getByText("All"));
    expect(container.querySelectorAll(".klimt-trend-venue-group").length).toBe(2);
  });

  // --- Hover: line shows name only, dot shows name + value ---

  it("hovering a venue line shows tooltip with just the club name", () => {
    const { container } = render(<VenueTrendChart filters={defaultFilters} />);
    const firstGroup = container.querySelectorAll(".klimt-trend-venue-group")[0];
    const venueName = firstGroup.getAttribute("data-venue")!;

    fireEvent.mouseEnter(firstGroup);

    const tooltip = container.querySelector(".klimt-trend-tooltip");
    expect(tooltip).not.toBeNull();
    expect(tooltip!.textContent).toContain(venueName);
    expect(tooltip!.querySelector(".klimt-trend-tooltip-value")).toBeNull();
  });

  it("hovering a data point dot shows tooltip with club name and that point's value", () => {
    const { container } = render(<VenueTrendChart filters={defaultFilters} />);
    const firstDot = container.querySelector(".klimt-trend-venue-group circle")!;

    fireEvent.mouseEnter(firstDot);

    const tooltip = container.querySelector(".klimt-trend-tooltip");
    expect(tooltip).not.toBeNull();
    expect(tooltip!.querySelector(".klimt-trend-tooltip-value")).not.toBeNull();
  });

  it("hides tooltip on mouse leave from venue line", () => {
    const { container } = render(<VenueTrendChart filters={defaultFilters} />);
    const firstGroup = container.querySelectorAll(".klimt-trend-venue-group")[0];
    fireEvent.mouseEnter(firstGroup);
    expect(container.querySelector(".klimt-trend-tooltip")).not.toBeNull();
    fireEvent.mouseLeave(firstGroup);
    expect(container.querySelector(".klimt-trend-tooltip")).toBeNull();
  });

  // --- Empty / loading states ---

  it("shows 'No data' message when hook returns empty array", () => {
    mockUseVenueTrendData.mockReturnValue({ data: [], isLoading: false });
    const { container } = render(<VenueTrendChart filters={defaultFilters} />);
    expect(container.querySelector(".klimt-trend-empty")!.textContent).toMatch(/no data/i);
  });

  it("applies loading class when hook is loading", () => {
    mockUseVenueTrendData.mockReturnValue({ data: [], isLoading: true });
    const { container } = render(<VenueTrendChart filters={defaultFilters} />);
    expect(container.firstElementChild!.className).toContain("klimt-trend--loading");
  });
});
