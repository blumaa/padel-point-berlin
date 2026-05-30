"use client";

import { useState, useMemo, useCallback } from "react";
import { friendlyTrendBucket } from "@/lib/formatters";
import { useVenueTrendData } from "@/hooks/useVenueTrendData";
import type { AnalyticsFilterState, TrendGranularity, TimePeriod } from "@/lib/analyticsTypes";

const VENUE_COLORS = [
  "#4e79a7",
  "#f28e2b",
  "#e15759",
  "#76b7b2",
  "#59a14f",
  "#edc948",
  "#b07aa1",
  "#ff9da7",
];

const STROKE_PATTERNS: (string | undefined)[] = [
  undefined,
  "8 4",
  "2 3",
  "12 4 2 4",
  "6 2",
  "4 4 1 4",
  "10 3",
  "3 6",
];

const ALL_GRANULARITIES: TrendGranularity[] = ["day", "week", "month", "year"];

function getAvailableGranularities(period: TimePeriod): Set<TrendGranularity> {
  switch (period) {
    case "30d": return new Set<TrendGranularity>(["day", "week"]);
    case "90d": return new Set<TrendGranularity>(["day", "week", "month"]);
    case "6m":  return new Set<TrendGranularity>(["week", "month"]);
    case "1y":  return new Set<TrendGranularity>(["week", "month"]);
    case "all": return new Set<TrendGranularity>(["week", "month", "year"]);
  }
}

function getDefaultGranularity(period: TimePeriod): TrendGranularity {
  switch (period) {
    case "30d": return "week";
    case "90d": return "week";
    case "6m":  return "month";
    case "1y":  return "month";
    case "all": return "month";
  }
}

const GRANULARITY_LABELS: Record<TrendGranularity, string> = {
  day: "Day",
  week: "Week",
  month: "Month",
  year: "Year",
};

function niceMax(max: number): number {
  if (max <= 0) return 5;
  if (max <= 5) return 5;
  if (max <= 10) return 10;
  const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
  const normalized = max / magnitude;
  if (normalized <= 2) return 2 * magnitude;
  if (normalized <= 3) return 3 * magnitude;
  if (normalized <= 5) return 5 * magnitude;
  return 10 * magnitude;
}

const PAD = { left: 38, right: 12, top: 12, bottom: 28 };
const SVG_W = 600;
const SVG_H = 220;
const PLOT_W = SVG_W - PAD.left - PAD.right;
const PLOT_H = SVG_H - PAD.top - PAD.bottom;

interface HoverState {
  venue: string;
  pointIndex?: number;
}

interface Props {
  filters: AnalyticsFilterState;
}

export function VenueTrendChart({ filters }: Props) {
  const available = getAvailableGranularities(filters.period);
  const [selectedGranularity, setSelectedGranularity] = useState<TrendGranularity>(() => getDefaultGranularity(filters.period));
  const [hiddenVenues, setHiddenVenues] = useState<Set<string>>(new Set());
  const [hover, setHover] = useState<HoverState | null>(null);

  const granularity = useMemo(
    () => available.has(selectedGranularity) ? selectedGranularity : getDefaultGranularity(filters.period),
    [available, selectedGranularity, filters.period],
  );

  const { data, isLoading } = useVenueTrendData(filters, granularity);

  const { buckets, venues, series, yMax, yTicks, sameYear } = useMemo(() => {
    const bucketSet = new Set<string>();
    const venueSet = new Set<string>();
    for (const row of data) {
      bucketSet.add(row.bucket);
      venueSet.add(row.venue);
    }
    const b = [...bucketSet].sort();
    const v = [...venueSet].sort();

    const lookup = new Map<string, number>();
    for (const row of data) {
      lookup.set(`${row.bucket}|${row.venue}`, row.count);
    }

    const s = v.map((venue) => ({
      venue,
      points: b.map((bucket, i) => ({
        x: i,
        y: lookup.get(`${bucket}|${venue}`) ?? 0,
      })),
    }));

    const visibleValues = s
      .filter((sv) => !hiddenVenues.has(sv.venue))
      .flatMap((sv) => sv.points.map((p) => p.y));
    const maxVal = Math.max(...visibleValues, 0);
    const yM = niceMax(maxVal);
    const tickCount = 5;
    const yT = Array.from({ length: tickCount + 1 }, (_, i) => Math.round((yM / tickCount) * i));

    const sameYr = b.length > 0 && new Set(b.map((k) => k.slice(0, 4))).size === 1;

    return { buckets: b, venues: v, series: s, yMax: yM, yTicks: yT, sameYear: sameYr };
  }, [data, hiddenVenues]);

  const xScale = useCallback(
    (i: number) => PAD.left + (buckets.length <= 1 ? PLOT_W / 2 : (i / (buckets.length - 1)) * PLOT_W),
    [buckets.length],
  );
  const yScale = useCallback(
    (v: number) => PAD.top + PLOT_H - (v / (yMax || 1)) * PLOT_H,
    [yMax],
  );

  const maxLabels = 8;
  const labelStep = Math.max(1, Math.ceil(buckets.length / maxLabels));

  const toggleVenue = useCallback((venue: string) => {
    setHiddenVenues((prev) => {
      const next = new Set(prev);
      if (next.has(venue)) next.delete(venue);
      else next.add(venue);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => setHiddenVenues(new Set()), []);
  const deselectAll = useCallback(() => setHiddenVenues(new Set(venues)), [venues]);

  const visibleSeries = series.filter((s) => !hiddenVenues.has(s.venue));
  const showDots = buckets.length <= 24;

  return (
    <div className={isLoading ? "klimt-trend--loading" : ""} style={{ position: "relative" }}>
      <div className="klimt-trend-toggle">
        {ALL_GRANULARITIES.map((g) => {
          const enabled = available.has(g);
          return (
            <button
              key={g}
              className={`klimt-pill klimt-pill--sm ${granularity === g ? "klimt-pill--active" : ""} ${!enabled ? "klimt-pill--disabled" : ""}`}
              onClick={enabled ? () => setSelectedGranularity(g) : undefined}
              disabled={!enabled}
            >
              {GRANULARITY_LABELS[g]}
            </button>
          );
        })}
      </div>

      {buckets.length === 0 ? (
        <p className="klimt-trend-empty">No data for this period.</p>
      ) : (
        <>
          <svg
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            className="klimt-trend-svg"
            preserveAspectRatio="xMidYMid meet"
          >
            {yTicks.map((tick) => (
              <line
                key={tick}
                x1={PAD.left}
                y1={yScale(tick)}
                x2={SVG_W - PAD.right}
                y2={yScale(tick)}
                className="klimt-trend-grid"
              />
            ))}

            {yTicks.map((tick) => (
              <text key={tick} x={PAD.left - 6} y={yScale(tick) + 3} className="klimt-trend-ylabel">
                {tick}
              </text>
            ))}

            {visibleSeries.map((s) => {
              const vi = venues.indexOf(s.venue);
              const color = VENUE_COLORS[vi % VENUE_COLORS.length];
              const dashArray = STROKE_PATTERNS[vi % STROKE_PATTERNS.length];
              const pointStr = s.points.map((p) => `${xScale(p.x)},${yScale(p.y)}`).join(" ");
              const isHovered = hover?.venue === s.venue;
              return (
                <g
                  key={s.venue}
                  className="klimt-trend-venue-group"
                  data-venue={s.venue}
                  onMouseEnter={() => setHover({ venue: s.venue })}
                  onMouseLeave={() => setHover(null)}
                >
                  <polyline
                    points={pointStr}
                    fill="none"
                    stroke="transparent"
                    strokeWidth="12"
                  />
                  <polyline
                    points={pointStr}
                    fill="none"
                    stroke={color}
                    strokeWidth={isHovered ? 3 : 2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    strokeDasharray={dashArray}
                  />
                  {showDots &&
                    s.points.map((p, pi) => (
                      <circle
                        key={pi}
                        cx={xScale(p.x)}
                        cy={yScale(p.y)}
                        r={isHovered && hover?.pointIndex === pi ? 6 : isHovered ? 4 : 3}
                        fill={color}
                        onMouseEnter={(e) => {
                          e.stopPropagation();
                          setHover({ venue: s.venue, pointIndex: pi });
                        }}
                        onMouseLeave={(e) => {
                          e.stopPropagation();
                          setHover({ venue: s.venue });
                        }}
                        style={{ cursor: "pointer" }}
                      />
                    ))}
                </g>
              );
            })}

            {buckets.map((bucket, i) =>
              i % labelStep === 0 ? (
                <text key={bucket} x={xScale(i)} y={SVG_H - 4} className="klimt-trend-xlabel">
                  {friendlyTrendBucket(bucket, granularity, sameYear)}
                </text>
              ) : null,
            )}
          </svg>

          {hover !== null && (() => {
            const s = visibleSeries.find((vs) => vs.venue === hover.venue);
            if (!s) return null;
            const vi = venues.indexOf(s.venue);
            const color = VENUE_COLORS[vi % VENUE_COLORS.length];
            const hasPoint = hover.pointIndex !== undefined;
            const anchorX = hasPoint ? xScale(hover.pointIndex!) : xScale(Math.floor(s.points.length / 2));

            return (
              <div
                className="klimt-trend-tooltip"
                style={{ left: `${(anchorX / SVG_W) * 100}%` }}
              >
                <div className="klimt-trend-tooltip-header" style={{ color }}>
                  {s.venue}
                </div>
                {hasPoint && (
                  <div className="klimt-trend-tooltip-row">
                    <span className="klimt-trend-tooltip-venue">
                      {friendlyTrendBucket(buckets[hover.pointIndex!], granularity, sameYear)}
                    </span>
                    <span className="klimt-trend-tooltip-value">
                      {s.points[hover.pointIndex!].y}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}

      {venues.length > 0 && (
        <div className="klimt-legend klimt-trend-legend">
          <span className="klimt-trend-legend-controls">
            <button className="klimt-pill klimt-pill--xs" onClick={selectAll}>All</button>
            <button className="klimt-pill klimt-pill--xs" onClick={deselectAll}>None</button>
          </span>
          {venues.map((venue, i) => (
            <span
              key={venue}
              className={`klimt-legend-item ${hiddenVenues.has(venue) ? "klimt-legend-item--hidden" : ""}`}
              onClick={() => toggleVenue(venue)}
              role="button"
              tabIndex={0}
            >
              <span
                className="klimt-legend-swatch"
                style={{ background: VENUE_COLORS[i % VENUE_COLORS.length] }}
              />
              {venue}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
