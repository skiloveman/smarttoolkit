type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

// Synthesizes a bright repeating "띠리리링" trill while a ladder path is
// being traced, plus a short cheerful landing chime, with the Web Audio API
// so the game doesn't need a bundled audio file.
export class LadderSoundPlayer {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private tickIndex = 0;

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

  // One bright bell-like blip of the trill. Call repeatedly at a steady
  // interval while the trace animation runs so the ticks read as
  // "띠리리링띠리리링" rather than a flat metronome click.
  playTraceTick() {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t0 = ctx.currentTime;
    const notes = [1568, 1976]; // G6, B6 — alternate for a trilling feel
    const freq = notes[this.tickIndex % notes.length];
    this.tickIndex += 1;

    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t0);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, t0);
    gain.gain.exponentialRampToValueAtTime(0.22, t0 + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.1);

    // Quiet higher harmonic layered on top for a bell-like shimmer.
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2, t0);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.001, t0);
    gain2.gain.exponentialRampToValueAtTime(0.08, t0 + 0.006);
    gain2.gain.exponentialRampToValueAtTime(0.001, t0 + 0.07);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t0);
    osc2.stop(t0 + 0.08);
  }

  playLanding() {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t0 = ctx.currentTime;
    const notes = [1568, 1976, 2637];

    notes.forEach((freq, i) => {
      const start = t0 + i * 0.07;
      const osc = ctx.createOscillator();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.26, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.2);
    });
  }

  close() {
    this.ctx?.close().catch(() => {});
    this.ctx = null;
  }
}
