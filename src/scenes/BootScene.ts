/**
 * BootScene.ts
 * ---------------------------------------------------------------------------
 * Loads every texture/audio asset up-front and shows a small loading bar,
 * then hands off to the MainMenuScene. Also kicks off the custom webfont.
 */
import Phaser from "phaser";
import WebFont from "webfontloader";
import { GEM_TEXTURES } from "../config/GemTypes";
import { SPECIAL_TEXTURES } from "../config/GemTypes";
import { DECOR_SHOP, FISH_SHOP } from "../config/Levels";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    const { width, height } = this.cameras.main;

    const barBg = this.add.rectangle(width / 2, height / 2, 420, 28, 0x0b3d54).setStrokeStyle(3, 0x1fd4ff);
    const bar = this.add.rectangle(width / 2 - 205, height / 2, 10, 18, 0x38e8ff).setOrigin(0, 0.5);
    const label = this.add
      .text(width / 2, height / 2 - 40, "Ładowanie Złotej Rybki...", {
        fontFamily: "Arial",
        fontSize: "22px",
        color: "#eaffff",
      })
      .setOrigin(0.5);

    this.load.on("progress", (value: number) => {
      bar.width = 10 + 400 * value;
    });
    this.load.on("complete", () => {
      barBg.destroy();
      bar.destroy();
      label.destroy();
    });

    // Gem + bonus icons
    for (const [type, key] of Object.entries(GEM_TEXTURES)) this.load.image(key, `/sprites/${key}.png`);
    for (const [type, key] of Object.entries(SPECIAL_TEXTURES)) this.load.image(key, `/sprites/${key}.png`);
    this.load.image("particle_sparkle", "sprites/particle_sparkle.png");

    // Fish + decorations
    for (const item of [...DECOR_SHOP, ...FISH_SHOP]) this.load.image(item.texture, `/sprites/${item.texture}.png`);

    // Backgrounds + logo
    this.load.image("bg_menu", "sprites/bg_menu.png");
    this.load.image("bg_game", "sprites/bg_game.png");
    this.load.image("bg_aquarium", "sprites/bg_aquarium.png");
    // Hero goldfish artwork — vector, rasterized by Phaser at the size below.
    this.load.svg("logo_goldfish", "sprites/logo_goldfish.svg", { width: 760, height: 520 });
  }

  create() {
    WebFont.load({
      custom: { families: ["Bangers"], urls: ["fonts/coral-tide-fonts.css"] },
      active: () => this.scene.start("MainMenu"),
      inactive: () => this.scene.start("MainMenu"),
    });
    // Safety net in case the font event never fires.
    this.time.delayedCall(1500, () => {
      if (this.scene.isActive("Boot")) this.scene.start("MainMenu");
    });
  }
}
