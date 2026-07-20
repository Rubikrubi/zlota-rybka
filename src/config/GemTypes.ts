/**
 * GemTypes.ts
 * ---------------------------------------------------------------------------
 * Central definitions for every collectible / bonus symbol used on the
 * Złota Rybka match-3 board. Keeping this in one file means the board logic,
 * renderer and UI all agree on the same set of IDs and texture keys.
 */

// The six "normal" sea symbols that can form 3-in-a-row matches.
export enum GemType {
  SHELL = "SHELL",
  STARFISH = "STARFISH",
  BUBBLE = "BUBBLE",
  CRYSTAL = "CRYSTAL",
  FISH = "FISH",
  PEARL = "PEARL",
}

export const NORMAL_GEM_TYPES: GemType[] = [
  GemType.SHELL,
  GemType.STARFISH,
  GemType.BUBBLE,
  GemType.CRYSTAL,
  GemType.FISH,
  GemType.PEARL,
];

// Texture keys loaded in BootScene, mapped 1:1 to GemType.
export const GEM_TEXTURES: Record<GemType, string> = {
  [GemType.SHELL]: "gem_shell",
  [GemType.STARFISH]: "gem_starfish",
  [GemType.BUBBLE]: "gem_bubble",
  [GemType.CRYSTAL]: "gem_crystal",
  [GemType.FISH]: "gem_fish",
  [GemType.PEARL]: "gem_pearl",
};

// Special "bonus" gems produced by matching 4, 5, or an L/T shaped group.
export enum SpecialType {
  NONE = "NONE",
  BOMB = "BOMB", // Water Bomb: clears a 3x3 area
  WAVE = "WAVE", // Tsunami Wave: clears the full row + column
  MAGIC = "MAGIC", // Magic Pearl: clears every gem of one type on the board
}

export const SPECIAL_TEXTURES: Record<Exclude<SpecialType, SpecialType.NONE>, string> = {
  [SpecialType.BOMB]: "bonus_bomb",
  [SpecialType.WAVE]: "bonus_wave",
  [SpecialType.MAGIC]: "bonus_pearl",
};

// A single board cell: what it displays and any bonus behaviour it carries.
//
// Deliberately holds NO reference to its sprite. The board replaces and nulls
// cell objects constantly (matches, gravity, shuffle), so any render state
// parked here is orphaned the moment the model changes — which is exactly how
// stale gems ended up stacked on top of each other. GameScene owns a separate
// sprite grid indexed by position instead.
export interface Cell {
  type: GemType;
  special: SpecialType;
  // The gem type this Magic Pearl should erase when detonated (assigned at
  // the moment it is created by a swap, or when later swapped by a player).
  magicTarget?: GemType;
  row: number;
  col: number;
}
