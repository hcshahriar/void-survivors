import type { GameSave } from '../core/save';

export type SfxId =
  | 'weapon'
  | 'enemy-down'
  | 'player-hit'
  | 'level-up'
  | 'chest'
  | 'boss'
  | 'purchase'
  | 'select'
  | 'ui';
type Waveform = OscillatorType;

interface ToneProfile {
  frequency: number;
  duration: number;
  waveform: Waveform;
  volume: number;
}

const SFX: Record<SfxId, ToneProfile> = {
  weapon: { frequency: 640, duration: 0.055, waveform: 'square', volume: 0.1 },
  'enemy-down': { frequency: 190, duration: 0.1, waveform: 'triangle', volume: 0.16 },
  'player-hit': { frequency: 95, duration: 0.22, waveform: 'sawtooth', volume: 0.24 },
  'level-up': { frequency: 720, duration: 0.32, waveform: 'triangle', volume: 0.2 },
  chest: { frequency: 880, duration: 0.26, waveform: 'square', volume: 0.22 },
  boss: { frequency: 75, duration: 0.5, waveform: 'sawtooth', volume: 0.3 },
  purchase: { frequency: 520, duration: 0.15, waveform: 'triangle', volume: 0.18 },
  select: { frequency: 440, duration: 0.08, waveform: 'square', volume: 0.12 },
  ui: { frequency: 330, duration: 0.045, waveform: 'square', volume: 0.06 },
};

const NOTES = [
  65.41, 98, 130.81, 164.81, 196, 146.83, 110, 174.61, 220, 164.81, 130.81, 196,
];

export class AudioManager {
  private context: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private musicBeat = 0;
  private nextNoteTime = 0;
  private waveLevel = 1;
  private settings: GameSave['settings'];

  constructor(settings: GameSave['settings']) {
    this.settings = { ...settings };
  }

  async unlock(): Promise<void> {
    if (!this.context) {
      if (!window.AudioContext) return;
      this.context = new AudioContext();
      this.masterGain = this.context.createGain();
      this.musicGain = this.context.createGain();
      this.sfxGain = this.context.createGain();
      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.context.destination);
      this.syncGains();
    }
    if (this.context.state === 'suspended') await this.context.resume();
    if (this.musicTimer === null)
      this.musicTimer = window.setInterval(() => this.scheduleNote(), 40);
  }

  play(id: SfxId): void {
    if (!this.context || !this.sfxGain || this.settings.muted) return;
    const profile = SFX[id];
    const start = this.context.currentTime;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    oscillator.type = profile.waveform;
    oscillator.frequency.setValueAtTime(profile.frequency, start);
    if (id === 'player-hit' || id === 'boss') {
      oscillator.frequency.exponentialRampToValueAtTime(
        profile.frequency * 0.45,
        start + profile.duration,
      );
    }
    envelope.gain.setValueAtTime(profile.volume, start);
    envelope.gain.exponentialRampToValueAtTime(0.001, start + profile.duration);
    oscillator.connect(envelope);
    envelope.connect(this.sfxGain);
    oscillator.start(start);
    oscillator.stop(start + profile.duration);
  }

  setWaveLevel(level: number): void {
    this.waveLevel = Math.max(1, level);
  }

  updateSettings(settings: GameSave['settings']): void {
    this.settings = { ...settings };
    this.syncGains();
  }

  destroy(): void {
    if (this.musicTimer !== null) window.clearInterval(this.musicTimer);
    this.musicTimer = null;
    void this.context?.close();
    this.context = null;
  }

  private scheduleNote(): void {
    if (
      !this.context ||
      !this.musicGain ||
      this.settings.muted ||
      this.settings.musicVolume <= 0
    )
      return;
    const now = this.context.currentTime;
    if (now < this.nextNoteTime) return;
    const frequency = NOTES[this.musicBeat % NOTES.length]!;
    const oscillator = this.context.createOscillator();
    const envelope = this.context.createGain();
    const start = now + 0.015;
    const duration = 0.18;
    const intensity = Math.min(1.6, 0.35 + this.waveLevel * 0.12);
    oscillator.type = this.musicBeat % 4 === 0 ? 'sawtooth' : 'square';
    oscillator.frequency.setValueAtTime(frequency * intensity, start);
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.linearRampToValueAtTime(0.09, start + 0.018);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(this.musicGain);
    oscillator.start(start);
    oscillator.stop(start + duration);
    this.musicBeat += 1;
    this.nextNoteTime = start + 0.24 / Math.min(1.7, 1 + this.waveLevel * 0.035);
  }

  private syncGains(): void {
    if (!this.context || !this.masterGain || !this.musicGain || !this.sfxGain) return;
    const now = this.context.currentTime;
    this.masterGain.gain.setTargetAtTime(
      this.settings.muted ? 0 : this.settings.masterVolume,
      now,
      0.04,
    );
    this.musicGain.gain.setTargetAtTime(this.settings.musicVolume, now, 0.04);
    this.sfxGain.gain.setTargetAtTime(this.settings.sfxVolume, now, 0.02);
  }
}
