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

    const panel = this.add.rectangle(width / 2, height / 2, 860, 800, 0x0c3f56).setStrokeStyle(5, 0x38e8ff);

    this.add
      .text(width / 2, height / 2 - 330, "OPCJE", {
        fontFamily: "Bangers",
        fontSize: "58px",
        color: "#ffffff", stroke: "#00151d", strokeThickness: 8 })
      .setOrigin(0.5);

    const save = SaveSystem.get();

    const musicLabel = this.add
      .text(width / 2 - 340, height / 2 - 170, `Muzyka: ${save.musicOn ? "WŁ." : "WYŁ."}`, {
        fontFamily: "Arial",
        fontSize: "34px",
        color: "#eafcff", stroke: "#00151d", strokeThickness: 5 })
      .setOrigin(0, 0.5);

    makeButton(this, width / 2 + 250, height / 2 - 170, 220, 130, save.musicOn ? "WŁ." : "WYŁ.", "#3fd0ff", () => {
      const newState = !SaveSystem.get().musicOn;
      AudioManager.setMusicEnabled(newState);
      musicLabel.setText(`Muzyka: ${newState ? "WŁ." : "WYŁ."}`);
      this.scene.restart();
    }, 40);

    const sfxLabel = this.add
      .text(width / 2 - 340, height / 2 - 10, `Efekty dźwiękowe: ${save.sfxOn ? "WŁ." : "WYŁ."}`, {
        fontFamily: "Arial",
        fontSize: "34px",
        color: "#eafcff", stroke: "#00151d", strokeThickness: 5 })
      .setOrigin(0, 0.5);

    makeButton(this, width / 2 + 250, height / 2 - 10, 220, 130, save.sfxOn ? "WŁ." : "WYŁ.", "#3fd0ff", () => {
      const newState = !SaveSystem.get().sfxOn;
      AudioManager.setSfxEnabled(newState);
      sfxLabel.setText(`Efekty dźwiękowe: ${newState ? "WŁ." : "WYŁ."}`);
      this.scene.restart();
    }, 40);

    makeButton(this, width / 2, height / 2 + 160, 460, 130, "RESETUJ POSTĘP", "#ff5a5a", () => {
      SaveSystem.resetAll();
      this.scene.restart();
    }, 36);

    makeButton(this, width / 2, height / 2 + 320, 340, 130, "ZAMKNIJ", "#59c86b", () => {
      this.scene.stop();
      this.scene.resume("MainMenu");
    });
  }
}
