import { GET } from "@/app/api/analytics/venue-trend/route";

const mockRpc = jest.fn();
jest.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: () => ({ rpc: mockRpc }),
}));

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL("http://localhost/api/analytics/venue-trend");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new Request(url.toString());
}

describe("GET /api/analytics/venue-trend", () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it("rejects invalid period", async () => {
    const res = await GET(makeRequest({ period: "999d" }));
    expect(res.status).toBe(400);
  });

  it("rejects invalid granularity", async () => {
    const res = await GET(makeRequest({ granularity: "hour" }));
    expect(res.status).toBe(400);
  });

  it("accepts all valid granularities", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    for (const granularity of ["day", "week", "month", "year"]) {
      const res = await GET(makeRequest({ granularity }));
      expect(res.status).toBe(200);
    }
  });

  it("defaults to period=30d and granularity=week", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    await GET(makeRequest());
    expect(mockRpc).toHaveBeenCalledWith("get_venue_trend", {
      p_period: "30d",
      p_granularity: "week",
      p_venues: [],
      p_outcomes: [],
      p_categories: [],
    });
  });

  it("passes all filter params to RPC", async () => {
    mockRpc.mockResolvedValue({ data: [], error: null });
    await GET(makeRequest({
      period: "1y",
      granularity: "month",
      venues: "Padel FC,Urban Padel",
      outcomes: "filled",
      categories: "Open,Mixed",
    }));
    expect(mockRpc).toHaveBeenCalledWith("get_venue_trend", {
      p_period: "1y",
      p_granularity: "month",
      p_venues: ["Padel FC", "Urban Padel"],
      p_outcomes: ["filled"],
      p_categories: ["Open", "Mixed"],
    });
  });

  it("returns 200 with Cache-Control header", async () => {
    mockRpc.mockResolvedValue({ data: [{ bucket: "2026-01", venue: "A", count: 5 }], error: null });
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=300");
  });

  it("returns empty array when RPC returns null", async () => {
    mockRpc.mockResolvedValue({ data: null, error: null });
    const res = await GET(makeRequest());
    const body = await res.json();
    expect(body).toEqual([]);
  });

  it("returns 500 on Supabase error", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });
});
