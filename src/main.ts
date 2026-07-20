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

/**
 * Dobiera rozmiar plotna do proporcji ekranu, zeby Scale.FIT wypelnil go w
 * calosci zamiast dokladac czarne pasy. Wysokosc jest stala (sceny licza
 * uklad wzgledem niej), a szerokosc wynika z proporcji urzadzenia:
 *   - telefon poziomo 19.5:9 -> ~2340x1080 (pelny ekran, bez pasow)
 *   - monitor 16:9            -> 1920x1080
 * Szerokosc jest ograniczona z dolu, bo najszerszy panel UI (sklep w akwarium)
 * ma 1400 px i ponizej tego uklad zaczalby wychodzic poza ekran.
 */
function designSize() {
  const height = 1080;
  let w = window.innerWidth;
  let h = window.innerHeight;
  // Gra jest pozioma i prosi uzytkownika o obrocenie telefonu, wiec na
  // pionowym ekranie dotykowym liczymy proporcje od razu tak, jak beda
  // wygladac po obrocie. Dzieki temu plotno pasuje juz przy starcie i nie
  // trzeba go przemierzac (co przesunieloby gotowy uklad sceny).
  if (h > w && window.matchMedia("(pointer: coarse)").matches) [w, h] = [h, w];
  const width = Math.round(Math.min(2600, Math.max(1500, height * (w / h))));
  return { width, height };
}

const { width, height } = designSize();

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  backgroundColor: "#04374d",
  width,
  height,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MainMenuScene, OptionsScene, LevelSelectScene, GameScene, VictoryScene, DefeatScene, AquariumScene],
});

// Android/Chrome chowa pasek adresu dopiero w trybie pelnoekranowym, a ten
// wolno wlaczyc wylacznie z gestu uzytkownika — stad pierwsze dotkniecie.
document.addEventListener(
  "pointerdown",
  () => {
    const isTouch = window.matchMedia("(pointer: coarse)").matches;
    if (isTouch && !document.fullscreenElement) void document.documentElement.requestFullscreen?.().catch(() => {});
  },
  { once: true }
);
