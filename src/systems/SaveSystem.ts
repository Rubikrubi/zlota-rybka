/**
 * SaveSystem.ts
 * ---------------------------------------------------------------------------
 * Persists player progress to localStorage as JSON. Mirrors the role of
 * res://scripts/save_system.gd in the original Godot spec: tracks the
 * current unlocked level, coin balance, purchased decorations/fish, and
 * the placement of every item inside the aquarium scene.
 */

export interface PlacedItem {
  key: string; // shop item key, e.g. "plant" or "bluefin"
  texture: string;
  category: "decor" | "fish";
  x: number; // normalized 0..1 position inside the aquarium viewport
  y: number;
  scale: number;
}

export interface SaveData {
  currentLevel: number; // highest unlocked level (1-based)
  coins: number;
  ownedDecor: string[]; // shop item keys purchased
  ownedFish: string[];
  placedItems: PlacedItem[];
  musicOn: boolean;
  sfxOn: boolean;
  levelStars: Record<number, number>; // stars earned per level id
}

const SAVE_KEY = "coral_tide_save_v1";

const DEFAULT_SAVE: SaveData = {
  currentLevel: 1,
  coins: 100,
  ownedDecor: [],
  ownedFish: ["bluefin"], // player always starts with one friendly fish
  placedItems: [
    { key: "bluefin", texture: "fish_bluefin", category: "fish", x: 0.5, y: 0.5, scale: 0.45 },
  ],
  musicOn: true,
  sfxOn: true,
  levelStars: {},
};

class SaveSystemClass {
  private data: SaveData;

  constructor() {
    this.data = this.load();
  }

  private load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return structuredClone(DEFAULT_SAVE);
      const parsed = JSON.parse(raw);
      // Merge with defaults so new fields introduced later don't crash old saves.
      return { ...structuredClone(DEFAULT_SAVE), ...parsed };
    } catch (e) {
      console.warn("SaveSystem: failed to load save, using defaults", e);
      return structuredClone(DEFAULT_SAVE);
    }
  }

  private persist() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.warn("SaveSystem: failed to persist save", e);
    }
  }

  get(): SaveData {
    return this.data;
  }

  addCoins(amount: number) {
    this.data.coins = Math.max(0, this.data.coins + amount);
    this.persist();
  }

  spendCoins(amount: number): boolean {
    if (this.data.coins < amount) return false;
    this.data.coins -= amount;
    this.persist();
    return true;
  }

  unlockNextLevel(finishedLevelId: number) {
    if (finishedLevelId + 1 > this.data.currentLevel) {
      this.data.currentLevel = finishedLevelId + 1;
    }
    this.persist();
  }

  setStars(levelId: number, stars: number) {
    const prev = this.data.levelStars[levelId] ?? 0;
    this.data.levelStars[levelId] = Math.max(prev, stars);
    this.persist();
  }

  purchaseDecor(key: string) {
    if (!this.data.ownedDecor.includes(key)) this.data.ownedDecor.push(key);
    this.persist();
  }

  purchaseFish(key: string) {
    if (!this.data.ownedFish.includes(key)) this.data.ownedFish.push(key);
    this.persist();
  }

  savePlacedItems(items: PlacedItem[]) {
    this.data.placedItems = items;
    this.persist();
  }

  setMusicOn(on: boolean) {
    this.data.musicOn = on;
    this.persist();
  }

  setSfxOn(on: boolean) {
    this.data.sfxOn = on;
    this.persist();
  }

  /** Wipes all progress back to a fresh game — used by the Options "Reset" button. */
  resetAll() {
    this.data = structuredClone(DEFAULT_SAVE);
    this.persist();
  }
}

// Singleton instance shared across all scenes.
export const SaveSystem = new SaveSystemClass();
