"use client";

import { useState, useEffect, useRef } from "react";
import type { Match } from "@/lib/types";
import MatchCard from "./MatchCard";

const PAGE_SIZE = 30;

interface MatchListProps {
  matches: Match[];
  isLoading: boolean;
}

export default function MatchList({ matches, isLoading }: MatchListProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset to first page whenever the match list changes (filter/sort/date)
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [matches]);

  // Load more when the sentinel scrolls into view
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, matches.length));
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [matches.length]);

  if (isLoading) {
    return (
      <div className="klimt-loading" role="status" aria-live="polite">
        <div className="klimt-spinner" aria-hidden="true" />
        <span className="klimt-loading-text">Loading</span>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="klimt-empty">
        <div className="klimt-empty-icons" aria-hidden="true">
          <div className="klimt-empty-icon--accent" />
          <div className="klimt-empty-icon--match" />
          <div className="klimt-empty-triangle" />
        </div>
        <p className="klimt-empty-title">No matches found</p>
        <p className="klimt-empty-subtitle">Try a different day or adjust filters</p>
      </div>
    );
  }

  const visible = matches.slice(0, visibleCount);
  const hasMore = visibleCount < matches.length;

  return (
    <div className="klimt-match-list">
      {visible.map((match, index) => (
        <MatchCard key={match.id} match={match} isAlt={index % 2 === 1} />
      ))}
      {hasMore && (
        <div ref={sentinelRef} style={{ height: 1 }} aria-hidden="true" />
      )}
    </div>
  );
}
