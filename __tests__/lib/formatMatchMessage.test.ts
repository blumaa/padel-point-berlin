import { formatMatchMessage } from "@/lib/formatMatchMessage";
import type { Match } from "@/lib/types";

function makeMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: "m1",
    title: "Padel Match",
    match_type: "match",
    match_time: "2026-03-11T09:00:00+01:00", // Wednesday in CET
    duration_min: 90,
    venue: "Padel FC Berlin",
    level_min: 2.5,
    level_max: 4,
    category: "Open",
    indoor: "indoor",
    competition_mode: "friendly",
    source_group: null,
    playtomic_url: "https://app.playtomic.io/match/abc123",
    visibility: "VISIBLE",
    archive_reason: null,
    created_at: "2026-03-07T10:00:00Z",
    match_players: [
      { id: "p1", match_id: "m1", name: "Alice", level: 3, status: "confirmed", slot_order: 1 },
      { id: "p2", match_id: "m1", name: "Bob", level: 2.5, status: "confirmed", slot_order: 2 },
      { id: "p3", match_id: "m1", name: "??", level: null, status: "open", slot_order: 3 },
      { id: "p4", match_id: "m1", name: "??", level: null, status: "open", slot_order: 4 },
    ],
    ...overrides,
  };
}

describe("formatMatchMessage", () => {
  it("formats a full match with all fields", () => {
    const msg = formatMatchMessage(makeMatch());
    expect(msg).toContain("Wednesday 11., 09:00");
    expect(msg).toContain("(90min)");
    expect(msg).toContain("Padel FC Berlin");
    expect(msg).toContain("2,5 - 4");
    expect(msg).toContain("Alice (3)");
    expect(msg).toContain("Bob (2,5)");
    expect(msg).toContain("??");
    expect(msg).toContain("https://app.playtomic.io/match/abc123");
  });

  it("uses English weekday names", () => {
    const msg = formatMatchMessage(makeMatch());
    expect(msg).toMatch(/Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday/);
  });

  it("uses comma decimal separator for levels (German style)", () => {
    const msg = formatMatchMessage(makeMatch({ level_min: 2.5, level_max: 3.5 }));
    expect(msg).toContain("2,5 - 3,5");
  });

  it("shows confirmed players with checkmark and open slots with open circle", () => {
    const msg = formatMatchMessage(makeMatch());
    const lines = msg.split("\n");
    const aliceLine = lines.find(l => l.includes("Alice"));
    const openLine = lines.find(l => l.includes("??"));
    expect(aliceLine).toMatch(/^✅/);
    expect(openLine).toMatch(/^⚪/);
  });

  it("sorts players by slot_order", () => {
    const match = makeMatch({
      match_players: [
        { id: "p4", match_id: "m1", name: "Delta", level: 1, status: "confirmed", slot_order: 4 },
        { id: "p1", match_id: "m1", name: "Alpha", level: 3, status: "confirmed", slot_order: 1 },
        { id: "p3", match_id: "m1", name: "??", level: null, status: "open", slot_order: 3 },
        { id: "p2", match_id: "m1", name: "Beta", level: 2, status: "confirmed", slot_order: 2 },
      ],
    });
    const msg = formatMatchMessage(match);
    const playerLines = msg.split("\n").filter(l => /^[✅⚪]/.test(l));
    expect(playerLines[0]).toContain("Alpha");
    expect(playerLines[1]).toContain("Beta");
    expect(playerLines[2]).toContain("??");
    expect(playerLines[3]).toContain("Delta");
  });

  it("handles missing venue", () => {
    const msg = formatMatchMessage(makeMatch({ venue: null }));
    expect(msg).not.toContain("undefined");
    expect(msg).not.toContain("null");
  });

  it("handles missing level", () => {
    const msg = formatMatchMessage(makeMatch({ level_min: null, level_max: null }));
    expect(msg).not.toContain("null");
    expect(msg).not.toContain("undefined");
    expect(msg).not.toContain("Level:");
  });

  it("handles missing URL", () => {
    const msg = formatMatchMessage(makeMatch({ playtomic_url: null }));
    expect(msg).not.toContain("null");
    expect(msg).not.toContain("undefined");
  });

  it("handles missing duration", () => {
    const msg = formatMatchMessage(makeMatch({ duration_min: null }));
    expect(msg).not.toContain("min)");
    expect(msg).not.toContain("null");
  });

  it("formats integer levels without decimal", () => {
    const msg = formatMatchMessage(makeMatch({ level_min: 3, level_max: 5 }));
    expect(msg).toContain("3 - 5");
  });

  it("shows player level with comma for half-levels", () => {
    const match = makeMatch({
      match_players: [
        { id: "p1", match_id: "m1", name: "Test", level: 2.5, status: "confirmed", slot_order: 1 },
      ],
    });
    const msg = formatMatchMessage(match);
    expect(msg).toContain("Test (2,5)");
  });

  it("shows player without level when level is null", () => {
    const match = makeMatch({
      match_players: [
        { id: "p1", match_id: "m1", name: "NoLevel", level: null, status: "confirmed", slot_order: 1 },
      ],
    });
    const msg = formatMatchMessage(match);
    expect(msg).toContain("NoLevel");
    expect(msg).not.toContain("NoLevel (");
  });
});
