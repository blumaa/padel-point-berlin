import { extractPlaytomicId } from "@/lib/parser/extractPlaytomicId";
import { formatA1, formatA2, formatB1, formatC1, noPlaytomicLink } from "../fixtures/messages";

describe("extractPlaytomicId", () => {
  it("extracts short match ID from /t/ URL", () => {
    expect(extractPlaytomicId(formatA1)).toEqual({
      id: "cWBx3ut8",
      url: "https://app.playtomic.io/t/cWBx3ut8",
    });
  });

  it("extracts short match ID from another /t/ URL", () => {
    expect(extractPlaytomicId(formatA2)).toEqual({
      id: "HIqdkrnm",
      url: "https://app.playtomic.io/t/HIqdkrnm",
    });
  });

  it("extracts UUID from lesson_class URL", () => {
    expect(extractPlaytomicId(formatB1)).toEqual({
      id: "6c3522b9-843c-4bc4-9cac-a725e076ba09",
      url: "https://app.playtomic.io/lesson_class/6c3522b9-843c-4bc4-9cac-a725e076ba09",
    });
  });

  it("returns null for messages without playtomic links", () => {
    expect(extractPlaytomicId(formatC1)).toBeNull();
    expect(extractPlaytomicId(noPlaytomicLink)).toBeNull();
  });
});
