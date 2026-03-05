import type { PlaytomicMatch, PlaytomicTenant } from "@/lib/playtomic/types";

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockFetchBerlinVenues = jest.fn<Promise<PlaytomicTenant[]>, []>();
const mockFetchOpenMatches = jest.fn<Promise<PlaytomicMatch[]>, [string, string]>();
const mockMapToMatch = jest.fn();
const mockUpsertMatch = jest.fn();

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

// Supabase chainable query builder mock
function makeSupaMock({
  expiredCount = 0,
  staleCount = 0,
}: { expiredCount?: number; staleCount?: number } = {}) {
  // Track which delete call we're on (first = expired, second = stale)
  let deleteCallCount = 0;

  const chain = {
    from: jest.fn().mockReturnThis(),
    delete: jest.fn().mockImplementation(() => {
      deleteCallCount++;
      chain._deleteCall = deleteCallCount;
      return chain;
    }),
    eq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    not: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    upsert: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    _deleteCall: 0,
    // Resolves when awaited — return count based on which delete it is
    then: jest.fn().mockImplementation((resolve: (v: unknown) => void) => {
      resolve({ count: chain._deleteCall === 1 ? expiredCount : staleCount, error: null });
      return Promise.resolve();
    }),
  };

  return chain;
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
    supabaseMock = makeSupaMock({ staleCount: 1 });
    mockFetchBerlinVenues.mockResolvedValue([venue]);
    // API returns the match as canceled — it won't be in validPlaytomicIds
    mockFetchOpenMatches.mockResolvedValue([
      { ...makePlaytomicMatch("match-now-canceled", 2, 4), status: "CANCELED" },
      makePlaytomicMatch("match-valid", 2, 4),
    ]);

    const { pollAndCleanup } = await import("@/lib/playtomic/pollAndCleanup");
    const result = await pollAndCleanup();

    expect(result.upserted).toBe(1); // only the valid match
    expect(result.stale).toBe(1);    // canceled match deleted from DB
    expect(supabaseMock.not).toHaveBeenCalledWith(
      "playtomic_id", "in", expect.not.stringContaining("match-now-canceled")
    );
  });

  it("removes a full match that was previously in the DB", async () => {
    supabaseMock = makeSupaMock({ staleCount: 1 });
    mockFetchBerlinVenues.mockResolvedValue([venue]);
    mockFetchOpenMatches.mockResolvedValue([
      makePlaytomicMatch("match-now-full", 4, 4), // was valid, now full
      makePlaytomicMatch("match-valid", 2, 4),
    ]);

    const { pollAndCleanup } = await import("@/lib/playtomic/pollAndCleanup");
    const result = await pollAndCleanup();

    expect(result.upserted).toBe(1);
    expect(result.stale).toBe(1);
    expect(supabaseMock.not).toHaveBeenCalledWith(
      "playtomic_id", "in", expect.not.stringContaining("match-now-full")
    );
  });

  it("deletes stale DB matches not present in fresh Playtomic data", async () => {
    supabaseMock = makeSupaMock({ expiredCount: 0, staleCount: 3 });
    mockFetchBerlinVenues.mockResolvedValue([venue]);
    mockFetchOpenMatches.mockResolvedValue([
      makePlaytomicMatch("match-1", 2, 4),
    ]);

    const { pollAndCleanup } = await import("@/lib/playtomic/pollAndCleanup");
    const result = await pollAndCleanup();

    expect(result.stale).toBe(3);
    // The stale delete must filter by playtomic_id NOT IN the valid set
    expect(supabaseMock.not).toHaveBeenCalledWith(
      "playtomic_id", "in", expect.stringContaining("match-1")
    );
  });

  it("skips stale delete when no valid matches were found (avoids wiping DB on total API failure)", async () => {
    mockFetchBerlinVenues.mockResolvedValue([venue]);
    mockFetchOpenMatches.mockResolvedValue([
      makePlaytomicMatch("match-full", 4, 4), // all full → validIds empty
    ]);

    const { pollAndCleanup } = await import("@/lib/playtomic/pollAndCleanup");
    const result = await pollAndCleanup();

    // .not() should never be called since validPlaytomicIds is empty
    expect(supabaseMock.not).not.toHaveBeenCalled();
    expect(result.stale).toBe(0);
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
});
