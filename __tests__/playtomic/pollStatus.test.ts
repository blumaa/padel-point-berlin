import { updatePollStatus, getPollStatus } from "@/lib/db/pollStatus";

const mockUpsert = jest.fn().mockReturnValue({ error: null });
const mockSelect = jest.fn();
const mockSingle = jest.fn();

const mockSupabase = {
  from: jest.fn().mockReturnValue({
    upsert: mockUpsert,
    select: mockSelect,
  }),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockSelect.mockReturnValue({ single: mockSingle });
  mockSupabase.from.mockReturnValue({
    upsert: mockUpsert,
    select: mockSelect,
  });
});

describe("updatePollStatus", () => {
  it("upserts a row with id 1, last_success_at, and result summary", async () => {
    const result = { ok: true, upserted: 10, expired: 2, stale: 1, errors: [] };
    await updatePollStatus(mockSupabase as never, result);

    expect(mockSupabase.from).toHaveBeenCalledWith("poll_status");
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 1,
        last_success_at: expect.any(String),
        upserted: 10,
        expired: 2,
        stale: 1,
      }),
      { onConflict: "id" }
    );
  });

  it("stores an ISO timestamp in last_success_at", async () => {
    const result = { ok: true, upserted: 0, expired: 0, stale: 0, errors: [] };
    await updatePollStatus(mockSupabase as never, result);

    const row = mockUpsert.mock.calls[0][0];
    expect(() => new Date(row.last_success_at).toISOString()).not.toThrow();
  });
});

describe("getPollStatus", () => {
  it("returns the single poll_status row", async () => {
    const row = { id: 1, last_success_at: "2026-03-06T08:00:00Z", upserted: 10, expired: 2, stale: 1 };
    mockSingle.mockResolvedValue({ data: row, error: null });

    const status = await getPollStatus(mockSupabase as never);
    expect(status).toEqual(row);
    expect(mockSupabase.from).toHaveBeenCalledWith("poll_status");
  });

  it("returns null when no row exists", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: "PGRST116" } });

    const status = await getPollStatus(mockSupabase as never);
    expect(status).toBeNull();
  });
});
