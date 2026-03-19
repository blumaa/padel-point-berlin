import { GET } from "@/app/api/analytics/route";

// Mock Supabase
const mockRpc = jest.fn();
jest.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: () => ({ rpc: mockRpc }),
}));

function makeRequest(params: Record<string, string> = {}): Request {
  const url = new URL("http://localhost/api/analytics");
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }
  return new Request(url.toString());
}

describe("GET /api/analytics", () => {
  beforeEach(() => {
    mockRpc.mockReset();
  });

  it("validates period param — rejects invalid values", async () => {
    const res = await GET(makeRequest({ period: "999d" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid period/i);
  });

  it("accepts valid period values", async () => {
    mockRpc.mockResolvedValue({ data: {}, error: null });
    for (const period of ["30d", "90d", "6m", "1y", "all"]) {
      const res = await GET(makeRequest({ period }));
      expect(res.status).toBe(200);
    }
  });

  it("parses venues from comma-separated query param", async () => {
    mockRpc.mockResolvedValue({ data: {}, error: null });
    await GET(makeRequest({ venues: "Padel FC,Urban Padel" }));
    expect(mockRpc).toHaveBeenCalledWith(
      "get_analytics",
      expect.objectContaining({ p_venues: ["Padel FC", "Urban Padel"] }),
    );
  });

  it("parses outcomes from comma-separated query param", async () => {
    mockRpc.mockResolvedValue({ data: {}, error: null });
    await GET(makeRequest({ outcomes: "filled,canceled" }));
    expect(mockRpc).toHaveBeenCalledWith(
      "get_analytics",
      expect.objectContaining({ p_outcomes: ["filled", "canceled"] }),
    );
  });

  it("parses categories from comma-separated query param", async () => {
    mockRpc.mockResolvedValue({ data: {}, error: null });
    await GET(makeRequest({ categories: "Open,Women" }));
    expect(mockRpc).toHaveBeenCalledWith(
      "get_analytics",
      expect.objectContaining({ p_categories: ["Open", "Women"] }),
    );
  });

  it("calls supabase.rpc with correct params", async () => {
    mockRpc.mockResolvedValue({ data: {}, error: null });
    await GET(makeRequest({ period: "90d", venues: "A", outcomes: "filled", categories: "Open" }));
    expect(mockRpc).toHaveBeenCalledWith("get_analytics", {
      p_period: "90d",
      p_venues: ["A"],
      p_outcomes: ["filled"],
      p_categories: ["Open"],
    });
  });

  it("returns 200 with correct Cache-Control header", async () => {
    mockRpc.mockResolvedValue({ data: { totalMatches: 5 }, error: null });
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=300");
  });

  it("returns 500 on Supabase error", async () => {
    mockRpc.mockResolvedValue({ data: null, error: { message: "boom" } });
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });

  it("defaults to period=30d when not provided", async () => {
    mockRpc.mockResolvedValue({ data: {}, error: null });
    await GET(makeRequest());
    expect(mockRpc).toHaveBeenCalledWith(
      "get_analytics",
      expect.objectContaining({ p_period: "30d" }),
    );
  });
});
