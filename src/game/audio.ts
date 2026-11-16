export type MusicTrack = 'world1' | 'world2' | 'world3' | 'world4' | 'world5' | 'boss';

interface TrackDef {
  tempoMs: number;
  wave: OscillatorType;
  melody: number[];
  bass: number[];
}

const TRACKS: Record<MusicTrack, TrackDef> = {
  // Welt 1: Fröhliches C-Dur Abenteuer
  world1: {
    tempoMs: 210,
    wave: 'triangle',
    melody: [523, 659, 784, 659, 880, 784, 659, 587, 523, 587, 659, 784, 659, 523, 587, 0],
    bass:   [131, 0,   196, 0,   175, 0,   196, 0,   131, 0,   196, 0,   175, 0,   196, 147],
  },
  // Welt 2: Geheimnisvolle Kristall-Grotte (a-Moll)
  world2: {
    tempoMs: 230,
    wave: 'sine',
    melody: [440, 523, 659, 880, 784, 659, 523, 494, 440, 523, 659, 784, 659, 587, 523, 0],
    bass:   [110, 0,   165, 0,   147, 0,   165, 0,   110, 0,   131, 0,   147, 0,   165, 0],
  },
  // Welt 3: Schnelles Wildwasser-Boot / Sonic-Speed
  world3: {
    tempoMs: 165,
    wave: 'triangle',
    melody: [587, 740, 880, 988, 880, 740, 659, 740, 587, 740, 880, 1175, 988, 880, 740, 0],
    bass:   [147, 147, 220, 0,   196, 196, 220, 0,   147, 147, 220, 0,    196, 0,   220, 0],
  },
  // Welt 4: Majestätisches Himmels-Archipel
  world4: {
    tempoMs: 200,
    wave: 'sine',
    melody: [659, 784, 988, 1175, 988, 880, 784, 659, 784, 880, 988, 1319, 1175, 988, 880, 0],
    bass:   [165, 0,   247, 0,    196, 0,   220, 0,   165, 0,   247, 0,    220,  0,   196, 0],
  },
  // Welt 5: Tropisches Blubber-Riff (Marimba-Feeling)
  world5: {
    tempoMs: 190,
    wave: 'sine',
    melody: [523, 659, 784, 1046, 880, 784, 659, 523, 587, 698, 880, 784, 659, 587, 523, 0],
    bass:   [131, 0,   196, 0,    175, 0,   131, 0,   147, 0,   196, 0,   165, 0,   131, 0],
  },
  // Boss-Kampf Spannung!
  boss: {
    tempoMs: 150,
    wave: 'sawtooth',
    melody: [330, 392, 440, 392, 494, 440, 392, 349, 330, 392, 440, 523, 494, 440, 392, 330],
    bass:   [110, 110, 165, 110, 147, 147, 165, 131, 110, 110, 165, 110, 147, 131, 123, 110],
  },
};

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxMuted = false;
  private musicMuted = false;
  private musicPlaying = false;
  private currentTrack: MusicTrack = 'world1';
  private stepIdx = 0;
  private musicTimer: number | null = null;

  public setSfxMuted(muted: boolean) {
    this.sfxMuted = muted;
  }

  public isSfxMuted(): boolean {
    return this.sfxMuted;
  }

  public setMusicMuted(muted: boolean) {
    this.musicMuted = muted;
    if (muted) {
      this.stopMusicLoop();
    } else if (this.musicPlaying) {
      this.startMusicLoop();
    }
  }

  public isMusicMuted(): boolean {
    return this.musicMuted;
  }

  public startMusic(track: MusicTrack) {
    const changed = this.currentTrack !== track;
    this.currentTrack = track;
    this.musicPlaying = true;
    if (!this.musicMuted && (changed || this.musicTimer === null)) {
      this.stopMusicLoop();
      this.startMusicLoop();
    }
  }

  public stopMusic() {
    this.musicPlaying = false;
    this.stopMusicLoop();
  }

  private startMusicLoop() {
    if (this.musicMuted) return;
    if (this.musicTimer !== null) return;
    const def = TRACKS[this.currentTrack];
    this.musicTimer = window.setInterval(() => {
      if (this.musicMuted || !this.musicPlaying) return;
      const ctx = this.ensureContext(true);
      if (!ctx || ctx.state !== 'running') return;

      const t = TRACKS[this.currentTrack];
      const step = this.stepIdx % t.melody.length;
      this.stepIdx++;

      const mFreq = t.melody[step];
      const bFreq = t.bass[step];

      if (mFreq > 0) {
        this.playMusicNote(ctx, mFreq, (t.tempoMs / 1000) * 0.85, t.wave, 0.036);
      }
      if (bFreq > 0) {
        this.playMusicNote(ctx, bFreq, (t.tempoMs / 1000) * 0.9, 'triangle', 0.042);
      }
    }, def.tempoMs);
  }

  private stopMusicLoop() {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private playMusicNote(
    ctx: AudioContext,
    freq: number,
    dur: number,
    type: OscillatorType,
    vol: number
  ) {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(vol, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }

  private ensureContext(forMusic = false): AudioContext | null {
    if (forMusic ? this.musicMuted : this.sfxMuted) return null;
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

  public unlock() {
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
    } catch {
      // Ignore audio errors
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
    const ctx = this.ensureContext(false);
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

  public boost() {
    this.tone(320, 1180, 0.22, 'sawtooth', 0.11);
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
