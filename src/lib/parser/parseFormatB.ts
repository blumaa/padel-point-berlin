import type { ParsedMatch, MatchCategory } from "@/lib/types";
import { extractPlaytomicId } from "./extractPlaytomicId";
import { parseDateFormatB, parseDuration } from "./parseDate";
import { parseLevelRange } from "./parseLevel";

function extractField(text: string, field: string): string | null {
  const regex = new RegExp(`${field}:\\s*(.+)`, "i");
  const match = text.match(regex);
  return match ? match[1].trim() : null;
}

/**
 * Parse Format B messages: key-value class/lesson with lesson_class URL
 */
export function parseFormatB(text: string): ParsedMatch | null {
  const link = extractPlaytomicId(text);
  if (!link) return null;

  const activityType = extractField(text, "Activity type") || "Unknown";
  const dateTimeStr = extractField(text, "Date and time");
  const durationStr = extractField(text, "Duration");
  const levelStr = extractField(text, "Level");
  const categoryStr = extractField(text, "Category");

  const matchTime = dateTimeStr ? parseDateFormatB(dateTimeStr) : null;
  if (!matchTime) return null;

  const durationMin = durationStr ? parseDuration(durationStr) : null;
  const { min: levelMin, max: levelMax } = levelStr
    ? parseLevelRange(levelStr)
    : { min: null, max: null };

  let category: MatchCategory = "Open";
  if (categoryStr) {
    const cat = categoryStr.trim();
    if (cat === "Mixed") category = "Mixed";
    else if (cat === "Women") category = "Women";
    else if (cat === "Men") category = "Men";
  }

  return {
    playtomicId: link.id,
    playtomicUrl: link.url,
    title: activityType,
    matchType: "class",
    matchTime,
    durationMin,
    venue: null,
    levelMin,
    levelMax,
    category,
    players: [],
  };
}
