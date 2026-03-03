"use client";

import MatchCard from "./MatchCard";

interface MatchListProps {
  matches: any[];
  isLoading: boolean;
}

export default function MatchList({ matches, isLoading }: MatchListProps) {
  if (isLoading) {
    return (
      <div className="klimt-loading">
        <div className="klimt-spinner" />
        <span className="klimt-loading-text">Loading</span>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="klimt-empty">
        <div className="klimt-empty-icons">
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
