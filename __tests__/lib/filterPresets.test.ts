import { loadPresets, savePreset, deletePreset } from "@/lib/filterPresets";

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

const sampleFilter = {
  levelMin: "2",
  levelMax: "5",
  venues: ["Padel FC Berlin"],
  timeOfDay: ["morning" as const, "afternoon" as const],
  category: ["Open" as const],
  indoor: null,
  competitionMode: null,
};

describe("loadPresets", () => {
  it("returns empty object when nothing stored", () => {
    expect(loadPresets()).toEqual({});
  });

  it("handles corrupted localStorage gracefully", () => {
    store["ppb-filter-presets"] = "not valid json{{{";
    expect(loadPresets()).toEqual({});
  });
});

describe("savePreset", () => {
  it("stores and retrieves a preset", () => {
    savePreset("My Filter", sampleFilter);
    const presets = loadPresets();
    expect(presets["My Filter"]).toEqual(sampleFilter);
  });

  it("rejects empty names", () => {
    expect(() => savePreset("", sampleFilter)).toThrow();
  });

  it("rejects whitespace-only names", () => {
    expect(() => savePreset("   ", sampleFilter)).toThrow();
  });

  it("trims whitespace on names", () => {
    savePreset("  Trimmed  ", sampleFilter);
    const presets = loadPresets();
    expect(presets["Trimmed"]).toEqual(sampleFilter);
    expect(presets["  Trimmed  "]).toBeUndefined();
  });

  it("rejects when 5 presets already exist", () => {
    for (let i = 0; i < 5; i++) {
      savePreset(`Preset ${i}`, sampleFilter);
    }
    expect(() => savePreset("Preset 6th", sampleFilter)).toThrow();
  });

  it("rejects duplicate preset name", () => {
    savePreset("Same", sampleFilter);
    expect(() => savePreset("Same", sampleFilter)).toThrow("already exists");
  });
});

describe("deletePreset", () => {
  it("removes one preset while keeping others", () => {
    savePreset("Keep", sampleFilter);
    savePreset("Remove", sampleFilter);
    deletePreset("Remove");
    const presets = loadPresets();
    expect(presets["Keep"]).toBeDefined();
    expect(presets["Remove"]).toBeUndefined();
  });

  it("does nothing when deleting non-existent preset", () => {
    savePreset("Exists", sampleFilter);
    deletePreset("Nope");
    expect(Object.keys(loadPresets())).toHaveLength(1);
  });
});
