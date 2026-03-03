import { parseFormatB } from "@/lib/parser/parseFormatB";
import { formatB1 } from "../fixtures/messages";

describe("parseFormatB", () => {
  it("parses class/lesson format", () => {
    const result = parseFormatB(formatB1);
    expect(result).not.toBeNull();
    expect(result!.matchType).toBe("class");
    expect(result!.playtomicId).toBe("6c3522b9-843c-4bc4-9cac-a725e076ba09");
    expect(result!.title).toBe("Padel class");
    expect(result!.matchTime.getMonth()).toBe(2); // March
    expect(result!.matchTime.getDate()).toBe(3);
    expect(result!.matchTime.getHours()).toBe(10);
    expect(result!.durationMin).toBe(60);
    expect(result!.levelMin).toBe(0);
    expect(result!.levelMax).toBe(1.5);
    expect(result!.category).toBe("Open");
    expect(result!.players).toEqual([]);
  });
});
