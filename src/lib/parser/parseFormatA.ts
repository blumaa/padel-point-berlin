import type { ParsedMatch, MatchCategory } from "@/lib/types";
import { extractPlaytomicId } from "./extractPlaytomicId";
import { parseDate, parseDuration } from "./parseDate";
import { parseLevelRange } from "./parseLevel";
import { parsePlayers } from "./parsePlayers";
import { normalizeVenue } from "./normalizeVenue";

/**
 * Parse Format A messages: emoji-structured matches with 📅📊✅⚪
 */
export function parseFormatA(text: string, referenceDate: Date): ParsedMatch | null {
  const link = extractPlaytomicId(text);
  if (!link) return null;

  // Extract title from bold markers *...*
  const titleMatch = text.match(/\*([^*]+)\*/);
  const title = titleMatch ? titleMatch[1].trim() : "";

  // Find the date line (📅)
  const lines = text.split("\n");
  const dateLine = lines.find((l) => l.includes("📅"));
  const matchTime = dateLine ? parseDate(dateLine, referenceDate) : null;
  if (!matchTime) return null;

  const durationMin = dateLine ? parseDuration(dateLine) : null;

  // Extract and normalise venue from title
  const venue = title ? normalizeVenue(title) : null;

  // Find level range (📊)
  const levelLine = lines.find((l) => l.includes("📊"));
  const { min: levelMin, max: levelMax } = levelLine
    ? parseLevelRange(levelLine)
    : { min: null, max: null };

  // Find category (🚻)
  const categoryLine = lines.find((l) => l.includes("🚻"));
  let category: MatchCategory = "Open";
  if (categoryLine) {
    const cat = categoryLine.replace("🚻", "").trim();
    if (cat === "Mixed") category = "Mixed";
    else if (cat === "Women") category = "Women";
    else if (cat === "Men") category = "Men";
  }

  // Parse players from all ✅/⚪ lines
  const players = parsePlayers(text);

  return {
    playtomicId: link.id,
    playtomicUrl: link.url,
    title,
    matchType: "match",
    matchTime,
    durationMin,
    venue,
    levelMin,
    levelMax,
    category,
    players,
  };
}
