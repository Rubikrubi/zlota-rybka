/**
 * Button.ts
 * ---------------------------------------------------------------------------
 * Large, friendly, mobile-style rounded button used across every scene.
 * Returns a Container so callers can reposition/destroy it as one unit.
 */
import Phaser from "phaser";

export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  color: string,
  onClick: () => void,
  fontSize = 34
): Phaser.GameObjects.Container {
  const container = scene.add.container(x, y);

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
