/**
 * GameScene.ts
 * ---------------------------------------------------------------------------
 * Renders and drives the 8x8 match-3 board. Owns the Board data model,
 * translates pointer input into swaps, animates matches/falls/specials,
 * tracks score vs. the level's goal/move-budget, and transitions to the
 * Victory/Defeat overlays.
 */
import Phaser from "phaser";
import { Board, BOARD_SIZE, MatchGroup } from "../systems/Board";
import { Cell, GEM_TEXTURES, SPECIAL_TEXTURES, SpecialType, GemType } from "../config/GemTypes";
import { getLevel, LevelConfig } from "../config/Levels";
import { AudioManager } from "../systems/AudioManager";
import { SaveSystem } from "../systems/SaveSystem";

// The board is sized to the screen rather than to a constant, so gems stay
// thumb-sized on a phone. See layoutBoard().
const MIN_CELL = 72;
const EDGE = 24; // breathing room between the board and the screen edge
const SIDE_GUTTER = 300; // width reserved for a HUD column in the side layout
const TOP_BAND = 190; // height reserved for the HUD band in the stacked layout

const DEPTH_HIGHLIGHT = 1;
const DEPTH_GEM = 2;
const DEPTH_POPUP = 30;

export class GameScene extends Phaser.Scene {
  private board!: Board;
  private level!: LevelConfig;
  private originX = 0;
  private originY = 0;
  private cell = 128; // px per board cell, computed in layoutBoard()
  private sideHud = false; // HUD in the left/right gutters instead of a top band

  private score = 0;
  private movesLeft = 0;
  private busy = false; // true while animations are resolving (blocks input)
  private selected: { row: number; col: number } | null = null;

  private scoreText!: Phaser.GameObjects.Text;
  private movesText!: Phaser.GameObjects.Text;
  private goalBarFill!: Phaser.GameObjects.Rectangle;
  private goalBarWidth = 420;
  private selectionHighlight!: Phaser.GameObjects.Rectangle;
  /** Render state, indexed by board position and owned solely by this scene. */
  private sprites: (Phaser.GameObjects.Image | null)[][] = [];

  constructor() {
    super("Game");
  }

  init(data: { levelId: number }) {
    this.level = getLevel(data.levelId ?? 1);
    this.score = 0;
    this.movesLeft = this.level.moves;
    this.busy = false;
    this.selected = null;
  }

  create() {
    const { width, height } = this.cameras.main;
    const bg = this.add.image(width / 2, height / 2, "bg_game");
    bg.setDisplaySize(width, height);
    this.add.rectangle(width / 2, height / 2, width, height, 0x012535, 0.25);

    this.layoutBoard();
    const span = BOARD_SIZE * this.cell;

    // Board backdrop panel
    this.add
      .rectangle(this.originX + span / 2, this.originY + span / 2, span + 24, span + 24, 0x043a52, 0.55)
      .setStrokeStyle(4, 0x38e8ff, 0.6);

    // Checkerboard cell tiles for readability
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const { x, y } = this.cellToWorld(r, c);
        const shade = (r + c) % 2 === 0 ? 0x0c5876 : 0x0a4d68;
        this.add.rectangle(x, y, this.cell - 4, this.cell - 4, shade, 0.5);
      }
    }

    this.selectionHighlight = this.add
      .rectangle(0, 0, this.cell - 6, this.cell - 6, 0xffffff, 0)
      .setStrokeStyle(6, 0xffe27a, 0)
      .setDepth(DEPTH_HIGHLIGHT)
      .setVisible(false);

    this.sprites = Array.from({ length: BOARD_SIZE }, () => new Array(BOARD_SIZE).fill(null));
    this.board = new Board();
    this.board.fillInitial();
    this.renderFullBoard();

    this.buildHUD();

    this.input.on("gameobjectdown", this.onCellClicked, this);

    AudioManager.playMusic();
  }

  // --- Coordinate helpers ---------------------------------------------------

  /** Sizes the board to whatever room the screen actually gives us instead of a
   *  fixed cell size, so gems stay large enough to tap on a phone.
   *
   *  On a wide (landscape) canvas the HUD moves into the left/right gutters and
   *  the board claims the full height; on a narrow one the HUD keeps its top
   *  band and the board claims the full width. */
  private layoutBoard() {
    const { width, height } = this.cameras.main;

    // Score both candidate layouts and keep whichever yields the bigger gem.
    const sideCell = Math.min((height - 2 * EDGE) / BOARD_SIZE, (width - 2 * SIDE_GUTTER) / BOARD_SIZE);
    const topCell = Math.min((height - TOP_BAND - EDGE) / BOARD_SIZE, (width - 2 * EDGE) / BOARD_SIZE);
    this.sideHud = sideCell >= topCell;

    const topBand = this.sideHud ? EDGE : TOP_BAND;
    this.cell = Math.max(MIN_CELL, Math.floor(this.sideHud ? sideCell : topCell));

    const span = BOARD_SIZE * this.cell;
    this.originX = Math.round(width / 2 - span / 2);
    this.originY = Math.round(topBand + (height - topBand - EDGE - span) / 2);
  }

  private cellToWorld(row: number, col: number): { x: number; y: number } {
    return {
      x: this.originX + col * this.cell + this.cell / 2,
      y: this.originY + row * this.cell + this.cell / 2,
    };
  }

  // --- HUD -------------------------------------------------------------------

  private buildHUD() {
    const { width, height } = this.cameras.main;

    // In the side layout each HUD element gets a gutter column; otherwise they
    // share the band above the board.
    const leftX = this.sideHud ? this.originX / 2 : 150;
    const rightX = this.sideHud ? width - this.originX / 2 : width - 150;
    const nameY = this.sideHud ? height * 0.18 : 40;
    const panelY = this.sideHud ? height * 0.4 : 110;
    const goalY = this.sideHud ? height * 0.62 : 168;
    this.goalBarWidth = this.sideHud ? Math.min(360, this.originX - 60) : 420;

    this.add
      .text(leftX, nameY, this.level.name, {
        fontFamily: "Bangers",
        fontSize: "44px",
        color: "#ffffff",
        stroke: "#023d52",
        strokeThickness: 6,
        align: "center",
        wordWrap: { width: this.sideHud ? this.originX - 50 : width },
      })
      .setOrigin(0.5);

    // Score panel
    this.add.rectangle(leftX, panelY, 260, 96, 0x0c3f56, 0.85).setStrokeStyle(3, 0x38e8ff);
    this.add.text(leftX, panelY - 24, "WYNIK", { fontFamily: "Arial", fontSize: "20px", color: "#9fe8ff" }).setOrigin(0.5);
    this.scoreText = this.add
      .text(leftX, panelY + 14, "0", { fontFamily: "Bangers", fontSize: "40px", color: "#ffffff" })
      .setOrigin(0.5);

    // Moves panel
    this.add.rectangle(rightX, panelY, 260, 96, 0x0c3f56, 0.85).setStrokeStyle(3, 0x38e8ff);
    this.add.text(rightX, panelY - 24, "RUCHY", { fontFamily: "Arial", fontSize: "20px", color: "#9fe8ff" }).setOrigin(0.5);
    this.movesText = this.add
      .text(rightX, panelY + 14, `${this.movesLeft}`, { fontFamily: "Bangers", fontSize: "40px", color: "#ffffff" })
      .setOrigin(0.5);

    // Goal bar
    const goalX = this.sideHud ? leftX : width / 2;
    this.add
      .text(goalX, goalY - 26, `Cel: ${this.level.goal}`, { fontFamily: "Arial", fontSize: "20px", color: "#eafcff" })
      .setOrigin(0.5);
    this.add.rectangle(goalX, goalY, this.goalBarWidth, 22, 0x02202c).setStrokeStyle(2, 0x38e8ff);
    this.goalBarFill = this.add
      .rectangle(goalX - this.goalBarWidth / 2 + 2, goalY, 1, 18, 0xffe27a)
      .setOrigin(0, 0.5);

    // Quit button — generously padded so it is an easy touch target.
    const quit = this.add
      .text(this.sideHud ? rightX : 40, this.sideHud ? nameY : 40, "✕ Wyjdź", {
        fontFamily: "Bangers",
        fontSize: "34px",
        color: "#ffffff",
        backgroundColor: "#0c3f56",
        padding: { x: 22, y: 12 },
      })
      .setOrigin(this.sideHud ? 0.5 : 0, this.sideHud ? 0.5 : 0)
      .setInteractive({ useHandCursor: true });
    quit.on("pointerdown", () => this.scene.start("LevelSelect"));
  }

  private updateHUD() {
    this.scoreText.setText(`${this.score}`);
    this.movesText.setText(`${this.movesLeft}`);
    const pct = Phaser.Math.Clamp(this.score / this.level.goal, 0, 1);
    this.goalBarFill.width = Math.max(1, (this.goalBarWidth - 4) * pct);
  }

  // --- Rendering ---------------------------------------------------------

  private textureFor(cell: Cell): string {
    return cell.special !== SpecialType.NONE
      ? SPECIAL_TEXTURES[cell.special as keyof typeof SPECIAL_TEXTURES]
      : GEM_TEXTURES[cell.type];
  }

  private createSprite(row: number, col: number, cell: Cell): Phaser.GameObjects.Image {
    const { x, y } = this.cellToWorld(row, col);
    const img = this.add.image(x, y, this.textureFor(cell));
    // Gems fill most of the cell; the small inset keeps neighbours distinct.
    img.setDisplaySize(this.cell - 12, this.cell - 12);
    img.setDepth(DEPTH_GEM);
    img.setInteractive({ useHandCursor: true });
    this.sprites[row][col] = img;
    return img;
  }

  private removeSprite(row: number, col: number, animate: boolean) {
    const img = this.sprites[row][col];
    if (!img) return;
    this.sprites[row][col] = null;
    if (animate) {
      this.tweens.add({
        targets: img,
        scale: 0,
        alpha: 0,
        duration: 180,
        ease: "Back.In",
        onComplete: () => img.destroy(),
      });
    } else {
      img.destroy();
    }
  }

  /** Brings the sprite grid back in line with the model: squares the board
   *  emptied lose their sprite, squares that gained or changed a gem get a
   *  fresh one. Safe to call after ANY board mutation — which is the point,
   *  since the model is free to replace cell objects whenever it likes. */
  private reconcileSprites(animateRemovals = true) {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        const cell = this.board.grid[r][c];
        const img = this.sprites[r][c];
        if (!cell) {
          this.removeSprite(r, c, animateRemovals);
        } else if (!img) {
          this.createSprite(r, c, cell);
        } else if (img.texture.key !== this.textureFor(cell)) {
          this.removeSprite(r, c, animateRemovals);
          this.createSprite(r, c, cell);
        }
      }
    }
  }

  private renderFullBoard() {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) this.removeSprite(r, c, false);
    }
    this.reconcileSprites(false);
  }

  /** Where a sprite currently lives, read off the sprite grid rather than from
   *  data stashed on the image — the grid is the one thing kept in lockstep. */
  private findSprite(img: Phaser.GameObjects.GameObject): { row: number; col: number } | null {
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) if (this.sprites[r][c] === img) return { row: r, col: c };
    }
    return null;
  }

  // --- Input / swap flow ---------------------------------------------------

  private onCellClicked(_pointer: Phaser.Input.Pointer, obj: Phaser.GameObjects.GameObject) {
    if (this.busy) return;
    const pos = this.findSprite(obj);
    if (!pos) return; // a sprite mid-destruction, no longer on the board
    const { row, col } = pos;

    if (!this.selected) {
      this.selected = { row, col };
      this.showSelection(row, col);
      return;
    }

    if (this.selected.row === row && this.selected.col === col) {
      // Clicked same cell again -> deselect
      this.selected = null;
      this.selectionHighlight.setVisible(false);
      return;
    }

    if (this.board.isAdjacent(this.selected, { row, col })) {
      this.attemptSwap(this.selected, { row, col });
      this.selected = null;
      this.selectionHighlight.setVisible(false);
    } else {
      // Not adjacent: treat the newly clicked cell as the new selection
      this.selected = { row, col };
      this.showSelection(row, col);
    }
  }

  private showSelection(row: number, col: number) {
    const { x, y } = this.cellToWorld(row, col);
    this.selectionHighlight.setPosition(x, y);
    this.selectionHighlight.setStrokeStyle(5, 0xffe27a, 1);
    this.selectionHighlight.setVisible(true);
  }

  private attemptSwap(a: { row: number; col: number }, b: { row: number; col: number }) {
    if (this.movesLeft <= 0) return;
    this.busy = true;

    const cellA = this.board.grid[a.row][a.col]!;
    const cellB = this.board.grid[b.row][b.col]!;
    const specialSwap = cellA.special !== SpecialType.NONE || cellB.special !== SpecialType.NONE;

    this.board.swap(a, b);
    const matches = this.board.findMatches();

    if (matches.length === 0 && !specialSwap) {
      // Invalid move: animate a little "bump" swap-back and let the player retry.
      this.animateSwap(a, b, () => {
        this.board.swap(a, b); // revert data model
        this.animateSwap(a, b, () => {
          this.busy = false;
        }, true);
      }, true);
      return;
    }

    AudioManager.play("swap");
    this.movesLeft--;
    this.updateHUD();

    this.animateSwap(a, b, () => {
      if (specialSwap && matches.length === 0) {
        // Triggering a special gem directly via swap (no normal match formed).
        // Go straight to gravity: the blast leaves holes but forms no match, so
        // settleBoard() would see nothing to do and leave the board full of gaps.
        this.detonateSpecialsFromSwap([cellA, cellB]).then(() => this.fallAndRefill());
      } else {
        this.settleBoard(matches, [a, b]);
      }
    });
  }

  /** Exchanges the two sprites in the grid, then tweens each to the square it
   *  now occupies. Because it works off positions rather than cell objects,
   *  calling it a second time with the same arguments is an exact undo. */
  private animateSwap(
    a: { row: number; col: number },
    b: { row: number; col: number },
    onDone: () => void,
    isRevert = false
  ) {
    const spriteA = this.sprites[a.row][a.col];
    const spriteB = this.sprites[b.row][b.col];
    this.sprites[a.row][a.col] = spriteB;
    this.sprites[b.row][b.col] = spriteA;

    let remaining = 2;
    const done = () => {
      if (--remaining === 0) onDone();
    };
    for (const pos of [a, b]) {
      const img = this.sprites[pos.row][pos.col];
      if (!img) {
        done();
        continue;
      }
      const { x, y } = this.cellToWorld(pos.row, pos.col);
      this.tweens.add({
        targets: img,
        x,
        y,
        duration: isRevert ? 140 : 160,
        ease: "Sine.easeInOut",
        onComplete: done,
      });
    }
  }

  // --- Match resolution loop -------------------------------------------------

  private settleBoard(initialMatches?: MatchGroup[], swapHint?: { row: number; col: number }[]) {
    let matches = initialMatches ?? this.board.findMatches();

    if (matches.length === 0) {
      this.busy = false;
      this.checkEndConditions();
      return;
    }

    this.resolveStep(matches, swapHint);
  }

  private resolveStep(matches: MatchGroup[], swapHint?: { row: number; col: number }[]) {
    AudioManager.play("match");

    const result = this.board.resolveMatches(matches, swapHint);
    this.score += result.scoreGained;
    this.updateHUD();
    this.showScorePopup(result.scoreGained, matches);

    if (result.detonations.length > 0) AudioManager.play("bonus");
    for (const pos of result.removed) this.burstAt(pos.row, pos.col);
    this.reconcileSprites();

    // Pop in the bonus gems the match left behind. Tween towards the sprite's
    // own fitted scale — the textures are 256px, so animating to scale 1 would
    // blow each bonus gem up to twice its cell and bury its neighbours.
    for (const s of result.specialsCreated) {
      const img = this.sprites[s.row][s.col];
      if (!img) continue;
      const fitted = img.scaleX;
      img.setScale(fitted * 0.2);
      this.tweens.add({ targets: img, scale: fitted, duration: 220, ease: "Back.Out" });
      AudioManager.play("bonus");
    }

    this.time.delayedCall(180, () => this.fallAndRefill());
  }

  private burstAt(row: number, col: number) {
    const { x, y } = this.cellToWorld(row, col);
    const particles = this.add.particles(x, y, "particle_sparkle", {
      speed: { min: 40, max: 140 },
      lifespan: 400,
      scale: { start: 0.5, end: 0 },
      quantity: 6,
      blendMode: "ADD",
    });
    this.time.delayedCall(420, () => particles.destroy());
  }

  private fallAndRefill() {
    const moves = this.board.applyGravity();

    let pending = moves.length;
    if (pending === 0) {
      // settleBoard() releases `busy` itself once the cascade is genuinely over;
      // clearing it here would let the player act mid-cascade.
      this.settleBoard();
      return;
    }

    // Gravity emits its moves bottom-up, so a source square is always vacated
    // before a later move needs to read it.
    for (const move of moves) {
      const { x, y } = this.cellToWorld(move.toRow, move.col);
      let img = this.sprites[move.fromRow]?.[move.col] ?? null;
      if (img) {
        this.sprites[move.fromRow][move.col] = null;
        this.sprites[move.toRow][move.col] = img;
      } else {
        // Brand new gem: spawn it above the board and let it drop in.
        img = this.createSprite(move.toRow, move.col, move.cell);
        img.setPosition(x, this.originY + move.fromRow * this.cell + this.cell / 2);
      }
      this.tweens.add({
        targets: img,
        x,
        y,
        duration: 220,
        ease: "Bounce.Out",
        delay: (BOARD_SIZE - move.toRow) * 8,
        onComplete: () => {
          pending--;
          if (pending === 0) {
            this.time.delayedCall(120, () => this.settleBoard());
          }
        },
      });
    }
  }

  /** Handles the case where the player swapped a special gem directly (no new match). */
  private async detonateSpecialsFromSwap(cells: Cell[]): Promise<void> {
    AudioManager.play("bonus");

    const result = this.board.detonateCells(cells.map((c) => ({ row: c.row, col: c.col })));
    this.score += result.scoreGained;
    this.updateHUD();
    for (const pos of result.removed) this.burstAt(pos.row, pos.col);
    this.reconcileSprites();

    return new Promise((resolve) => this.time.delayedCall(200, () => resolve()));
  }

  private showScorePopup(amount: number, matches: MatchGroup[]) {
    if (amount <= 0 || matches.length === 0) return;
    const firstCell = matches[0].cells[0];
    const { x, y } = this.cellToWorld(firstCell.row, firstCell.col);
    const label = matches.some((m) => m.cells.length >= 5)
      ? `+${amount} MAGIA!`
      : matches.some((m) => m.cells.length === 4)
      ? `+${amount} KOMBO!`
      : `+${amount}`;
    const txt = this.add
      .text(x, y, label, { fontFamily: "Bangers", fontSize: "34px", color: "#ffe27a", stroke: "#023d52", strokeThickness: 4 })
      .setOrigin(0.5)
      .setDepth(DEPTH_POPUP);
    this.tweens.add({ targets: txt, y: y - 60, alpha: 0, duration: 700, ease: "Cubic.Out", onComplete: () => txt.destroy() });
  }

  // --- End conditions --------------------------------------------------------

  private checkEndConditions() {
    if (this.score >= this.level.goal) {
      this.time.delayedCall(300, () => this.handleVictory());
      return;
    }
    if (this.movesLeft <= 0) {
      this.time.delayedCall(300, () => this.handleDefeat());
      return;
    }
    if (!this.board.hasAnyValidMove()) {
      this.board.shuffle();
      this.renderFullBoard();
    }
  }

  private handleVictory() {
    const stars = this.computeStars();
    SaveSystem.addCoins(this.level.reward);
    SaveSystem.unlockNextLevel(this.level.id);
    SaveSystem.setStars(this.level.id, stars);
    AudioManager.play("reward");
    this.scene.start("Victory", { level: this.level, score: this.score, stars });
  }

  private handleDefeat() {
    this.scene.start("Defeat", { level: this.level, score: this.score });
  }

  private computeStars(): number {
    const ratio = this.score / this.level.goal;
    if (ratio >= 1.5) return 3;
    if (ratio >= 1.15) return 2;
    return 1;
  }
}
