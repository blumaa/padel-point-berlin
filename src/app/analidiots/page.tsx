"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { aggregateAnalytics } from "@/lib/analytics";
import { filterMatches, type TimePeriod, type AnalyticsFilterState, DEFAULT_ANALYTICS_FILTERS } from "@/lib/analyticsFilters";
import type { Match } from "@/lib/types";
import CSSAnalytics from "@/components/analytics/CSSAnalytics";
import dynamic from "next/dynamic";

const RechartsAnalytics = dynamic(
  () => import("@/components/analytics/RechartsAnalytics"),
  { ssr: false, loading: () => <p className="klimt-privacy-text">Loading charts...</p> },
);

const D3Analytics = dynamic(
  () => import("@/components/analytics/D3Analytics"),
  { ssr: false, loading: () => <p className="klimt-privacy-text">Loading charts...</p> },
);

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "6m", label: "6m" },
  { value: "1y", label: "1y" },
  { value: "all", label: "All" },
];

type ChartRenderer = "css" | "recharts" | "d3";

function dateRange(earliest: string | null, latest: string | null): string {
  if (!earliest || !latest) return "";
  const fmt = (s: string) => {
    const d = new Date(s);
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
  };
  return `${fmt(earliest)} - ${fmt(latest)}`;
}

export default function AnalyticsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [allMatches, setAllMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [chartRenderer, setChartRenderer] = useState<ChartRenderer>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("analytics-renderer") as ChartRenderer) || "css";
    }
    return "css";
  });

  // Parse filter state from URL
  const filters: AnalyticsFilterState = useMemo(() => {
    const period = (searchParams.get("period") as TimePeriod) || DEFAULT_ANALYTICS_FILTERS.period;
    const venueParam = searchParams.get("venues");
    const venues = venueParam ? venueParam.split(",").filter(Boolean) : [];
    return { period, venues };
  }, [searchParams]);

  const setFilters = useCallback(
    (next: AnalyticsFilterState) => {
      const params = new URLSearchParams();
      if (next.period !== DEFAULT_ANALYTICS_FILTERS.period) {
        params.set("period", next.period);
      }
      if (next.venues.length > 0) {
        params.set("venues", next.venues.join(","));
      }
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "/analidiots", { scroll: false });
    },
    [router],
  );

  // Fetch raw matches once
  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((matches: Match[]) => {
        setAllMatches(matches);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  // Extract unique venues from full dataset
  const uniqueVenues = useMemo(() => {
    const venues = new Set<string>();
    for (const m of allMatches) {
      if (m.venue) venues.add(m.venue);
    }
    return [...venues].sort();
  }, [allMatches]);

  // Filter + aggregate
  const filteredMatches = useMemo(
    () => filterMatches(allMatches, filters),
    [allMatches, filters],
  );

  const analyticsData = useMemo(
    () => aggregateAnalytics(filteredMatches),
    [filteredMatches],
  );

  // Chart renderer toggle
  const toggleRenderer = (r: ChartRenderer) => {
    setChartRenderer(r);
    localStorage.setItem("analytics-renderer", r);
  };

  if (error) {
    return (
      <div className="klimt-bg">
        <div className="klimt-analytics">
          <h1 className="klimt-analytics-title">Analytics</h1>
          <p className="klimt-privacy-text">Failed to load analytics data.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="klimt-bg">
        <div className="klimt-analytics">
          <h1 className="klimt-analytics-title">Analytics</h1>
          <p className="klimt-privacy-text">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="klimt-bg">
      <div className="klimt-analytics">
        <h1 className="klimt-analytics-title">Analytics</h1>

        {/* Sticky filter bar */}
        <div className="klimt-analytics-filters">
          {/* Time period pills */}
          <div className="klimt-filter-pills">
            {TIME_PERIODS.map((tp) => (
              <button
                key={tp.value}
                className={`klimt-pill ${filters.period === tp.value ? "klimt-pill--active" : ""}`}
                onClick={() => setFilters({ ...filters, period: tp.value })}
              >
                {tp.label}
              </button>
            ))}
          </div>

          {/* Venue chips */}
          <div className="klimt-analytics-venue-row">
            <button
              className={`klimt-pill ${filters.venues.length === 0 ? "klimt-pill--active" : ""}`}
              onClick={() => setFilters({ ...filters, venues: [] })}
            >
              All
            </button>
            {uniqueVenues.map((venue) => (
              <button
                key={venue}
                className={`klimt-pill ${filters.venues.includes(venue) ? "klimt-pill--active" : ""}`}
                onClick={() => {
                  const next = filters.venues.includes(venue)
                    ? filters.venues.filter((v) => v !== venue)
                    : [...filters.venues, venue];
                  setFilters({ ...filters, venues: next });
                }}
              >
                {venue}
              </button>
            ))}
          </div>
        </div>

        {/* Context line + chart toggle */}
        <div className="klimt-analytics-context">
          <span className="klimt-analytics-subtitle" style={{ margin: 0 }}>
            {filteredMatches.length} matches
            {dateRange(analyticsData.earliestDate, analyticsData.latestDate) &&
              ` · ${dateRange(analyticsData.earliestDate, analyticsData.latestDate)}`}
          </span>
          <div className="klimt-analytics-toggle">
            <button
              className={`klimt-sort-pill-btn ${chartRenderer === "css" ? "klimt-sort-pill-btn--active" : ""}`}
              onClick={() => toggleRenderer("css")}
            >
              CSS
            </button>
            <button
              className={`klimt-sort-pill-btn ${chartRenderer === "recharts" ? "klimt-sort-pill-btn--active" : ""}`}
              onClick={() => toggleRenderer("recharts")}
            >
              Charts
            </button>
            <button
              className={`klimt-sort-pill-btn ${chartRenderer === "d3" ? "klimt-sort-pill-btn--active" : ""}`}
              onClick={() => toggleRenderer("d3")}
            >
              D3
            </button>
          </div>
        </div>

        {/* Charts */}
        {chartRenderer === "css" ? (
          <CSSAnalytics data={analyticsData} />
        ) : chartRenderer === "recharts" ? (
          <RechartsAnalytics data={analyticsData} />
        ) : (
          <D3Analytics data={analyticsData} />
        )}
      </div>
    </div>
  );
}
