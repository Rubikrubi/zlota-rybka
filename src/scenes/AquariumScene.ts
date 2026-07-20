/**
 * AquariumScene.ts
 * ---------------------------------------------------------------------------
 * The decorating meta-game. Player spends coins earned from match-3 levels
 * to buy decorations and fish, then freely drags them around a custom tank
 * viewport. Fish that aren't being dragged swim autonomously and react with
 * a little "happy wiggle" when clicked. State persists via SaveSystem.
 */
import Phaser from "phaser";
import { DECOR_SHOP, FISH_SHOP, ShopItem } from "../config/Levels";
import { PlacedItem, SaveSystem } from "../systems/SaveSystem";
import { AudioManager } from "../systems/AudioManager";
import { makeButton } from "../ui/Button";

// Tank viewport rectangle in screen space (normalized coords map inside this box).
const TANK = { x: 260, y: 190, w: 1400, h: 760 };

interface LiveFish {
  img: Phaser.GameObjects.Image;
  speed: number;
  dir: number; // +1 / -1 horizontal direction
  baseY: number;
  bobPhase: number;
  placed: PlacedItem;
}

export class AquariumScene extends Phaser.Scene {
  private placed: PlacedItem[] = [];
  private liveFish: LiveFish[] = [];
  private shopOpen = false;
  private shopContainer: Phaser.GameObjects.Container | null = null;
  private draggingImg: Phaser.GameObjects.Image | null = null;
  private coinText!: Phaser.GameObjects.Text;

  constructor() {
    super("Aquarium");
  }

  create() {
    const { width, height } = this.cameras.main;
    const bg = this.add.image(width / 2, height / 2, "bg_aquarium");
    bg.setDisplaySize(width, height);

    // Tank frame outline for visual clarity
    this.add.rectangle(TANK.x + TANK.w / 2, TANK.y + TANK.h / 2, TANK.w, TANK.h, 0xffffff, 0.03).setStrokeStyle(6, 0x38e8ff, 0.7);

    this.add
      .text(width / 2, 60, "MOJE AKWARIUM", {
        fontFamily: "Bangers",
        fontSize: "52px",
        color: "#ffffff",
        stroke: "#023d52",
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    this.coinText = this.add
      .text(width - 40, 40, `🪙 ${SaveSystem.get().coins}`, { fontFamily: "Bangers", fontSize: "34px", color: "#ffe27a" })
      .setOrigin(1, 0);

    makeButton(this, 150, 60, 220, 70, "◀ WSTECZ", "#ff9f5a", () => {
      AudioManager.play("click");
      this.persistPlacements();
      this.scene.start("LevelSelect");
    }, 26);

    makeButton(this, width / 2, height - 60, 300, 78, "SKLEP", "#59c86b", () => {
      AudioManager.play("click");
      this.toggleShop();
    });

    this.placed = structuredClone(SaveSystem.get().placedItems);
    this.spawnAllPlacedItems();

    this.input.on("pointermove", this.onDragMove, this);
    this.input.on("pointerup", this.onDragEnd, this);

    // Save on scene shutdown too (covers window close / navigation away).
    this.events.on("shutdown", () => this.persistPlacements());
  }

  // --- Placement / spawning ------------------------------------------------

  private spawnAllPlacedItems() {
    for (const item of this.placed) {
      this.spawnItem(item);
    }
  }

  private spawnItem(item: PlacedItem) {
    const x = TANK.x + item.x * TANK.w;
    const y = TANK.y + item.y * TANK.h;
    const img = this.add.image(x, y, item.texture).setScale(item.scale);
    img.setInteractive({ useHandCursor: true, draggable: true });
    this.input.setDraggable(img);
    img.setData("placedRef", item);

    if (item.category === "fish") {
      img.setFlipX(Math.random() < 0.5);
      this.liveFish.push({
        img,
        speed: Phaser.Math.FloatBetween(18, 42),
        dir: img.flipX ? -1 : 1,
        baseY: y,
        bobPhase: Math.random() * Math.PI * 2,
        placed: item,
      });
      img.on("pointerdown", () => this.wiggleFish(img));
    }

    img.on("dragstart", () => {
      this.draggingImg = img;
      img.setScale(item.scale * 1.15);
    });
    img.on("drag", (_p: Phaser.Input.Pointer, dragX: number, dragY: number) => {
      const clampedX = Phaser.Math.Clamp(dragX, TANK.x + 30, TANK.x + TANK.w - 30);
      const clampedY = Phaser.Math.Clamp(dragY, TANK.y + 30, TANK.y + TANK.h - 30);
      img.setPosition(clampedX, clampedY);
      const fish = this.liveFish.find((f) => f.img === img);
      if (fish) fish.baseY = clampedY;
    });
    img.on("dragend", () => {
      img.setScale(item.scale);
      item.x = (img.x - TANK.x) / TANK.w;
      item.y = (img.y - TANK.y) / TANK.h;
      this.draggingImg = null;
      this.persistPlacements();
    });
  }

  private wiggleFish(img: Phaser.GameObjects.Image) {
    AudioManager.play("coin");
    this.tweens.add({
      targets: img,
      angle: { from: -12, to: 12 },
      duration: 90,
      yoyo: true,
      repeat: 3,
      onComplete: () => img.setAngle(0),
    });
    // little heart burst
    const heart = this.add
      .text(img.x, img.y - 40, "♥", { fontFamily: "Arial", fontSize: "28px", color: "#ff7f9f" })
      .setOrigin(0.5);
    this.tweens.add({ targets: heart, y: heart.y - 40, alpha: 0, duration: 600, onComplete: () => heart.destroy() });
  }

  private onDragMove() {
    /* handled per-object via 'drag' event above; kept for future global effects */
  }

  private onDragEnd() {
    /* handled per-object via 'dragend' event above */
  }

  private persistPlacements() {
    SaveSystem.savePlacedItems(this.placed);
  }

  // --- Shop ------------------------------------------------------------------

  private toggleShop() {
    this.shopOpen = !this.shopOpen;
    if (this.shopContainer) {
      this.shopContainer.destroy();
      this.shopContainer = null;
    }
    if (this.shopOpen) this.buildShop();
  }

  private buildShop() {
    const { width, height } = this.cameras.main;
    const container = this.add.container(0, 0);
    this.shopContainer = container;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x001824, 0.8).setInteractive();
    const panel = this.add.rectangle(width / 2, height / 2, 1400, 820, 0x0c3f56).setStrokeStyle(5, 0x38e8ff);
    container.add([overlay, panel]);

    container.add(
      this.add
        .text(width / 2, height / 2 - 380, "SKLEP Z DEKORACJAMI", { fontFamily: "Bangers", fontSize: "42px", color: "#ffffff" })
        .setOrigin(0.5)
    );

    const allItems: ShopItem[] = [...DECOR_SHOP, ...FISH_SHOP];
    const cols = 6;
    const cellW = 210;
    const cellH = 230;
    const startX = width / 2 - ((cols - 1) * cellW) / 2;
    const startY = height / 2 - 260;

    allItems.forEach((item, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const x = startX + col * cellW;
      const y = startY + row * cellH;

      const owned =
        item.category === "decor" ? SaveSystem.get().ownedDecor.includes(item.key) : SaveSystem.get().ownedFish.includes(item.key);

      const card = this.add.rectangle(x, y, 180, 200, 0x0a2e40).setStrokeStyle(3, owned ? 0x59c86b : 0x38e8ff, 0.8);
      const icon = this.add.image(x, y - 35, item.texture).setScale((item.scale ?? 0.5) * 0.9);
      const name = this.add.text(x, y + 40, item.name, { fontFamily: "Arial", fontSize: "15px", color: "#eafcff" }).setOrigin(0.5);

      container.add([card, icon, name]);

      if (owned) {
        const placeLabel = this.add
          .text(x, y + 70, "POSTAW", { fontFamily: "Bangers", fontSize: "20px", color: "#59c86b" })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true });
        placeLabel.on("pointerdown", () => {
          AudioManager.play("click");
          this.placeNewItem(item);
        });
        container.add(placeLabel);
      } else {
        const buyLabel = this.add
          .text(x, y + 70, `🪙 ${item.cost}`, { fontFamily: "Bangers", fontSize: "20px", color: "#ffe27a" })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true });
        buyLabel.on("pointerdown", () => {
          if (SaveSystem.spendCoins(item.cost)) {
            AudioManager.play("coin");
            if (item.category === "decor") SaveSystem.purchaseDecor(item.key);
            else SaveSystem.purchaseFish(item.key);
            this.coinText.setText(`🪙 ${SaveSystem.get().coins}`);
            this.placeNewItem(item);
            this.toggleShop();
            this.toggleShop(); // rebuild to reflect owned state
          } else {
            this.flashInsufficientFunds(x, y);
          }
        });
        container.add(buyLabel);
      }
    });

    const closeBtn = makeButton(this, width / 2, height / 2 + 370, 260, 66, "ZAMKNIJ", "#ff5a5a", () => this.toggleShop());
    container.add(closeBtn);
  }

  private flashInsufficientFunds(x: number, y: number) {
    const txt = this.add.text(x, y + 100, "Za mało monet!", { fontFamily: "Arial", fontSize: "14px", color: "#ff8080" }).setOrigin(0.5);
    this.shopContainer?.add(txt);
    this.tweens.add({ targets: txt, alpha: 0, duration: 900, delay: 400, onComplete: () => txt.destroy() });
  }

  private placeNewItem(item: ShopItem) {
    const placed: PlacedItem = {
      key: item.key,
      texture: item.texture,
      category: item.category,
      x: Phaser.Math.FloatBetween(0.2, 0.8),
      y: Phaser.Math.FloatBetween(0.3, 0.85),
      scale: item.scale ?? 0.5,
    };
    this.placed.push(placed);
    this.spawnItem(placed);
    this.persistPlacements();
  }

  // --- Update loop: idle fish swimming ---------------------------------------

  update(_time: number, delta: number) {
    const dt = delta / 1000;
    for (const fish of this.liveFish) {
      if (this.draggingImg === fish.img) continue;
      fish.img.x += fish.dir * fish.speed * dt;
      fish.bobPhase += dt * 2;
      fish.img.y = fish.baseY + Math.sin(fish.bobPhase) * 6;

      const leftBound = TANK.x + 40;
      const rightBound = TANK.x + TANK.w - 40;
      if (fish.img.x <= leftBound || fish.img.x >= rightBound) {
        fish.dir *= -1;
        fish.img.setFlipX(fish.dir < 0);
      }
      // Keep the underlying save data roughly in sync as fish roam.
      fish.placed.x = (fish.img.x - TANK.x) / TANK.w;
      fish.placed.y = (fish.img.y - TANK.y) / TANK.h;
    }
  }
}
