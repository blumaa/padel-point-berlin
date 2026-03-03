import { parseMessage } from "@/lib/parser/parseMessage";
import {
  formatA1, formatA2, formatA3, formatA4, formatA5,
  formatB1, formatC1, noPlaytomicLink,
} from "../fixtures/messages";

const ref = new Date(2026, 2, 2);

describe("parseMessage", () => {
  it("parses Format A messages", () => {
    const result = parseMessage(formatA1, ref);
    expect(result).not.toBeNull();
    expect(result!.matchType).toBe("match");
    expect(result!.playtomicId).toBe("cWBx3ut8");
  });

  it("parses all Format A variants", () => {
    expect(parseMessage(formatA2, ref)).not.toBeNull();
    expect(parseMessage(formatA3, ref)).not.toBeNull();
    expect(parseMessage(formatA4, ref)).not.toBeNull();
    expect(parseMessage(formatA5, ref)).not.toBeNull();
  });

  it("parses Format B messages", () => {
    const result = parseMessage(formatB1, ref);
    expect(result).not.toBeNull();
    expect(result!.matchType).toBe("class");
  });

  it("returns null for Format C (no playtomic link)", () => {
    expect(parseMessage(formatC1, ref)).toBeNull();
  });

  it("returns null for messages without playtomic links", () => {
    expect(parseMessage(noPlaytomicLink, ref)).toBeNull();
  });
});
