/**
 * VictoryScene.ts
 * ---------------------------------------------------------------------------
 * Shown when the player reaches the score goal before running out of moves.
 * Displays stars earned, coins rewarded, and options to continue or replay.
 */
import Phaser from "phaser";
import { Tween, Group, Easing } from "@tweenjs/tween.js";
import { LevelConfig, LEVELS } from "../config/Levels";
import { AudioManager } from "../systems/AudioManager";
import { SaveSystem } from "../systems/SaveSystem";
import { makeButton } from "../ui/Button";

export class VictoryScene extends Phaser.Scene {
  private tweenGroup = new Group();

  constructor() {
    super("Victory");
  }

  create(data: { level: LevelConfig; score: number; stars: number }) {
    const { width, height } = this.cameras.main;
    const bg = this.add.image(width / 2, height / 2, "bg_menu");
    bg.setDisplaySize(width, height);
    this.add.rectangle(width / 2, height / 2, width, height, 0x012535, 0.55);

    this.add
      .text(width / 2, height * 0.22, "POZIOM UKOŃCZONY!", {
        fontFamily: "Bangers",
        fontSize: "64px",
        color: "#ffe27a",
        stroke: "#7a4a00",
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    // Stars
    for (let i = 0; i < 3; i++) {
      const filled = i < data.stars;
      const star = this.add
        .text(width / 2 + (i - 1) * 90, height * 0.36, filled ? "★" : "☆", {
          fontFamily: "Arial",
          fontSize: "72px",
          color: filled ? "#ffe27a" : "#4a5f6b",
        })
        .setOrigin(0.5)
        .setScale(0);
      new Tween(star, this.tweenGroup)
        .to({}, 1)
        .delay(i * 200)
        .onStart(() => {
          this.tweens.add({ targets: star, scale: 1, duration: 300, ease: "Back.Out" });
        })
        .start();
    }

    this.add
      .text(width / 2, height * 0.5, `Wynik: ${data.score}`, {
        fontFamily: "Bangers",
        fontSize: "36px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    this.add
      .text(width / 2, height * 0.58, `Zdobyto +${data.level.reward} monet!`, {
        fontFamily: "Bangers",
        fontSize: "30px",
        color: "#7fffbf",
      })
      .setOrigin(0.5);

    const hasNext = LEVELS.some((l) => l.id === data.level.id + 1);

    if (hasNext) {
      makeButton(this, width / 2, height * 0.72, 440, 80, "NASTĘPNY POZIOM", "#3fd0ff", () => {
        AudioManager.play("click");
        this.scene.start("Game", { levelId: data.level.id + 1 });
      });
    }

    makeButton(this, width / 2, height * (hasNext ? 0.84 : 0.72), 340, 74, "AKWARIUM", "#59c86b", () => {
      AudioManager.play("click");
      this.scene.start("Aquarium");
    });

    makeButton(this, width / 2, height * (hasNext ? 0.94 : 0.86), 340, 66, "MAPA POZIOMÓW", "#ff9f5a", () => {
      AudioManager.play("click");
      this.scene.start("LevelSelect");
    }, 26);
  }

  update() {
    this.tweenGroup.update();
  }
}
