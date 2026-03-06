export function allDates(): string[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

export function saveOffsets(selectedDates: string[]): number[] {
  const all = allDates();
  return selectedDates.map((d) => all.indexOf(d)).filter((i) => i >= 0);
}

export function restoreSelectedDates(stored: string | null): string[] {
  if (stored) {
    const offsets = JSON.parse(stored) as number[];
    if (offsets.length === 0) return [];
    const all = allDates();
    const restored = offsets.map((i) => all[i]).filter(Boolean);
    if (restored.length > 0) return restored;
  }
  return allDates();
}

const STORAGE_KEY = "ppb-selected-offsets";

export function persistSelectedDates(dates: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(saveOffsets(dates)));
  } catch {}
}

export function loadSelectedDates(): string[] {
  try {
    return restoreSelectedDates(localStorage.getItem(STORAGE_KEY));
  } catch {}
  return allDates();
}
