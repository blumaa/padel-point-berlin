import { parseLevel, parseLevelRange } from "@/lib/parser/parseLevel";

describe("parseLevel", () => {
  it("parses dot decimal", () => {
    expect(parseLevel("1.6")).toBe(1.6);
  });

  it("parses German comma decimal", () => {
    expect(parseLevel("0,8")).toBe(0.8);
  });

  it("parses with leading paren", () => {
    expect(parseLevel("(2.6")).toBe(2.6);
  });

  it("parses with parens on both sides", () => {
    expect(parseLevel("(1.6)")).toBe(1.6);
  });

  it("parses bare integer as float", () => {
    expect(parseLevel("(2")).toBe(2.0);
  });

  it("returns null for non-numeric", () => {
    expect(parseLevel("abc")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseLevel("")).toBeNull();
  });
});

describe("parseLevelRange", () => {
  it("parses dot decimal range", () => {
    expect(parseLevelRange("Level 1.39 - 2.39")).toEqual({ min: 1.39, max: 2.39 });
  });

  it("parses German comma range", () => {
    expect(parseLevelRange("Level 1,5 - 2,5")).toEqual({ min: 1.5, max: 2.5 });
  });

  it("parses range with 📊 emoji prefix", () => {
    expect(parseLevelRange("📊 Level 1.8 - 2.8")).toEqual({ min: 1.8, max: 2.8 });
  });

  it("parses range from Format B", () => {
    expect(parseLevelRange("Level: 0 - 1.5")).toEqual({ min: 0, max: 1.5 });
  });

  it("returns nulls for non-matching text", () => {
    expect(parseLevelRange("no level here")).toEqual({ min: null, max: null });
  });
});
