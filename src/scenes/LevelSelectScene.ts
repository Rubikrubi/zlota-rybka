/**
 * LevelSelectScene.ts
 * ---------------------------------------------------------------------------
 * Shows the 10-level campaign as a scrollable path of nodes. Locked levels
 * beyond the player's progress are dimmed. Also offers a shortcut to the
 * Aquarium decorating scene.
 */
import Phaser from "phaser";
import { LEVELS } from "../config/Levels";
import { SaveSystem } from "../systems/SaveSystem";
import { AudioManager } from "../systems/AudioManager";
import { makeButton } from "../ui/Button";

export class LevelSelectScene extends Phaser.Scene {
  constructor() {
    super("LevelSelect");
  }

  create() {
    const { width, height } = this.cameras.main;
    const bg = this.add.image(width / 2, height / 2, "bg_game");
    bg.setDisplaySize(width, height);
    this.add.rectangle(width / 2, height / 2, width, height, 0x012535, 0.35);

    this.add
      .text(width / 2, 70, "WYBIERZ NURKOWANIE", {
        fontFamily: "Bangers",
        fontSize: "56px",
        color: "#ffffff",
        stroke: "#023d52",
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    const unlocked = SaveSystem.get().currentLevel;
    const cols = 5;
    const startX = width / 2 - ((cols - 1) * 220) / 2;
    const startY = 230;

    LEVELS.forEach((lvl, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * 220;
      const y = startY + row * 220;
      const isLocked = lvl.id > unlocked;
      const stars = SaveSystem.get().levelStars[lvl.id] ?? 0;

      const circleColor = isLocked ? 0x395364 : 0x2fb6e0;
      const circle = this.add.circle(x, y, 70, circleColor).setStrokeStyle(5, 0xffffff, 0.9);
      if (!isLocked) circle.setInteractive({ useHandCursor: true });

      this.add
        .text(x, y - 8, isLocked ? "🔒" : `${lvl.id}`, {
          fontFamily: "Bangers",
          fontSize: "40px",
          color: "#ffffff",
        })
        .setOrigin(0.5);

      if (!isLocked) {
        const starStr = "★".repeat(stars) + "☆".repeat(3 - stars);
        this.add
          .text(x, y + 34, starStr, { fontFamily: "Arial", fontSize: "18px", color: "#ffe27a" })
          .setOrigin(0.5);
      }

      this.add
        .text(x, y + 92, lvl.name, {
          fontFamily: "Arial",
          fontSize: "15px",
          color: isLocked ? "#7d97a5" : "#eafcff",
          align: "center",
          // Polish level names run longer than the 220px grid pitch, so wrap
          // them instead of letting neighbouring labels collide.
          wordWrap: { width: 200 },
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

    // Bottom nav bar
    makeButton(this, width / 2 - 260, height - 80, 300, 80, "AKWARIUM", "#59c86b", () => {
      AudioManager.play("click");
      this.scene.start("Aquarium");
    });
    makeButton(this, width / 2 + 260, height - 80, 300, 80, "MENU", "#ff9f5a", () => {
      AudioManager.play("click");
      this.scene.start("MainMenu");
    });

    this.add
      .text(width - 40, 40, `🪙 ${SaveSystem.get().coins}`, {
        fontFamily: "Bangers",
        fontSize: "34px",
        color: "#ffe27a",
      })
      .setOrigin(1, 0);
  }
}
