/**
 * main.ts
 * ---------------------------------------------------------------------------
 * Entry point: Phaser.Game bootstrap wiring together every scene of
 * Złota Rybka — an original underwater match-3 + aquarium decorating game.
 */
import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { MainMenuScene } from "./scenes/MainMenuScene";
import { OptionsScene } from "./scenes/OptionsScene";
import { LevelSelectScene } from "./scenes/LevelSelectScene";
import { GameScene } from "./scenes/GameScene";
import { VictoryScene } from "./scenes/VictoryScene";
import { DefeatScene } from "./scenes/DefeatScene";
import { AquariumScene } from "./scenes/AquariumScene";
import { AudioManager } from "./systems/AudioManager";

// Load every sound effect before the first scene can ask to play one.
AudioManager.init();

// Safety net: browsers keep the audio context suspended until a real user
// gesture, so unlock on the first interaction anywhere on the page — even if
// it lands outside the Phaser canvas.
for (const evt of ["pointerdown", "keydown", "touchstart"] as const) {
  window.addEventListener(evt, () => AudioManager.unlock(), { once: true });
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#04374d",
  width: 1920,
  height: 1080,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MainMenuScene, OptionsScene, LevelSelectScene, GameScene, VictoryScene, DefeatScene, AquariumScene],
});
