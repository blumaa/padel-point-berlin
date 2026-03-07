"use client";

import { useSyncExternalStore } from "react";

export interface ThemeColors {
  accent: string;
  match: string;
  confirmed: string;
  open: string;
  class: string;
  textMuted: string;
  text: string;
  surface2: string;
}

const DEFAULTS: ThemeColors = {
  accent: "#06b6d4",
  match: "#818cf8",
  confirmed: "#22c55e",
  open: "#f59e0b",
  class: "#f472b6",
  textMuted: "#a1a1aa",
  text: "#fafafa",
  surface2: "#27272a",
};

function readThemeColors(): ThemeColors {
  if (typeof document === "undefined") return DEFAULTS;
  const style = getComputedStyle(document.documentElement);
  const get = (v: string, fallback: string) => style.getPropertyValue(v).trim() || fallback;
  return {
    accent: get("--accent", DEFAULTS.accent),
    match: get("--match", DEFAULTS.match),
    confirmed: get("--confirmed", DEFAULTS.confirmed),
    open: get("--open", DEFAULTS.open),
    class: get("--class", DEFAULTS.class),
    textMuted: get("--text-muted", DEFAULTS.textMuted),
    text: get("--text", DEFAULTS.text),
    surface2: get("--surface2", DEFAULTS.surface2),
  };
}

const subscribe = () => () => {};
const getSnapshot = () => readThemeColors();
const getServerSnapshot = () => DEFAULTS;

export function useThemeColors(): ThemeColors {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
