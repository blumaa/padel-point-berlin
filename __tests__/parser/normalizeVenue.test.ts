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

  // ── Unknown venues — prefix stripped but passed through ───────────────────

  it("returns prefix-stripped value for unknown venues", () => {
    expect(normalizeVenue("MATCH IN PADZONE BERLIN")).toBe("PADZONE BERLIN");
  });

  it("passes through unrecognised venue unchanged", () => {
    expect(normalizeVenue("Padel Arena Berlin")).toBe("Padel Arena Berlin");
  });
});
