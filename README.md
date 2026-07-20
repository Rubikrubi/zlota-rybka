# 🐠 Złota Rybka — podwodna gra match-3

Przytulna gra logiczna w przeglądarce. Układaj trójki morskich symboli na planszy 7×7, zdobywaj bonusy, przechodź **50 poziomów** kampanii — a za zarobione monety **urządzaj własne akwarium**: kupuj dekoracje i rybki, i rozstawiaj je po swojemu.

## ▶️ Zagraj teraz (bez instalacji)

**👉 [rubikrubi.github.io/zlota-rybka](https://rubikrubi.github.io/zlota-rybka/)**

Wystarczy kliknąć w link i grać w przeglądarce — na komputerze i na telefonie.

## 🎮 Sterowanie

Tylko **klikanie / dotyk** — nie trzeba klawiatury.

| Akcja | Jak |
|---|---|
| Zaznacz kafelek | kliknij / dotknij |
| Zamień miejscami | kliknij sąsiedni kafelek (w pionie lub poziomie) |
| Odznacz | kliknij ten sam kafelek jeszcze raz |
| Odpal bonus | przesuń bonusowy kafelek na sąsiednie pole |

Zamiana, która nie tworzy trójki, jest odrzucana — kafelki wracają na miejsce i ruch się nie liczy.

## 💎 Bonusy

| Co ułożysz | Bonus | Efekt |
|---|---|---|
| 4 w linii | 💣 **Bomba** | wybija obszar 3×3 |
| kształt **L** lub **T** | 🌊 **Fala** | czyści cały rząd i całą kolumnę |
| 5 lub więcej w linii | ✨ **Magiczna Perła** | usuwa z planszy wszystkie symbole jednego rodzaju |

Bonusy **wybuchają łańcuchowo** — jeśli wybuch jednego obejmie drugi, ten też idzie w górę.

## 🎯 Cel gry

- Każdy z **50 poziomów** ma **próg punktowy** i **limit ruchów** — zrób wynik zanim skończą się ruchy.
- Za wygraną dostajesz **monety 🪙** i **gwiazdki ⭐** (1–3, zależnie od tego jak bardzo przebijesz próg).
- Monety wydajesz w **akwarium** na dekoracje (roślina, kamień, koralowiec, lampa nurka, skrzynia, zamek) i **rybki** (Modropłetwa, Rybka Koralowa, Neonek, Złota Płetwa).
- Rybki same pływają, a po kliknięciu reagują 💕. Wszystko rozstawiasz przeciąganiem.
- Postęp, monety i wystrój akwarium zapisują się **automatycznie w przeglądarce**.

## 💻 Jak pobrać i uruchomić na swoim PC

### Sposób 1 — najprościej (gotowa wersja)

Gra działa online pod linkiem powyżej — nic nie musisz instalować. Jeśli mimo to chcesz mieć ją lokalnie:

1. Pobierz repozytorium: zielony przycisk **Code → Download ZIP** na GitHubie i rozpakuj.
2. Zainstaluj [Node.js](https://nodejs.org/) (wersja 18 lub nowsza).
3. W folderze gry otwórz terminal i uruchom:

```bash
npm install
npm run dev
```

4. Otwórz w przeglądarce adres, który wypisze terminal (zwykle `http://localhost:5173`).

### Sposób 2 — dla programistów (klon + build)

```bash
git clone https://github.com/Rubikrubi/zlota-rybka.git
cd zlota-rybka
npm install
npm run dev      # tryb deweloperski z podglądem na żywo
npm run build    # produkcyjny build do folderu dist/
npm run preview  # podgląd zbudowanej wersji
```

> ℹ️ Gra to aplikacja przeglądarkowa (moduły ES + wczytywanie plików). **Nie da się jej uruchomić przez zwykłe dwukliknięcie `index.html`** — potrzebny jest lokalny serwer HTTP, który uruchamiają powyższe komendy (`npm run dev` / `npm run preview`).

## 🗂️ Struktura projektu

```
src/
├── scenes/          ekrany gry (Phaser Scene)
│   ├── BootScene.ts         wczytywanie grafik, dźwięków i fontów
│   ├── MainMenuScene.ts     menu główne
│   ├── LevelSelectScene.ts  wybór poziomu
│   ├── GameScene.ts         plansza match-3 7×7 (render + sterowanie)
│   ├── AquariumScene.ts     akwarium: sklep i rozstawianie
│   ├── VictoryScene.ts / DefeatScene.ts / OptionsScene.ts
├── systems/
│   ├── Board.ts             logika planszy — czysty TypeScript, bez Phasera
│   ├── SaveSystem.ts        zapis stanu w localStorage
│   └── AudioManager.ts      dźwięki (Howler) + ambient
└── config/
    ├── GemTypes.ts          rodzaje symboli i bonusów
    └── Levels.ts            progi, limity ruchów, nagrody, katalog sklepu
```

`Board.ts` nie wie nic o silniku graficznym — trzyma wyłącznie stan gry, a `GameScene.ts` osobno rysuje. Dzięki temu logikę da się testować bez przeglądarki.

## 🛠️ Technologie

- [Phaser 3](https://phaser.io/) — silnik gier 2D
- [TypeScript](https://www.typescriptlang.org/) + [Vite](https://vite.dev/) — build i dev server
- [Howler.js](https://howlerjs.com/) — dźwięk
- Hosting: **GitHub Pages** (gotowy build publikowany z gałęzi `gh-pages`)

## 🔄 Aktualizacja wersji online

Po zmianach w kodzie zbuduj grę i opublikuj build na gałąź `gh-pages`:

```bash
npm run build            # tworzy folder dist/
npx gh-pages -d dist     # publikuje dist/ na gałąź gh-pages
```

Po chwili nowa wersja pojawi się pod adresem gry. (Gałąź `main` = kod źródłowy, `gh-pages` = zbudowana gra publikowana przez GitHub Pages.)

## Część kodu, dokumentacja projektu były przygotowywane z pomocą modelu AI Claude Code
Ostateczne sprawdzenie, testy na urządzeniu oraz publikację wykonał autor repozytorium.

## 👤 Autor

**Rubikrubi** — [github.com/Rubikrubi](https://github.com/Rubikrubi)

## 📄 Licencja

Projekt do użytku osobistego i edukacyjnego. Grafiki i nazwy przygotowane na potrzeby tego projektu; efekty dźwiękowe z zestawu [Kenney](https://kenney.nl/) (domena publiczna, CC0).
