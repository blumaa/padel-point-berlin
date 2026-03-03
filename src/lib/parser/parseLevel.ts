export function parseLevel(raw: string): number | null {
  // Strip parentheses and whitespace
  const cleaned = raw.replace(/[()]/g, "").replace(",", ".").trim();
  if (!cleaned) return null;

  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export interface LevelRange {
  min: number | null;
  max: number | null;
}

export function parseLevelRange(text: string): LevelRange {
  // Match patterns like "Level 1.39 - 2.39" or "Level: 0 - 1.5" or with commas
  const match = text.match(
    /(\d+[.,]?\d*)\s*-\s*(\d+[.,]?\d*)/
  );
  if (!match) return { min: null, max: null };

  return {
    min: parseFloat(match[1].replace(",", ".")),
    max: parseFloat(match[2].replace(",", ".")),
  };
}
