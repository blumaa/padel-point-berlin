import { detectFormat } from "@/lib/parser/detectFormat";
import { formatA1, formatA2, formatA3, formatA4, formatA5, formatB1, formatC1 } from "../fixtures/messages";

describe("detectFormat", () => {
  it("detects Format A (emoji-structured match)", () => {
    expect(detectFormat(formatA1)).toBe("formatA");
    expect(detectFormat(formatA2)).toBe("formatA");
    expect(detectFormat(formatA3)).toBe("formatA");
    expect(detectFormat(formatA4)).toBe("formatA");
    expect(detectFormat(formatA5)).toBe("formatA");
  });

  it("detects Format B (lesson/class)", () => {
    expect(detectFormat(formatB1)).toBe("formatB");
  });

  it("detects Format C (plain text)", () => {
    expect(detectFormat(formatC1)).toBe("formatC");
  });
});
