type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

// Synthesizes playful "rolling ball" blips while the lotto numbers are being
// drawn, plus a bright ta-da chime when the final numbers are revealed, with
// the Web Audio API so the game doesn't need a bundled audio file.
export class LottoSoundPlayer {
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

  // A bouncy little blip for each roll tick. Pitch is randomized slightly
  // each call so a run of ticks reads as playful rather than robotic.
  playRollTick() {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t0 = ctx.currentTime;
    const base = 520 + Math.random() * 260;

    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(base, t0);
    osc.frequency.exponentialRampToValueAtTime(base * 1.6, t0 + 0.05);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.exponentialRampToValueAtTime(0.14, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.08);
  }

  // Bright ascending "ta-da" chime for the final reveal.
  playReveal() {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t0 = ctx.currentTime;
    const notes = [784, 988, 1175, 1568]; // G5, B5, D6, G6

    notes.forEach((freq, i) => {
      const start = t0 + i * 0.09;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.24, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.24);
    });
  }

  close() {
    this.ctx?.close().catch(() => {});
    this.ctx = null;
  }
}
