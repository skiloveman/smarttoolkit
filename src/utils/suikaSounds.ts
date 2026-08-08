type ToneOptions = {
  type?: OscillatorType;
  gain?: number;
  sweepTo?: number;
  delay?: number;
};

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

// Lightweight, dependency-free sound effects synthesized with the Web Audio
// API so the cute drop/merge/fanfare cues don't need any bundled audio files.
export class SuikaSoundPlayer {
  private ctx: AudioContext | null = null;
  private enabled = true;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext ?? (window as WebkitWindow).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private tone(freq: number, duration: number, opts: ToneOptions = {}) {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t0 = ctx.currentTime + (opts.delay ?? 0);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = opts.type ?? 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (opts.sweepTo) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(opts.sweepTo, 1), t0 + duration);
    }

    const peak = opts.gain ?? 0.18;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + Math.min(0.02, duration * 0.3));
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  }

  playDrop() {
    this.tone(520, 0.09, { type: 'triangle', gain: 0.14, sweepTo: 420 });
  }

  playMerge(level: number) {
    const base = 300 + level * 45;
    this.tone(base, 0.16, { type: 'triangle', gain: 0.22, sweepTo: base * 1.6 });
    this.tone(base * 1.5, 0.12, { type: 'sine', gain: 0.12, sweepTo: base * 2, delay: 0.02 });
  }

  playBigPop() {
    this.tone(140, 0.32, { type: 'sine', gain: 0.28, sweepTo: 55 });
  }

  playFanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((freq, i) => {
      this.tone(freq, 0.26, { type: 'square', gain: 0.15, delay: i * 0.09 });
      this.tone(freq * 2, 0.2, { type: 'sine', gain: 0.05, delay: i * 0.09 });
    });
  }

  close() {
    this.ctx?.close().catch(() => {});
    this.ctx = null;
  }
}
