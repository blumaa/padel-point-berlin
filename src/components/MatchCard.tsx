"use client";

interface Player {
  name: string;
  level: number | null;
  status: string;
  slot_order: number;
}

interface Match {
  id: string;
  title: string;
  match_type: string;
  match_time: string;
  duration_min: number | null;
  venue: string | null;
  level_min: number | null;
  level_max: number | null;
  category: string;
  source_group: string | null;
  playtomic_url: string | null;
  match_players: Player[];
}

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

interface MatchCardProps {
  match: Match;
  isAlt?: boolean;
}

export default function MatchCard({ match, isAlt = false }: MatchCardProps) {
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

  return (
    <div className={`klimt-card${isAlt ? " klimt-card-alt" : ""}`}>
      <div className="klimt-card-body">
        <div className="klimt-card-info">
          <div className="klimt-card-row">
            <span className="klimt-card-day">{dayStr}</span>
            <span className="klimt-card-time">{timeStr}</span>
            <span className="klimt-card-venue">{clubName}</span>
          </div>
          <div className="klimt-card-badges">
            {levelStr ? (
              <span className="klimt-badge-level">Level {levelStr}</span>
            ) : (
              <span className="klimt-badge-level">All levels</span>
            )}
            <div className="klimt-badge-details">
              <span className="klimt-badge-category">{match.category}</span>
              {match.duration_min && (
                <span className="klimt-card-duration">
                  {match.duration_min} min
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
                    {confirmed
                      ? `P${slot}${p!.level != null ? ` (${p!.level})` : ""}`
                      : "Open"}
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
                    {confirmed
                      ? `P${slot}${p!.level != null ? ` (${p!.level})` : ""}`
                      : "Open"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {match.playtomic_url && (
        <a
          href={match.playtomic_url}
          target="_blank"
          rel="noopener noreferrer"
          className="klimt-cta"
        >
          Open in Playtomic
        </a>
      )}
    </div>
  );
}
