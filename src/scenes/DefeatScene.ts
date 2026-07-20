/**
 * DefeatScene.ts
 * ---------------------------------------------------------------------------
 * Shown when the player runs out of moves before reaching the score goal.
 * Offers a retry (free) or a return to the level map.
 */
import Phaser from "phaser";
import { LevelConfig } from "../config/Levels";
import { AudioManager } from "../systems/AudioManager";
import { makeButton } from "../ui/Button";

export class DefeatScene extends Phaser.Scene {
  constructor() {
    super("Defeat");
  }

  create(data: { level: LevelConfig; score: number }) {
    const { width, height } = this.cameras.main;
    const bg = this.add.image(width / 2, height / 2, "bg_game");
    bg.setDisplaySize(width, height);
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a0000, 0.55);

    this.add
      .text(width / 2, height * 0.32, "KONIEC RUCHÓW", {
        fontFamily: "Bangers",
        fontSize: "60px",
        color: "#ff8080",
        stroke: "#4a0000",
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.45, `Wynik: ${data.score} / ${data.level.goal}`, {
        fontFamily: "Bangers",
        fontSize: "32px",
        color: "#ffffff", stroke: "#00151d", strokeThickness: 5 })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.52, "Tak blisko! Spróbujesz jeszcze raz?", {
        fontFamily: "Arial",
        fontSize: "22px",
        color: "#eafcff", stroke: "#00151d", strokeThickness: 3 })
      .setOrigin(0.5);

    makeButton(this, width / 2, height * 0.72, 420, 140, "JESZCZE RAZ", "#3fd0ff", () => {
      AudioManager.play("click");
      this.scene.start("Game", { levelId: data.level.id });
    });

    makeButton(this, width / 2, height * 0.885, 420, 140, "MAPA POZIOMÓW", "#ff9f5a", () => {
      AudioManager.play("click");
      this.scene.start("LevelSelect");
    });
  }
}
