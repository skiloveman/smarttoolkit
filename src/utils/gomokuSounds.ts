type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext };

// Synthesizes a short percussive "stone on wood board" click with the Web
// Audio API so the game doesn't need a bundled audio file.
export class StoneSoundPlayer {
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

  playPlace() {
    if (!this.enabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const t0 = ctx.currentTime;

    // Sharp noise "click" for the surface contact.
    const duration = 0.09;
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      const decay = Math.pow(1 - i / bufferSize, 3);
      data[i] = (Math.random() * 2 - 1) * decay;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 2400;
    bandpass.Q.value = 1.1;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.55, t0);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

    noise.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(t0);
    noise.stop(t0 + duration + 0.02);

    // Low "thock" body resonance so it doesn't sound like a bare click.
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, t0);
    osc.frequency.exponentialRampToValueAtTime(85, t0 + 0.06);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.001, t0);
    oscGain.gain.exponentialRampToValueAtTime(0.3, t0 + 0.005);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.08);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.09);
  }

  close() {
    this.ctx?.close().catch(() => {});
    this.ctx = null;
  }
}
