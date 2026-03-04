import { mapToMatch } from "@/lib/playtomic/mapToMatch";
import type { PlaytomicMatch } from "@/lib/playtomic/types";

function makeMatch(overrides: Partial<PlaytomicMatch> = {}): PlaytomicMatch {
  return {
    match_id: "abc123",
    location: "Padel Court 1",
    start_date: "2026-03-18T14:00:00",
    end_date: "2026-03-18T15:30:00",
    status: "PENDING",
    gender: "ALL",
    min_level: 2.0,
    max_level: 3.5,
    teams: [
      {
        team_id: "t1",
        players: [{ name: "Alice", level_value: 2.5 }],
        max_players: 2,
      },
      {
        team_id: "t2",
        players: [],
        max_players: 2,
      },
    ],
    tenant: {
      tenant_id: "venue1",
      tenant_name: "Padel FC Berlin",
      address: {
        city: "Berlin",
        coordinate: { lat: 52.52, lon: 13.405 },
        timezone: "Europe/Berlin",
      },
    },
    competition_mode: "FRIENDLY",
    resource_properties: {
      resource_type: "indoor",
      resource_size: "P4",
      resource_feature: "GLASS",
    },
    ...overrides,
  };
}

describe("mapToMatch", () => {
  describe("timezone conversion", () => {
    it("converts CET (winter) time correctly: 14:00 Berlin = 13:00 UTC", () => {
      const m = makeMatch({ start_date: "2026-03-18T14:00:00", end_date: "2026-03-18T15:30:00" });
      const result = mapToMatch(m);
      expect(result.matchTime.toISOString()).toBe("2026-03-18T13:00:00.000Z");
    });

    it("converts CEST (summer) time correctly: 18:00 Berlin = 16:00 UTC", () => {
      const m = makeMatch({ start_date: "2026-07-15T18:00:00", end_date: "2026-07-15T19:30:00" });
      const result = mapToMatch(m);
      expect(result.matchTime.toISOString()).toBe("2026-07-15T16:00:00.000Z");
    });
  });

  describe("gender → category", () => {
    it("maps ALL to Open", () => {
      expect(mapToMatch(makeMatch({ gender: "ALL" })).category).toBe("Open");
    });

    it("maps null to Open", () => {
      expect(mapToMatch(makeMatch({ gender: null })).category).toBe("Open");
    });

    it("maps MALE to Men", () => {
      expect(mapToMatch(makeMatch({ gender: "MALE" })).category).toBe("Men");
    });

    it("maps FEMALE to Women", () => {
      expect(mapToMatch(makeMatch({ gender: "FEMALE" })).category).toBe("Women");
    });

    it("maps MIXED to Mixed", () => {
      expect(mapToMatch(makeMatch({ gender: "MIXED" })).category).toBe("Mixed");
    });
  });

  describe("players", () => {
    it("assigns confirmed player to slot 1, open slots to 2, 3, 4", () => {
      const m = makeMatch({
        teams: [
          { team_id: "t1", players: [{ name: "Alice", level_value: 2.5 }], max_players: 2 },
          { team_id: "t2", players: [], max_players: 2 },
        ],
      });
      const { players } = mapToMatch(m);
      expect(players).toHaveLength(4);

      const slot1 = players.find((p) => p.slotOrder === 1)!;
      expect(slot1.name).toBe("Alice");
      expect(slot1.status).toBe("confirmed");
      expect(slot1.level).toBe(2.5);

      const openSlots = players.filter((p) => p.status === "open");
      expect(openSlots).toHaveLength(3);
      expect(openSlots.map((p) => p.slotOrder).sort()).toEqual([2, 3, 4]);
      expect(openSlots.every((p) => p.name === "??")).toBe(true);
    });

    it("handles 2 confirmed players across both teams", () => {
      const m = makeMatch({
        teams: [
          { team_id: "t1", players: [{ name: "Alice", level_value: 2.5 }, { name: "Bob", level_value: 3.0 }], max_players: 2 },
          { team_id: "t2", players: [{ name: "Carol", level_value: 2.8 }], max_players: 2 },
        ],
      });
      const { players } = mapToMatch(m);
      expect(players).toHaveLength(4);
      expect(players.find((p) => p.slotOrder === 1)!.name).toBe("Alice");
      expect(players.find((p) => p.slotOrder === 2)!.name).toBe("Bob");
      expect(players.find((p) => p.slotOrder === 3)!.name).toBe("Carol");
      expect(players.find((p) => p.slotOrder === 4)!.status).toBe("open");
    });
  });

  describe("indoor", () => {
    it("sets indoor from resource_properties.resource_type", () => {
      expect(mapToMatch(makeMatch({ resource_properties: { resource_type: "indoor", resource_size: "P4", resource_feature: "GLASS" } })).indoor).toBe("indoor");
    });

    it("sets outdoor from resource_properties.resource_type", () => {
      expect(mapToMatch(makeMatch({ resource_properties: { resource_type: "outdoor", resource_size: "P4", resource_feature: "WALL" } })).indoor).toBe("outdoor");
    });

    it("returns null when resource_properties is null", () => {
      expect(mapToMatch(makeMatch({ resource_properties: null })).indoor).toBeNull();
    });

    it("returns null for unknown resource_type", () => {
      expect(mapToMatch(makeMatch({ resource_properties: { resource_type: "unknown", resource_size: "P4", resource_feature: "" } })).indoor).toBeNull();
    });
  });

  describe("durationMin", () => {
    it("calculates 90 min from start/end dates", () => {
      const m = makeMatch({ start_date: "2026-03-18T14:00:00", end_date: "2026-03-18T15:30:00" });
      expect(mapToMatch(m).durationMin).toBe(90);
    });

    it("calculates 60 min from start/end dates", () => {
      const m = makeMatch({ start_date: "2026-07-15T18:00:00", end_date: "2026-07-15T19:00:00" });
      expect(mapToMatch(m).durationMin).toBe(60);
    });
  });

  describe("playtomicUrl", () => {
    it("builds URL from match_id", () => {
      const m = makeMatch({ match_id: "xyz789" });
      expect(mapToMatch(m).playtomicUrl).toBe("https://app.playtomic.io/matches/xyz789");
    });
  });

  describe("other fields", () => {
    it("maps levels correctly", () => {
      const m = makeMatch({ min_level: 1.5, max_level: 4.0 });
      const result = mapToMatch(m);
      expect(result.levelMin).toBe(1.5);
      expect(result.levelMax).toBe(4.0);
    });

    it("maps venue from tenant_name", () => {
      const result = mapToMatch(makeMatch());
      expect(result.venue).toBe("Padel FC Berlin");
    });

    it("sets matchType to match", () => {
      expect(mapToMatch(makeMatch()).matchType).toBe("match");
    });

    it("sets playtomicId from match_id", () => {
      expect(mapToMatch(makeMatch({ match_id: "abc123" })).playtomicId).toBe("abc123");
    });
  });
});
