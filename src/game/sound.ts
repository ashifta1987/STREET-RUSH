import { Howl, Howler } from 'howler';
import { CITIES, CityConfig } from './content';

const SOUND_STORAGE_KEY = 'street_rush_sound_enabled';

function encodeWavFromFloat32(samples: Float32Array, sampleRate = 22050): string {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return 'data:audio/wav;base64,' + btoa(binary);
}

function createToneWav(freq: number, durationSec: number, type: 'sine' | 'saw' | 'square' = 'sine', slideFreq?: number): string {
  const sr = 22050;
  const len = Math.floor(sr * durationSec);
  const data = new Float32Array(len);
  let phase = 0;
  for (let i = 0; i < len; i++) {
    const t = i / len;
    const currentFreq = slideFreq ? freq + (slideFreq - freq) * t : freq;
    phase += (2 * Math.PI * currentFreq) / sr;
    const env = Math.sin(Math.min(1, i / (sr * 0.015)) * (Math.PI / 2)) * Math.pow(1 - t, 1.3);
    let val = Math.sin(phase);
    if (type === 'saw') {
      val = 2 * ((phase / (2 * Math.PI)) - Math.floor(0.5 + phase / (2 * Math.PI)));
    } else if (type === 'square') {
      val = Math.sin(phase) >= 0 ? 0.8 : -0.8;
    }
    data[i] = val * env * 0.45;
  }
  return encodeWavFromFloat32(data, sr);
}

function createEngineLoopWav(): string {
  const sr = 22050;
  // Seamless loop of 60 cycles of 80 Hz base engine purr
  const baseFreq = 85;
  const cycles = 34;
  const len = Math.floor((sr / baseFreq) * cycles);
  const data = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / sr;
    const w = 2 * Math.PI * baseFreq * t;
    const pulse =
      0.45 * Math.sin(w) +
      0.28 * Math.sin(2 * w + 0.4) +
      0.16 * Math.sin(3 * w + 1.1) +
      0.1 * Math.sin(4 * w);
    data[i] = pulse * 0.35;
  }
  return encodeWavFromFloat32(data, sr);
}

function createCrashWav(durationSec = 0.28): string {
  const sr = 22050;
  const len = Math.floor(sr * durationSec);
  const data = new Float32Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / len;
    const env = Math.pow(1 - t, 2.2);
    const noise = (Math.random() * 2 - 1) * 0.6;
    const thud = Math.sin(2 * Math.PI * (120 * (1 - t * 0.6)) * (i / sr)) * 0.5;
    data[i] = (noise + thud) * env * 0.5;
  }
  return encodeWavFromFloat32(data, sr);
}

function createFanfareWav(notes: number[], noteDurSec = 0.14): string {
  const sr = 22050;
  const noteSamples = Math.floor(sr * noteDurSec);
  const len = noteSamples * notes.length;
  const data = new Float32Array(len);
  for (let n = 0; n < notes.length; n++) {
    const freq = notes[n];
    for (let i = 0; i < noteSamples; i++) {
      const t = i / noteSamples;
      const env = Math.min(1, i / 200) * Math.pow(1 - t, 0.8);
      const phase = (2 * Math.PI * freq * i) / sr;
      data[n * noteSamples + i] = (Math.sin(phase) + 0.3 * Math.sin(phase * 2)) * env * 0.35;
    }
  }
  return encodeWavFromFloat32(data, sr);
}

function createCityMusicLoopWav(city: CityConfig): string {
  const sr = 22050;
  const beatSec = 60 / city.musicTempo / 2; // 8th notes
  const pattern = [0, 2, 3, 5, 3, 2, 4, 1, 0, 3, 4, 5, 4, 2, 1, 2];
  const stepSamples = Math.floor(sr * beatSec);
  const len = stepSamples * pattern.length;
  const data = new Float32Array(len);

  for (let step = 0; step < pattern.length; step++) {
    const noteFreq = city.musicScale[pattern[step] % city.musicScale.length];
    const bassFreq = city.musicScale[0] * 0.5;
    for (let i = 0; i < stepSamples; i++) {
      const t = i / stepSamples;
      const leadEnv = Math.min(1, i / 180) * Math.pow(1 - t, 1.4);
      const bassEnv = step % 2 === 0 ? Math.pow(1 - t, 1.8) : 0.3 * (1 - t);
      const timeSec = (step * stepSamples + i) / sr;
      const lead = Math.sin(2 * Math.PI * noteFreq * timeSec) * leadEnv * 0.14;
      const bass = Math.sin(2 * Math.PI * bassFreq * timeSec) * bassEnv * 0.18;
      data[step * stepSamples + i] = lead + bass;
    }
  }
  return encodeWavFromFloat32(data, sr);
}

class SoundManager {
  private initialized = false;
  private enabled = true;
  private engineHowl: Howl | null = null;
  private enginePlaying = false;
  private beepHowl: Howl | null = null;
  private goHowl: Howl | null = null;
  private crashHowl: Howl | null = null;
  private bumpHowl: Howl | null = null;
  private lapHowl: Howl | null = null;
  private finishHowl: Howl | null = null;
  private cityMusicHowls: Record<string, Howl> = {};
  private currentCityMusic: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(SOUND_STORAGE_KEY);
      this.enabled = saved === null ? true : saved === 'true';
      Howler.mute(!this.enabled);
    }
  }

  private ensureInit() {
    if (this.initialized || typeof window === 'undefined') return;
    this.initialized = true;

    this.engineHowl = new Howl({
      src: [createEngineLoopWav()],
      format: ['wav'],
      loop: true,
      volume: 0.24,
    });
    this.beepHowl = new Howl({
      src: [createToneWav(523.25, 0.18, 'square')],
      format: ['wav'],
      volume: 0.45,
    });
    this.goHowl = new Howl({
      src: [createToneWav(880.0, 0.38, 'saw', 1046.5)],
      format: ['wav'],
      volume: 0.55,
    });
    this.crashHowl = new Howl({
      src: [createCrashWav(0.32)],
      format: ['wav'],
      volume: 0.6,
    });
    this.bumpHowl = new Howl({
      src: [createCrashWav(0.14)],
      format: ['wav'],
      volume: 0.38,
    });
    this.lapHowl = new Howl({
      src: [createFanfareWav([523.25, 659.25, 783.99], 0.11)],
      format: ['wav'],
      volume: 0.45,
    });
    this.finishHowl = new Howl({
      src: [createFanfareWav([523.25, 659.25, 783.99, 1046.5], 0.16)],
      format: ['wav'],
      volume: 0.55,
    });

    for (const city of CITIES) {
      this.cityMusicHowls[city.id] = new Howl({
        src: [createCityMusicLoopWav(city)],
        format: ['wav'],
        loop: true,
        volume: 0.22,
      });
    }

    Howler.mute(!this.enabled);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  toggle(): boolean {
    this.setEnabled(!this.enabled);
    return this.enabled;
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem(SOUND_STORAGE_KEY, String(enabled));
    }
    Howler.mute(!enabled);
  }

  playCountdownBeep() {
    this.ensureInit();
    if (this.enabled) this.beepHowl?.play();
  }

  playCountdownGo() {
    this.ensureInit();
    if (this.enabled) this.goHowl?.play();
  }

  playCrash() {
    this.ensureInit();
    if (this.enabled) this.crashHowl?.play();
  }

  playBump() {
    this.ensureInit();
    if (this.enabled) this.bumpHowl?.play();
  }

  playLapComplete() {
    this.ensureInit();
    if (this.enabled) this.lapHowl?.play();
  }

  playRaceFinish() {
    this.ensureInit();
    if (this.enabled) this.finishHowl?.play();
  }

  startEngine() {
    this.ensureInit();
    if (!this.enginePlaying && this.engineHowl) {
      this.engineHowl.play();
      this.enginePlaying = true;
    }
  }

  updateEnginePitch(speedRatio: number) {
    if (!this.enginePlaying || !this.engineHowl) return;
    const clamped = Math.max(0, Math.min(1.2, Math.abs(speedRatio)));
    this.engineHowl.rate(0.65 + clamped * 1.35);
  }

  stopEngine() {
    if (this.enginePlaying && this.engineHowl) {
      this.engineHowl.stop();
      this.enginePlaying = false;
    }
  }

  startCityMusic(cityId: string) {
    this.ensureInit();
    if (this.currentCityMusic === cityId) return;
    this.stopCityMusic();
    const howl = this.cityMusicHowls[cityId];
    if (howl) {
      howl.play();
      this.currentCityMusic = cityId;
    }
  }

  stopCityMusic() {
    if (this.currentCityMusic && this.cityMusicHowls[this.currentCityMusic]) {
      this.cityMusicHowls[this.currentCityMusic].stop();
    }
    this.currentCityMusic = null;
  }

  stopAllRaceAudio() {
    this.stopEngine();
    this.stopCityMusic();
  }
}

export const soundManager = new SoundManager();
