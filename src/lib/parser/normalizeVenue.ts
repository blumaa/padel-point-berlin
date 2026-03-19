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
// Order matters: more specific patterns must come before broader ones.
const VENUE_ALIASES: Array<{ pattern: RegExp; canonical: string }> = [
  { pattern: /charlotte|charlottenburg/i,              canonical: "Mitte Charlotte" },
  { pattern: /4\s*padel|we\s+are\s+padel/i,           canonical: "4PADEL Berlin" },
  { pattern: /pbc|pscb|social\s*club/i,                  canonical: "PBC Center" },
  { pattern: /t[ií]o\s*t[ií]o/i,                       canonical: "Tio Tio" },
  { pattern: /padel\s*fc|padelhaus/i,                  canonical: "Padelhaus GmbH" },
  { pattern: /padel\s*city/i,                          canonical: "PadelCity Berlin" },
  { pattern: /padel\s*bros/i,                          canonical: "PadelBros" },
  { pattern: /neuk[öo]lln/i,                           canonical: "Padel Neukölln" },
  { pattern: /beach\s*mitte/i,                         canonical: "BeachMitte" },
  { pattern: /lankwitz/i,                              canonical: "Padel Lankwitz" },
  { pattern: /birgit/i,                                canonical: "Birgit Padel" },
  { pattern: /rainbow/i,                               canonical: "Rainbow Padel" },
  { pattern: /ludwigsfelde/i,                          canonical: "Padel Ludwigsfelde" },
  { pattern: /grenzallee/i,                            canonical: "Grenzallee Padel" },
  { pattern: /padel\s+mitte|m[üu]llerstr|padel\s+wedding/i, canonical: "Padel Mitte" },
  { pattern: /wiesenweg/i,                             canonical: "Padel Berlin" },
];

// Bare action words with no venue info — treat as no venue
const BARE_ACTIONS = /^(?:match|game|partido|juego)$/i;

export function normalizeVenue(raw: string | null): string | null {
  if (!raw) return null;
  const stripped = stripPrefix(raw);
  if (!stripped || BARE_ACTIONS.test(stripped)) return null;
  for (const { pattern, canonical } of VENUE_ALIASES) {
    if (pattern.test(stripped)) return canonical;
  }
  // Return the prefix-stripped version even if no alias matched
  return stripped || null;
}
