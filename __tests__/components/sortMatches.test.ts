import { sortMatches } from "@/lib/sortMatches";

type Match = { id: string; match_time: string; created_at: string };

const A: Match = { id: "a", match_time: "2025-06-01T08:00:00Z", created_at: "2025-05-28T10:00:00Z" };
const B: Match = { id: "b", match_time: "2025-06-01T12:00:00Z", created_at: "2025-05-27T09:00:00Z" };
const C: Match = { id: "c", match_time: "2025-06-02T09:00:00Z", created_at: "2025-05-29T11:00:00Z" };

describe("sortMatches — field: date", () => {
  it("asc returns matches in match_time ascending order", () => {
    const result = sortMatches([C, A, B], "date", "asc");
    expect(result.map((m) => m.id)).toEqual(["a", "b", "c"]);
  });

  it("desc returns matches in match_time descending order", () => {
    const result = sortMatches([A, C, B], "date", "desc");
    expect(result.map((m) => m.id)).toEqual(["c", "b", "a"]);
  });
});

describe("sortMatches — field: added", () => {
  it("asc returns matches in created_at ascending order", () => {
    const result = sortMatches([C, A, B], "added", "asc");
    expect(result.map((m) => m.id)).toEqual(["b", "a", "c"]);
  });

  it("desc returns matches in created_at descending order", () => {
    const result = sortMatches([A, B, C], "added", "desc");
    expect(result.map((m) => m.id)).toEqual(["c", "a", "b"]);
  });
});

describe("sortMatches — invariants", () => {
  it("does not mutate the input array", () => {
    const input = [C, A, B];
    const copy = [...input];
    sortMatches(input, "date", "desc");
    expect(input).toEqual(copy);
  });

  it("returns an empty array unchanged", () => {
    expect(sortMatches([], "date", "asc")).toEqual([]);
    expect(sortMatches([], "added", "desc")).toEqual([]);
  });

  it("returns a single-element array unchanged", () => {
    expect(sortMatches([A], "date", "desc")).toEqual([A]);
  });
});
