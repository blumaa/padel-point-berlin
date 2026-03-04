import { shouldDismiss, nextDrawerState } from "@/lib/drawerLogic";

// ---------------------------------------------------------------------------
// shouldDismiss
// ---------------------------------------------------------------------------
describe("shouldDismiss", () => {
  it("returns true when deltaY exceeds distance threshold (>80)", () => {
    expect(shouldDismiss(90, 0)).toBe(true);
  });

  it("returns false when deltaY is below distance threshold (79)", () => {
    expect(shouldDismiss(79, 0)).toBe(false);
  });

  it("returns true when velocity exceeds velocity threshold (>0.5)", () => {
    expect(shouldDismiss(0, 0.6)).toBe(true);
  });

  it("returns false when velocity is below velocity threshold (0.49)", () => {
    expect(shouldDismiss(0, 0.49)).toBe(false);
  });

  it("returns true when both distance and velocity thresholds are exceeded", () => {
    expect(shouldDismiss(81, 0.6)).toBe(true);
  });

  it("returns false for upward drag (negative deltaY), regardless of velocity", () => {
    expect(shouldDismiss(-10, 0)).toBe(false);
  });

  it("returns false for upward drag even with high velocity", () => {
    expect(shouldDismiss(-50, 1.0)).toBe(false);
  });

  it("returns false when deltaY is exactly 80 (boundary — not strictly greater)", () => {
    expect(shouldDismiss(80, 0)).toBe(false);
  });

  it("returns false when velocity is exactly 0.5 (boundary — not strictly greater)", () => {
    expect(shouldDismiss(0, 0.5)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// nextDrawerState
// ---------------------------------------------------------------------------
describe("nextDrawerState", () => {
  it('transitions from "idle" to "open" on "open" action', () => {
    expect(nextDrawerState("idle", "open")).toBe("open");
  });

  it('transitions from "open" to "closing" on "internalClose"', () => {
    expect(nextDrawerState("open", "internalClose")).toBe("closing");
  });

  it('transitions from "open" to "closing" on "externalClose"', () => {
    expect(nextDrawerState("open", "externalClose")).toBe("closing");
  });

  it('stays "closing" when "externalClose" fires while already closing (no double-close)', () => {
    expect(nextDrawerState("closing", "externalClose")).toBe("closing");
  });

  it('stays "closing" when "internalClose" fires while already closing (no double-close)', () => {
    expect(nextDrawerState("closing", "internalClose")).toBe("closing");
  });

  it('stays "idle" when "externalClose" fires while idle (ignore if not open)', () => {
    expect(nextDrawerState("idle", "externalClose")).toBe("idle");
  });

  it('stays "idle" when "internalClose" fires while idle', () => {
    expect(nextDrawerState("idle", "internalClose")).toBe("idle");
  });

  it('transitions from "closing" to "open" when re-opened', () => {
    expect(nextDrawerState("closing", "open")).toBe("open");
  });
});
