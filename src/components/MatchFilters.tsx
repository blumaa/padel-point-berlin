"use client";

import { useState } from "react";

interface MatchFiltersProps {
  isOpen: boolean;
  value: FilterState;
  availableVenues: string[];
  onFilterChange: (filters: FilterState) => void;
}

export const TIME_OF_DAY = ["morning", "afternoon", "evening"] as const;
export type TimeOfDay = typeof TIME_OF_DAY[number];
const TIME_LABELS: Record<TimeOfDay, string> = {
  morning: "Morning (6–12)",
  afternoon: "Afternoon (12–17)",
  evening: "Evening (17–24)",
};

export interface FilterState {
  levelMin: string;
  levelMax: string;
  venues: string[];
  timeOfDay: TimeOfDay[];
  category: string;
}

export const defaultFilters: FilterState = {
  levelMin: "",
  levelMax: "",
  venues: [],
  timeOfDay: [...TIME_OF_DAY],
  category: "",
};

export default function MatchFilters({ isOpen, value, availableVenues, onFilterChange }: MatchFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(value);
  const [venuesOpen, setVenuesOpen] = useState(true);

  function toggleTimeOfDay(slot: TimeOfDay) {
    const next = {
      ...filters,
      timeOfDay: filters.timeOfDay.includes(slot)
        ? filters.timeOfDay.filter((t) => t !== slot)
        : [...filters.timeOfDay, slot],
    };
    setFilters(next);
    onFilterChange(next);
  }

  function updateField(field: keyof Omit<FilterState, "venues" | "timeOfDay">, value: string) {
    const next = { ...filters, [field]: value };
    setFilters(next);
    onFilterChange(next);
  }

  function toggleVenue(venue: string) {
    const next = {
      ...filters,
      venues: filters.venues.includes(venue)
        ? filters.venues.filter((v) => v !== venue)
        : [...filters.venues, venue],
    };
    setFilters(next);
    onFilterChange(next);
  }

  function setVenues(venues: string[]) {
    const next = { ...filters, venues };
    setFilters(next);
    onFilterChange(next);
  }

  if (!isOpen) return null;

  return (
    <div className="klimt-filter-panel">
      {/* Level */}
      <div className="klimt-filter-level-grid">
        <div>
          <label className="klimt-filter-label">Min Level</label>
          <input
            type="number" step="0.1" min="0" max="10"
            value={filters.levelMin}
            onChange={(e) => updateField("levelMin", e.target.value)}
            placeholder="0"
            className="klimt-input"
          />
        </div>
        <div>
          <label className="klimt-filter-label">Max Level</label>
          <input
            type="number" step="0.1" min="0" max="10"
            value={filters.levelMax}
            onChange={(e) => updateField("levelMax", e.target.value)}
            placeholder="10"
            className="klimt-input"
          />
        </div>
      </div>

      {/* Time of day */}
      <div className="klimt-filter-section">
        <label className="klimt-filter-label">Time of Day</label>
        {TIME_OF_DAY.map((slot) => (
          <label key={slot} className="klimt-filter-checkbox-row">
            <input
              type="checkbox"
              checked={filters.timeOfDay.includes(slot)}
              onChange={() => toggleTimeOfDay(slot)}
              className="klimt-checkbox"
            />
            <span className="klimt-filter-checkbox-label">{TIME_LABELS[slot]}</span>
          </label>
        ))}
      </div>

      {/* Category */}
      <div>
        <label className="klimt-filter-label">Category</label>
        <select
          value={filters.category}
          onChange={(e) => updateField("category", e.target.value)}
          className="klimt-input"
        >
          <option value="">All</option>
          <option value="Open">Open</option>
          <option value="Mixed">Mixed</option>
          <option value="Women">Women</option>
          <option value="Men">Men</option>
        </select>
      </div>

      {/* Venue checkboxes */}
      {availableVenues.length > 0 && (
        <div>
          <button
            onClick={() => setVenuesOpen((v) => !v)}
            className="klimt-filter-venue-header"
          >
            <span className="klimt-filter-venue-title">Venue {venuesOpen ? "▲" : "▼"}</span>
            <div className="klimt-filter-venue-actions">
              <span
                onClick={(e) => { e.stopPropagation(); setVenues(availableVenues); }}
                className={`klimt-filter-venue-action${filters.venues.length === availableVenues.length ? " klimt-filter-venue-action--inactive" : ""}`}
              >
                All
              </span>
              <span
                onClick={(e) => { e.stopPropagation(); setVenues([]); }}
                className={`klimt-filter-venue-action${filters.venues.length === 0 ? " klimt-filter-venue-action--inactive" : ""}`}
              >
                None
              </span>
            </div>
          </button>

          {venuesOpen && (
            <div className="klimt-filter-section">
              {availableVenues.map((venue) => (
                <label key={venue} className="klimt-filter-checkbox-row">
                  <input
                    type="checkbox"
                    checked={filters.venues.includes(venue)}
                    onChange={() => toggleVenue(venue)}
                    className="klimt-checkbox"
                  />
                  <span className="klimt-filter-checkbox-label">{venue}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
