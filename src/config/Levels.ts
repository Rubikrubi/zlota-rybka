/**
 * Levels.ts
 * ---------------------------------------------------------------------------
 * Static configuration for the 10-level campaign. Each level defines a score
 * goal, a limited number of moves, and a coin reward paid out on victory.
 */

export interface LevelConfig {
  id: number; // 1-based level number
  name: string;
  goal: number; // score required to win
  moves: number; // move budget
  reward: number; // coins awarded on victory
}

export const LEVELS: LevelConfig[] = [
  { id: 1, name: "Płytka Zatoczka", goal: 3000, moves: 20, reward: 50 },
  { id: 2, name: "Ogród Wodorostów", goal: 5000, moves: 25, reward: 60 },
  { id: 3, name: "Bąbelkowa Rafa", goal: 7000, moves: 22, reward: 70 },
  { id: 4, name: "Zatopione Ruiny", goal: 9000, moves: 24, reward: 80 },
  { id: 5, name: "Perłowa Grota", goal: 12000, moves: 26, reward: 100 },
  { id: 6, name: "Kryształowy Rów", goal: 15000, moves: 25, reward: 120 },
  { id: 7, name: "Koralowy Labirynt", goal: 18000, moves: 27, reward: 140 },
  { id: 8, name: "Rozgwiazdowe Mielizny", goal: 22000, moves: 28, reward: 160 },
  { id: 9, name: "Morska Otchłań", goal: 26000, moves: 30, reward: 180 },
  { id: 10, name: "Skarbiec Króla Przypływów", goal: 32000, moves: 30, reward: 250 },
];

export function getLevel(id: number): LevelConfig {
  const lvl = LEVELS.find((l) => l.id === id);
  return lvl ?? LEVELS[0];
}

// --- Aquarium shop catalogue -------------------------------------------------

export interface ShopItem {
  key: string;
  name: string;
  texture: string;
  cost: number;
  category: "decor" | "fish";
  scale?: number;
}

export const DECOR_SHOP: ShopItem[] = [
  { key: "plant", name: "Morska Roślina", texture: "deco_plant", cost: 60, category: "decor", scale: 0.55 },
  { key: "stone", name: "Rzeczny Kamień", texture: "deco_stone", cost: 80, category: "decor", scale: 0.55 },
  { key: "coral", name: "Koralowiec", texture: "deco_coral", cost: 100, category: "decor", scale: 0.55 },
  { key: "lamp", name: "Lampa Nurka", texture: "deco_lamp", cost: 120, category: "decor", scale: 0.5 },
  { key: "chest", name: "Skrzynia Skarbów", texture: "deco_chest", cost: 150, category: "decor", scale: 0.5 },
  { key: "castle", name: "Zamek z Piasku", texture: "deco_castle", cost: 400, category: "decor", scale: 0.7 },
];

export const FISH_SHOP: ShopItem[] = [
  { key: "bluefin", name: "Modropłetwa", texture: "fish_bluefin", cost: 0, category: "fish", scale: 0.45 },
  { key: "coral", name: "Rybka Koralowa", texture: "fish_coral", cost: 100, category: "fish", scale: 0.45 },
  { key: "neon", name: "Neonek", texture: "fish_neon", cost: 150, category: "fish", scale: 0.4 },
  { key: "golden", name: "Złota Płetwa", texture: "fish_golden", cost: 250, category: "fish", scale: 0.5 },
];
