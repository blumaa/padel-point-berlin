import type { ParsedMatch } from "@/lib/types";
import { detectFormat } from "./detectFormat";
import { parseFormatA } from "./parseFormatA";
import { parseFormatB } from "./parseFormatB";

/**
 * Main entry point: raw WhatsApp message text → ParsedMatch | null.
 * Returns null for messages that can't be parsed (Format C / no link).
 */
export function parseMessage(
  text: string,
  referenceDate: Date = new Date()
): ParsedMatch | null {
  const format = detectFormat(text);

  switch (format) {
    case "formatA":
      return parseFormatA(text, referenceDate);
    case "formatB":
      return parseFormatB(text);
    case "formatC":
      return null;
  }
}
