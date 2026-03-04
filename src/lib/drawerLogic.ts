/**
 * Pure functions for drawer open/close lifecycle and swipe-dismiss logic.
 * No I/O, no React — safe to test in a node environment.
 */

/**
 * Determines whether a swipe gesture should dismiss the drawer.
 *
 * @param deltaY       Vertical displacement in pixels (positive = downward).
 * @param velocityPxPerMs  Average velocity in px/ms (positive = downward).
 */
export function shouldDismiss(deltaY: number, velocityPxPerMs: number): boolean {
  if (deltaY < 0) return false;
  return deltaY > 80 || velocityPxPerMs > 0.5;
}

/**
 * Possible states for the drawer lifecycle.
 * - "idle"    → drawer has never been opened or has fully closed.
 * - "open"    → drawer is visible and interactive.
 * - "closing" → close animation is in progress.
 */
export type DrawerState = "idle" | "open" | "closing";

/**
 * Actions that drive state transitions.
 * - "open"          → parent sets isOpen=true.
 * - "internalClose" → user taps Done / backdrop / swipes down.
 * - "externalClose" → parent sets isOpen=false (click-outside, etc.).
 */
export type DrawerAction = "open" | "internalClose" | "externalClose";

/**
 * Pure state-machine transition for the drawer lifecycle.
 * Prevents double-close: transitioning from "closing" on any close action
 * is a no-op.
 */
export function nextDrawerState(
  current: DrawerState,
  action: DrawerAction
): DrawerState {
  switch (action) {
    case "open":
      return "open";
    case "internalClose":
      return current === "open" ? "closing" : current;
    case "externalClose":
      return current === "open" ? "closing" : current;
    default:
      return current;
  }
}
