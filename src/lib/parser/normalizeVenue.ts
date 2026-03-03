/**
 * Strip known "action" prefixes from raw venue strings extracted from message titles,
 * then map the result to a canonical venue name.
 */

// Strip "MATCH IN", "GAME IN", "PARTIDO EN" etc. and any "X — Y" separator,
// returning the clean venue portion.
function stripPrefix(raw: string): string {
  // "MATCH IN MITTE — CHARLOTTE | CHARLOTTENBURG" → "CHARLOTTE | CHARLOTTENBURG"
  const withSep = raw.match(/(?:match|game|partido)\s+(?:in|en)\s+.+?[—–-]\s*(.+)/i);
  if (withSep) return withSep[1].trim();

  // "MATCH IN PADEL FC" / "GAME IN TIO TIO ROOFTOP" / "PARTIDO EN PADEL FC"
  const plain = raw.match(/(?:match|game|partido)\s+(?:in|en)\s+(.+)/i);
  if (plain) return plain[1].trim();

  return raw.trim();
}

// Canonical venue table — add entries here as new venues appear.
const VENUE_ALIASES: Array<{ pattern: RegExp; canonical: string }> = [
  { pattern: /charlotte|charlottenburg/i, canonical: "Mitte Charlotte" },
  { pattern: /padel\s*fc|padelhaus/i,     canonical: "Padelhaus GmbH" },
  { pattern: /pbc/i,                       canonical: "PBC Center" },
  { pattern: /tio\s*tio/i,               canonical: "Tio Tio" },
];

export function normalizeVenue(raw: string | null): string | null {
  if (!raw) return null;
  const stripped = stripPrefix(raw);
  for (const { pattern, canonical } of VENUE_ALIASES) {
    if (pattern.test(stripped)) return canonical;
  }
  // Return the prefix-stripped version even if no alias matched
  return stripped || null;
}
