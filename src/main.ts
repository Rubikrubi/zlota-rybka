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
  // wygladac po obrocie — plotno pasuje juz przy starcie, zamiast wymuszac
  // przebudowe scen zaraz po pierwszym obrocie (patrz relayout ponizej).
  if (h > w && window.matchMedia("(pointer: coarse)").matches) [w, h] = [h, w];
  const width = Math.round(Math.min(2600, Math.max(1500, height * (w / h))));
  return { width, height };
}

const { width, height } = designSize();

const game = new Phaser.Game({
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

/**
 * Przelicza uklad po zmianie proporcji okna — po wejsciu/wyjsciu z pelnego
 * ekranu, obroceniu telefonu albo zmianie rozmiaru okna na komputerze.
 *
 * Samo `setGameSize` nie wystarcza: sceny licza swoj uklad raz, przy tworzeniu,
 * wiec po zmianie rozmiaru trzeba je zbudowac na nowo. Kazda scena dostaje z
 * powrotem dane, z ktorymi wystartowala, a plansza dodatkowo migawke stanu
 * partii, zeby zmiana rozmiaru nie kasowala trwajacego poziomu.
 */
function relayout() {
  const next = designSize();
  const nextAspect = next.width / next.height;
  if (Math.abs(nextAspect - lastAspect) < 0.02) return;
  lastAspect = nextAspect;
  game.scale.setGameSize(next.width, next.height);

  // Kopia listy: restart() zmienia zbior aktywnych scen w trakcie iteracji.
  for (const scene of [...game.scene.getScenes(true)]) {
    const withSnapshot = scene as Phaser.Scene & { snapshot?: () => object };
    const data = typeof withSnapshot.snapshot === "function" ? withSnapshot.snapshot() : scene.scene.settings.data;
    scene.scene.restart(data);
  }
}

let lastAspect = width / height;
let relayoutTimer = 0;
const scheduleRelayout = () => {
  window.clearTimeout(relayoutTimer);
  // Zmiana rozmiaru sypie zdarzeniami seriami; przebudowujemy dopiero gdy ucichna.
  relayoutTimer = window.setTimeout(relayout, 250);
};
window.addEventListener("resize", scheduleRelayout);
window.addEventListener("orientationchange", scheduleRelayout);
document.addEventListener("fullscreenchange", scheduleRelayout);

// --- Przelacznik pelnego ekranu ---------------------------------------------

const fullscreenBtn = document.getElementById("fullscreen");
const canFullscreen = !!document.documentElement.requestFullscreen;

if (fullscreenBtn) {
  if (!canFullscreen) {
    // iPhone/Safari nie wspiera Fullscreen API — przycisk bylby martwy.
    fullscreenBtn.classList.add("unsupported");
  } else {
    const syncIcon = () => {
      const on = !!document.fullscreenElement;
      fullscreenBtn.textContent = on ? "⤡" : "⛶";
      fullscreenBtn.title = on ? "Wyjdź z pełnego ekranu" : "Pełny ekran";
      fullscreenBtn.setAttribute("aria-label", fullscreenBtn.title);
    };
    fullscreenBtn.addEventListener("click", () => {
      AudioManager.unlock();
      if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
      else void document.documentElement.requestFullscreen().catch(() => {});
    });
    document.addEventListener("fullscreenchange", syncIcon);
    syncIcon();
  }
}
