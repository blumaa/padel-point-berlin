import { normalizeVenue } from "@/lib/parser/normalizeVenue";

describe("normalizeVenue", () => {
  it("returns null for null input", () => {
    expect(normalizeVenue(null)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(normalizeVenue("")).toBeNull();
  });

  // ── Prefix stripping ──────────────────────────────────────────────────────

  it("strips MATCH IN prefix", () => {
    expect(normalizeVenue("MATCH IN PADEL FC")).toBe("Padelhaus GmbH");
  });

  it("strips GAME IN prefix", () => {
    expect(normalizeVenue("GAME IN TIO TIO ROOFTOP")).toBe("Tio Tio");
  });

  it("strips PARTIDO EN prefix", () => {
    expect(normalizeVenue("PARTIDO EN PADEL FC")).toBe("Padelhaus GmbH");
  });

  it("strips MATCH IN ... — separator and keeps right side", () => {
    expect(normalizeVenue("MATCH IN MITTE — CHARLOTTE | CHARLOTTENBURG")).toBe("Mitte Charlotte");
  });

  it("strips MATCH IN ... — separator (en-dash)", () => {
    expect(normalizeVenue("MATCH IN MITTE – CHARLOTTENBURG")).toBe("Mitte Charlotte");
  });

  // ── Canonical venue aliases ────────────────────────────────────────────────

  it("maps CHARLOTTE to Mitte Charlotte", () => {
    expect(normalizeVenue("CHARLOTTE")).toBe("Mitte Charlotte");
  });

  it("maps CHARLOTTENBURG to Mitte Charlotte", () => {
    expect(normalizeVenue("CHARLOTTENBURG")).toBe("Mitte Charlotte");
  });

  it("maps MITTE CHARLOTTENBURG to Mitte Charlotte", () => {
    expect(normalizeVenue("MITTE CHARLOTTENBURG")).toBe("Mitte Charlotte");
  });

  it("maps PADEL FC to Padelhaus GmbH", () => {
    expect(normalizeVenue("PADEL FC")).toBe("Padelhaus GmbH");
  });

  it("maps PADELHAUS to Padelhaus GmbH", () => {
    expect(normalizeVenue("PADELHAUS")).toBe("Padelhaus GmbH");
  });

  it("maps PADELHAUS GMBH to Padelhaus GmbH", () => {
    expect(normalizeVenue("PADELHAUS GMBH")).toBe("Padelhaus GmbH");
  });

  it("maps PBC CENTER to PBC Center", () => {
    expect(normalizeVenue("PBC CENTER")).toBe("PBC Center");
  });

  it("maps PARTIDO EN PBC CENTER to PBC Center", () => {
    expect(normalizeVenue("PARTIDO EN PBC CENTER")).toBe("PBC Center");
  });

  it("maps TIO TIO ROOFTOP to Tio Tio", () => {
    expect(normalizeVenue("TIO TIO ROOFTOP")).toBe("Tio Tio");
  });

  it("maps GAME IN TIO TIO ROOFTOP to Tio Tio", () => {
    expect(normalizeVenue("GAME IN TIO TIO ROOFTOP")).toBe("Tio Tio");
  });

  it("maps 4Padel to 4PADEL Berlin", () => {
    expect(normalizeVenue("4Padel")).toBe("4PADEL Berlin");
  });

  it("maps 4 PADEL BERLIN to 4PADEL Berlin", () => {
    expect(normalizeVenue("4 PADEL BERLIN")).toBe("4PADEL Berlin");
  });

  it("maps WE ARE PADEL to 4PADEL Berlin", () => {
    expect(normalizeVenue("WE ARE PADEL")).toBe("4PADEL Berlin");
  });

  it("maps PADEL CITY to PadelCity Berlin", () => {
    expect(normalizeVenue("PADEL CITY")).toBe("PadelCity Berlin");
  });

  it("maps PADELCITY BERLIN to PadelCity Berlin", () => {
    expect(normalizeVenue("PADELCITY BERLIN")).toBe("PadelCity Berlin");
  });

  it("maps PADELBROS to PadelBros", () => {
    expect(normalizeVenue("PADELBROS")).toBe("PadelBros");
  });

  it("maps PADEL BROS to PadelBros", () => {
    expect(normalizeVenue("PADEL BROS")).toBe("PadelBros");
  });

  it("maps NEUKOLLN to Padel Neukölln", () => {
    expect(normalizeVenue("NEUKOLLN")).toBe("Padel Neukölln");
  });

  it("maps NEUKÖLLN to Padel Neukölln", () => {
    expect(normalizeVenue("PADEL NEUKÖLLN")).toBe("Padel Neukölln");
  });

  it("maps BEACH MITTE to BeachMitte", () => {
    expect(normalizeVenue("BEACH MITTE")).toBe("BeachMitte");
  });

  it("maps BEACHMITTE to BeachMitte", () => {
    expect(normalizeVenue("BEACHMITTE")).toBe("BeachMitte");
  });

  it("maps LANKWITZ to Padel Lankwitz", () => {
    expect(normalizeVenue("LANKWITZ")).toBe("Padel Lankwitz");
  });

  it("maps BIRGIT PADEL to Birgit Padel", () => {
    expect(normalizeVenue("BIRGIT PADEL")).toBe("Birgit Padel");
  });

  it("maps RAINBOW PADEL to Rainbow Padel", () => {
    expect(normalizeVenue("RAINBOW PADEL")).toBe("Rainbow Padel");
  });

  it("maps RAINBOW to Rainbow Padel", () => {
    expect(normalizeVenue("RAINBOW")).toBe("Rainbow Padel");
  });

  it("maps LUDWIGSFELDE to Padel Ludwigsfelde", () => {
    expect(normalizeVenue("LUDWIGSFELDE")).toBe("Padel Ludwigsfelde");
  });

  it("maps GRENZALLEE to Grenzallee Padel", () => {
    expect(normalizeVenue("GRENZALLEE")).toBe("Grenzallee Padel");
  });

  it("maps GRENZALLEE PADEL to Grenzallee Padel", () => {
    expect(normalizeVenue("GRENZALLEE PADEL")).toBe("Grenzallee Padel");
  });

  it("maps PADEL MITTE to Padel Mitte", () => {
    expect(normalizeVenue("PADEL MITTE")).toBe("Padel Mitte");
  });

  it("maps PADEL WEDDING to Padel Mitte", () => {
    expect(normalizeVenue("PADEL WEDDING")).toBe("Padel Mitte");
  });

  it("maps MÜLLERSTRASSE to Padel Mitte", () => {
    expect(normalizeVenue("MÜLLERSTRASSE")).toBe("Padel Mitte");
  });

  it("maps WIESENWEG to Padel Berlin", () => {
    expect(normalizeVenue("WIESENWEG")).toBe("Padel Berlin");
  });

  // ── Unknown venues — prefix stripped but passed through ───────────────────

  it("returns prefix-stripped value for unknown venues", () => {
    expect(normalizeVenue("MATCH IN PADZONE BERLIN")).toBe("PADZONE BERLIN");
  });

  it("passes through unrecognised venue unchanged", () => {
    expect(normalizeVenue("Padel Arena Berlin")).toBe("Padel Arena Berlin");
  });
});
