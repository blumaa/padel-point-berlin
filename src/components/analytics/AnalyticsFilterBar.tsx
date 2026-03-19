"use client";

import { useState } from "react";
import type { AnalyticsFilterState, TimePeriod, OutcomeFilter } from "@/lib/analyticsTypes";

const TIME_PERIODS: { value: TimePeriod; label: string }[] = [
  { value: "30d", label: "30d" },
  { value: "90d", label: "90d" },
  { value: "6m", label: "6m" },
  { value: "1y", label: "1y" },
  { value: "all", label: "All" },
];

const OUTCOMES: { value: OutcomeFilter; label: string }[] = [
  { value: "filled", label: "Filled" },
  { value: "canceled", label: "Canceled" },
  { value: "pending", label: "Pending" },
  { value: "expired", label: "Expired" },
  { value: "empty", label: "Empty" },
];

const CATEGORIES = ["Open", "Women", "Men", "Mixed"];

interface Props {
  filters: AnalyticsFilterState;
  venues: string[];
  onFiltersChange: (filters: AnalyticsFilterState) => void;
}

function toggleItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((v) => v !== item) : [...arr, item];
}

function hasActiveFilters(filters: AnalyticsFilterState): boolean {
  return filters.outcomes.length > 0 || filters.venues.length > 0 || filters.categories.length > 0;
}

export function AnalyticsFilterBar({ filters, venues, onFiltersChange }: Props) {
  const [open, setOpen] = useState(false);
  const activeCount =
    filters.outcomes.length + filters.venues.length + filters.categories.length;

  return (
    <>
      {open && (
        <div
          className="klimt-filters-backdrop"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="klimt-analytics-filters">
        {/* Time period — always visible */}
        <div className="klimt-filter-pills">
          {TIME_PERIODS.map((tp) => (
            <button
              key={tp.value}
              className={`klimt-pill ${filters.period === tp.value ? "klimt-pill--active" : ""}`}
              onClick={() => onFiltersChange({ ...filters, period: tp.value })}
            >
              {tp.label}
            </button>
          ))}

          <button
            className={`klimt-pill klimt-pill--toggle ${open ? "klimt-pill--active" : ""} ${hasActiveFilters(filters) ? "klimt-pill--has-filters" : ""}`}
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
          >
            Filters{activeCount > 0 ? ` (${activeCount})` : ""}
          </button>
        </div>

        {/* Overlay filter panel */}
        {open && (
          <div className="klimt-filters-expanded">
            {/* Outcomes */}
            <div className="klimt-filter-group">
              <span className="klimt-filter-group-label">Outcome</span>
              <div className="klimt-filter-pills">
                {OUTCOMES.map((o) => (
                  <button
                    key={o.value}
                    className={`klimt-pill ${filters.outcomes.includes(o.value) ? "klimt-pill--active" : ""}`}
                    onClick={() =>
                      onFiltersChange({ ...filters, outcomes: toggleItem(filters.outcomes, o.value) })
                    }
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Venues */}
            {venues.length > 0 && (
              <div className="klimt-filter-group klimt-filter-group--venues">
                <span className="klimt-filter-group-label">Venue</span>
                <div className="klimt-filter-pills">
                  <button
                    className={`klimt-pill ${filters.venues.length === 0 ? "klimt-pill--active" : ""}`}
                    onClick={() => onFiltersChange({ ...filters, venues: [] })}
                  >
                    All
                  </button>
                  {venues.map((venue) => (
                    <button
                      key={venue}
                      className={`klimt-pill ${filters.venues.includes(venue) ? "klimt-pill--active" : ""}`}
                      onClick={() =>
                        onFiltersChange({ ...filters, venues: toggleItem(filters.venues, venue) })
                      }
                    >
                      {venue}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            <div className="klimt-filter-group">
              <span className="klimt-filter-group-label">Category</span>
              <div className="klimt-filter-pills">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    className={`klimt-pill ${filters.categories.includes(cat) ? "klimt-pill--active" : ""}`}
                    onClick={() =>
                      onFiltersChange({ ...filters, categories: toggleItem(filters.categories, cat) })
                    }
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
