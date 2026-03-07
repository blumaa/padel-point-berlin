"use client";

import { memo, useState, useCallback } from "react";
import { formatMatchMessage } from "@/lib/formatMatchMessage";
import type { Match } from "@/lib/types";
import { useViewedMatches } from "@/hooks/useViewedMatches";

function extractClub(groupName: string | null): string | null {
  if (!groupName) return null;
  const sep = groupName.search(/ [-–] (?!\d)/);
  const raw = sep > 0 ? groupName.slice(0, sep) : groupName;
  const club = raw
    .replace(/\s*(level|padel\s+level|bronze|silver|gold).*$/i, "")
    .trim();
  if (!club || club.length < 2 || /^padel\s*(level)?$/i.test(club)) return null;
  return club;
}

function PadelPlayerIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* Head */}
      <circle cx="12" cy="4" r="2" />
      {/* Body */}
      <line x1="12" y1="6" x2="12" y2="15" />
      {/* Left leg */}
      <line x1="12" y1="15" x2="9" y2="21" />
      {/* Right leg */}
      <line x1="12" y1="15" x2="15" y2="21" />
      {/* Left arm */}
      <line x1="12" y1="9" x2="9" y2="13" />
      {/* Right arm holding racket */}
      <line x1="12" y1="9" x2="16" y2="11" />
      {/* Padel racket */}
      <rect x="16" y="9" width="5" height="6" rx="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

interface MatchCardProps {
  match: Match;
  isAlt?: boolean;
}

function MatchCard({ match, isAlt = false }: MatchCardProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(() => {
    const msg = formatMatchMessage(match);
    navigator.clipboard.writeText(msg).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }).catch(() => {});
  }, [match]);

  const { isViewed: checkViewed, markViewed: markViewedCtx } = useViewedMatches();
  const isViewed = checkViewed(match.id);

  function markViewed() {
    markViewedCtx(match.id);
  }

  const time = new Date(match.match_time);
  const timeStr = time.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const dayStr = time.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
  });

  const seenSlots = new Set<number>();
  const players = [...match.match_players]
    .sort((a, b) => a.slot_order - b.slot_order)
    .filter((p) => {
      if (seenSlots.has(p.slot_order)) return false;
      seenSlots.add(p.slot_order);
      return true;
    });

  const levelStr =
    match.level_min != null && match.level_max != null
      ? `${match.level_min} – ${match.level_max}`
      : null;

  const clubName = match.venue || extractClub(match.source_group) || "—";
  const venueWords = clubName.split(" ");
  const venueLastWord = venueWords[venueWords.length - 1];
  const venueInit = venueWords.slice(0, -1).join(" ");

  return (
    <div className={`klimt-card${isAlt ? " klimt-card-alt" : ""}`}>
      <div className="klimt-card-body">
        <div className="klimt-card-info">
          {isViewed && (
            <span className="klimt-card-eye" aria-label="Viewed" title="Viewed">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
            </span>
          )}
          <div className="klimt-card-row">
            <span className="klimt-card-day">{dayStr}</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: "0.4rem" }}>
              <span className="klimt-card-time">{timeStr}</span>
              {match.duration_min && (
                <span className="klimt-card-duration">{match.duration_min} min</span>
              )}
            </div>
            <div className="klimt-card-venue-row">
              <span className="klimt-card-venue">
                {venueInit && venueInit + " "}
                <span style={{ whiteSpace: "nowrap" }}>
                  {venueLastWord}
                  {clubName !== "—" && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(clubName + ", Berlin")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="klimt-card-map-btn"
                      aria-label={`Open ${clubName} in Google Maps`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                           strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                    </a>
                  )}
                </span>
              </span>
            </div>
          </div>
          <div className="klimt-card-badges">
            {levelStr ? (
              <span className="klimt-badge-level">Level {levelStr}</span>
            ) : (
              <span className="klimt-badge-level">All levels</span>
            )}
            <div className="klimt-badge-details">
              {match.competition_mode && (
                <span className="klimt-badge-category">
                  {match.competition_mode === "friendly" ? "Friendly" : "Competitive"}
                </span>
              )}
              {match.category !== "Open" && (
                <span className="klimt-badge-category">
                  {match.category === "Women" ? "Women only" : match.category === "Men" ? "Men only" : match.category}
                </span>
              )}

              {(match.indoor === "indoor" || match.indoor === "outdoor") && (
                <span className={`klimt-badge klimt-badge--${match.indoor}`}>
                  {match.indoor === "indoor" ? "Indoor" : "Outdoor"}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="klimt-court" aria-label="Court layout">
          {/* Team A — slots 1 & 2 */}
          <div className="klimt-court-team klimt-court-team--a">
            {[1, 2].map((slot) => {
              const p = players.find((pl) => pl.slot_order === slot);
              const confirmed = p?.status === "confirmed";
              return (
                <div
                  key={slot}
                  className={`klimt-court-slot${confirmed ? " klimt-court-slot--confirmed" : ""}`}
                >
                  <span
                    className={confirmed ? "klimt-dot klimt-dot-confirmed" : "klimt-dot klimt-dot-open"}
                    aria-hidden="true"
                  />
                  <span className={confirmed ? "klimt-court-name" : "klimt-court-name--open"}>
                    {confirmed ? (
                      <>
                        <PadelPlayerIcon />
                        {p!.level != null ? ` ${p!.level}` : ""}
                      </>
                    ) : "Open"}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Net */}
          <div className="klimt-court-net" aria-hidden="true">
            <span className="klimt-court-net-line" />
          </div>

          {/* Team B — slots 3 & 4 */}
          <div className="klimt-court-team klimt-court-team--b">
            {[3, 4].map((slot) => {
              const p = players.find((pl) => pl.slot_order === slot);
              const confirmed = p?.status === "confirmed";
              return (
                <div
                  key={slot}
                  className={`klimt-court-slot${confirmed ? " klimt-court-slot--confirmed" : ""}`}
                >
                  <span
                    className={confirmed ? "klimt-dot klimt-dot-confirmed" : "klimt-dot klimt-dot-open"}
                    aria-hidden="true"
                  />
                  <span className={confirmed ? "klimt-court-name" : "klimt-court-name--open"}>
                    {confirmed ? (
                      <>
                        <PadelPlayerIcon />
                        {p!.level != null ? ` ${p!.level}` : ""}
                      </>
                    ) : "Open"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="klimt-card-actions">
        {match.playtomic_url && (
          <a
            href={match.playtomic_url}
            onClick={markViewed}
            target="_blank"
            rel="noopener noreferrer"
            className="klimt-cta"
          >
            Open in Playtomic
          </a>
        )}
        <button
          type="button"
          className="klimt-share-btn"
          onClick={handleShare}
          aria-label="Copy match to clipboard"
          title="Copy match to clipboard"
        >
          {copied ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export default memo(MatchCard);
