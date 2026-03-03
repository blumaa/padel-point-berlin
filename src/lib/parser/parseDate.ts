const MONTH_MAP: Record<string, number> = {
  january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
  // German
  januar: 0, februar: 1, märz: 2, mai: 4, juni: 5,
  juli: 6, oktober: 9, dezember: 11,
  // Spanish
  enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5,
  julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11,
  // Italian
  gennaio: 0, febbraio: 1, aprile: 3, maggio: 4, giugno: 5,
  luglio: 6, settembre: 8, ottobre: 9, novembre: 10, dicembre: 11,
  // Portuguese
  janeiro: 0, fevereiro: 1, março: 2, maio: 4, junho: 5,
  julho: 6, setembro: 8, outubro: 9, dezembro: 11,
};

/**
 * Parse a Format A date line like:
 * "📅 Tuesday 10, 13:30 (90min)"
 * "📅 Montag, 09., 13:00 (90min)"
 *
 * Extracts day number and time. Uses reference date to resolve month/year.
 */
export function parseDate(text: string, referenceDate: Date): Date | null {
  // Extract day number and time from the line
  // Pattern: [optional day name stuff] DD[.,] HH:MM
  const match = text.match(/(\d{1,2})\.?,?\s+(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const dayNum = parseInt(match[1], 10);
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3], 10);

  // Resolve month/year from reference date
  // If the day is >= reference day, assume current month
  // If the day is < reference day, assume next month
  const refYear = referenceDate.getFullYear();
  const refMonth = referenceDate.getMonth();
  const refDay = referenceDate.getDate();

  let year = refYear;
  let month = refMonth;

  if (dayNum < refDay) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  return new Date(year, month, dayNum, hours, minutes);
}

/**
 * Extract duration in minutes from text containing "(90min)" or "60 min"
 */
export function parseDuration(text: string): number | null {
  const match = text.match(/(\d+)\s*min/);
  return match ? parseInt(match[1], 10) : null;
}

/**
 * Parse Format B date: "Date and time: Tuesday, March 03, 10:00 am"
 */
export function parseDateFormatB(text: string): Date | null {
  const match = text.match(
    /(\w+),?\s+(\w+)\s+(\d{1,2}),?\s+(\d{1,2}):(\d{2})\s*(am|pm)/i
  );
  if (!match) return null;

  const monthName = match[2].toLowerCase();
  const month = MONTH_MAP[monthName];
  if (month === undefined) return null;

  const day = parseInt(match[3], 10);
  let hours = parseInt(match[4], 10);
  const minutes = parseInt(match[5], 10);
  const ampm = match[6].toLowerCase();

  if (ampm === "pm" && hours !== 12) hours += 12;
  if (ampm === "am" && hours === 12) hours = 0;

  // Use current year
  const year = new Date().getFullYear();

  return new Date(year, month, day, hours, minutes);
}
