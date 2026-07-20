/**
 * Button.ts
 * ---------------------------------------------------------------------------
 * Large, friendly, mobile-style rounded button used across every scene.
 * Returns a Container so callers can reposition/destroy it as one unit.
 */
import Phaser from "phaser";

/** Najmniejszy przycisk, jaki wolno narysowac, w pikselach projektowych.
 *  Plotno o wysokosci 1080 skaluje sie na telefonie do ~360-410 px CSS, czyli
 *  1 px projektowy to ~0.33 px CSS. 140 px projektowych daje ~47 px pod palcem
 *  nawet na najciasniejszym ekranie (360 px CSS wysokosci),
 *  a to prog wygodnego dotyku (44 px Apple / 48 dp Android). Wymuszamy to tutaj,
 *  zeby zaden ekran nie mogl przypadkiem narysowac przycisku ponizej progu. */
const MIN_W = 260;
const MIN_H = 140;

export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  color: string,
  onClick: () => void,
  fontSize = 40
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);
  w = Math.max(w, MIN_W);
  h = Math.max(h, MIN_H);

  const colorInt = Phaser.Display.Color.HexStringToColor(color).color;
  const shadow = scene.add.rectangle(4, 6, w, h, 0x00131a, 0.35).setOrigin(0.5);
  const bg = scene.add.rectangle(0, 0, w, h, colorInt).setOrigin(0.5).setStrokeStyle(4, 0xffffff, 0.9);
  bg.setInteractive({ useHandCursor: true });

  const text = scene.add
    .text(0, 0, label, {
      fontFamily: "Bangers",
      fontSize: `${fontSize}px`,
      color: "#ffffff",
      stroke: "#00303f",
      strokeThickness: 5,
    })
    .setOrigin(0.5);

  container.add([shadow, bg, text]);

  bg.on("pointerover", () => scene.tweens.add({ targets: container, scale: 1.05, duration: 100 }));
  bg.on("pointerout", () => scene.tweens.add({ targets: container, scale: 1, duration: 100 }));
  bg.on("pointerdown", () => scene.tweens.add({ targets: container, scale: 0.94, duration: 60 }));
  bg.on("pointerup", () => {
    scene.tweens.add({ targets: container, scale: 1.05, duration: 80 });
    onClick();
  });

  return container;
}
