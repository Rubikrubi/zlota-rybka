/**
 * AudioManager.ts
 * ---------------------------------------------------------------------------
 * Thin wrapper around Howler.js that centralizes every sound effect + the
 * looping ambient music track. Playback is gated behind the first user
 * gesture (handled by whichever scene calls `AudioManager.unlock()`).
 *
 * The music track is synthesized at runtime (see `synthMusic`) so the game
 * never depends on an external music license.
 */
import { Howl, Howler } from "howler";
import { SaveSystem } from "./SaveSystem";

export type SfxKey = "click" | "swap" | "match" | "bonus" | "reward" | "coin";

const SFX_SOURCES: Record<SfxKey, { src: string; volume: number }> = {
  click: { src: "audio/click.wav", volume: 0.6 },
  swap: { src: "audio/swap.ogg", volume: 0.5 },
  match: { src: "audio/match.ogg", volume: 0.6 },
  bonus: { src: "audio/bonus.wav", volume: 0.7 },
  reward: { src: "audio/reward.wav", volume: 0.7 },
  coin: { src: "audio/coin.wav", volume: 0.5 },
};

class AudioManagerClass {
  private music: Howl | null = null;
  private sfx: Partial<Record<SfxKey, Howl>> = {};
  private unlocked = false;
  private initialized = false;

  /**
   * Loads every sound effect. Must be called once at startup (main.ts) —
   * before this runs, `play()` has nothing to play.
   */
  init() {
    if (this.initialized) return;
    this.initialized = true;

    for (const [key, { src, volume }] of Object.entries(SFX_SOURCES)) {
      this.sfx[key as SfxKey] = new Howl({ src: [src], volume, preload: true });
    }
    // Music is synthesized lazily on first unlock so the ~350k-sample render
    // never blocks the initial page load.
  }

  /**
   * Called from the first user gesture in any scene. Browsers keep the
   * WebAudio context suspended until then, so resuming it here is what
   * actually makes sound audible.
   */
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;

    Howler.autoUnlock = true;
    // Howler creates its AudioContext eagerly; if the page loaded without a
    // gesture it is stuck in "suspended" and every play() is silently dropped.
    const ctx = Howler.ctx;
    if (ctx && ctx.state !== "running") void ctx.resume();

    if (SaveSystem.get().musicOn) this.playMusic();
  }

  playMusic() {
    if (!this.unlocked) return; // will start from unlock() once the user interacts
    if (!SaveSystem.get().musicOn) return;
    if (!this.music) this.music = this.synthMusic();
    if (!this.music.playing()) this.music.play();
  }

  stopMusic() {
    this.music?.stop();
  }

  setMusicEnabled(on: boolean) {
    SaveSystem.setMusicOn(on);
    if (on) this.playMusic();
    else this.stopMusic();
  }

  setSfxEnabled(on: boolean) {
    SaveSystem.setSfxOn(on);
  }

  play(key: SfxKey) {
    if (!SaveSystem.get().sfxOn) return;
    const sound = this.sfx[key];
    if (!sound) return;
    // A tap can arrive before any scene called unlock() (e.g. keyboard input),
    // so make sure the context is awake before asking Howler to play.
    const ctx = Howler.ctx;
    if (ctx && ctx.state !== "running") void ctx.resume();
    sound.play();
  }

  // --- Music synthesis ------------------------------------------------------

  /**
   * Renders a calm 16-second underwater loop: a warm chord pad, a soft bass
   * pulse, and a pentatonic music-box melody over an Am-F-C-G progression.
   * Everything is additive sine synthesis so it stays gentle behind the SFX.
   */
  private synthMusic(): Howl {
    const sampleRate = 22050;
    const beat = 0.5; // seconds per beat (120 BPM)
    const barBeats = 4;
    const bars = 8;
    const loopS = bars * barBeats * beat; // 16s
    const n = Math.floor(sampleRate * loopS);
    const buf = new Float32Array(n);

    /** Adds one enveloped sine (plus a quiet octave) into the mix buffer. */
    const addNote = (
      startS: number,
      durS: number,
      freq: number,
      gain: number,
      attackS: number,
      releaseS: number
    ) => {
      const start = Math.floor(startS * sampleRate);
      const len = Math.floor(durS * sampleRate);
      const attack = Math.max(1, attackS * sampleRate);
      const release = Math.max(1, releaseS * sampleRate);
      for (let i = 0; i < len; i++) {
        const idx = start + i;
        if (idx >= n) break;
        // Linear attack, exponential-ish decay to zero at the note tail.
        const env = Math.min(1, i / attack) * Math.min(1, (len - i) / release);
        const t = i / sampleRate;
        const w = Math.sin(2 * Math.PI * freq * t) + 0.3 * Math.sin(4 * Math.PI * freq * t);
        buf[idx] += w * env * gain;
      }
    };

    const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

    // Am - F - C - G, two bars each, repeated once across the loop.
    const progression = [
      [57, 60, 64], // Am
      [53, 57, 60], // F
      [48, 52, 55], // C
      [55, 59, 62], // G
    ];

    for (let bar = 0; bar < bars; bar++) {
      const barStart = bar * barBeats * beat;
      const chord = progression[Math.floor(bar / 2) % progression.length];

      // Pad: full-bar sustained triad, slow swell.
      for (const note of chord) {
        addNote(barStart, barBeats * beat, midiToFreq(note), 0.09, 0.35, 0.5);
      }
      // Bass: root two octaves down, one pulse per half bar.
      for (let half = 0; half < 2; half++) {
        addNote(barStart + half * 2 * beat, 2 * beat, midiToFreq(chord[0] - 24), 0.14, 0.02, 0.4);
      }
    }

    // Music-box melody in A minor pentatonic. Each entry is [beatOffset, midi].
    const melody: Array<[number, number]> = [
      [0, 69], [1.5, 72], [2, 74], [3, 72],
      [4, 76], [5.5, 74], [6, 72], [7, 69],
      [8, 72], [9.5, 76], [10, 79], [11, 76],
      [12, 74], [13.5, 72], [14, 69], [15, 67],
      [16, 69], [17.5, 72], [18, 76], [19, 79],
      [20, 81], [21.5, 79], [22, 76], [23, 74],
      [24, 72], [25.5, 74], [26, 76], [27, 72],
      [28, 69], [29.5, 67], [30, 69], [31, 72],
    ];
    for (const [beatOffset, note] of melody) {
      addNote(beatOffset * beat, 1.1 * beat, midiToFreq(note), 0.16, 0.008, 0.45);
    }

    // Normalize to a comfortable headroom, then apply a loop-boundary crossfade
    // so the seam between repeats is inaudible.
    let peak = 0;
    for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(buf[i]));
    const norm = peak > 0 ? 0.85 / peak : 1;

    const fade = Math.floor(0.05 * sampleRate);
    const data = new Int16Array(n);
    for (let i = 0; i < n; i++) {
      let s = buf[i] * norm;
      if (i < fade) s *= i / fade;
      else if (i > n - fade) s *= (n - i) / fade;
      data[i] = Math.max(-1, Math.min(1, s)) * 32000;
    }

    const wav = encodeWav(data, sampleRate);
    // A Blob URL avoids building a ~1MB base64 string on the main thread.
    const url = URL.createObjectURL(new Blob([wav], { type: "audio/wav" }));
    return new Howl({ src: [url], format: ["wav"], loop: true, volume: 0.32 });
  }
}

// --- WAV encoding helpers --------------------------------------------------

function encodeWav(samples: Int16Array, sampleRate: number): Uint8Array {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples.length * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, samples.length * 2, true);
  for (let i = 0; i < samples.length; i++) view.setInt16(44 + i * 2, samples[i], true);
  return new Uint8Array(buffer);
}

export const AudioManager = new AudioManagerClass();
