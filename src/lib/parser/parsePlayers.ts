import type { Player } from "@/lib/types";
import { parseLevel } from "./parseLevel";

/**
 * Parse player lines from message text.
 * ✅ lines → confirmed player with optional level
 * ⚪ lines → open slot
 */
export function parsePlayers(text: string): Player[] {
  const lines = text.split("\n");
  const players: Player[] = [];
  let slotOrder = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("✅")) {
      slotOrder++;
      const content = trimmed.replace("✅", "").trim();
      const levelMatch = content.match(/\(([^)]*\d[^)]*)\)?$/);

      let name = content;
      let level: number | null = null;

      if (levelMatch) {
        name = content.slice(0, content.indexOf("(")).trim();
        level = parseLevel(levelMatch[1]);
      }

      players.push({ name, level, status: "confirmed", slotOrder });
    } else if (trimmed.startsWith("⚪")) {
      slotOrder++;
      players.push({ name: "", level: null, status: "open", slotOrder });
    }
  }

  return players;
}
