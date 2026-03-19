import { GET } from "@/app/api/analytics/venues/route";

const mockSelect = jest.fn();
const mockOrder = jest.fn();
jest.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: () => ({
    from: () => ({ select: mockSelect }),
  }),
}));

function makeRequest(): Request {
  return new Request("http://localhost/api/analytics/venues");
}

describe("GET /api/analytics/venues", () => {
  beforeEach(() => {
    mockSelect.mockReset();
    mockOrder.mockReset();
  });

  it("returns sorted unique venue list", async () => {
    mockSelect.mockReturnValue({
      not: () => ({
        order: () =>
          Promise.resolve({
            data: [
              { venue: "Padel FC Berlin" },
              { venue: "Urban Padel" },
              { venue: "Grenzallee" },
            ],
            error: null,
          }),
      }),
    });
    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual(["Grenzallee", "Padel FC Berlin", "Urban Padel"]);
  });

  it("returns 1hr cache header", async () => {
    mockSelect.mockReturnValue({
      not: () => ({
        order: () => Promise.resolve({ data: [], error: null }),
      }),
    });
    const res = await GET(makeRequest());
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=3600");
  });

  it("returns 500 on error", async () => {
    mockSelect.mockReturnValue({
      not: () => ({
        order: () => Promise.resolve({ data: null, error: { message: "fail" } }),
      }),
    });
    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });
});
