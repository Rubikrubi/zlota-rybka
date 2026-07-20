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

// Prostokat akwarium w przestrzeni ekranu (pozycje przedmiotow sa zapisywane
// jako 0..1 wewnatrz niego). Liczony z rozmiaru plotna, bo szerokosc zalezy od
// proporcji ekranu — na sztywno wpisane 1400 px zostawialo akwarium przesuniete
// w lewo na szerokim ekranie telefonu.
const TANK = { x: 260, y: 190, w: 1400, h: 760 };

function computeTank(width: number, height: number) {
  const w = Math.min(1900, width - 260);
  const h = height - 190 - 200; // gora: tytul i licznik monet, dol: przycisk sklepu
  TANK.w = w;
  TANK.h = h;
  TANK.x = Math.round(width / 2 - w / 2);
  TANK.y = 190;
}

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
  private shopPage = 0;
  private shopContainer: Phaser.GameObjects.Container | null = null;
  private draggingImg: Phaser.GameObjects.Image | null = null;
  private coinText!: Phaser.GameObjects.Text;

  constructor() {
    super("Aquarium");
  }

  create() {
    const { width, height } = this.cameras.main;
    computeTank(width, height);

    const bg = this.add.image(width / 2, height / 2, "bg_aquarium");
    bg.setDisplaySize(width, height);

    // Tank frame outline for visual clarity
    this.add.rectangle(TANK.x + TANK.w / 2, TANK.y + TANK.h / 2, TANK.w, TANK.h, 0xffffff, 0.03).setStrokeStyle(6, 0x38e8ff, 0.7);

    this.add
      .text(width / 2, 55, "MOJE AKWARIUM", {
        fontFamily: "Bangers",
        fontSize: "52px",
        color: "#ffffff",
        stroke: "#023d52",
        strokeThickness: 8,
      })
      .setOrigin(0.5);

    // Licznik monet na srodku u gory: w rogu bywal ucinany przez zaokraglone
    // rogi ekranu telefonu, a zloty napis na jasnym tle akwarium byl slabo
    // czytelny. Ciemna plakietka daje kontrast niezalezny od tla.
    this.buildCoinBadge(width);

    makeButton(this, 175, 85, 300, 130, "◀ WSTECZ", "#ff9f5a", () => {
      AudioManager.play("click");
      this.persistPlacements();
      this.scene.start("LevelSelect");
    }, 26);

    makeButton(this, width / 2, height - 85, 380, 130, "SKLEP", "#59c86b", () => {
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

  /** Plakietka z liczba monet: ciemne tlo, zloty obrys, duzy napis z czarna
   *  obwodka — czytelna zarowno na jasnym piasku, jak i na ciemnej wodzie. */
  private buildCoinBadge(width: number) {
    const y = 130;
    const badge = this.add.rectangle(width / 2, y, 360, 84, 0x03202c, 0.92).setStrokeStyle(4, 0xffc93c, 0.95);
    badge.setDepth(20);

    this.add
      .text(width / 2 - 128, y, "🪙", { fontSize: "52px" })
      .setOrigin(0.5)
      .setDepth(21);

    this.coinText = this.add
      .text(width / 2 + 26, y, `${SaveSystem.get().coins}`, {
        fontFamily: "Bangers",
        fontSize: "52px",
        color: "#ffffff",
        stroke: "#00151d",
        strokeThickness: 7,
      })
      .setOrigin(0.5)
      .setDepth(21);
  }

  private refreshCoins() {
    this.coinText.setText(`${SaveSystem.get().coins}`);
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
    if (item.tint !== undefined) img.setTint(item.tint);
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
      .text(img.x, img.y - 40, "♥", { fontFamily: "Arial", fontSize: "28px", color: "#ff7f9f", stroke: "#00151d", strokeThickness: 4 })
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

  /** Przerysowuje sklep zachowujac otwarta strone — po zakupie trzeba odswiezyc
   *  karty, ale przerzucenie gracza na pierwsza strone byloby irytujace. */
  private rebuildShop() {
    if (this.shopContainer) {
      this.shopContainer.destroy();
      this.shopContainer = null;
    }
    this.buildShop();
  }

  private buildShop() {
    const { width, height } = this.cameras.main;
    const container = this.add.container(0, 0);
    this.shopContainer = container;

    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x001824, 0.85).setInteractive();
    const panel = this.add.rectangle(width / 2, height / 2, 1400, 900, 0x0c3f56).setStrokeStyle(5, 0x38e8ff);
    container.add([overlay, panel]);

    const allItems: ShopItem[] = [...DECOR_SHOP, ...FISH_SHOP];
    const cols = 6;
    const rows = 2;
    const perPage = cols * rows;
    const pages = Math.ceil(allItems.length / perPage);
    this.shopPage = Phaser.Math.Clamp(this.shopPage, 0, pages - 1);

    container.add(
      this.add
        .text(width / 2, height / 2 - 400, `SKLEP  —  strona ${this.shopPage + 1} / ${pages}`, {
          fontFamily: "Bangers",
          fontSize: "44px",
          color: "#ffffff",
          stroke: "#00151d",
          strokeThickness: 6,
        })
        .setOrigin(0.5)
    );

    const cellW = 210;
    const cellH = 260; // wyzsze karty: nazwa przedmiotu musi byc czytelna na telefonie
    const startX = width / 2 - ((cols - 1) * cellW) / 2;
    const startY = height / 2 - 200;
    const shown = allItems.slice(this.shopPage * perPage, (this.shopPage + 1) * perPage);

    shown.forEach((item, i) => {
      const x = startX + (i % cols) * cellW;
      const y = startY + Math.floor(i / cols) * cellH;

      const owned =
        item.category === "decor" ? SaveSystem.get().ownedDecor.includes(item.key) : SaveSystem.get().ownedFish.includes(item.key);

      const card = this.add.rectangle(x, y, 188, 240, 0x0a2e40).setStrokeStyle(3, owned ? 0x59c86b : 0x38e8ff, 0.8);
      const icon = this.add.image(x, y - 66, item.texture).setScale((item.scale ?? 0.5) * 0.8);
      if (item.tint !== undefined) icon.setTint(item.tint);
      const name = this.add
        .text(x, y - 6, item.name, {
          fontFamily: "Arial",
          fontSize: "24px",
          color: "#ffffff",
          align: "center",
          stroke: "#00151d",
          strokeThickness: 4,
          wordWrap: { width: 176 },
        })
        .setOrigin(0.5, 0);

      container.add([card, icon, name]);

      if (owned) {
        const placeLabel = this.add
          .text(x, y + 88, "POSTAW", { fontFamily: "Bangers", fontSize: "30px", color: "#7dffb0", stroke: "#00151d", strokeThickness: 5 })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true });
        placeLabel.on("pointerdown", () => {
          AudioManager.play("click");
          this.placeNewItem(item);
        });
        container.add(placeLabel);
      } else {
        const buyLabel = this.add
          .text(x, y + 88, `🪙 ${item.cost}`, { fontFamily: "Bangers", fontSize: "30px", color: "#ffd54a", stroke: "#00151d", strokeThickness: 5 })
          .setOrigin(0.5)
          .setInteractive({ useHandCursor: true });
        buyLabel.on("pointerdown", () => {
          if (SaveSystem.spendCoins(item.cost)) {
            AudioManager.play("coin");
            if (item.category === "decor") SaveSystem.purchaseDecor(item.key);
            else SaveSystem.purchaseFish(item.key);
            this.refreshCoins();
            this.placeNewItem(item);
            this.rebuildShop();
          } else {
            this.flashInsufficientFunds(x, y);
          }
        });
        container.add(buyLabel);
      }
    });

    // Dolny pasek: strzalki stron po bokach przycisku zamkniecia.
    const navY = height / 2 + 350;
    if (this.shopPage > 0) {
      container.add(
        makeButton(this, width / 2 - 340, navY, 260, 140, "◀", "#3fd0ff", () => {
          this.shopPage--;
          this.rebuildShop();
        }, 46)
      );
    }
    container.add(makeButton(this, width / 2, navY, 300, 140, "ZAMKNIJ", "#ff5a5a", () => this.toggleShop()));
    if (this.shopPage < pages - 1) {
      container.add(
        makeButton(this, width / 2 + 340, navY, 260, 140, "▶", "#3fd0ff", () => {
          this.shopPage++;
          this.rebuildShop();
        }, 46)
      );
    }
  }

  private flashInsufficientFunds(x: number, y: number) {
    const txt = this.add.text(x, y + 140, "Za mało monet!", { fontFamily: "Bangers", fontSize: "30px", color: "#ff9b9b", stroke: "#00151d", strokeThickness: 5 }).setOrigin(0.5);
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
      tint: item.tint,
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
