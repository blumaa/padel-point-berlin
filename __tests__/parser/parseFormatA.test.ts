import { parseFormatA } from "@/lib/parser/parseFormatA";
import { formatA1, formatA2, formatA3, formatA4, formatA5 } from "../fixtures/messages";

const ref = new Date(2026, 2, 2); // March 2, 2026

describe("parseFormatA", () => {
  it("parses basic match (A1)", () => {
    const result = parseFormatA(formatA1, ref);
    expect(result).not.toBeNull();
    expect(result!.title).toBe("MATCH IN MITTE — CHARLOTTE | CHARLOTTENBURG");
    expect(result!.matchType).toBe("match");
    expect(result!.playtomicId).toBe("cWBx3ut8");
    expect(result!.playtomicUrl).toBe("https://app.playtomic.io/t/cWBx3ut8");
    expect(result!.venue).toBe("Mitte Charlotte");
    expect(result!.levelMin).toBe(1.39);
    expect(result!.levelMax).toBe(2.39);
    expect(result!.durationMin).toBe(90);
    expect(result!.matchTime.getDate()).toBe(10);
    expect(result!.matchTime.getHours()).toBe(13);
    expect(result!.players).toHaveLength(4);
    expect(result!.players[0].name).toBe("Zain Salman Dar");
    expect(result!.category).toBe("Open");
  });

  it("parses German day + comma levels (A2)", () => {
    const result = parseFormatA(formatA2, ref);
    expect(result).not.toBeNull();
    expect(result!.title).toBe("MATCH IN PADEL FC");
    expect(result!.venue).toBe("Padelhaus GmbH");
    expect(result!.levelMin).toBe(0.56);
    expect(result!.levelMax).toBe(1.56);
    expect(result!.players).toHaveLength(4);
    expect(result!.players[0].level).toBe(0.8);
  });

  it("parses freeform text between title and data (A3)", () => {
    const result = parseFormatA(formatA3, ref);
    expect(result).not.toBeNull();
    expect(result!.matchTime.getDate()).toBe(9);
    expect(result!.matchTime.getHours()).toBe(13);
    expect(result!.players).toHaveLength(4);
    expect(result!.players[0].name).toBe("Lukas Bohnert");
  });

  it("parses Mixed category (A4)", () => {
    const result = parseFormatA(formatA4, ref);
    expect(result).not.toBeNull();
    expect(result!.category).toBe("Mixed");
    expect(result!.players).toHaveLength(4);
  });

  it("parses different club name format (A5)", () => {
    const result = parseFormatA(formatA5, ref);
    expect(result).not.toBeNull();
    expect(result!.title).toBe("Padel Mitte");
    expect(result!.venue).toBe("Padel Mitte");
    expect(result!.durationMin).toBe(60);
    expect(result!.category).toBe("Open");
  });
});
