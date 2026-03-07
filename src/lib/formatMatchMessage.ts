const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

interface ShareableMatch {
  match_time: string;
  duration_min: number | null;
  venue: string | null;
  level_min: number | null;
  level_max: number | null;
  playtomic_url: string | null;
  match_players: {
    name: string;
    level: number | null;
    status: string;
    slot_order: number;
  }[];
}

function formatLevel(n: number): string {
  return n % 1 === 0 ? String(n) : String(n).replace(".", ",");
}

export function formatMatchMessage(match: ShareableMatch): string {
  const dt = new Date(match.match_time);
  const weekday = WEEKDAYS[dt.getDay()];
  const day = String(dt.getDate()).padStart(2, "0");
  const hours = String(dt.getHours()).padStart(2, "0");
  const minutes = String(dt.getMinutes()).padStart(2, "0");

  const lines: string[] = [];

  // Date/time line
  let dateLine = `${weekday} ${day}., ${hours}:${minutes}`;
  if (match.duration_min != null) {
    dateLine += ` (${match.duration_min}min)`;
  }
  lines.push(dateLine);

  // Venue
  if (match.venue) {
    lines.push(match.venue);
  }

  // Level
  if (match.level_min != null && match.level_max != null) {
    lines.push(`Level: ${formatLevel(match.level_min)} - ${formatLevel(match.level_max)}`);
  }

  lines.push("");

  // Players sorted by slot_order
  const players = [...match.match_players].sort((a, b) => a.slot_order - b.slot_order);
  for (const p of players) {
    if (p.status === "confirmed") {
      const levelSuffix = p.level != null ? ` (${formatLevel(p.level)})` : "";
      lines.push(`✅ ${p.name}${levelSuffix}`);
    } else {
      lines.push(`⚪ ??`);
    }
  }

  // URL
  if (match.playtomic_url) {
    lines.push("");
    lines.push(match.playtomic_url);
  }

  return lines.join("\n");
}
