/**
 * LevelSelectScene.ts
 * ---------------------------------------------------------------------------
 * Kampania na 50 poziomow, pokazywana stronami. Liczba kolumn wynika z
 * szerokosci plotna, wiec szeroki ekran telefonu miesci wiecej poziomow na
 * stronie niz waski. Poziomy powyzej postepu gracza sa wygaszone. Stad prowadzi
 * tez skrot do akwarium.
 */
import Phaser from "phaser";
import { LEVELS } from "../config/Levels";
import { SaveSystem } from "../systems/SaveSystem";
import { AudioManager } from "../systems/AudioManager";
import { makeButton } from "../ui/Button";

const COL_PITCH = 240;
const ROW_PITCH = 250; // mniej i podpis poziomu wchodzilby na kolko z rzedu nizej
const ROWS = 2;
const NODE_R = 88;

interface LevelSelectData {
  page?: number;
}

export class LevelSelectScene extends Phaser.Scene {
  private requestedPage?: number;

  constructor() {
    super("LevelSelect");
  }

  init(data: LevelSelectData) {
    // Strona przychodzi z powrotem przy przebudowie sceny (zmiana rozmiaru
    // plotna), wiec pelny ekran nie przerzuca gracza na poczatek listy.
    this.requestedPage = data?.page;
  }

  create() {
    const { width, height } = this.cameras.main;
    const bg = this.add.image(width / 2, height / 2, "bg_game");
    bg.setDisplaySize(width, height);
    this.add.rectangle(width / 2, height / 2, width, height, 0x012535, 0.35);

    this.add
      .text(width / 2, 55, "WYBIERZ NURKOWANIE", {
        fontFamily: "Bangers",
        fontSize: "56px",
        color: "#ffffff",
        stroke: "#023d52",
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    // Ile kolumn zmiesci sie w tej szerokosci — telefon trzymany poziomo jest
    // znacznie szerszy niz monitor 16:9, wiec pokazuje wiecej poziomow naraz.
    const cols = Phaser.Math.Clamp(Math.floor((width - 160) / COL_PITCH), 4, 8);
    const perPage = cols * ROWS;
    const pages = Math.ceil(LEVELS.length / perPage);

    const unlocked = SaveSystem.get().currentLevel;
    const pageOfProgress = Math.floor((Math.min(unlocked, LEVELS.length) - 1) / perPage);
    const page = Phaser.Math.Clamp(this.requestedPage ?? pageOfProgress, 0, pages - 1);

    this.buildPageNav(width, page, pages);
    this.buildGrid(width, cols, perPage, page, unlocked);

    // Dolny pasek nawigacji
    makeButton(this, width / 2 - 250, height - 90, 420, 140, "AKWARIUM", "#59c86b", () => {
      AudioManager.play("click");
      this.scene.start("Aquarium");
    });
    makeButton(this, width / 2 + 250, height - 90, 420, 140, "MENU", "#ff9f5a", () => {
      AudioManager.play("click");
      this.scene.start("MainMenu");
    });

    this.add
      .text(width - 40, 40, `🪙 ${SaveSystem.get().coins}`, {
        fontFamily: "Bangers",
        fontSize: "34px",
        color: "#ffe27a", stroke: "#00151d", strokeThickness: 5 })
      .setOrigin(1, 0);
  }

  /** Strzalki i licznik stron. Strzalka pojawia sie tylko wtedy, gdy jest dokad
   *  isc — martwy, wygaszony przycisk myli bardziej niz jego brak. */
  private buildPageNav(width: number, page: number, pages: number) {
    if (pages <= 1) return;

    this.add
      .text(width / 2, 170, `Strona ${page + 1} / ${pages}`, {
        fontFamily: "Bangers",
        fontSize: "38px",
        color: "#eafcff",
        stroke: "#023d52",
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    if (page > 0) {
      makeButton(this, width / 2 - 300, 170, 260, 140, "◀", "#3fd0ff", () => this.goToPage(page - 1), 46);
    }
    if (page < pages - 1) {
      makeButton(this, width / 2 + 300, 170, 260, 140, "▶", "#3fd0ff", () => this.goToPage(page + 1), 46);
    }
  }

  private goToPage(page: number) {
    AudioManager.play("click");
    this.scene.restart({ page } satisfies LevelSelectData);
  }

  private buildGrid(width: number, cols: number, perPage: number, page: number, unlocked: number) {
    const startX = width / 2 - ((cols - 1) * COL_PITCH) / 2;
    const startY = 330;
    const shown = LEVELS.slice(page * perPage, (page + 1) * perPage);

    shown.forEach((lvl, i) => {
      const x = startX + (i % cols) * COL_PITCH;
      const y = startY + Math.floor(i / cols) * ROW_PITCH;
      const isLocked = lvl.id > unlocked;
      const stars = SaveSystem.get().levelStars[lvl.id] ?? 0;

      const circle = this.add
        .circle(x, y, NODE_R, isLocked ? 0x395364 : 0x2fb6e0)
        .setStrokeStyle(5, 0xffffff, 0.9);
      if (!isLocked) circle.setInteractive({ useHandCursor: true });

      this.add
        .text(x, y - 10, isLocked ? "🔒" : `${lvl.id}`, {
          fontFamily: "Bangers",
          fontSize: "58px",
          color: "#ffffff", stroke: "#00151d", strokeThickness: 8 })
        .setOrigin(0.5);

      if (!isLocked) {
        this.add
          .text(x, y + 44, "★".repeat(stars) + "☆".repeat(3 - stars), {
            fontFamily: "Arial",
            fontSize: "26px",
            color: "#ffe27a", stroke: "#00151d", strokeThickness: 4 })
          .setOrigin(0.5);
      }

      this.add
        .text(x, y + 108, lvl.name, {
          fontFamily: "Arial",
          fontSize: "24px",
          color: isLocked ? "#9fb4c2" : "#ffffff",
          align: "center",
          stroke: "#00151d",
          strokeThickness: 4,
          // Polskie nazwy poziomow bywaja dluzsze niz odstep siatki, wiec je
          // lamiemy zamiast pozwolic sasiednim podpisom na siebie wejsc.
          wordWrap: { width: COL_PITCH - 16 },
        })
        .setOrigin(0.5, 0);

      if (!isLocked) {
        circle.on("pointerover", () => circle.setScale(1.08));
        circle.on("pointerout", () => circle.setScale(1));
        circle.on("pointerdown", () => {
          AudioManager.play("click");
          this.cameras.main.fadeOut(300, 4, 20, 40);
          this.cameras.main.once("camerafadeoutcomplete", () => {
            this.scene.start("Game", { levelId: lvl.id });
          });
        });
      }
    });
  }
}
