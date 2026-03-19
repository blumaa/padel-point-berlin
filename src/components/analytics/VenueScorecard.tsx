"use client";

import { useState } from "react";
import type { VenueCount, FillRateRow, LeadTimeRow } from "@/lib/analyticsTypes";

interface Props {
  popularity: VenueCount[];
  fillRate: FillRateRow[];
  leadTime: LeadTimeRow[];
}

const DEFAULT_VISIBLE = 5;

export function VenueScorecard({ popularity, fillRate, leadTime }: Props) {
  const [showAll, setShowAll] = useState(false);

  // Build a lookup for fill rate and lead time by venue
  const fillMap = new Map(fillRate.map((v) => [v.venue, v.percentage]));
  const leadMap = new Map(leadTime.map((v) => [v.venue, v.avgDays]));

  const rows = popularity.map((v, i) => ({
    rank: i + 1,
    venue: v.venue,
    matches: v.count,
    fillPct: fillMap.get(v.venue) ?? null,
    leadDays: leadMap.get(v.venue) ?? null,
  }));

  const visible = showAll ? rows : rows.slice(0, DEFAULT_VISIBLE);
  const hasMore = rows.length > DEFAULT_VISIBLE;

  return (
    <>
      <div className="klimt-venue-table">
        <div className="klimt-venue-header">
          <span className="klimt-venue-col klimt-venue-col--name">Venue</span>
          <span className="klimt-venue-col klimt-venue-col--stat">Matches</span>
          <span className="klimt-venue-col klimt-venue-col--stat">Fill Rate</span>
          <span className="klimt-venue-col klimt-venue-col--stat">Lead Time</span>
        </div>
        {visible.map((r) => (
          <div key={r.venue} className="klimt-venue-row">
            <span className="klimt-venue-col klimt-venue-col--name">
              <span className="klimt-venue-rank">{r.rank}</span>
              {r.venue}
            </span>
            <span className="klimt-venue-col klimt-venue-col--stat">{r.matches}</span>
            <span className="klimt-venue-col klimt-venue-col--stat">
              {r.fillPct != null ? `${r.fillPct}%` : "—"}
            </span>
            <span className="klimt-venue-col klimt-venue-col--stat">
              {r.leadDays != null ? `${r.leadDays}d` : "—"}
            </span>
          </div>
        ))}
      </div>
      {hasMore && (
        <button
          className="klimt-pill klimt-venue-toggle"
          onClick={() => setShowAll((v) => !v)}
        >
          {showAll ? "Show less" : `Show all ${rows.length} venues`}
        </button>
      )}
    </>
  );
}
