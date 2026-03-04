import { parseDate, parseDuration, parseDateFormatB } from "@/lib/parser/parseDate";

describe("parseDate (Format A)", () => {
  // Use a fixed reference date: March 2, 2026
  const ref = new Date(2026, 2, 2); // month is 0-indexed

  it("parses English day name with day number", () => {
    const result = parseDate("📅 Tuesday 10, 13:30 (90min)", ref);
    expect(result).not.toBeNull();
    // Tuesday March 10, 2026
    expect(result!.getFullYear()).toBe(2026);
    expect(result!.getMonth()).toBe(2); // March
    expect(result!.getDate()).toBe(10);
    expect(result!.getHours()).toBe(13);
    expect(result!.getMinutes()).toBe(30);
  });

  it("parses German day name (Dienstag)", () => {
    const result = parseDate("📅 Dienstag 03., 11:30 (90min)", ref);
    expect(result).not.toBeNull();
    expect(result!.getDate()).toBe(3);
    expect(result!.getHours()).toBe(11);
    expect(result!.getMinutes()).toBe(30);
  });

  it("parses German day name with comma after day name (Montag,)", () => {
    const result = parseDate("📅 Montag, 09., 13:00 (90min)", ref);
    expect(result).not.toBeNull();
    expect(result!.getDate()).toBe(9);
    expect(result!.getHours()).toBe(13);
    expect(result!.getMinutes()).toBe(0);
  });

  it("parses Thursday", () => {
    const result = parseDate("📅 Thursday 05, 10:30 (90min)", ref);
    expect(result).not.toBeNull();
    expect(result!.getDate()).toBe(5);
    expect(result!.getHours()).toBe(10);
    expect(result!.getMinutes()).toBe(30);
  });

  it("parses German Donnerstag", () => {
    const result = parseDate("📅 Donnerstag 12, 18:00 (60min)", ref);
    expect(result).not.toBeNull();
    expect(result!.getDate()).toBe(12);
    expect(result!.getHours()).toBe(18);
    expect(result!.getMinutes()).toBe(0);
  });

  it("parses day number before day name (04 Wednesday, 17:30)", () => {
    const result = parseDate("📅 04 Wednesday, 17:30 (90min)", ref);
    expect(result).not.toBeNull();
    expect(result!.getDate()).toBe(4);
    expect(result!.getHours()).toBe(17);
    expect(result!.getMinutes()).toBe(30);
  });

  it("returns null for non-date text", () => {
    expect(parseDate("no date here", ref)).toBeNull();
  });
});

describe("parseDuration", () => {
  it("parses 90min", () => {
    expect(parseDuration("📅 Tuesday 10, 13:30 (90min)")).toBe(90);
  });

  it("parses 60min", () => {
    expect(parseDuration("📅 Donnerstag 12, 18:00 (60min)")).toBe(60);
  });

  it("parses 60 min with space", () => {
    expect(parseDuration("Duration: 60 min")).toBe(60);
  });

  it("returns null if no duration found", () => {
    expect(parseDuration("no duration")).toBeNull();
  });
});

describe("parseDateFormatB", () => {
  it("parses 'Date and time: Tuesday, March 03, 10:00 am'", () => {
    const result = parseDateFormatB("Date and time: Tuesday, March 03, 10:00 am");
    expect(result).not.toBeNull();
    expect(result!.getMonth()).toBe(2); // March
    expect(result!.getDate()).toBe(3);
    expect(result!.getHours()).toBe(10);
    expect(result!.getMinutes()).toBe(0);
  });

  it("parses pm time correctly", () => {
    const result = parseDateFormatB("Date and time: Friday, March 06, 2:30 pm");
    expect(result).not.toBeNull();
    expect(result!.getHours()).toBe(14);
    expect(result!.getMinutes()).toBe(30);
  });

  it("returns null for non-matching text", () => {
    expect(parseDateFormatB("no date here")).toBeNull();
  });
});
