"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import DayPicker from "@/components/DayPicker";
import MatchFilters, { defaultFilters, CATEGORIES, type FilterState } from "@/components/MatchFilters";
import type { Match, MatchCategory } from "@/lib/types";
import MatchList from "@/components/MatchList";
import { PadelPointBerlin } from "@/components/PadelPointBerlin";
import LogoOverlay from "@/components/LogoOverlay";
import Footer from "@/components/Footer";
import AddMatchModal from "@/components/AddMatchModal";
import ThemeToggle from "@/components/ThemeToggle";
import { sortMatches } from "@/lib/sortMatches";
import { useWeather } from "@/hooks/useWeather";
import { useHydrated } from "@/hooks/useHydrated";
import { allDates, loadSelectedDates, persistSelectedDates } from "@/lib/dateSelection";

const TIME_SLOTS = {
  morning:   { start: 6,  end: 11 },
  afternoon: { start: 12, end: 16 },
  evening:   { start: 17, end: 23 },
} as const;

export default function Dashboard() {
  const dates14 = useMemo(allDates, []);
  const hydrated = useHydrated();

  // All state initializes with SSR-safe defaults, then loads from localStorage after hydration
  const [selectedDates, _setSelectedDates] = useState<string[]>(allDates);
  const [filters, _setFilters] = useState<FilterState>(defaultFilters);
  const [sortField, _setSortField] = useState<"date" | "added">("date");
  const [sortDir, _setSortDir] = useState<"asc" | "desc">("asc");
  const [hydrationLoaded, setHydrationLoaded] = useState(false);

  if (hydrated && !hydrationLoaded) {
    setHydrationLoaded(true);
    _setSelectedDates(loadSelectedDates());
    try {
      const storedFilters = localStorage.getItem("ppb-filters");
      if (storedFilters) _setFilters({ ...defaultFilters, ...JSON.parse(storedFilters) });
      const storedSort = localStorage.getItem("ppb-sort-field");
      if (storedSort === "date" || storedSort === "added") _setSortField(storedSort);
      const storedDir = localStorage.getItem("ppb-sort-dir");
      if (storedDir === "asc" || storedDir === "desc") _setSortDir(storedDir);
    } catch {}
  }

  const setSelectedDates = useCallback((dates: string[] | ((prev: string[]) => string[])) => {
    _setSelectedDates((prev) => {
      const next = typeof dates === "function" ? dates(prev) : dates;
      persistSelectedDates(next);
      return next;
    });
  }, []);

  const setFilters = useCallback((value: FilterState | ((prev: FilterState) => FilterState)) => {
    _setFilters((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      try { localStorage.setItem("ppb-filters", JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const setSortField = useCallback((value: "date" | "added") => {
    _setSortField(value);
    try { localStorage.setItem("ppb-sort-field", value); } catch {}
  }, []);

  const setSortDir = useCallback((value: "asc" | "desc" | ((prev: "asc" | "desc") => "asc" | "desc")) => {
    _setSortDir((prev) => {
      const next = typeof value === "function" ? value(prev) : value;
      try { localStorage.setItem("ppb-sort-dir", next); } catch {}
      return next;
    });
  }, []);

  const [availableVenues, setAvailableVenues] = useState<string[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const [logoExpanded, setLogoExpanded] = useState(false);
  const [logoRect, setLogoRect] = useState<DOMRect | null>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { weather, isLoading: weatherLoading } = useWeather();

  useEffect(() => {
    fetch("/api/venues")
      .then((r) => r.json())
      .then((data: string[]) => {
        if (!Array.isArray(data)) return;
        setAvailableVenues(data);
        setFilters((prev) => {
          // If no venues persisted yet, default to all
          if (prev.venues.length === 0) return { ...prev, venues: data };
          // Otherwise keep the intersection of persisted + available (handles removed venues)
          const valid = new Set(data);
          const kept = prev.venues.filter((v) => valid.has(v));
          return { ...prev, venues: kept.length > 0 ? kept : data };
        });
      })
      .catch(() => {});
  }, [setFilters]);

  const toggleDate = useCallback((date: string) => {
    setSelectedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date].sort()
    );
  }, [setSelectedDates]);

  const activeFilterCount = useMemo(() => {
    return (
      (filters.levelMin ? 1 : 0) +
      (filters.levelMax ? 1 : 0) +
      (filters.venues.length < availableVenues.length && availableVenues.length > 0 ? 1 : 0) +
      (filters.timeOfDay.length < 3 ? 1 : 0) +
      (filters.category.length < CATEGORIES.length ? 1 : 0) +
      (filters.indoor !== null ? 1 : 0) +
      (filters.competitionMode !== null ? 1 : 0)
    );
  }, [filters, availableVenues.length]);

  const fetchMatches = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/matches");
      const data = await res.json();
      setMatches(Array.isArray(data) ? data : []);
    } catch {
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);

  const filteredMatches = useMemo(() => {
    if (selectedDates.length === 0 || filters.timeOfDay.length === 0) return [];
    if (availableVenues.length > 0 && filters.venues.length === 0) return [];

    const twoHoursFromNow = Date.now() + 2 * 60 * 60 * 1000;

    return matches.filter((match) => {
      const t = new Date(match.match_time);
      if (t.getTime() < twoHoursFromNow) return false;
      const dateStr = t.toISOString().split("T")[0];
      if (!selectedDates.includes(dateStr)) return false;

      const hour = t.getHours();
      const inSlot = filters.timeOfDay.some((slot) => {
        const s = TIME_SLOTS[slot as keyof typeof TIME_SLOTS];
        return s && hour >= s.start && hour <= s.end;
      });
      if (!inSlot) return false;

      if (filters.levelMin || filters.levelMax) {
        if (match.level_min == null || match.level_max == null) return false;
        if (filters.levelMin && match.level_min < Number(filters.levelMin)) return false;
        if (filters.levelMax && match.level_max > Number(filters.levelMax)) return false;
      }

      if (availableVenues.length > 0 && filters.venues.length < availableVenues.length) {
        if (!match.venue || !filters.venues.includes(match.venue)) return false;
      }

      if (filters.category.length < CATEGORIES.length && !filters.category.includes(match.category as MatchCategory)) return false;

      if (filters.indoor !== null && match.indoor !== filters.indoor) return false;
      if (filters.competitionMode !== null && match.competition_mode !== filters.competitionMode) return false;

      return true;
    });
  }, [matches, selectedDates, filters, availableVenues]);

  const sortedMatches = useMemo(
    () => sortMatches(filteredMatches, sortField, sortDir),
    [filteredMatches, sortField, sortDir]
  );

  const allSelected = dates14.every((d) => selectedDates.includes(d));

  return (
    <div className="klimt-bg">
      <header className="klimt-header">
        <div className="klimt-header-inner">
          <div className="klimt-header-left">
            <div
              ref={logoRef}
              className="klimt-logo"
              onClick={() => {
                const rect = logoRef.current?.getBoundingClientRect();
                if (rect) {
                  setLogoRect(rect);
                  setLogoExpanded(true);
                }
              }}
              role="button"
              aria-label="View logo animation"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  const rect = logoRef.current?.getBoundingClientRect();
                  if (rect) {
                    setLogoRect(rect);
                    setLogoExpanded(true);
                  }
                }
              }}
            >
              <PadelPointBerlin />
            </div>
            <h1 className="klimt-title">Padel Point Berlin</h1>
          </div>
          <ThemeToggle />
        </div>
        <div className="klimt-divider" />
      </header>

      {logoExpanded && logoRect && (
        <LogoOverlay
          sourceRect={logoRect}
          onClose={() => setLogoExpanded(false)}
        />
      )}

      <main className="klimt-main" id="main-content">
        <div className="klimt-sticky-zone">
        <div className="klimt-controls">
          <div className="klimt-controls-left">
            <button
              onClick={() => setIsFiltersOpen((v) => !v)}
              disabled={isLoading}
              className={`klimt-filter-toggle${activeFilterCount > 0 ? " klimt-filter-toggle--active" : ""}`}
              aria-expanded={isFiltersOpen}
            >
              {`Filters${activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}`}
            </button>
            <MatchFilters
              isOpen={isFiltersOpen}
              value={filters}
              availableVenues={availableVenues}
              onFilterChange={setFilters}
              onClose={() => setIsFiltersOpen(false)}
            />
            <button
              onClick={() => setSelectedDates(dates14)}
              disabled={isLoading || allSelected}
              className="klimt-btn-select"
            >
              Select all
            </button>
            <button
              onClick={() => setSelectedDates([])}
              disabled={isLoading || selectedDates.length === 0}
              className="klimt-btn-clear"
            >
              Clear
            </button>
          </div>
          <div className="klimt-sort-controls">
            <div className="klimt-sort-pill">
              {(["date", "added"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setSortField(f)}
                  aria-pressed={sortField === f}
                  className={`klimt-sort-pill-btn${sortField === f ? " klimt-sort-pill-btn--active" : ""}`}
                >
                  {f === "date" ? "Date" : "Added"}
                </button>
              ))}
            </div>
            <button
              onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}
              className={`klimt-sort-dir${(sortField !== "date" || sortDir !== "asc") ? " klimt-sort-dir--active" : ""}`}
              aria-label={sortDir === "asc" ? "Sort ascending, click to reverse" : "Sort descending, click to reverse"}
            >
              <svg width="11" height="14" viewBox="0 0 11 14" fill="none" stroke="currentColor"
                   strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="5.5" y1="1" x2="5.5" y2="13" />
                {sortDir === "asc" ? (
                  <polyline points="2,4 5.5,1 9,4" />
                ) : (
                  <polyline points="2,10 5.5,13 9,10" />
                )}
              </svg>
            </button>
          </div>
        </div>

        <DayPicker selectedDates={selectedDates} onToggle={toggleDate} weather={weather} weatherLoading={weatherLoading} />
        </div>

        {!isLoading && (
          <p className="klimt-match-count">
            <span className="klimt-match-count-number">{sortedMatches.length}</span> {`${sortedMatches.length === 1 ? "match" : "matches"}`}
          </p>
        )}

        <div className="klimt-match-wrapper">
          <MatchList key={sortedMatches.map((m) => m.id).join(",")} matches={sortedMatches} isLoading={isLoading} />
        </div>
        <Footer />
      </main>

      <button
        onClick={() => setIsAddOpen(true)}
        aria-label="Add match"
        className="klimt-fab"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      </button>

      <AddMatchModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onSuccess={fetchMatches}
      />
    </div>
  );
}
