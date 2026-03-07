import type { FilterState } from "@/components/MatchFilters";

const STORAGE_KEY = "ppb-filter-presets";
const MAX_PRESETS = 5;

export function loadPresets(): Record<string, FilterState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    return parsed as Record<string, FilterState>;
  } catch {
    return {};
  }
}

export function savePreset(name: string, filters: FilterState): void {
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Preset name cannot be empty");

  const presets = loadPresets();
  if (trimmed in presets) throw new Error("A preset with that name already exists");
  if (Object.keys(presets).length >= MAX_PRESETS) {
    throw new Error(`Maximum of ${MAX_PRESETS} presets reached`);
  }

  presets[trimmed] = filters;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}

export function deletePreset(name: string): void {
  const presets = loadPresets();
  delete presets[name];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
}
