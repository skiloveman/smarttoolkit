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

    // Crisp "딱" crack: a very short, steeply-decaying noise burst pushed
    // toward the high end so it reads as a snap rather than a soft click.
    const duration = 0.045;
    const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i += 1) {
      const decay = Math.pow(1 - i / bufferSize, 6);
      data[i] = (Math.random() * 2 - 1) * decay;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = 1500;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 3800;
    bandpass.Q.value = 0.9;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, t0);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);

    noise.connect(highpass);
    highpass.connect(bandpass);
    bandpass.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(t0);
    noise.stop(t0 + duration + 0.01);

    // Instantaneous click transient right at the attack for extra snap.
    const clickOsc = ctx.createOscillator();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(1300, t0);

    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(0.32, t0);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.012);

    clickOsc.connect(clickGain);
    clickGain.connect(ctx.destination);
    clickOsc.start(t0);
    clickOsc.stop(t0 + 0.015);

    // Just a hint of low body under the crack, cut off quickly so it stays
    // "딱!" and doesn't trail off into a soft "thock".
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, t0);
    osc.frequency.exponentialRampToValueAtTime(140, t0 + 0.025);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.001, t0);
    oscGain.gain.exponentialRampToValueAtTime(0.18, t0 + 0.003);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.03);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + 0.035);
  }

  close() {
    this.ctx?.close().catch(() => {});
    this.ctx = null;
  }
}
