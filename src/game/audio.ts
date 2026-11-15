class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted = false;

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  private tone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType = 'triangle',
    volume = 0.12,
    delay = 0
  ) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqStart, now);
    if (freqEnd !== freqStart) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, freqEnd),
        now + duration
      );
    }
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  public jump() {
    this.tone(240, 620, 0.14, 'triangle', 0.13);
  }

  public doubleJump() {
    this.tone(380, 880, 0.16, 'sine', 0.13);
    this.tone(540, 1080, 0.12, 'triangle', 0.08, 0.04);
  }

  public spring() {
    this.tone(220, 960, 0.24, 'sine', 0.15);
  }

  public punch(powered: boolean) {
    if (powered) {
      this.tone(420, 95, 0.14, 'sawtooth', 0.14);
      this.tone(680, 220, 0.12, 'triangle', 0.1, 0.02);
    } else {
      this.tone(340, 110, 0.11, 'sawtooth', 0.11);
    }
  }

  public boomerang() {
    this.tone(520, 740, 0.09, 'sine', 0.11);
    this.tone(740, 460, 0.11, 'sine', 0.09, 0.08);
  }

  public coin() {
    this.tone(988, 988, 0.07, 'sine', 0.11);
    this.tone(1319, 1319, 0.16, 'sine', 0.12, 0.06);
  }

  public gem() {
    this.tone(880, 1175, 0.09, 'triangle', 0.12);
    this.tone(1319, 1760, 0.16, 'sine', 0.12, 0.07);
  }

  public heal() {
    this.tone(440, 554, 0.1, 'sine', 0.12);
    this.tone(554, 659, 0.1, 'sine', 0.12, 0.08);
    this.tone(659, 880, 0.18, 'sine', 0.13, 0.16);
  }

  public stomp() {
    this.tone(280, 90, 0.12, 'square', 0.1);
  }

  public enemyHit() {
    this.tone(180, 480, 0.13, 'triangle', 0.13);
  }

  public blockBreak() {
    this.tone(160, 55, 0.12, 'square', 0.11);
  }

  public chest() {
    const notes = [523, 659, 784, 1046];
    notes.forEach((n, idx) => {
      this.tone(n, n * 1.03, 0.16, 'triangle', 0.13, idx * 0.09);
    });
  }

  public checkpoint() {
    this.tone(587, 587, 0.1, 'triangle', 0.11);
    this.tone(880, 880, 0.18, 'triangle', 0.12, 0.09);
  }

  public hurt() {
    this.tone(260, 95, 0.22, 'sawtooth', 0.13);
  }

  public lifeLost() {
    this.tone(330, 260, 0.15, 'sawtooth', 0.13);
    this.tone(240, 140, 0.25, 'sawtooth', 0.13, 0.14);
  }

  public bossWarn() {
    this.tone(130, 95, 0.25, 'sawtooth', 0.14);
    this.tone(110, 75, 0.3, 'sawtooth', 0.14, 0.22);
  }

  public bossHit() {
    this.tone(150, 420, 0.14, 'square', 0.12);
    this.tone(220, 90, 0.16, 'sawtooth', 0.11, 0.04);
  }

  public victory() {
    const notes = [523, 659, 784, 659, 784, 1046];
    notes.forEach((n, idx) => {
      this.tone(n, n, 0.18, 'triangle', 0.13, idx * 0.11);
    });
  }
}

export const soundEngine = new SoundEngine();
