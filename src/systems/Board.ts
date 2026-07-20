/**
 * Board.ts
 * ---------------------------------------------------------------------------
 * Pure game-logic for the 8x8 match-3 grid: generation, swap validation,
 * match detection (rows/cols of 3+, including 4/5 combos and L/T shapes),
 * cascade resolution, and special-gem detonation. Rendering is handled
 * separately by GameScene so this class stays engine-agnostic and testable.
 */
import { Cell, GemType, NORMAL_GEM_TYPES, SpecialType } from "../config/GemTypes";

// 7x7, nie 8x8: na wysokosci ekranu telefonu osiem rzedow daje kafelki
// 43-49 px CSS, czyli ponizej progu wygodnego dotyku (44 px Apple / 48 dp
// Android). Siedem rzedow podnosi kafelek do ~54 px.
export const BOARD_SIZE = 7;

export interface MatchGroup {
  cells: { row: number; col: number }[];
  type: GemType;
}

export interface Detonation {
  row: number;
  col: number;
  special: SpecialType;
  type: GemType;
}

export interface ResolveResult {
  scoreGained: number;
  matchedCount: number;
  specialsCreated: { row: number; col: number; special: SpecialType; type: GemType }[];
  /** Special gems that were caught in the match and blew up (chained). */
  detonations: Detonation[];
  /** Every cell this step emptied — the renderer needs this to clear sprites. */
  removed: { row: number; col: number }[];
}

export class Board {
  grid: (Cell | null)[][];

  constructor() {
    this.grid = [];
    for (let r = 0; r < BOARD_SIZE; r++) {
      this.grid.push(new Array(BOARD_SIZE).fill(null));
    }
  }

  /** Fills the board with random gems, re-rolling any cell that would start
   *  the game with an already-formed match (so the player begins clean). */
  fillInitial() {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        let type: GemType;
        do {
          type = randomGemType();
        } while (this.wouldMatchAt(r, c, type));
        this.grid[r][c] = { type, special: SpecialType.NONE, row: r, col: c };
      }
    }
  }

  private wouldMatchAt(row: number, col: number, type: GemType): boolean {
    // Check two-to-the-left horizontal
    if (col >= 2) {
      const a = this.grid[row][col - 1];
      const b = this.grid[row][col - 2];
      if (a && b && a.type === type && b.type === type) return true;
    }
    // Check two-above vertical
    if (row >= 2) {
      const a = this.grid[row - 1][col];
      const b = this.grid[row - 2][col];
      if (a && b && a.type === type && b.type === type) return true;
    }
    return false;
  }

  inBounds(row: number, col: number): boolean {
    return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
  }

  isAdjacent(a: { row: number; col: number }, b: { row: number; col: number }): boolean {
    const dr = Math.abs(a.row - b.row);
    const dc = Math.abs(a.col - b.col);
    return dr + dc === 1;
  }

  /** Swaps two cells in the data model (does not check validity). */
  swap(a: { row: number; col: number }, b: { row: number; col: number }) {
    const cellA = this.grid[a.row][a.col];
    const cellB = this.grid[b.row][b.col];
    this.grid[a.row][a.col] = cellB;
    this.grid[b.row][b.col] = cellA;
    if (this.grid[a.row][a.col]) {
      this.grid[a.row][a.col]!.row = a.row;
      this.grid[a.row][a.col]!.col = a.col;
    }
    if (this.grid[b.row][b.col]) {
      this.grid[b.row][b.col]!.row = b.row;
      this.grid[b.row][b.col]!.col = b.col;
    }
  }

  /** Finds every run of 3+ identical gems (horizontal & vertical) currently on the board. */
  findMatches(): MatchGroup[] {
    const groups: MatchGroup[] = [];
    const visited = new Set<string>();

    // Horizontal runs
    for (let r = 0; r < BOARD_SIZE; r++) {
      let runStart = 0;
      for (let c = 1; c <= BOARD_SIZE; c++) {
        const prev = this.grid[r][c - 1];
        const cur = c < BOARD_SIZE ? this.grid[r][c] : null;
        const sameType = prev && cur && prev.type === cur.type;
        if (!sameType) {
          const runLen = c - runStart;
          if (runLen >= 3 && prev) {
            const cells = [];
            for (let k = runStart; k < c; k++) cells.push({ row: r, col: k });
            groups.push({ cells, type: prev.type });
            cells.forEach((cc) => visited.add(`${cc.row},${cc.col}`));
          }
          runStart = c;
        }
      }
    }

    // Vertical runs
    for (let c = 0; c < BOARD_SIZE; c++) {
      let runStart = 0;
      for (let r = 1; r <= BOARD_SIZE; r++) {
        const prev = this.grid[r - 1][c];
        const cur = r < BOARD_SIZE ? this.grid[r][c] : null;
        const sameType = prev && cur && prev.type === cur.type;
        if (!sameType) {
          const runLen = r - runStart;
          if (runLen >= 3 && prev) {
            const cells = [];
            for (let k = runStart; k < r; k++) cells.push({ row: k, col: c });
            groups.push({ cells, type: prev.type });
          }
          runStart = r;
        }
      }
    }

    return groups;
  }

  /** Returns true if swapping these two adjacent cells produces at least one match. */
  wouldSwapMatch(a: { row: number; col: number }, b: { row: number; col: number }): boolean {
    this.swap(a, b);
    const matches = this.findMatches();
    this.swap(a, b); // revert — caller performs the "real" swap separately
    return matches.length > 0;
  }

  /** Scans the whole board for any legal move that would create a match. Used for
   *  the "no more moves" shuffle check. */
  hasAnyValidMove(): boolean {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (c < BOARD_SIZE - 1 && this.wouldSwapMatch({ row: r, col: c }, { row: r, col: c + 1 })) return true;
        if (r < BOARD_SIZE - 1 && this.wouldSwapMatch({ row: r, col: c }, { row: r + 1, col: c })) return true;
      }
    }
    return false;
  }

  /** Reshuffles all existing gems randomly in place (kept counts identical). */
  shuffle() {
    const flat: GemType[] = [];
    for (let r = 0; r < BOARD_SIZE; r++)
      for (let c = 0; c < BOARD_SIZE; c++) flat.push(this.grid[r][c]!.type);
    for (let i = flat.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [flat[i], flat[j]] = [flat[j], flat[i]];
    }
    let idx = 0;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        this.grid[r][c] = { type: flat[idx++], special: SpecialType.NONE, row: r, col: c };
      }
    }
  }

  /** Grows `doomed` to swallow the blast radius of every special gem already
   *  inside it, repeating until the chain reaction stops. Reads the grid but
   *  never writes to it, so callers can still inspect cells afterwards. */
  private chainDetonations(doomed: Set<string>, detonations: Detonation[]) {
    const seen = new Set<string>();
    const queue = Array.from(doomed);

    while (queue.length > 0) {
      const key = queue.pop()!;
      if (seen.has(key)) continue;
      seen.add(key);

      const [r, c] = key.split(",").map(Number);
      const cell = this.grid[r][c];
      if (!cell || cell.special === SpecialType.NONE) continue;

      const target = cell.magicTarget ?? cell.type;
      detonations.push({ row: r, col: c, special: cell.special, type: target });
      for (const pos of this.getSpecialClearCells(r, c, cell.special, target)) {
        const blastKey = `${pos.row},${pos.col}`;
        doomed.add(blastKey);
        if (!seen.has(blastKey)) queue.push(blastKey);
      }
    }
  }

  /** Picks which special gem (if any) a matched run leaves behind.
   *  4 in a line -> bomb, an L/T junction -> wave, 5+ in a line -> magic pearl. */
  private specialForGroup(group: MatchGroup, junction: boolean): SpecialType {
    if (group.cells.length >= 5) return SpecialType.MAGIC;
    if (junction) return SpecialType.WAVE;
    if (group.cells.length === 4) return SpecialType.BOMB;
    return SpecialType.NONE;
  }

  /** Removes matched cells, detonates any special gems caught in the match,
   *  and decides which runs leave a new special gem behind. Returns score,
   *  the specials created, and the full list of emptied cells. */
  resolveMatches(groups: MatchGroup[], swapHint?: { row: number; col: number }[]): ResolveResult {
    const doomed = new Set<string>();
    for (const group of groups) group.cells.forEach((cc) => doomed.add(`${cc.row},${cc.col}`));

    // A cell listed by two groups is the junction of an L/T shape.
    const membership = new Map<string, number>();
    for (const group of groups)
      for (const cc of group.cells) {
        const key = `${cc.row},${cc.col}`;
        membership.set(key, (membership.get(key) ?? 0) + 1);
      }

    // Blow up specials the player matched away, before anything is cleared —
    // getSpecialClearCells needs to read the still-intact grid.
    const detonations: Detonation[] = [];
    this.chainDetonations(doomed, detonations);
    const detonatedKeys = new Set(detonations.map((d) => `${d.row},${d.col}`));

    // Decide new specials. Keyed by cell so an L/T can never stack two on one square.
    const specialByKey = new Map<string, { special: SpecialType; type: GemType }>();
    for (const group of groups) {
      const junction = group.cells.find((cc) => (membership.get(`${cc.row},${cc.col}`) ?? 0) > 1);
      const special = this.specialForGroup(group, junction !== undefined);
      if (special === SpecialType.NONE) continue;
      // Both arms of an L/T see the same junction; only the first one spawns a gem.
      if (junction && specialByKey.has(`${junction.row},${junction.col}`)) continue;

      // Prefer the cell the player actually moved, then the junction, then the
      // middle of the run — skipping any square that is busy exploding.
      const swapped = (swapHint ?? []).filter((s) => group.cells.some((cc) => cc.row === s.row && cc.col === s.col));
      const candidates = [...swapped, ...(junction ? [junction] : []), group.cells[Math.floor(group.cells.length / 2)], ...group.cells];
      const anchor = candidates.find((p) => {
        const key = `${p.row},${p.col}`;
        return !detonatedKeys.has(key) && !specialByKey.has(key);
      });
      if (!anchor) continue;
      specialByKey.set(`${anchor.row},${anchor.col}`, { special, type: group.type });
    }

    // Score: base 100/cell, bonus for bigger groups and for each chained blast.
    let scoreGained = doomed.size * 100;
    for (const group of groups) {
      if (group.cells.length === 4) scoreGained += 200;
      else if (group.cells.length >= 5) scoreGained += 500;
    }
    scoreGained += detonations.length * 250;

    // Clear every doomed cell; anchors are reborn in place as the new special.
    const removed: { row: number; col: number }[] = [];
    for (const key of doomed) {
      const [r, c] = key.split(",").map(Number);
      removed.push({ row: r, col: c });
      const info = specialByKey.get(key);
      if (info) {
        this.grid[r][c] = {
          type: info.type,
          special: info.special,
          magicTarget: info.special === SpecialType.MAGIC ? info.type : undefined,
          row: r,
          col: c,
        };
      } else {
        this.grid[r][c] = null;
      }
    }

    const specialsCreated = Array.from(specialByKey.entries()).map(([key, info]) => {
      const [row, col] = key.split(",").map(Number);
      return { row, col, special: info.special, type: info.type };
    });

    return { scoreGained, matchedCount: doomed.size, specialsCreated, detonations, removed };
  }

  /** Detonates the specials sitting on the given cells (the player swapped one
   *  directly instead of matching it) and clears everything the blast touches. */
  detonateCells(positions: { row: number; col: number }[]): {
    scoreGained: number;
    detonations: Detonation[];
    removed: { row: number; col: number }[];
  } {
    const doomed = new Set(positions.map((p) => `${p.row},${p.col}`));
    const detonations: Detonation[] = [];
    this.chainDetonations(doomed, detonations);

    const removed: { row: number; col: number }[] = [];
    for (const key of doomed) {
      const [r, c] = key.split(",").map(Number);
      removed.push({ row: r, col: c });
      this.grid[r][c] = null;
    }
    return { scoreGained: removed.length * 120 + detonations.length * 250, detonations, removed };
  }

  /** Applies gravity: gems fall down into empty cells, and new random gems
   *  spawn at the top of each column that lost cells. Returns a list of moves
   *  for animation purposes: {fromRow, col, toRow, type, special, isNew} */
  applyGravity(): { fromRow: number; toRow: number; col: number; cell: Cell }[] {
    const moves: { fromRow: number; toRow: number; col: number; cell: Cell }[] = [];

    for (let c = 0; c < BOARD_SIZE; c++) {
      // Compact existing gems downward.
      let writeRow = BOARD_SIZE - 1;
      for (let r = BOARD_SIZE - 1; r >= 0; r--) {
        const cell = this.grid[r][c];
        if (cell) {
          if (writeRow !== r) {
            this.grid[writeRow][c] = cell;
            this.grid[r][c] = null;
            cell.row = writeRow;
            moves.push({ fromRow: r, toRow: writeRow, col: c, cell });
          }
          writeRow--;
        }
      }
      // Fill remaining empty slots at top with brand new gems, falling from above the board.
      for (let r = writeRow; r >= 0; r--) {
        const type = randomGemType();
        const cell: Cell = { type, special: SpecialType.NONE, row: r, col: c };
        this.grid[r][c] = cell;
        moves.push({ fromRow: r - (writeRow + 1) - 1, toRow: r, col: c, cell });
      }
    }
    return moves;
  }

  /** Returns the set of cells a special gem should destroy when triggered. */
  getSpecialClearCells(row: number, col: number, special: SpecialType, type: GemType): { row: number; col: number }[] {
    const cells: { row: number; col: number }[] = [];
    if (special === SpecialType.BOMB) {
      for (let r = row - 1; r <= row + 1; r++) {
        for (let c = col - 1; c <= col + 1; c++) {
          if (this.inBounds(r, c)) cells.push({ row: r, col: c });
        }
      }
    } else if (special === SpecialType.WAVE) {
      for (let c = 0; c < BOARD_SIZE; c++) cells.push({ row, col: c });
      for (let r = 0; r < BOARD_SIZE; r++) cells.push({ row: r, col });
    } else if (special === SpecialType.MAGIC) {
      for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
          const cell = this.grid[r][c];
          if (cell && cell.type === type) cells.push({ row: r, col: c });
        }
      }
    }
    return cells;
  }
}

export function randomGemType(): GemType {
  return NORMAL_GEM_TYPES[Math.floor(Math.random() * NORMAL_GEM_TYPES.length)];
}
