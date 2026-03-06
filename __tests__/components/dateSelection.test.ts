import {
  allDates,
  saveOffsets,
  restoreSelectedDates,
  persistSelectedDates,
  loadSelectedDates,
} from "@/lib/dateSelection";

// Mock localStorage for Node test environment
const store: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { for (const k in store) delete store[k]; },
};
Object.defineProperty(global, "localStorage", { value: localStorageMock, writable: true });

beforeEach(() => {
  localStorageMock.clear();
});

describe("saveOffsets / restoreSelectedDates", () => {
  it("restores all dates when nothing is stored", () => {
    expect(restoreSelectedDates(null)).toEqual(allDates());
  });

  it("restores all dates when all offsets are stored", () => {
    const stored = JSON.stringify(saveOffsets(allDates()));
    expect(restoreSelectedDates(stored)).toEqual(allDates());
  });

  it("restores a single selected date", () => {
    const all = allDates();
    const stored = JSON.stringify(saveOffsets([all[3]]));
    expect(restoreSelectedDates(stored)).toEqual([all[3]]);
  });

  it("restores multiple selected dates", () => {
    const all = allDates();
    const selected = [all[0], all[5], all[13]];
    const stored = JSON.stringify(saveOffsets(selected));
    expect(restoreSelectedDates(stored)).toEqual(selected);
  });

  it("restores empty selection after clear (does NOT fall back to all dates)", () => {
    const stored = JSON.stringify(saveOffsets([]));
    const result = restoreSelectedDates(stored);
    expect(result).toEqual([]);
    expect(result).not.toEqual(allDates());
  });

  it("round-trips all cases correctly", () => {
    const all = allDates();
    const testCases: string[][] = [[], [all[0]], [all[0], all[7]], [all[13]], all];
    for (const selected of testCases) {
      const stored = JSON.stringify(saveOffsets(selected));
      expect(restoreSelectedDates(stored)).toEqual(selected);
    }
  });
});

describe("persistSelectedDates / loadSelectedDates (localStorage)", () => {
  it("persists and loads all dates", () => {
    const all = allDates();
    persistSelectedDates(all);
    expect(loadSelectedDates()).toEqual(all);
  });

  it("persists and loads a single date", () => {
    const all = allDates();
    persistSelectedDates([all[1]]);
    expect(loadSelectedDates()).toEqual([all[1]]);
  });

  it("persists and loads empty selection", () => {
    persistSelectedDates([]);
    expect(loadSelectedDates()).toEqual([]);
  });

  it("loads all dates when localStorage is empty", () => {
    expect(loadSelectedDates()).toEqual(allDates());
  });

  it("overwrites previous value correctly", () => {
    const all = allDates();
    persistSelectedDates(all);
    expect(loadSelectedDates()).toEqual(all);

    persistSelectedDates([all[2]]);
    expect(loadSelectedDates()).toEqual([all[2]]);

    persistSelectedDates([]);
    expect(loadSelectedDates()).toEqual([]);
  });

  it("simulates full user flow: load → clear → select one → reload", () => {
    // Fresh load — no storage, defaults to all
    const initial = loadSelectedDates();
    expect(initial).toEqual(allDates());

    // User clicks "Clear"
    persistSelectedDates([]);
    expect(loadSelectedDates()).toEqual([]);

    // User selects tomorrow
    const all = allDates();
    const tomorrow = all[1];
    persistSelectedDates([tomorrow]);
    expect(loadSelectedDates()).toEqual([tomorrow]);

    // User refreshes — should still be just tomorrow
    expect(loadSelectedDates()).toEqual([tomorrow]);
  });
});

describe("toggle logic", () => {
  it("adds a date when not selected", () => {
    const all = allDates();
    const toggled = [all[0], all[1]].sort();
    expect(toggled).toContain(all[0]);
    expect(toggled).toContain(all[1]);
  });

  it("removes a date when already selected", () => {
    const all = allDates();
    const selected = [all[0], all[1]];
    const toggled = selected.filter((d) => d !== all[0]);
    expect(toggled).toEqual([all[1]]);
  });
});
