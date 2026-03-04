import type { ParsedMatch, MatchCategory } from "@/lib/types";
import type { PlaytomicMatch } from "./types";

function parseBerlinDatetime(s: string): Date {
  const fakeUtc = new Date(s + "Z");
  const berlinAsUtcStr = fakeUtc
    .toLocaleString("sv-SE", { timeZone: "Europe/Berlin" })
    .replace(" ", "T") + "Z";
  const offset = new Date(berlinAsUtcStr).getTime() - fakeUtc.getTime();
  return new Date(fakeUtc.getTime() - offset);
}

function mapGender(gender: string | null): MatchCategory {
  switch (gender) {
    case "MALE":   return "Men";
    case "FEMALE": return "Women";
    case "MIXED":  return "Mixed";
    default:       return "Open";
  }
}

function mapIndoor(
  resourceProperties: PlaytomicMatch["resource_properties"]
): "indoor" | "outdoor" | null {
  const t = resourceProperties?.resource_type;
  if (t === "indoor" || t === "outdoor") return t;
  return null;
}

export function mapToMatch(m: PlaytomicMatch): ParsedMatch {
  const matchTime = parseBerlinDatetime(m.start_date);
  const endTime = parseBerlinDatetime(m.end_date);
  const durationMin = Math.round((endTime.getTime() - matchTime.getTime()) / 60000);

  const players: ParsedMatch["players"] = [];
  let slotOrder = 1;

  for (const team of m.teams) {
    for (const p of team.players) {
      players.push({
        name: p.name,
        level: p.level_value,
        status: "confirmed",
        slotOrder: slotOrder++,
      });
    }
    const openCount = team.max_players - team.players.length;
    for (let i = 0; i < openCount; i++) {
      players.push({
        name: "??",
        level: null,
        status: "open",
        slotOrder: slotOrder++,
      });
    }
  }

  return {
    playtomicId: m.match_id,
    playtomicUrl: `https://app.playtomic.io/match/${m.match_id}`,
    title: m.location,
    matchType: "match",
    matchTime,
    durationMin,
    venue: m.tenant.tenant_name,
    levelMin: m.min_level,
    levelMax: m.max_level,
    category: mapGender(m.gender),
    players,
    indoor: mapIndoor(m.resource_properties),
  };
}
