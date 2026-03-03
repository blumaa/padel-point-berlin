"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import DayPicker from "@/components/DayPicker";
import MatchFilters, { defaultFilters, type FilterState } from "@/components/MatchFilters";
import MatchList from "@/components/MatchList";
import { PadelPointBerlin } from "@/app/stage/PadelPointBerlin";
import Footer from "@/components/Footer";
import AddMatchModal from "@/components/AddMatchModal";

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
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFiltersOpen(false);
      }
    }
    if (isFiltersOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isFiltersOpen]);

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
      (filters.category ? 1 : 0)
    );
  }, [filters, availableVenues.length]);

  const fetchMatches = useCallback(async () => {
    if (selectedDates.length === 0 || filters.venues.length === 0 || filters.timeOfDay.length === 0) {
      setMatches([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const params = new URLSearchParams();
    params.set("dates", selectedDates.join(","));
    if (filters.levelMin) params.set("levelMin", filters.levelMin);
    if (filters.levelMax) params.set("levelMax", filters.levelMax);
    if (filters.venues.length < availableVenues.length) {
      params.set("venues", filters.venues.join(","));
    }
    if (filters.timeOfDay.length < 3) {
      params.set("timeOfDay", filters.timeOfDay.join(","));
    }
    if (filters.category) params.set("category", filters.category);

    try {
      const res = await fetch(`/api/matches?${params}`);
      const data = await res.json();
      setMatches(Array.isArray(data) ? data : []);
    } catch {
      setMatches([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDates, filters, availableVenues.length]);

  useEffect(() => { fetchMatches(); }, [fetchMatches]);
  useEffect(() => {
    const t = setInterval(fetchMatches, 60_000);
    return () => clearInterval(t);
  }, [fetchMatches]);

  const allSelected = dates14.every((d) => selectedDates.includes(d));

  return (
    <div className="klimt-bg">
      <header className="klimt-header">
        <div className="klimt-header-inner">
          <div className="klimt-logo">
            <PadelPointBerlin />
          </div>
          <h1 className="klimt-title">Padel Point Berlin</h1>
        </div>
        <div className="klimt-divider" />
      </header>

      <main className="klimt-main">
        <div className="klimt-controls">
          <div className="klimt-controls-left">
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
          <div className="klimt-filter-wrapper" ref={filterRef}>
            <button
              onClick={() => setIsFiltersOpen((v) => !v)}
              className="klimt-filter-toggle"
            >
              {`▼ Filters${activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}`}
            </button>
            {isFiltersOpen && (
              <div className="klimt-filter-dropdown">
                <MatchFilters
                  isOpen={isFiltersOpen}
                  value={filters}
                  availableVenues={availableVenues}
                  onFilterChange={setFilters}
                />
              </div>
            )}
          </div>
        </div>

        <DayPicker selectedDates={selectedDates} onToggle={toggleDate} />

        <div className="klimt-match-wrapper">
          <MatchList matches={matches} isLoading={isLoading} />
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
