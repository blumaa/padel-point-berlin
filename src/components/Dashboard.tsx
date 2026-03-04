"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import DayPicker from "@/components/DayPicker";
import MatchFilters, { defaultFilters, CATEGORIES, type FilterState } from "@/components/MatchFilters";
import MatchList from "@/components/MatchList";
import { PadelPointBerlin } from "@/components/PadelPointBerlin";
import LogoOverlay from "@/components/LogoOverlay";
import Footer from "@/components/Footer";
import AddMatchModal from "@/components/AddMatchModal";
import ThemeToggle from "@/components/ThemeToggle";
import { sortMatches } from "@/lib/sortMatches";

const TIME_SLOTS = {
  morning:   { start: 6,  end: 11 },
  afternoon: { start: 12, end: 16 },
  evening:   { start: 17, end: 23 },
} as const;

function allDates(): string[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

export default function Dashboard() {
  const dates14 = useMemo(allDates, []);

  const [selectedDates, setSelectedDates] = useState<string[]>(allDates());
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  const [availableVenues, setAvailableVenues] = useState<string[]>([]);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [sortField, setSortField] = useState<"date" | "added">("date");
  const [sortDir, setSortDir]     = useState<"asc" | "desc">("asc");
  const [logoExpanded, setLogoExpanded] = useState(false);
  const [logoRect, setLogoRect] = useState<DOMRect | null>(null);
  const logoRef = useRef<HTMLDivElement>(null);

  const [matches, setMatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/venues")
      .then((r) => r.json())
      .then((data: string[]) => {
        if (!Array.isArray(data)) return;
        setAvailableVenues(data);
        setFilters((prev) => ({ ...prev, venues: data }));
      })
      .catch(() => {});
  }, []);

  const toggleDate = useCallback((date: string) => {
    setSelectedDates((prev) =>
      prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date].sort()
    );
  }, []);

  const activeFilterCount = useMemo(() => {
    return (
      (filters.levelMin ? 1 : 0) +
      (filters.levelMax ? 1 : 0) +
      (filters.venues.length < availableVenues.length && availableVenues.length > 0 ? 1 : 0) +
      (filters.timeOfDay.length < 3 ? 1 : 0) +
      (filters.category.length < CATEGORIES.length ? 1 : 0)
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

    return matches.filter((match) => {
      const t = new Date(match.match_time);
      const dateStr = t.toISOString().split("T")[0];
      if (!selectedDates.includes(dateStr)) return false;

      const hour = t.getHours();
      const inSlot = filters.timeOfDay.some((slot) => {
        const s = TIME_SLOTS[slot as keyof typeof TIME_SLOTS];
        return s && hour >= s.start && hour <= s.end;
      });
      if (!inSlot) return false;

      if (filters.levelMin && match.level_min != null && match.level_min < Number(filters.levelMin)) return false;
      if (filters.levelMax && match.level_max != null && match.level_max > Number(filters.levelMax)) return false;

      if (availableVenues.length > 0 && filters.venues.length < availableVenues.length) {
        if (!filters.venues.includes(match.venue)) return false;
      }

      if (filters.category.length < CATEGORIES.length && !filters.category.includes(match.category)) return false;

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
              disabled={allSelected}
              className="klimt-btn-select"
            >
              Select all
            </button>
            <button
              onClick={() => setSelectedDates([])}
              disabled={selectedDates.length === 0}
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

        <DayPicker selectedDates={selectedDates} onToggle={toggleDate} />
        </div>

        <div className="klimt-match-wrapper">
          <MatchList matches={sortedMatches} isLoading={isLoading} />
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
