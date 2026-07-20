/**
 * OptionsScene.ts
 * ---------------------------------------------------------------------------
 * Modal overlay launched on top of the Main Menu. Lets the player toggle
 * music/SFX and reset all saved progress.
 */
import Phaser from "phaser";
import { AudioManager } from "../systems/AudioManager";
import { SaveSystem } from "../systems/SaveSystem";
import { makeButton } from "../ui/Button";

export class OptionsScene extends Phaser.Scene {
  constructor() {
    super("Options");
  }

  create() {
    const { width, height } = this.cameras.main;
    this.add.rectangle(width / 2, height / 2, width, height, 0x001824, 0.75);

    const panel = this.add.rectangle(width / 2, height / 2, 640, 480, 0x0c3f56).setStrokeStyle(5, 0x38e8ff);

    this.add
      .text(width / 2, height / 2 - 200, "OPCJE", {
        fontFamily: "Bangers",
        fontSize: "46px",
        color: "#ffffff",
      })
      .setOrigin(0.5);

    const save = SaveSystem.get();

    const musicLabel = this.add
      .text(width / 2 - 220, height / 2 - 90, `Muzyka: ${save.musicOn ? "WŁ." : "WYŁ."}`, {
        fontFamily: "Arial",
        fontSize: "26px",
        color: "#eafcff",
      })
      .setOrigin(0, 0.5);

    makeButton(this, width / 2 + 190, height / 2 - 90, 180, 60, save.musicOn ? "WŁ." : "WYŁ.", "#3fd0ff", () => {
      const newState = !SaveSystem.get().musicOn;
      AudioManager.setMusicEnabled(newState);
      musicLabel.setText(`Muzyka: ${newState ? "WŁ." : "WYŁ."}`);
      this.scene.restart();
    }, 26);

    const sfxLabel = this.add
      .text(width / 2 - 220, height / 2 - 10, `Efekty dźwiękowe: ${save.sfxOn ? "WŁ." : "WYŁ."}`, {
        fontFamily: "Arial",
        fontSize: "26px",
        color: "#eafcff",
      })
      .setOrigin(0, 0.5);

    makeButton(this, width / 2 + 190, height / 2 - 10, 180, 60, save.sfxOn ? "WŁ." : "WYŁ.", "#3fd0ff", () => {
      const newState = !SaveSystem.get().sfxOn;
      AudioManager.setSfxEnabled(newState);
      sfxLabel.setText(`Efekty dźwiękowe: ${newState ? "WŁ." : "WYŁ."}`);
      this.scene.restart();
    }, 26);

    makeButton(this, width / 2, height / 2 + 90, 340, 66, "RESETUJ POSTĘP", "#ff5a5a", () => {
      SaveSystem.resetAll();
      this.scene.restart();
    }, 24);

    makeButton(this, width / 2, height / 2 + 180, 260, 66, "ZAMKNIJ", "#59c86b", () => {
      this.scene.stop();
      this.scene.resume("MainMenu");
    });
  }
}
