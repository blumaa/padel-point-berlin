"use client";

import { useState, useEffect, useRef } from "react";
import Drawer from "@/components/Drawer";
import { loadPresets, savePreset, deletePreset } from "@/lib/filterPresets";

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
  matchCount: number;
  onFilterChange: (filters: FilterState) => void;
  onClose: () => void;
}

export default function MatchFilters({
  isOpen,
  value,
  availableVenues,
  matchCount,
  onFilterChange,
  onClose,
}: MatchFiltersProps) {
  const [filters, setFilters] = useState<FilterState>(value);
  const [presets, setPresets] = useState<Record<string, FilterState>>({});
  const [activePreset, setActivePreset] = useState<string | null>(() => {
    try { return localStorage.getItem("ppb-active-preset") ?? null; } catch { return null; }
  });
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [deleteMode, setDeleteMode] = useState(false);
  const [presetError, setPresetError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presetRowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFilters(value);
  }, [value]);

  useEffect(() => {
    setPresets(loadPresets());
  }, []);

  // Persist active preset
  useEffect(() => {
    try {
      if (activePreset) localStorage.setItem("ppb-active-preset", activePreset);
      else localStorage.removeItem("ppb-active-preset");
    } catch {}
  }, [activePreset]);

  // On mount, restore preset filters if one is active
  useEffect(() => {
    if (activePreset) {
      const saved = loadPresets()[activePreset];
      if (saved) {
        setFilters(saved);
        onFilterChange(saved);
      } else {
        setActivePreset(null);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activePreset) {
      const saved = presets[activePreset];
      if (saved && JSON.stringify(saved) !== JSON.stringify(filters)) {
        setActivePreset(null);
      }
    }
  }, [filters, activePreset, presets]);

  useEffect(() => {
    if (isAdding && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isAdding]);

  // Exit delete mode on click outside preset row
  useEffect(() => {
    if (!deleteMode) return;
    function handlePointerDown(e: PointerEvent) {
      if (presetRowRef.current && !presetRowRef.current.contains(e.target as Node)) {
        setDeleteMode(false);
      }
    }
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [deleteMode]);

  function startLongPress() {
    longPressTimer.current = setTimeout(() => setDeleteMode(true), 500);
  }

  function cancelLongPress() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }

  function handleLoadPreset(name: string) {
    if (deleteMode) return;
    const preset = presets[name];
    if (!preset) return;
    setActivePreset(name);
    setFilters(preset);
    onFilterChange(preset);
  }

  function handleSavePreset() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (trimmed in presets) {
      setPresetError("Name already exists");
      return;
    }
    const filtersJson = JSON.stringify(filters);
    const duplicate = Object.entries(presets).find(([, v]) => JSON.stringify(v) === filtersJson);
    if (duplicate) {
      setPresetError(`Same filters as "${duplicate[0]}"`);
      return;
    }
    if (Object.keys(presets).length >= 5) {
      setPresetError("Max 5 presets. Long-press a preset to delete it.");
      return;
    }
    try {
      savePreset(trimmed, filters);
      setPresets(loadPresets());
      setActivePreset(trimmed);
      setIsAdding(false);
      setNewName("");
      setPresetError(null);
    } catch {}
  }

  function handleDeletePreset(name: string) {
    deletePreset(name);
    const updated = loadPresets();
    setPresets(updated);
    if (activePreset === name) setActivePreset(null);
    if (Object.keys(updated).length === 0) setDeleteMode(false);
  }

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
      title={<><span className="klimt-filter-count">{matchCount} matches</span>{!isAdding && (
        <button type="button" className="klimt-preset-add" onClick={() => setIsAdding(true)}>+ Save preset</button>
      )}</>}
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
      {/* Presets */}
      <div className="klimt-filter-section">
        {Object.keys(presets).length > 0 && (
          <div className="klimt-preset-row" ref={presetRowRef}>
            {Object.keys(presets).map((name) => (
              <button
                key={name}
                type="button"
                className={`klimt-preset-pill${activePreset === name ? " klimt-preset-pill--active" : ""}${deleteMode ? " klimt-preset-pill--shaking" : ""}`}
                onClick={() => handleLoadPreset(name)}
                onPointerDown={startLongPress}
                onPointerUp={cancelLongPress}
                onPointerLeave={cancelLongPress}
              >
                {name}
                {deleteMode && (
                  <span
                    className="klimt-preset-x-badge"
                    role="button"
                    aria-label={`Delete preset ${name}`}
                    onClick={(e) => { e.stopPropagation(); handleDeletePreset(name); }}
                  />
                )}
              </button>
            ))}
          </div>
        )}
        {isAdding && (
          <div className="klimt-preset-add-row">
            <input
              ref={nameInputRef}
              type="text"
              maxLength={20}
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setPresetError(null); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSavePreset(); if (e.key === "Escape") { setIsAdding(false); setNewName(""); } }}
              placeholder="Preset name"
              className="klimt-input klimt-preset-input"
            />
            <button type="button" className="klimt-preset-confirm" onClick={handleSavePreset}>
              Save
            </button>
            <button type="button" className="klimt-preset-cancel" onClick={() => { setIsAdding(false); setNewName(""); setPresetError(null); }}>
              Cancel
            </button>
          </div>
        )}
        {presetError && <p className="klimt-preset-error">{presetError}</p>}
      </div>

      {/* Level */}
      <div className="klimt-filter-section klimt-filter-section--divided">
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
    </Drawer>
  );
}
