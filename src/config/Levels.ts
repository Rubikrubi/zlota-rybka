/**
 * Levels.ts
 * ---------------------------------------------------------------------------
 * Static configuration for the 50-level campaign. Each level defines a score
 * goal, a limited number of moves, and a coin reward paid out on victory.
 */

export interface LevelConfig {
  id: number; // 1-based level number
  name: string;
  goal: number; // score required to win
  moves: number; // move budget
  reward: number; // coins awarded on victory
}

// Progi punktowe obnizone o ~22% wzgledem wersji na plansze 8x8: przy 7x7 jest
// 49 pol zamiast 64, wiec kaskady sa krotsze i punkty zbieraja sie wolniej.
export const LEVELS: LevelConfig[] = [
  { id: 1, name: "Płytka Zatoczka", goal: 4900, moves: 20, reward: 50 },
  { id: 2, name: "Ogród Wodorostów", goal: 6600, moves: 25, reward: 60 },
  { id: 3, name: "Bąbelkowa Rafa", goal: 6700, moves: 23, reward: 70 },
  { id: 4, name: "Zatopione Ruiny", goal: 7100, moves: 24, reward: 80 },
  { id: 5, name: "Perłowa Grota", goal: 8000, moves: 26, reward: 100 },
  { id: 6, name: "Kryształowy Rów", goal: 8100, moves: 25, reward: 120 },
  { id: 7, name: "Koralowy Labirynt", goal: 9000, moves: 27, reward: 140 },
  { id: 8, name: "Rozgwiazdowe Mielizny", goal: 9600, moves: 28, reward: 160 },
  { id: 9, name: "Morska Otchłań", goal: 10700, moves: 30, reward: 180 },
  { id: 10, name: "Skarbiec Króla Przypływów", goal: 11000, moves: 30, reward: 250 },
  { id: 11, name: "Koralowy Ogród", goal: 11100, moves: 28, reward: 260 },
  { id: 12, name: "Latarnia Głębin", goal: 11200, moves: 28, reward: 280 },
  { id: 13, name: "Wrak Karaweli", goal: 11300, moves: 28, reward: 290 },
  { id: 14, name: "Perłowa Ławica", goal: 12300, moves: 30, reward: 310 },
  { id: 15, name: "Szmaragdowa Toń", goal: 12400, moves: 29, reward: 320 },
  { id: 16, name: "Jaskinia Meduz", goal: 12500, moves: 29, reward: 340 },
  { id: 17, name: "Prąd Zatokowy", goal: 12700, moves: 29, reward: 360 },
  { id: 18, name: "Srebrna Mielizna", goal: 13000, moves: 29, reward: 370 },
  { id: 19, name: "Grota Węgorzy", goal: 13800, moves: 30, reward: 390 },
  { id: 20, name: "Zatoka Rozbitków", goal: 14000, moves: 30, reward: 550 },
  { id: 21, name: "Podwodny Wulkan", goal: 14800, moves: 31, reward: 420 },
  { id: 22, name: "Rafa Barierowa", goal: 14900, moves: 30, reward: 440 },
  { id: 23, name: "Kolonia Koników", goal: 15000, moves: 30, reward: 450 },
  { id: 24, name: "Zimny Nurt", goal: 15700, moves: 31, reward: 470 },
  { id: 25, name: "Anemonowa Łąka", goal: 15900, moves: 31, reward: 480 },
  { id: 26, name: "Skalne Wrota", goal: 16200, moves: 31, reward: 500 },
  { id: 27, name: "Dolina Skorupiaków", goal: 16500, moves: 31, reward: 520 },
  { id: 28, name: "Zatopiona Świątynia", goal: 17300, moves: 32, reward: 530 },
  { id: 29, name: "Bursztynowa Płycizna", goal: 17600, moves: 32, reward: 550 },
  { id: 30, name: "Trójząb Neptuna", goal: 17900, moves: 32, reward: 710 },
  { id: 31, name: "Czarna Rozpadlina", goal: 18100, moves: 32, reward: 580 },
  { id: 32, name: "Ławica Latarników", goal: 18400, moves: 32, reward: 600 },
  { id: 33, name: "Ogród Rozgwiazd", goal: 19300, moves: 33, reward: 610 },
  { id: 34, name: "Kryształowa Kopuła", goal: 19500, moves: 33, reward: 630 },
  { id: 35, name: "Wir Południowy", goal: 20400, moves: 34, reward: 640 },
  { id: 36, name: "Grzbiet Wieloryba", goal: 20500, moves: 33, reward: 660 },
  { id: 37, name: "Muszlowa Aleja", goal: 20600, moves: 33, reward: 680 },
  { id: 38, name: "Zatoka Ośmiornic", goal: 21300, moves: 34, reward: 690 },
  { id: 39, name: "Fosforyzujący Kanion", goal: 21600, moves: 34, reward: 710 },
  { id: 40, name: "Korona Przypływów", goal: 21800, moves: 34, reward: 870 },
  { id: 41, name: "Lodowa Szczelina", goal: 22100, moves: 34, reward: 740 },
  { id: 42, name: "Ruiny Atlantydy", goal: 23000, moves: 35, reward: 760 },
  { id: 43, name: "Ławica Rekinów", goal: 23300, moves: 35, reward: 770 },
  { id: 44, name: "Studnia Bez Dna", goal: 23600, moves: 35, reward: 790 },
  { id: 45, name: "Ogród Ukwiałów", goal: 23900, moves: 35, reward: 800 },
  { id: 46, name: "Rów Mariański", goal: 24200, moves: 35, reward: 820 },
  { id: 47, name: "Świetlisty Labirynt", goal: 24400, moves: 35, reward: 840 },
  { id: 48, name: "Sanktuarium Syren", goal: 25400, moves: 36, reward: 850 },
  { id: 49, name: "Otchłań Lewiatana", goal: 26400, moves: 37, reward: 870 },
  { id: 50, name: "Tron Władcy Mórz", goal: 26500, moves: 36, reward: 1030 },
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
  // Odmiany kolorystyczne dziela grafike z pozycja podstawowa i roznia sie
  // barwieniem. Nowych rysunkow nie ma, wiec to sposob na urozmaicenie
  // sklepu bez dokladania plikow.
  tint?: number;
}

export const DECOR_SHOP: ShopItem[] = [
  { key: "plant", name: "Morska Roślina", texture: "deco_plant", cost: 60, category: "decor", scale: 0.55 },
  { key: "stone", name: "Rzeczny Kamień", texture: "deco_stone", cost: 80, category: "decor", scale: 0.55 },
  { key: "coral", name: "Koralowiec", texture: "deco_coral", cost: 100, category: "decor", scale: 0.55 },
  { key: "lamp", name: "Lampa Nurka", texture: "deco_lamp", cost: 120, category: "decor", scale: 0.5 },
  { key: "chest", name: "Skrzynia Skarbów", texture: "deco_chest", cost: 150, category: "decor", scale: 0.5 },
  { key: "castle", name: "Zamek z Piasku", texture: "deco_castle", cost: 400, category: "decor", scale: 0.7 },

  { key: "plant_red", name: "Czerwona Roślina", texture: "deco_plant", cost: 90, category: "decor", scale: 0.55, tint: 0xff7a6a },
  { key: "plant_violet", name: "Fioletowa Roślina", texture: "deco_plant", cost: 110, category: "decor", scale: 0.6, tint: 0xb47aff },
  { key: "stone_basalt", name: "Bazaltowy Głaz", texture: "deco_stone", cost: 120, category: "decor", scale: 0.65, tint: 0x8fa4b5 },
  { key: "coral_pink", name: "Różowy Koralowiec", texture: "deco_coral", cost: 140, category: "decor", scale: 0.55, tint: 0xff8fc0 },
  { key: "coral_gold", name: "Złoty Koralowiec", texture: "deco_coral", cost: 190, category: "decor", scale: 0.6, tint: 0xffd24a },
  { key: "lamp_emerald", name: "Szmaragdowa Lampa", texture: "deco_lamp", cost: 170, category: "decor", scale: 0.5, tint: 0x7dffb0 },
  { key: "chest_silver", name: "Srebrna Skrzynia", texture: "deco_chest", cost: 220, category: "decor", scale: 0.5, tint: 0xd6e4ee },
  { key: "castle_coral", name: "Koralowy Zamek", texture: "deco_castle", cost: 480, category: "decor", scale: 0.7, tint: 0xffb08a },
];

export const FISH_SHOP: ShopItem[] = [
  { key: "bluefin", name: "Modropłetwa", texture: "fish_bluefin", cost: 0, category: "fish", scale: 0.45 },
  { key: "coral", name: "Rybka Koralowa", texture: "fish_coral", cost: 100, category: "fish", scale: 0.45 },
  { key: "neon", name: "Neonek", texture: "fish_neon", cost: 150, category: "fish", scale: 0.4 },
  { key: "golden", name: "Złota Płetwa", texture: "fish_golden", cost: 250, category: "fish", scale: 0.5 },

  { key: "bluefin_lemon", name: "Cytrynowa Płetwa", texture: "fish_bluefin", cost: 130, category: "fish", scale: 0.45, tint: 0xffe066 },
  { key: "coral_turquoise", name: "Turkusowa Rybka", texture: "fish_coral", cost: 160, category: "fish", scale: 0.48, tint: 0x66e0d8 },
  { key: "neon_red", name: "Czerwony Neonek", texture: "fish_neon", cost: 180, category: "fish", scale: 0.4, tint: 0xff6b6b },
  { key: "neon_violet", name: "Fioletowy Neonek", texture: "fish_neon", cost: 200, category: "fish", scale: 0.44, tint: 0xc08bff },
  { key: "golden_pearl", name: "Perłowa Płetwa", texture: "fish_golden", cost: 300, category: "fish", scale: 0.52, tint: 0xdfeaf2 },
];
