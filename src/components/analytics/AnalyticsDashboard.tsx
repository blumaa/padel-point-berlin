"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAnalyticsData } from "@/hooks/useAnalyticsData";
import { KPIRow } from "./KPIRow";
import { BarChart } from "./BarChart";
import { HeatmapChart } from "./HeatmapChart";
import { VenueScorecard } from "./VenueScorecard";
import { StatSection } from "./StatSection";
import { AnalyticsFilterBar } from "./AnalyticsFilterBar";
import { friendlyBucket, friendlyMonth } from "@/lib/formatters";
import type { AnalyticsFilterState, TimePeriod } from "@/lib/analyticsTypes";
import { DEFAULT_ANALYTICS_FILTERS } from "@/lib/analyticsTypes";

function formatScopeDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

export function AnalyticsDashboard() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const filters: AnalyticsFilterState = useMemo(() => {
    const period = (searchParams.get("period") as TimePeriod) || DEFAULT_ANALYTICS_FILTERS.period;
    const venueParam = searchParams.get("venues");
    const venues = venueParam ? venueParam.split(",").filter(Boolean) : [];
    const outcomeParam = searchParams.get("outcomes");
    const outcomes = outcomeParam
      ? (outcomeParam.split(",").filter(Boolean) as AnalyticsFilterState["outcomes"])
      : [];
    const categoryParam = searchParams.get("categories");
    const categories = categoryParam ? categoryParam.split(",").filter(Boolean) : [];
    return { period, venues, outcomes, categories };
  }, [searchParams]);

  const setFilters = useCallback(
    (next: AnalyticsFilterState) => {
      const params = new URLSearchParams();
      if (next.period !== DEFAULT_ANALYTICS_FILTERS.period) params.set("period", next.period);
      if (next.venues.length > 0) params.set("venues", next.venues.join(","));
      if (next.outcomes.length > 0) params.set("outcomes", next.outcomes.join(","));
      if (next.categories.length > 0) params.set("categories", next.categories.join(","));
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "/analidiots", { scroll: false });
    },
    [router],
  );

  const [venues, setVenues] = useState<string[]>([]);
  useEffect(() => {
    fetch("/api/analytics/venues")
      .then((r) => (r.ok ? r.json() : []))
      .then((v: string[]) => setVenues(v))
      .catch(() => {});
  }, []);

  const { data, isLoading, error } = useAnalyticsData(filters);

  if (error) {
    return <p className="klimt-privacy-text">Failed to load analytics data.</p>;
  }

  if (!data && isLoading) {
    return (
      <div className="klimt-skeleton">
        <div className="klimt-kpi-row">
          {[1, 2, 3].map((i) => (
            <div key={i} className="klimt-kpi-card klimt-kpi-card--loading" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="klimt-stat-card klimt-stat-card--loading" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const dimClass = isLoading ? "klimt-analytics--refetching" : "";
  const now = new Date().toISOString();
  const endDate = data.latestDate && data.latestDate > now ? now : data.latestDate;
  const scope = [
    formatScopeDate(data.earliestDate),
    formatScopeDate(endDate),
  ].filter(Boolean);
  const venueCount = data.venuePopularity.length;

  return (
    <div className={dimClass}>
      {/* Data scope subtitle */}
      <p className="klimt-analytics-scope">
        {data.filledCount.toLocaleString()} matches played across {venueCount} venues
        {scope.length === 2 && ` \u00b7 ${scope[0]} \u2013 ${scope[1]}`}
      </p>

      <AnalyticsFilterBar filters={filters} venues={venues} onFiltersChange={setFilters} />

      {/* 1. KPIs */}
      <KPIRow data={data} />

      {/* 2. Best Times to Play — most actionable chart first */}
      {data.peakMatchTimes.length > 0 && (
        <StatSection
          heading="Best Times to Play"
          subtitle="Darker cells = more matches played"
        >
          <HeatmapChart data={data.peakMatchTimes} />
        </StatSection>
      )}

      {/* 3. Venue Scorecard — consolidated from 3 separate charts */}
      {data.venuePopularity.length > 0 && (
        <StatSection
          heading="Venues"
          subtitle="Ranked by total matches"
        >
          <VenueScorecard
            popularity={data.venuePopularity}
            fillRate={data.fillRate}
            leadTime={data.averageLeadTime}
          />
        </StatSection>
      )}

      {/* 4. Community Growth — activity trend */}
      {data.matchesPerWeek.length > 0 && (
        <StatSection
          heading="Community Growth"
          subtitle="Matches per period"
        >
          <BarChart
            items={data.matchesPerWeek.map((w) => ({
              label: friendlyBucket(w.week),
              value: w.count,
            }))}
            variant="accent"
            labelWidth={60}
          />
        </StatSection>
      )}

      {/* 5. Player Levels */}
      {data.levelDistribution.length > 0 && (
        <StatSection heading="Player Levels" subtitle="Skill level distribution">
          <BarChart
            items={data.levelDistribution.map((l) => ({
              label: `Level ${l.label}`,
              value: l.count,
            }))}
            variant="match"
            labelWidth={75}
          />
        </StatSection>
      )}

      {/* 6. Monthly Breakdown — collapsed by default */}
      {data.outcomeByMonth.length > 0 && (
        <StatSection
          heading="Monthly Breakdown"
          subtitle="Match outcomes over time"
          defaultCollapsed
        >
          {data.outcomeByMonth.map((m) => {
            const total = m.filled + m.canceled + m.empty + m.expired + m.stale + m.pending;
            const maxOutcome = Math.max(
              ...data.outcomeByMonth.map(
                (o) => o.filled + o.canceled + o.empty + o.expired + o.stale + o.pending,
              ),
              1,
            );
            return (
              <div key={m.month} className="klimt-bar-row">
                <span className="klimt-bar-label" style={{ width: 60, minWidth: 60 }}>{friendlyMonth(m.month)}</span>
                <div className="klimt-bar-track klimt-bar-track--stacked">
                  <div className="klimt-bar-fill klimt-bar-fill--filled" style={{ width: `${(m.filled / maxOutcome) * 100}%` }} title={`Filled: ${m.filled}`} />
                  <div className="klimt-bar-fill klimt-bar-fill--canceled" style={{ width: `${(m.canceled / maxOutcome) * 100}%` }} title={`Canceled: ${m.canceled}`} />
                  <div className="klimt-bar-fill klimt-bar-fill--empty" style={{ width: `${(m.empty / maxOutcome) * 100}%` }} title={`Empty: ${m.empty}`} />
                  <div className="klimt-bar-fill klimt-bar-fill--expired" style={{ width: `${(m.expired / maxOutcome) * 100}%` }} title={`Expired: ${m.expired}`} />
                  {m.stale > 0 && <div className="klimt-bar-fill klimt-bar-fill--stale" style={{ width: `${(m.stale / maxOutcome) * 100}%` }} title={`Stale: ${m.stale}`} />}
                  {m.pending > 0 && <div className="klimt-bar-fill klimt-bar-fill--pending" style={{ width: `${(m.pending / maxOutcome) * 100}%` }} title={`Pending: ${m.pending}`} />}
                </div>
                <span className="klimt-bar-value">{total}</span>
              </div>
            );
          })}
          <div className="klimt-legend">
            <span className="klimt-legend-item"><span className="klimt-legend-swatch klimt-legend-swatch--filled" /> Filled</span>
            <span className="klimt-legend-item"><span className="klimt-legend-swatch klimt-legend-swatch--canceled" /> Canceled</span>
            <span className="klimt-legend-item"><span className="klimt-legend-swatch klimt-legend-swatch--empty" /> Empty</span>
            <span className="klimt-legend-item"><span className="klimt-legend-swatch klimt-legend-swatch--expired" /> Expired</span>
          </div>
        </StatSection>
      )}
    </div>
  );
}
