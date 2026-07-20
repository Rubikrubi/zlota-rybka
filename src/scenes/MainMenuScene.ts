/**
 * MainMenuScene.ts
 * ---------------------------------------------------------------------------
 * The start screen: animated ocean background, original logo, START/OPTIONS
 * buttons, and ambient music kick-off (gated on first user gesture, per
 * Howler's autoplay policy).
 */
import Phaser from "phaser";
import { Tween, Group, Easing } from "@tweenjs/tween.js";
import { AudioManager } from "../systems/AudioManager";
import { SaveSystem } from "../systems/SaveSystem";
import { makeButton } from "../ui/Button";

export class MainMenuScene extends Phaser.Scene {
  private tweenGroup = new Group();
  private bubbles: Phaser.GameObjects.Image[] = [];

  constructor() {
    super("MainMenu");
  }

  create() {
    const { width, height } = this.cameras.main;

    const bg = this.add.image(width / 2, height / 2, "bg_menu");
    bg.setDisplaySize(width, height);

    // Gentle drifting bubble particles rising from the bottom for an animated feel.
    for (let i = 0; i < 14; i++) {
      const b = this.add.image(Phaser.Math.Between(0, width), Phaser.Math.Between(0, height), "gem_bubble");
      b.setScale(Phaser.Math.FloatBetween(0.05, 0.16));
      b.setAlpha(Phaser.Math.FloatBetween(0.3, 0.7));
      this.bubbles.push(b);
    }

    // Hero goldfish with a soft breathing tween plus a gentle swimming bob.
    const fish = this.add.image(width / 2, height * 0.21, "logo_goldfish").setScale(0.7);
    new Tween(fish, this.tweenGroup)
      .to({ scale: 0.76 }, 1600)
      .easing(Easing.Sinusoidal.InOut)
      .yoyo(true)
      .repeat(Infinity)
      .start();
    this.tweens.add({
      targets: fish,
      y: fish.y + 26,
      angle: 3,
      duration: 2600,
      ease: "Sine.easeInOut",
      yoyo: true,
      repeat: -1,
    });

    const title = this.add
      .text(width / 2, height * 0.45, "ZŁOTA RYBKA", {
        fontFamily: "Bangers",
        fontSize: "112px",
        color: "#ffd54a",
        stroke: "#7a3a02",
        strokeThickness: 14,
      })
      .setOrigin(0.5);
    // Warm gold gradient across the title, matching the fish artwork.
    const grad = title.context.createLinearGradient(0, 0, 0, title.height);
    grad.addColorStop(0, "#fff6c2");
    grad.addColorStop(0.5, "#ffc93c");
    grad.addColorStop(1, "#f08a04");
    title.setFill(grad);
    title.setShadow(0, 8, "#00252f", 14, false, true);

    this.add
      .text(width / 2, height * 0.53, "Przytulna podwodna przygoda match-3", {
        fontFamily: "Bangers",
        fontSize: "34px",
        color: "#eafcff",
        stroke: "#023d52",
        strokeThickness: 5,
      })
      .setOrigin(0.5);

    makeButton(this, width / 2, height * 0.6, 340, 84, "GRAJ", "#3fd0ff", () => {
      AudioManager.unlock();
      AudioManager.play("click");
      this.cameras.main.fadeOut(400, 4, 20, 40);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("LevelSelect"));
    });

    makeButton(this, width / 2, height * 0.73, 340, 74, "OPCJE", "#ff9f5a", () => {
      AudioManager.unlock();
      AudioManager.play("click");
      this.scene.launch("Options");
      this.scene.pause();
    });

    // Download full game source code as a .zip (dev/portfolio convenience button).
    makeButton(
      this,
      width / 2,
      height * 0.84,
      340,
      64,
      "⬇ POBIERZ KOD",
      "#7a5cff",
      () => {
        AudioManager.unlock();
        AudioManager.play("click");
        downloadGameSource();
      },
      24
    );

    this.add
      .text(width / 2, height * 0.94, `Monety: ${SaveSystem.get().coins}`, {
        fontFamily: "Bangers",
        fontSize: "26px",
        color: "#ffe27a",
      })
      .setOrigin(0.5);

    // Resume main menu once Options scene is closed.
    this.events.on("resume", () => {
      this.scene.get("MainMenu").scene.restart();
    });

    // First-ever gesture anywhere unlocks audio.
    this.input.once("pointerdown", () => AudioManager.unlock());
  }

  update(_time: number, delta: number) {
    this.tweenGroup.update();
    for (const b of this.bubbles) {
      b.y -= delta * 0.02;
      if (b.y < -20) b.y = this.cameras.main.height + 20;
    }
  }
}

/**
 * Sends the player to the source code on GitHub, which serves the .zip of the
 * current main branch — so the download always matches the published game
 * instead of a stale archive baked into the build.
 */
function downloadGameSource() {
  window.open("https://github.com/Rubikrubi/zlota-rybka/archive/refs/heads/main.zip", "_blank");
}
