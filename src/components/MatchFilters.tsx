"use client";

import { useState, useEffect } from "react";
import Drawer from "@/components/Drawer";

export const TIME_OF_DAY = ["morning", "afternoon", "evening"] as const;
export type TimeOfDay = typeof TIME_OF_DAY[number];
const TIME_LABELS: Record<TimeOfDay, string> = {
  morning: "Morning (6–12)",
  afternoon: "Afternoon (12–17)",
  evening: "Evening (17–24)",
};

export const CATEGORIES = ["Open", "Mixed", "Women", "Men"] as const;
export type Category = typeof CATEGORIES[number];
const CATEGORY_LABELS: Record<Category, string> = {
  Open: "Open",
  Mixed: "Mixed",
  Women: "Women only",
  Men: "Men only",
};

export interface FilterState {
  levelMin: string;
  levelMax: string;
  venues: string[];
  timeOfDay: TimeOfDay[];
  category: Category[];
  indoor: "indoor" | "outdoor" | null;
  competitionMode: "friendly" | "competitive" | null;
}

export const defaultFilters: FilterState = {
  levelMin: "",
  levelMax: "",
  venues: [],
  timeOfDay: [...TIME_OF_DAY],
  category: [...CATEGORIES],
  indoor: null,
  competitionMode: null,
};

interface MatchFiltersProps {
  isOpen: boolean;
  value: FilterState;
  availableVenues: string[];
  onFilterChange: (filters: FilterState) => void;
  onClose: () => void;
}

export default function MatchFilters({
  isOpen,
  value,
  availableVenues,
  onFilterChange,
  onClose,
}: MatchFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(value);

  useEffect(() => {
    setFilters(value);
  }, [value]);

  const isFiltered =
    filters.levelMin !== "" ||
    filters.levelMax !== "" ||
    filters.timeOfDay.length < TIME_OF_DAY.length ||
    filters.category.length < CATEGORIES.length ||
    filters.venues.length < availableVenues.length ||
    filters.indoor !== null ||
    filters.competitionMode !== null;

  function handleReset() {
    const reset: FilterState = { ...defaultFilters, venues: availableVenues };
    setFilters(reset);
    onFilterChange(reset);
  }

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

  function updateLevel(field: "levelMin" | "levelMax", raw: string) {
    let val = raw;
    if (raw !== "") {
      const n = parseFloat(raw);
      if (!isNaN(n)) {
        val = String(Math.min(10, Math.max(0, n)));
      }
    }

    let next: FilterState = { ...filters, [field]: val };

    if (next.levelMin !== "" && next.levelMax !== "") {
      const lo = parseFloat(next.levelMin);
      const hi = parseFloat(next.levelMax);
      if (!isNaN(lo) && !isNaN(hi)) {
        if (field === "levelMin" && lo > hi) next = { ...next, levelMax: val };
        if (field === "levelMax" && hi < lo) next = { ...next, levelMin: val };
      }
    }

    setFilters(next);
    onFilterChange(next);
  }

  function toggleCategory(cat: Category) {
    const next = {
      ...filters,
      category: filters.category.includes(cat)
        ? filters.category.filter((c) => c !== cat)
        : [...filters.category, cat],
    };
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

  function setIndoor(indoor: "indoor" | "outdoor" | null) {
    const next = { ...filters, indoor };
    setFilters(next);
    onFilterChange(next);
  }

  function setCompetitionMode(competitionMode: "friendly" | "competitive" | null) {
    const next = { ...filters, competitionMode };
    setFilters(next);
    onFilterChange(next);
  }

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title="Filters"
      actions={
        <>
          <button
            type="button"
            className="klimt-drawer-reset"
            onClick={handleReset}
            disabled={!isFiltered}
          >
            Reset
          </button>
          <button
            type="button"
            className="klimt-drawer-done"
            onClick={onClose}
          >
            Done
          </button>
        </>
      }
    >
      {/* Level */}
      <div className="klimt-filter-section">
        <span className="klimt-filter-label">Level</span>
        <div className="klimt-filter-level-row">
          <div className="klimt-filter-level-field">
            <label className="klimt-filter-sublabel" htmlFor="levelMin">From</label>
            <input
              id="levelMin"
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={filters.levelMin}
              onChange={(e) => updateLevel("levelMin", e.target.value)}
              onBlur={(e) => updateLevel("levelMin", e.target.value)}
              placeholder="0"
              aria-label="Minimum level"
              className="klimt-input klimt-input--level"
            />
          </div>
          <span className="klimt-filter-level-sep">—</span>
          <div className="klimt-filter-level-field">
            <label className="klimt-filter-sublabel" htmlFor="levelMax">To</label>
            <input
              id="levelMax"
              type="number"
              step="0.1"
              min="0"
              max="10"
              value={filters.levelMax}
              onChange={(e) => updateLevel("levelMax", e.target.value)}
              onBlur={(e) => updateLevel("levelMax", e.target.value)}
              placeholder="10"
              aria-label="Maximum level"
              className="klimt-input klimt-input--level"
            />
          </div>
        </div>
      </div>

      {/* Time of day */}
      <div className="klimt-filter-section klimt-filter-section--divided">
        <span className="klimt-filter-label">Time of Day</span>
        <div className="klimt-filter-pills">
          {TIME_OF_DAY.map((slot) => (
            <button
              key={slot}
              type="button"
              className={`klimt-pill${filters.timeOfDay.includes(slot) ? " klimt-pill--active" : ""}`}
              onClick={() => toggleTimeOfDay(slot)}
            >
              {TIME_LABELS[slot]}
            </button>
          ))}
        </div>
      </div>

      {/* Category */}
      <div className="klimt-filter-section klimt-filter-section--divided">
        <span className="klimt-filter-label">Category</span>
        <div className="klimt-filter-pills">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`klimt-pill${filters.category.includes(cat) ? " klimt-pill--active" : ""}`}
              onClick={() => toggleCategory(cat)}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>
      </div>

      {/* Match type */}
      <div className="klimt-filter-section klimt-filter-section--divided">
        <span className="klimt-filter-label">Match Type</span>
        <div className="klimt-filter-pills">
          {([null, "friendly", "competitive"] as const).map((opt) => (
            <button
              key={String(opt)}
              type="button"
              className={`klimt-pill${filters.competitionMode === opt ? " klimt-pill--active" : ""}`}
              onClick={() => setCompetitionMode(opt)}
            >
              {opt === null ? "All" : opt === "friendly" ? "Friendly" : "Competitive"}
            </button>
          ))}
        </div>
      </div>

      {/* Court type */}
      <div className="klimt-filter-section klimt-filter-section--divided">
        <span className="klimt-filter-label">Court Type</span>
        <div className="klimt-filter-pills">
          {([null, "indoor", "outdoor"] as const).map((opt) => (
            <button
              key={String(opt)}
              type="button"
              className={`klimt-pill${filters.indoor === opt ? " klimt-pill--active" : ""}`}
              onClick={() => setIndoor(opt)}
            >
              {opt === null ? "All" : opt === "indoor" ? "Indoor" : "Outdoor"}
            </button>
          ))}
        </div>
      </div>

      {/* Venues */}
      {availableVenues.length > 0 && (
        <div className="klimt-filter-section klimt-filter-section--divided">
          <span className="klimt-filter-label">Venue</span>
          <div className="klimt-filter-pills">
            <button
              type="button"
              className={`klimt-pill${filters.venues.length === availableVenues.length ? " klimt-pill--active" : ""}`}
              onClick={() => setVenues(availableVenues)}
            >
              All
            </button>
            <button
              type="button"
              className={`klimt-pill${filters.venues.length === 0 ? " klimt-pill--active" : ""}`}
              onClick={() => setVenues([])}
            >
              None
            </button>
            {availableVenues.map((venue) => (
              <button
                key={venue}
                type="button"
                className={`klimt-pill${filters.venues.includes(venue) ? " klimt-pill--active" : ""}`}
                onClick={() => toggleVenue(venue)}
              >
                {venue}
              </button>
            ))}
          </div>
        </div>
      )}
    </Drawer>
  );
}
