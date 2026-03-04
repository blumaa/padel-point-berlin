"use client";

import type { Match } from "@/lib/types";
import MatchCard from "./MatchCard";

interface MatchListProps {
  matches: Match[];
  isLoading: boolean;
}

export default function MatchList({ matches, isLoading }: MatchListProps) {
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

  return (
    <div className="klimt-match-list">
      {matches.map((match, index) => (
        <MatchCard key={match.id} match={match} isAlt={index % 2 === 1} />
      ))}
    </div>
  );
}
