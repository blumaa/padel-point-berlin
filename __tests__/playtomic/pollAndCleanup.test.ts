import type { PlaytomicMatch, PlaytomicTenant } from "@/lib/playtomic/types";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockFetchBerlinVenues = jest.fn<Promise<PlaytomicTenant[]>, []>();
const mockFetchOpenMatches = jest.fn<Promise<PlaytomicMatch[]>, [string, string]>();
const mockMapToMatch = jest.fn();
const mockUpsertMatch = jest.fn();
const mockUpdatePollStatus = jest.fn();

jest.mock("@/lib/playtomic/client", () => ({
  fetchBerlinVenues: (...args: []) => mockFetchBerlinVenues(...args),
  fetchOpenMatches: (...args: [string, string]) => mockFetchOpenMatches(...args),
}));

jest.mock("@/lib/playtomic/mapToMatch", () => ({
  mapToMatch: (...args: unknown[]) => mockMapToMatch(...args),
}));

jest.mock("@/lib/db/matches", () => ({
  upsertMatch: (...args: unknown[]) => mockUpsertMatch(...args),
}));

jest.mock("@/lib/db/pollStatus", () => ({
  updatePollStatus: (...args: unknown[]) => mockUpdatePollStatus(...args),
}));

// Supabase chainable query builder mock
// Each .from() call returns a fresh chain that tracks its own operation type.
function makeSupaMock({
  expiredCount = 0,
  staleCount = 0,
  existingRows = [] as { id: string; playtomic_id: string }[],
}: {
  expiredCount?: number;
  staleCount?: number;
  existingRows?: { id: string; playtomic_id: string }[];
} = {}) {
  let deleteCallCount = 0;

  function makeChain() {
    let isSelect = false;
    let isDelete = false;
    let currentDeleteNum = 0;

    const chain: Record<string, jest.Mock> & { then: jest.Mock } = {
      delete: jest.fn().mockImplementation(() => {
        isDelete = true;
        deleteCallCount++;
        currentDeleteNum = deleteCallCount;
        return chain;
      }),
      select: jest.fn().mockImplementation(() => {
        isSelect = true;
        return chain;
      }),
      eq: jest.fn().mockReturnThis(),
      gt: jest.fn().mockReturnThis(),
      lt: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      then: jest.fn().mockImplementation((resolve: (v: unknown) => void) => {
        if (isSelect) {
          resolve({ data: existingRows, error: null });
        } else if (isDelete) {
          const count = currentDeleteNum === 1 ? expiredCount : staleCount;
          resolve({ count, error: null });
        } else {
          resolve({ error: null });
        }
        return Promise.resolve();
      }),
    };
    return chain;
  }

  const mock = {
    from: jest.fn().mockImplementation(() => makeChain()),
    _getDeleteCallCount: () => deleteCallCount,
  };

  return mock;
}

jest.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: () => supabaseMock,
}));

let supabaseMock: ReturnType<typeof makeSupaMock>;

// ── Fixtures ─────────────────────────────────────────────────────────────────

const venue: PlaytomicTenant = {
  tenant_id: "venue-1",
  tenant_name: "Padel FC Berlin",
  address: { city: "Berlin", coordinate: { lat: 52.52, lon: 13.405 }, timezone: "Europe/Berlin" },
};

function makePlaytomicMatch(id: string, confirmedPlayers: number, maxPlayers: number): PlaytomicMatch {
  return {
    match_id: id,
    location: "Court 1",
    start_date: "2026-03-10T14:00:00",
    end_date: "2026-03-10T15:30:00",
    status: "PENDING",
    gender: "ALL",
    min_level: 2,
    max_level: 4,
    teams: [
      { team_id: "t1", players: Array(confirmedPlayers).fill({ name: "Player", level_value: 2.5 }), max_players: maxPlayers },
      { team_id: "t2", players: [], max_players: 0 },
    ],
    tenant: venue,
    competition_mode: "FRIENDLY",
    resource_properties: { resource_type: "outdoor", resource_size: "P4", resource_feature: "GLASS" },
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("pollAndCleanup", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    supabaseMock = makeSupaMock();
    mockMapToMatch.mockReturnValue({ playtomicId: "match-1" });
    mockUpsertMatch.mockResolvedValue(undefined);
    mockUpdatePollStatus.mockResolvedValue(undefined);
  });

  it("upserts valid matches and returns correct counts", async () => {
    mockFetchBerlinVenues.mockResolvedValue([venue]);
    mockFetchOpenMatches.mockResolvedValue([
      makePlaytomicMatch("match-1", 2, 4), // valid: 2 confirmed, 4 max
    ]);

    const { pollAndCleanup } = await import("@/lib/playtomic/pollAndCleanup");
    const result = await pollAndCleanup();

    expect(mockUpsertMatch).toHaveBeenCalledTimes(1);
    expect(result.upserted).toBe(1);
    expect(result.errors).toHaveLength(0);
  });

  it("skips empty matches (0 confirmed players)", async () => {
    mockFetchBerlinVenues.mockResolvedValue([venue]);
    mockFetchOpenMatches.mockResolvedValue([
      makePlaytomicMatch("match-empty", 0, 4),
    ]);

    const { pollAndCleanup } = await import("@/lib/playtomic/pollAndCleanup");
    const result = await pollAndCleanup();

    expect(mockUpsertMatch).not.toHaveBeenCalled();
    expect(result.upserted).toBe(0);
  });

  it("skips full matches (confirmed >= max)", async () => {
    mockFetchBerlinVenues.mockResolvedValue([venue]);
    mockFetchOpenMatches.mockResolvedValue([
      makePlaytomicMatch("match-full", 4, 4),
    ]);

    const { pollAndCleanup } = await import("@/lib/playtomic/pollAndCleanup");
    const result = await pollAndCleanup();

    expect(mockUpsertMatch).not.toHaveBeenCalled();
    expect(result.upserted).toBe(0);
  });

  it("skips canceled matches (status !== PENDING)", async () => {
    mockFetchBerlinVenues.mockResolvedValue([venue]);
    mockFetchOpenMatches.mockResolvedValue([
      { ...makePlaytomicMatch("match-canceled", 2, 4), status: "CANCELED" },
    ]);

    const { pollAndCleanup } = await import("@/lib/playtomic/pollAndCleanup");
    const result = await pollAndCleanup();

    expect(mockUpsertMatch).not.toHaveBeenCalled();
    expect(result.upserted).toBe(0);
  });

  it("removes a canceled match that was previously in the DB", async () => {
    supabaseMock = makeSupaMock({
      staleCount: 1,
      existingRows: [
        { id: "db-1", playtomic_id: "match-now-canceled" },
        { id: "db-2", playtomic_id: "match-valid" },
      ],
    });
    mockFetchBerlinVenues.mockResolvedValue([venue]);
    mockFetchOpenMatches.mockResolvedValue([
      { ...makePlaytomicMatch("match-now-canceled", 2, 4), status: "CANCELED" },
      makePlaytomicMatch("match-valid", 2, 4),
    ]);

    const { pollAndCleanup } = await import("@/lib/playtomic/pollAndCleanup");
    const result = await pollAndCleanup();

    expect(result.upserted).toBe(1);
    expect(result.stale).toBe(1);
  });

  it("removes a full match that was previously in the DB", async () => {
    supabaseMock = makeSupaMock({
      staleCount: 1,
      existingRows: [
        { id: "db-1", playtomic_id: "match-now-full" },
        { id: "db-2", playtomic_id: "match-valid" },
      ],
    });
    mockFetchBerlinVenues.mockResolvedValue([venue]);
    mockFetchOpenMatches.mockResolvedValue([
      makePlaytomicMatch("match-now-full", 4, 4),
      makePlaytomicMatch("match-valid", 2, 4),
    ]);

    const { pollAndCleanup } = await import("@/lib/playtomic/pollAndCleanup");
    const result = await pollAndCleanup();

    expect(result.upserted).toBe(1);
    expect(result.stale).toBe(1);
  });

  it("deletes stale DB matches not present in fresh Playtomic data", async () => {
    supabaseMock = makeSupaMock({
      staleCount: 3,
      existingRows: [
        { id: "db-1", playtomic_id: "match-1" },
        { id: "db-2", playtomic_id: "stale-a" },
        { id: "db-3", playtomic_id: "stale-b" },
        { id: "db-4", playtomic_id: "stale-c" },
      ],
    });
    mockFetchBerlinVenues.mockResolvedValue([venue]);
    mockFetchOpenMatches.mockResolvedValue([
      makePlaytomicMatch("match-1", 2, 4),
    ]);

    const { pollAndCleanup } = await import("@/lib/playtomic/pollAndCleanup");
    const result = await pollAndCleanup();

    expect(result.stale).toBe(3);
  });

  it("skips stale delete when no valid matches were found (avoids wiping DB on total API failure)", async () => {
    mockFetchBerlinVenues.mockResolvedValue([venue]);
    mockFetchOpenMatches.mockResolvedValue([
      makePlaytomicMatch("match-full", 4, 4), // all full → validIds empty
    ]);

    const { pollAndCleanup } = await import("@/lib/playtomic/pollAndCleanup");
    const result = await pollAndCleanup();

    expect(result.stale).toBe(0);
    // Only 1 delete call (expired), not 2 (no stale delete when validIds empty)
    expect(supabaseMock._getDeleteCallCount()).toBe(1);
  });

  it("records venue errors but continues processing other venues", async () => {
    const venue2: PlaytomicTenant = { ...venue, tenant_id: "venue-2", tenant_name: "Grenzallee Padel" };
    mockFetchBerlinVenues.mockResolvedValue([venue, venue2]);
    mockFetchOpenMatches
      .mockResolvedValueOnce([makePlaytomicMatch("match-1", 2, 4)]) // venue-1 succeeds
      .mockRejectedValueOnce(new Error("API timeout"));              // venue-2 fails

    const { pollAndCleanup } = await import("@/lib/playtomic/pollAndCleanup");
    const result = await pollAndCleanup();

    expect(result.upserted).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("API timeout");
  });

  it("returns expired count from the cleanup delete", async () => {
    supabaseMock = makeSupaMock({ expiredCount: 5 });
    mockFetchBerlinVenues.mockResolvedValue([venue]);
    mockFetchOpenMatches.mockResolvedValue([]);

    const { pollAndCleanup } = await import("@/lib/playtomic/pollAndCleanup");
    const result = await pollAndCleanup();

    expect(result.expired).toBe(5);
  });

  it("calls updatePollStatus after a successful poll", async () => {
    mockFetchBerlinVenues.mockResolvedValue([venue]);
    mockFetchOpenMatches.mockResolvedValue([
      makePlaytomicMatch("match-1", 2, 4),
    ]);

    const { pollAndCleanup } = await import("@/lib/playtomic/pollAndCleanup");
    await pollAndCleanup();

    expect(mockUpdatePollStatus).toHaveBeenCalledTimes(1);
    expect(mockUpdatePollStatus).toHaveBeenCalledWith(
      supabaseMock,
      expect.objectContaining({ ok: true, upserted: 1 })
    );
  });
});
