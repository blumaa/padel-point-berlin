import { parsePlayers } from "@/lib/parser/parsePlayers";
import type { Player } from "@/lib/types";

describe("parsePlayers", () => {
  it("parses confirmed player with level in parens", () => {
    const players = parsePlayers(" ✅ Zain Salman Dar (1.6)\n ⚪ ??");
    expect(players).toHaveLength(2);
    expect(players[0]).toEqual<Player>({
      name: "Zain Salman Dar",
      level: 1.6,
      status: "confirmed",
      slotOrder: 1,
    });
    expect(players[1]).toEqual<Player>({
      name: "",
      level: null,
      status: "open",
      slotOrder: 2,
    });
  });

  it("parses German comma level with missing closing paren", () => {
    const players = parsePlayers(" ✅ Milan Schock (0,8\n ✅ Torben Schäfer (1,4");
    expect(players[0].name).toBe("Milan Schock");
    expect(players[0].level).toBe(0.8);
    expect(players[1].name).toBe("Torben Schäfer");
    expect(players[1].level).toBe(1.4);
  });

  it("parses interleaved confirmed and open slots", () => {
    const text = ` ✅ Nikki D (2
 ⚪ ??
 ✅ Rebecca  (2.6
 ✅ Sebastian (1.9`;
    const players = parsePlayers(text);
    expect(players).toHaveLength(4);
    expect(players[0].status).toBe("confirmed");
    expect(players[1].status).toBe("open");
    expect(players[2].status).toBe("confirmed");
    expect(players[2].name).toBe("Rebecca");
    expect(players[2].level).toBe(2.6);
    expect(players[3].slotOrder).toBe(4);
  });

  it("parses bare integer level", () => {
    const players = parsePlayers(" ✅ Nikki D (2");
    expect(players[0].level).toBe(2.0);
  });

  it("returns empty array for text without player lines", () => {
    expect(parsePlayers("no players here")).toEqual([]);
  });
});
