/**
 * TDD scenarios for the add-match pipeline.
 *
 * These tests exercise parseMessage end-to-end (the same code path triggered
 * by POST /api/matches) against the kinds of messages users actually paste in.
 */
import { parseMessage } from "@/lib/parser/parseMessage";
import {
  addMatchTypical,
  addMatchSpanishPrefix,
  addMatchPBC,
  addMatchTioTio,
  addMatchCharlotte,
  addMatchNoLink,
  addMatchUnparseable,
  addMatchWomen,
  formatB1,
} from "../fixtures/messages";

// Reference date: Wednesday March 4, 2026 — matches the "Mittwoch 04." in addMatchTypical
const ref = new Date(2026, 2, 3); // March 3, 2026 (day before, so day 4 is "next")

describe("Add match — parseMessage integration", () => {
  // ── Happy path ─────────────────────────────────────────────────────────────

  it("parses a typical German message (Mittwoch, comma decimals, unclosed parens)", () => {
    const result = parseMessage(addMatchTypical, ref);
    expect(result).not.toBeNull();
    expect(result!.matchType).toBe("match");
    expect(result!.playtomicId).toBe("xYz789ab");
    expect(result!.venue).toBe("Padelhaus GmbH");
    expect(result!.levelMin).toBe(1.5);
    expect(result!.levelMax).toBe(2.5);
    expect(result!.matchTime.getDate()).toBe(4);
    expect(result!.matchTime.getHours()).toBe(9);
    expect(result!.durationMin).toBe(90);
    expect(result!.players).toHaveLength(4);
    expect(result!.players[0].status).toBe("confirmed");
    expect(result!.players[0].name).toBe("Michael Reimer");
    expect(result!.players[0].level).toBe(2.5);
    expect(result!.players[2].status).toBe("open");
    expect(result!.category).toBe("Open");
  });

  it("parses Spanish prefix (PARTIDO EN) and maps to Padelhaus GmbH", () => {
    const result = parseMessage(addMatchSpanishPrefix, ref);
    expect(result).not.toBeNull();
    expect(result!.venue).toBe("Padelhaus GmbH");
    expect(result!.levelMin).toBe(2.0);
    expect(result!.levelMax).toBe(3.0);
    expect(result!.matchTime.getDate()).toBe(5);
    expect(result!.matchTime.getHours()).toBe(18);
    expect(result!.players[0].name).toBe("Carlos");
    expect(result!.players[0].level).toBe(2.5);
  });

  it("parses GAME IN PBC CENTER with Mixed category", () => {
    const result = parseMessage(addMatchPBC, ref);
    expect(result).not.toBeNull();
    expect(result!.venue).toBe("PBC Center");
    expect(result!.category).toBe("Mixed");
    expect(result!.matchTime.getDate()).toBe(6);
    expect(result!.matchTime.getHours()).toBe(20);
    expect(result!.levelMin).toBe(1.8);
    expect(result!.levelMax).toBe(2.8);
  });

  it("parses GAME IN TIO TIO ROOFTOP with Women category", () => {
    const result = parseMessage(addMatchTioTio, ref);
    expect(result).not.toBeNull();
    expect(result!.venue).toBe("Tio Tio");
    expect(result!.category).toBe("Women");
    expect(result!.durationMin).toBe(60);
    expect(result!.matchTime.getDate()).toBe(7);
    expect(result!.matchTime.getHours()).toBe(11);
  });

  it("parses MATCH IN MITTE — CHARLOTTENBURG and maps to Mitte Charlotte", () => {
    const result = parseMessage(addMatchCharlotte, ref);
    expect(result).not.toBeNull();
    expect(result!.venue).toBe("Mitte Charlotte");
    expect(result!.players).toHaveLength(4);
    expect(result!.players[0].name).toBe("Felix");
    expect(result!.players[3].status).toBe("open");
  });

  it("parses a Women category match", () => {
    const result = parseMessage(addMatchWomen, new Date(2026, 2, 2));
    expect(result).not.toBeNull();
    expect(result!.category).toBe("Women");
    expect(result!.venue).toBe("Padelhaus GmbH");
  });

  it("parses Format B (class/lesson) message", () => {
    const result = parseMessage(formatB1, ref);
    expect(result).not.toBeNull();
    expect(result!.matchType).toBe("class");
    expect(result!.levelMin).toBe(0);
    expect(result!.levelMax).toBe(1.5);
    expect(result!.category).toBe("Open");
  });

  // ── Null / rejection cases ─────────────────────────────────────────────────

  it("returns null when there is no playtomic link", () => {
    expect(parseMessage(addMatchNoLink, ref)).toBeNull();
  });

  it("returns null for a bare playtomic link with no parseable structure", () => {
    expect(parseMessage(addMatchUnparseable, ref)).toBeNull();
  });

  it("returns null for a completely unrelated message", () => {
    expect(parseMessage("Hey anyone want to play tomorrow?", ref)).toBeNull();
  });

  // ── Level parsing edge cases ───────────────────────────────────────────────

  it("handles dot decimal levels (1.8 - 2.8)", () => {
    const result = parseMessage(addMatchPBC, ref);
    expect(result!.levelMin).toBe(1.8);
    expect(result!.levelMax).toBe(2.8);
  });

  it("handles comma decimal levels (1,5 - 2,5)", () => {
    const result = parseMessage(addMatchTypical, ref);
    expect(result!.levelMin).toBe(1.5);
    expect(result!.levelMax).toBe(2.5);
  });

  it("handles player level with comma decimal and unclosed paren", () => {
    const result = parseMessage(addMatchTypical, ref);
    expect(result!.players[0].level).toBe(2.5);
    expect(result!.players[1].level).toBe(2.0);
  });

  // ── Open slots ────────────────────────────────────────────────────────────

  it("counts open slots correctly", () => {
    const result = parseMessage(addMatchTypical, ref);
    const open = result!.players.filter((p) => p.status === "open");
    const confirmed = result!.players.filter((p) => p.status === "confirmed");
    expect(open).toHaveLength(2);
    expect(confirmed).toHaveLength(2);
  });

  it("assigns ascending slot_order to players", () => {
    const result = parseMessage(addMatchTypical, ref);
    const orders = result!.players.map((p) => p.slotOrder);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });
});
