import { MusicTrack, soundEngine } from './audio';
import { Lang, TEXTS } from './i18n';
import { createLevel, GAME_H, GAME_W } from './levels';
import {
  FloatingText,
  GameMode,
  HudSnapshot,
  InputState,
  LevelDefinition,
  Particle,
  Player,
  Projectile,
  TOOLS_CATALOG,
  TileKind,
  ToolId,
  ToolInfo,
} from './types';

const BASE_GRAVITY = 0.62;
const MAX_FALL = 14.5;
const BASE_STAND_W = 42;
const BASE_STAND_H = 64;
const CROUCH_W = 44;
const CROUCH_H = 36;

function isVehicleMode(mode: GameMode): boolean {
  return mode !== 'platformer';
}

function getVehicleDimensions(mode: GameMode): { w: number; h: number } {
  if (mode === 'balloon_flight') return { w: 54, h: 66 };
  if (mode === 'plane_shooter') return { w: 68, h: 42 };
  if (mode === 'jet_shooter') return { w: 72, h: 38 };
  if (mode === 'topdown_boat') return { w: 68, h: 44 };
  return { w: BASE_STAND_W, h: BASE_STAND_H };
}

function isNonSolidTile(kind: TileKind): boolean {
  return (
    kind === 'lava' ||
    kind === 'boost_pad' ||
    kind === 'ladder' ||
    kind === 'slide_right' ||
    kind === 'slide_left' ||
    kind === 'bumper'
  );
}

export interface EngineCallbacks {
  onHudUpdate: (hud: HudSnapshot) => void;
  onLevelClear: (levelIndex: number, score: number, coins: number) => void;
  onGameOver: (score: number, coins: number) => void;
  onVictory: (score: number, coins: number) => void;
}

export class SuperKennethEngine {
  public levelIndex = 0;
  public level: LevelDefinition;
  public player: Player;
  public projectiles: Projectile[] = [];
  public particles: Particle[] = [];
  public floatingTexts: FloatingText[] = [];
  public cameraX = 0;
  public viewW = GAME_W;
  public screenShake = 0;
  public tick = 0;
  public score = 0;
  public coins = 0;
  public starsCollected = 0;
  public totalStars = 3;
  public isRunning = false;
  public lang: Lang = 'de';
  public recentToolUnlock: ToolInfo | null = null;
  private recentToolTimer = 0;
  private levelFinishTimer = -1;
  private nextProjId = 1;
  private callbacks: EngineCallbacks;
  private hudSyncCounter = 0;

  constructor(callbacks: EngineCallbacks, initialLang: Lang = 'de') {
    this.callbacks = callbacks;
    this.lang = initialLang;
    this.level = createLevel(0);
    this.player = this.createFreshPlayer([]);
    this.loadLevel(0, true);
  }

  public setViewWidth(w: number) {
    this.viewW = Math.max(840, Math.min(1800, w));
  }

  public setLang(lang: Lang) {
    this.lang = lang;
    this.emitHud();
  }

  public getMusicTrack(): MusicTrack {
    if (this.level.boss.active && !this.level.boss.defeated) {
      return 'boss';
    }
    const tracks: MusicTrack[] = [
      'world1',
      'world2',
      'world3',
      'world4',
      'world5',
      'world6',
      'world7',
      'world8',
      'world9',
      'world10',
    ];
    return tracks[this.levelIndex] ?? 'world1';
  }

  private t() {
    return TEXTS[this.lang];
  }

  private createFreshPlayer(keepTools: ToolId[]): Player {
    const dims = getVehicleDimensions(this.level.theme.mode);
    return {
      x: this.level.spawnX,
      y: this.level.spawnY,
      w: dims.w,
      h: dims.h,
      vx: 0,
      vy: 0,
      facingRight: true,
      onGround: false,
      onLadder: false,
      isSliding: false,
      jumpsRemaining: 2,
      isCrouching: false,
      isShielding: false,
      grabbedVineId: null,
      vineOffset: 0.75,
      vineCooldown: 0,
      boostTimer: 0,
      isSpringLaunch: false,
      attackTimer: 0,
      attackCooldown: 0,
      boomerangCooldown: 0,
      invulnTimer: 0,
      hitFlash: 0,
      animTimer: 0,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
      safeX: this.level.spawnX,
      safeY: this.level.spawnY,
      checkpointX: this.level.spawnX,
      checkpointY: this.level.spawnY,
      healthStamina: 100,
      maxHealthStamina: 100,
      toolEnergy: 100,
      maxToolEnergy: 100,
      lives: 10,
      maxLives: 10,
      tools: [...keepTools],
    };
  }

  public startNewGame(startLevelIndex = 0) {
    this.score = 0;
    this.coins = 0;
    const starterTools: ToolId[] = [];
    if (startLevelIndex >= 1) starterTools.push('power_gloves', 'star_boomerang');
    if (startLevelIndex >= 2) starterTools.push('turbo_boots', 'sun_sword');
    if (startLevelIndex >= 3) starterTools.push('aegis_shield');
    if (startLevelIndex >= 6) starterTools.push('fire_blaster');
    if (startLevelIndex >= 7) starterTools.push('thunder_hammer');
    if (startLevelIndex >= 9) starterTools.push('rocket_pod');
    this.loadLevel(startLevelIndex, true, starterTools);
  }

  public loadLevel(
    index: number,
    resetLivesAndTools: boolean,
    explicitTools?: ToolId[]
  ) {
    this.levelIndex = index;
    this.level = createLevel(index);
    this.projectiles = [];
    this.particles = [];
    this.floatingTexts = [];
    this.cameraX = 0;
    this.screenShake = 0;
    this.levelFinishTimer = -1;
    this.recentToolUnlock = null;
    this.recentToolTimer = 0;
    this.starsCollected = 0;
    this.totalStars =
      this.level.collectibles.filter((c) => c.kind === 'super_star').length || 3;

    if (resetLivesAndTools) {
      this.player = this.createFreshPlayer(explicitTools ?? []);
    } else {
      const preservedLives = Math.max(1, this.player.lives);
      const preservedTools = [...this.player.tools];
      this.player = this.createFreshPlayer(preservedTools);
      this.player.lives = preservedLives;
    }

    this.emitHud();
  }

  public hasTool(id: ToolId): boolean {
    return this.player.tools.includes(id);
  }

  private addParticles(
    x: number,
    y: number,
    color: string,
    count: number,
    speed = 7,
    gravity = 0.25,
    glow = false
  ) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const mag = 1.2 + Math.random() * speed;
      const life = 20 + Math.floor(Math.random() * 18);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * mag,
        vy: Math.sin(angle) * mag - 1.2,
        size: 3 + Math.random() * 5.5,
        color,
        life,
        maxLife: life,
        gravity,
        glow,
      });
    }
  }

  private addText(x: number, y: number, text: string, color: string) {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      life: 48,
      maxLife: 48,
    });
  }

  private overlaps(
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number }
  ): boolean {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  private canStandUp(): boolean {
    const p = this.player;
    const diff = BASE_STAND_H - p.h;
    if (diff <= 0) return true;
    const testBox = {
      x: p.x + 2,
      y: p.y - diff,
      w: BASE_STAND_W - 4,
      h: BASE_STAND_H,
    };
    for (const t of this.level.tiles) {
      if (isNonSolidTile(t.kind)) continue;
      if (this.overlaps(testBox, t)) return false;
    }
    return true;
  }

  private addCoins(amount: number) {
    const prevThreshold = Math.floor(this.coins / 50);
    this.coins += amount;
    const newThreshold = Math.floor(this.coins / 50);
    if (newThreshold > prevThreshold) {
      this.player.healthStamina = this.player.maxHealthStamina;
      if (this.player.lives < this.player.maxLives) {
        this.player.lives++;
        this.addText(
          this.player.x,
          this.player.y - 30,
          this.lang === 'de' ? '+1 Leben!' : '+1 Life!',
          '#34d399'
        );
      } else {
        this.addText(
          this.player.x,
          this.player.y - 30,
          this.lang === 'de' ? 'Energie voll!' : 'Full Energy!',
          '#34d399'
        );
      }
      soundEngine.heal();
    }
  }

  private damagePlayer(amount: number, fromPitOrLava: boolean) {
    const p = this.player;
    if (p.invulnTimer > 0 && !fromPitOrLava) return;

    const finalAmt =
      !fromPitOrLava && p.isShielding ? Math.max(5, Math.round(amount * 0.4)) : amount;

    p.healthStamina = Math.max(0, p.healthStamina - finalAmt);
    p.grabbedVineId = null;
    p.onLadder = false;
    p.isSliding = false;
    this.screenShake = 8;

    if (p.healthStamina > 0) {
      soundEngine.hurt();
      p.invulnTimer = 75;
      p.hitFlash = 16;
      this.addText(p.x, p.y - 16, `-${finalAmt} ${this.t().energy}`, '#fb7185');
      this.addParticles(p.x + p.w / 2, p.y + p.h / 2, '#fb7185', 10, 5, 0.2);

      if (fromPitOrLava) {
        p.x = p.safeX;
        p.y = p.safeY - 12;
        p.vx = 0;
        p.vy = -4;
        p.jumpsRemaining = 2;
        this.addParticles(p.x + p.w / 2, p.y + p.h / 2, '#38bdf8', 16, 6, 0.1, true);
        this.addText(p.x, p.y - 36, this.t().floatRescueBubble, '#38bdf8');
      } else if (this.level.theme.mode === 'platformer') {
        p.vy = -7;
        p.vx = p.facingRight ? -4.5 : 4.5;
      } else {
        p.vx = -3;
      }
      this.emitHud();
      return;
    }

    p.lives = Math.max(0, p.lives - 1);
    soundEngine.lifeLost();

    if (p.lives <= 0) {
      this.isRunning = false;
      this.emitHud();
      this.callbacks.onGameOver(this.score, this.coins);
      return;
    }

    const mode = this.level.theme.mode;
    const isVeh = isVehicleMode(mode);
    const dims = getVehicleDimensions(mode);
    p.healthStamina = p.maxHealthStamina;
    p.toolEnergy = p.maxToolEnergy;
    p.invulnTimer = 110;
    p.hitFlash = 20;
    p.isCrouching = false;
    p.grabbedVineId = null;
    p.onLadder = false;
    p.isSliding = false;
    p.isSpringLaunch = false;
    p.w = dims.w;
    p.h = dims.h;
    p.x = p.checkpointX;
    p.y = p.checkpointY - (isVeh ? 0 : 12);
    p.safeX = p.checkpointX;
    p.safeY = p.checkpointY;
    p.vx = 0;
    p.vy = isVeh ? 0 : -3;
    p.jumpsRemaining = 2;

    this.addParticles(p.x + p.w / 2, p.y + p.h / 2, '#fbbf24', 20, 7, 0.12, true);
    this.addText(p.x, p.y - 24, this.t().floatLifeLost, '#facc15');
    this.emitHud();
  }

  private getAttackHitbox() {
    const p = this.player;
    const hasHammer = this.hasTool('thunder_hammer');
    const hasSword = this.hasTool('sun_sword');
    const hasGloves = this.hasTool('power_gloves');
    const reach = hasHammer ? 96 : hasSword ? 86 : hasGloves ? 58 : 50;
    return {
      x: p.facingRight ? p.x + p.w - 8 : p.x - reach + 8,
      y: p.y + 4,
      w: reach,
      h: p.h - 6,
    };
  }

  private getMeleeDamage(): number {
    if (this.hasTool('thunder_hammer')) return 4;
    if (this.hasTool('sun_sword')) return 3;
    if (this.hasTool('power_gloves')) return 2;
    return 1;
  }

  private hitBlock(tile: LevelDefinition['tiles'][number], fromBelow: boolean) {
    if (tile.kind === 'question' && !tile.used) {
      tile.used = true;
      tile.kind = 'used';
      tile.bumpY = -10;
      const reward = tile.reward ?? 'coin';

      if (reward === 'coin') {
        this.addCoins(1);
        this.score += 100;
        soundEngine.coin();
        this.addParticles(tile.x + 24, tile.y - 10, '#facc15', 10, 5);
        this.addText(tile.x + 8, tile.y - 16, '+100', '#facc15');
      } else if (reward === 'coins_burst') {
        this.addCoins(5);
        this.score += 500;
        soundEngine.gem();
        this.addParticles(tile.x + 24, tile.y - 10, '#facc15', 18, 7, 0.2, true);
        this.addText(
          tile.x,
          tile.y - 18,
          this.lang === 'de' ? '+5 Münzen!' : '+5 Coins!',
          '#facc15'
        );
      } else if (reward === 'heart' || reward === 'big_heart') {
        const heal = reward === 'big_heart' ? 60 : 35;
        this.player.healthStamina = Math.min(
          this.player.maxHealthStamina,
          this.player.healthStamina + heal
        );
        soundEngine.heal();
        this.addParticles(tile.x + 24, tile.y - 10, '#fb7185', 14, 6, 0.15, true);
        this.addText(tile.x, tile.y - 18, `+${heal} ${this.t().energy}`, '#34d399');
      }
      this.emitHud();
    } else if (tile.kind === 'brick' && (fromBelow || this.player.attackTimer > 0)) {
      soundEngine.blockBreak();
      this.score += 50;
      this.addParticles(tile.x + 24, tile.y + 24, '#d97706', 12, 6);
      this.level.tiles = this.level.tiles.filter((t) => t.id !== tile.id);
    } else if (tile.kind === 'cracked' && this.hasTool('power_gloves')) {
      soundEngine.blockBreak();
      this.screenShake = 6;
      this.score += 120;
      this.addParticles(tile.x + 24, tile.y + 24, '#94a3b8', 16, 7);
      this.addText(tile.x, tile.y - 12, this.t().floatSmashed, '#f97316');
      this.level.tiles = this.level.tiles.filter((t) => t.id !== tile.id);
    } else if (tile.kind === 'cracked' && !fromBelow) {
      this.addText(tile.x - 16, tile.y - 14, this.t().floatNeedGloves, '#cbd5e1');
    } else {
      tile.bumpY = -6;
    }
  }

  public update(input: InputState) {
    if (!this.isRunning) return;
    this.tick++;

    if (this.screenShake > 0) {
      this.screenShake = Math.max(0, this.screenShake - 0.8);
    }

    if (this.recentToolTimer > 0) {
      this.recentToolTimer--;
      if (this.recentToolTimer === 0) {
        this.recentToolUnlock = null;
        this.emitHud();
      }
    }

    if (this.levelFinishTimer > 0) {
      this.levelFinishTimer--;
      if (this.tick % 8 === 0) {
        this.addParticles(
          this.cameraX + 180 + Math.random() * (this.viewW - 360),
          140 + Math.random() * 220,
          Math.random() > 0.5 ? '#facc15' : '#34d399',
          14,
          7,
          0.14,
          true
        );
      }
      this.updateParticlesAndTexts();
      if (this.levelFinishTimer === 0) {
        this.isRunning = false;
        soundEngine.stopMusic();
        if (this.levelIndex < 9) {
          this.callbacks.onLevelClear(this.levelIndex, this.score, this.coins);
        } else {
          this.callbacks.onVictory(this.score, this.coins);
        }
      }
      return;
    }

    const p = this.player;
    if (p.invulnTimer > 0) p.invulnTimer--;
    if (p.hitFlash > 0) p.hitFlash--;
    if (p.attackTimer > 0) p.attackTimer--;
    if (p.attackCooldown > 0) p.attackCooldown--;
    if (p.boomerangCooldown > 0) p.boomerangCooldown--;
    if (p.vineCooldown > 0) p.vineCooldown--;
    if (p.boostTimer > 0) p.boostTimer--;
    p.toolEnergy = Math.min(p.maxToolEnergy, p.toolEnergy + 0.65);

    p.isShielding = input.shieldHeld && this.hasTool('aegis_shield') && p.toolEnergy > 5;
    if (p.isShielding) {
      p.toolEnergy = Math.max(0, p.toolEnergy - 0.3);
    }

    // Ambient bubble stream particles in Reef World 5
    if (this.level.theme.backdropStyle === 'reef' && this.tick % 12 === 0) {
      this.particles.push({
        x: this.cameraX + Math.random() * this.viewW,
        y: GAME_H - 60,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -1.6 - Math.random() * 1.4,
        size: 6 + Math.random() * 6,
        color: 'rgba(224, 242, 254, 0.55)',
        life: 90,
        maxLife: 90,
        gravity: -0.01,
      });
    }

    // Ambient snow flakes in Mountain World 7
    if (this.level.theme.backdropStyle === 'mountain' && this.tick % 6 === 0) {
      this.particles.push({
        x: this.cameraX + Math.random() * this.viewW,
        y: 0,
        vx: -0.9 + Math.random() * 0.5,
        vy: 1.5 + Math.random() * 1.4,
        size: 4 + Math.random() * 4,
        color: 'rgba(255, 255, 255, 0.72)',
        life: 160,
        maxLife: 160,
        gravity: 0,
      });
    }

    if (isVehicleMode(this.level.theme.mode)) {
      this.updateVehicleOrFlightMode(input);
    } else {
      this.updatePlatformerMode(input);
    }

    this.updateParticlesAndTexts();
    this.hudSyncCounter++;
    if (this.hudSyncCounter >= 4) {
      this.hudSyncCounter = 0;
      this.emitHud();
    }
  }

  private spawnHomingRocket(x: number, y: number, facingRight = true) {
    soundEngine.rocket();
    this.projectiles.push({
      id: this.nextProjId++,
      fromPlayer: true,
      kind: 'rocket',
      x,
      y,
      w: 32,
      h: 18,
      vx: facingRight ? 9.5 : -9.5,
      vy: 0,
      damage: 4,
      life: 95,
      maxLife: 95,
      homing: true,
      rotation: facingRight ? 0 : Math.PI,
    });
  }

  private updateVehicleOrFlightMode(input: InputState) {
    const p = this.player;
    const mode = this.level.theme.mode;
    const hasTurbo = this.hasTool('turbo_boots');
    const isJet = mode === 'jet_shooter';
    const isPlane = mode === 'plane_shooter';
    const isBalloon = mode === 'balloon_flight';

    const maxSpd =
      (hasTurbo ? 6.8 : 5.5) + (isJet ? 1.5 : isPlane ? 0.7 : 0);
    const bossActive = this.level.boss.active;

    const cruiseVx = bossActive
      ? 0
      : p.boostTimer > 0
      ? maxSpd + 2.2
      : isJet
      ? 3.1
      : isPlane
      ? 2.4
      : isBalloon
      ? 1.65
      : 1.85;

    let targetVx = cruiseVx;
    let targetVy = isBalloon ? 1.75 : 0; // Balloon naturally settles downward gently!

    if (input.left) targetVx = -maxSpd * 0.85;
    if (input.right) targetVx = maxSpd + (p.boostTimer > 0 ? 1.5 : 0);

    if (isBalloon) {
      if (input.up || input.jumpHeld) {
        targetVy = -4.9;
        if (this.tick % 4 === 0) {
          this.particles.push({
            x: p.x + p.w / 2 + (Math.random() - 0.5) * 8,
            y: p.y + p.h - 14,
            vx: -1.1 + (Math.random() - 0.5) * 0.8,
            vy: 2.2,
            size: 7,
            color: '#fb923c',
            life: 16,
            maxLife: 16,
            gravity: -0.05,
            glow: true,
          });
        }
      } else if (input.down) {
        targetVy = 4.5;
      }
      if (input.jumpJustPressed) {
        p.vy = Math.min(p.vy, -4.5);
        this.addParticles(p.x + p.w / 2, p.y + p.h - 10, '#facc15', 6, 3, 0, true);
      }
    } else {
      if (input.up || input.jumpHeld) targetVy = -maxSpd * 0.92;
      if (input.down) targetVy = maxSpd * 0.92;
      if (input.jumpJustPressed && !input.up) {
        targetVx += 4.8;
        this.addParticles(
          p.x,
          p.y + p.h / 2,
          isJet ? '#38bdf8' : isPlane ? '#fef08a' : '#bae6fd',
          10,
          4,
          0,
          isJet
        );
      }
    }
    input.jumpJustPressed = false;

    p.vx += (targetVx - p.vx) * 0.16;
    p.vy += (targetVy - p.vy) * (isBalloon ? 0.1 : 0.18);
    p.facingRight = true;

    p.x += p.vx;
    p.y += p.vy;

    const minX = bossActive ? this.level.boss.arenaMinX + 20 : 20;
    const maxX = bossActive
      ? this.level.boss.arenaMaxX - p.w - 20
      : this.level.width - p.w - 20;
    p.x = Math.max(minX, Math.min(maxX, p.x));
    const minTopY = mode === 'topdown_boat' ? 96 : 64;
    const maxBotY = mode === 'topdown_boat' ? GAME_H - 96 - p.h : GAME_H - 72 - p.h;
    p.y = Math.max(minTopY, Math.min(maxBotY, p.y));

    // Vehicle Exhaust / Wake Particles
    if (this.tick % 3 === 0) {
      if (mode === 'topdown_boat') {
        this.particles.push({
          x: p.x + 6,
          y: p.y + p.h / 2 + (Math.random() - 0.5) * 16,
          vx: -2.2,
          vy: (Math.random() - 0.5) * 0.8,
          size: 5 + Math.random() * 4,
          color: 'rgba(224, 242, 254, 0.75)',
          life: 16,
          maxLife: 16,
          gravity: 0,
        });
      } else if (isJet) {
        this.particles.push({
          x: p.x - 4,
          y: p.y + p.h / 2 + (Math.random() - 0.5) * 6,
          vx: -4.2,
          vy: (Math.random() - 0.5) * 0.5,
          size: 7 + Math.random() * 4,
          color: this.tick % 6 === 0 ? '#38bdf8' : '#f97316',
          life: 14,
          maxLife: 14,
          gravity: 0,
          glow: true,
        });
      } else if (isPlane) {
        this.particles.push({
          x: p.x - 2,
          y: p.y + p.h / 2 + (Math.random() - 0.5) * 8,
          vx: -3.0,
          vy: (Math.random() - 0.5) * 0.6,
          size: 4 + Math.random() * 3,
          color: 'rgba(255, 255, 255, 0.65)',
          life: 14,
          maxLife: 14,
          gravity: 0,
        });
      }
    }

    // Primary Fire (Attack button)
    if (input.attackJustPressed && p.attackCooldown <= 0) {
      p.attackTimer = 10;
      if (isJet) {
        p.attackCooldown = 11;
        soundEngine.fire();
        [-10, 8].forEach((yOff) => {
          this.projectiles.push({
            id: this.nextProjId++,
            fromPlayer: true,
            kind: 'laser',
            x: p.x + p.w,
            y: p.y + p.h / 2 + yOff - 3,
            w: 32,
            h: 8,
            vx: 15.5,
            vy: 0,
            damage: 2,
            life: 45,
            maxLife: 45,
            rotation: 0,
          });
        });
      } else if (isPlane) {
        p.attackCooldown = 13;
        soundEngine.fire();
        this.projectiles.push({
          id: this.nextProjId++,
          fromPlayer: true,
          kind: 'fire_orb',
          x: p.x + p.w,
          y: p.y + p.h / 2 - 10,
          w: 24,
          h: 20,
          vx: 13.5,
          vy: 0,
          damage: 2.5,
          life: 46,
          maxLife: 46,
          rotation: 0,
        });
      } else if (isBalloon) {
        p.attackCooldown = 15;
        soundEngine.fire();
        this.projectiles.push({
          id: this.nextProjId++,
          fromPlayer: true,
          kind: 'fire_orb',
          x: p.x + p.w,
          y: p.y + p.h * 0.65 - 10,
          w: 24,
          h: 24,
          vx: 11.5,
          vy: 0,
          damage: 2.5,
          life: 46,
          maxLife: 46,
          rotation: 0,
        });
      } else {
        p.attackCooldown = 16;
        soundEngine.boomerang();
        this.projectiles.push({
          id: this.nextProjId++,
          fromPlayer: true,
          kind: this.hasTool('sun_sword') ? 'shockwave' : 'boomerang',
          x: p.x + p.w,
          y: p.y + p.h / 2 - 14,
          w: 30,
          h: 28,
          vx: 11.5,
          vy: 0,
          damage: this.hasTool('sun_sword') ? 3 : 2,
          life: 44,
          maxLife: 44,
          returning: false,
          rotation: 0,
        });
      }
    }

    // Special / Rocket Pod (Tool button)
    if (input.toolJustPressed && p.boomerangCooldown <= 0) {
      if (isJet || this.hasTool('rocket_pod')) {
        p.boomerangCooldown = isJet ? 22 : 28;
        this.spawnHomingRocket(p.x + p.w, p.y + p.h / 2 - 9, true);
      } else if (p.attackCooldown <= 0) {
        p.attackCooldown = 16;
        soundEngine.boomerang();
        this.projectiles.push({
          id: this.nextProjId++,
          fromPlayer: true,
          kind: this.hasTool('sun_sword') ? 'shockwave' : 'boomerang',
          x: p.x + p.w,
          y: p.y + p.h / 2 - 14,
          w: 30,
          h: 28,
          vx: 11.5,
          vy: 0,
          damage: this.hasTool('sun_sword') ? 3 : 2,
          life: 44,
          maxLife: 44,
          returning: false,
          rotation: 0,
        });
      }
    }
    input.attackJustPressed = false;
    input.toolJustPressed = false;

    for (const cp of this.level.checkpoints) {
      if (!cp.activated && p.x + p.w / 2 >= cp.x) {
        cp.activated = true;
        p.checkpointX = cp.x;
        p.checkpointY = cp.y;
        p.healthStamina = Math.min(p.maxHealthStamina, p.healthStamina + 25);
        soundEngine.checkpoint();
        this.addParticles(cp.x + 12, cp.y + 12, '#34d399', 16, 6, 0, true);
        this.addText(cp.x - 20, cp.y - 24, this.t().floatCheckpoint, '#34d399');
        this.emitHud();
      }
    }

    for (const col of this.level.collectibles) {
      if (!col.collected && this.overlaps(p, col)) {
        this.collectItem(col);
      }
    }

    for (const obs of this.level.boatObstacles) {
      if (!obs.alive) continue;
      if (obs.hitFlash > 0) obs.hitFlash--;

      if (obs.kind === 'mine') {
        obs.y += obs.vy;
        if (obs.y < 105 || obs.y > GAME_H - 145) {
          obs.vy *= -1;
        }
      } else if (obs.kind === 'asteroid') {
        obs.phase += 0.04;
      }

      if (this.overlaps(p, obs)) {
        if (obs.kind === 'ring_gate') {
          obs.alive = false;
          this.addCoins(3);
          this.score += 300;
          p.boostTimer = 32;
          soundEngine.gem();
          this.addParticles(obs.x + obs.w / 2, obs.y + obs.h / 2, '#facc15', 18, 6, 0, true);
          this.addText(obs.x, obs.y - 12, `${this.t().floatRing} +300`, '#fde047');
          this.emitHud();
        } else if (obs.kind === 'crate' || obs.kind === 'heart_crate') {
          this.smashBoatCrate(obs);
        } else if (obs.kind === 'whirlpool') {
          p.vx *= 0.4;
          p.vy += Math.sin(this.tick * 0.4) * 3;
          if (!p.isShielding) {
            this.damagePlayer(15, false);
          }
        } else {
          if (obs.kind === 'mine' || obs.kind === 'asteroid') {
            obs.alive = false;
            this.addParticles(obs.x + 22, obs.y + 22, '#fb923c', 16, 7);
          }
          if (p.isShielding) {
            this.addText(p.x, p.y - 16, this.t().floatShieldBlock, '#38bdf8');
            p.invulnTimer = 30;
          } else {
            this.damagePlayer(20, false);
          }
        }
      }
    }

    this.updateProjectiles();
    this.updateBoss();

    if (this.level.boss.active) {
      const targetCam = Math.max(
        0,
        this.level.boss.arenaMaxX - this.viewW + 40
      );
      this.cameraX += (targetCam - this.cameraX) * 0.12;
    } else {
      const desiredCam = Math.max(
        0,
        Math.min(this.level.width - this.viewW, p.x - this.viewW * 0.25)
      );
      this.cameraX += (desiredCam - this.cameraX) * 0.14;
    }
  }

  private smashBoatCrate(obs: LevelDefinition['boatObstacles'][number]) {
    obs.alive = false;
    soundEngine.blockBreak();
    this.addParticles(obs.x + 24, obs.y + 24, '#d97706', 14, 6);
    if (obs.kind === 'heart_crate') {
      this.player.healthStamina = Math.min(
        this.player.maxHealthStamina,
        this.player.healthStamina + 35
      );
      soundEngine.heal();
      this.addText(obs.x, obs.y - 12, `+35 ${this.t().energy}`, '#34d399');
    } else {
      this.addCoins(3);
      this.score += 250;
      soundEngine.coin();
      this.addText(obs.x, obs.y - 12, '+250', '#facc15');
    }
    this.emitHud();
  }

  private checkLadderOverlap(verticalExpand = 0): boolean {
    const p = this.player;
    const probe = {
      x: p.x + 10,
      y: p.y - verticalExpand * 0.5,
      w: p.w - 20,
      h: p.h + verticalExpand,
    };
    for (const t of this.level.tiles) {
      if (t.kind === 'ladder' && this.overlaps(probe, t)) {
        return true;
      }
    }
    return false;
  }

  private updatePlatformerMode(input: InputState) {
    const p = this.player;
    const gravity = this.level.theme.lowGravity ? 0.42 : BASE_GRAVITY;

    // Gentle idle sway on ungrabbed vines
    for (const v of this.level.vines) {
      if (p.grabbedVineId !== v.id) {
        v.angVel += -0.015 * Math.sin(v.angle);
        v.angVel *= 0.985;
        v.angle += v.angVel;
      }
    }

    for (const t of this.level.tiles) {
      if (t.bumpY !== 0) {
        t.bumpY *= 0.72;
        if (Math.abs(t.bumpY) < 0.4) t.bumpY = 0;
      }
      if (t.springAnim && t.springAnim > 0) t.springAnim--;
    }

    for (const plat of this.level.platforms) {
      const prevX = plat.x;
      const prevY = plat.y;
      plat.progress += plat.speed * plat.dir;
      if (plat.progress >= 1) {
        plat.progress = 1;
        plat.dir = -1;
      } else if (plat.progress <= 0) {
        plat.progress = 0;
        plat.dir = 1;
      }
      const smooth = 0.5 - 0.5 * Math.cos(plat.progress * Math.PI);
      plat.x = plat.startX + (plat.endX - plat.startX) * smooth;
      plat.y = plat.startY + (plat.endY - plat.startY) * smooth;
      plat.dx = plat.x - prevX;
      plat.dy = plat.y - prevY;
    }

    // Swinging Vine Physics if grabbed!
    if (p.grabbedVineId !== null) {
      const vine = this.level.vines.find((v) => v.id === p.grabbedVineId);
      if (vine) {
        if (input.left) {
          vine.angVel -= 0.0045;
          p.facingRight = false;
        }
        if (input.right) {
          vine.angVel += 0.0045;
          p.facingRight = true;
        }
        if (input.up) p.vineOffset = Math.max(0.35, p.vineOffset - 0.02);
        if (input.down) p.vineOffset = Math.min(0.96, p.vineOffset + 0.02);

        vine.angVel += -0.018 * Math.sin(vine.angle);
        vine.angVel *= 0.99;
        vine.angle = Math.max(-0.95, Math.min(0.95, vine.angle + vine.angVel));

        const handDist = vine.length * p.vineOffset;
        p.x = vine.anchorX + Math.sin(vine.angle) * handDist - p.w / 2;
        p.y = vine.anchorY + Math.cos(vine.angle) * handDist - p.h * 0.25;
        p.vx = Math.cos(vine.angle) * vine.angVel * handDist;
        p.vy = -Math.sin(vine.angle) * vine.angVel * handDist;
        p.jumpsRemaining = 2;

        if (input.jumpJustPressed) {
          input.jumpJustPressed = false;
          p.grabbedVineId = null;
          p.vineCooldown = 22;
          p.vy = -12.8;
          p.vx = (p.facingRight ? 4.5 : -4.5) + vine.angVel * handDist * 1.1;
          soundEngine.jump();
          this.addParticles(p.x + p.w / 2, p.y + p.h / 2, '#4ade80', 8, 4, 0.1);
        }

        const desiredCam = Math.max(
          0,
          Math.min(this.level.width - this.viewW, p.x - this.viewW * 0.36)
        );
        this.cameraX += (desiredCam - this.cameraX) * 0.14;
        return;
      } else {
        p.grabbedVineId = null;
      }
    }

    // Grab nearby Vine when airborne!
    if (!p.onGround && !p.onLadder && p.vineCooldown <= 0) {
      const pcx = p.x + p.w / 2;
      const pcy = p.y + p.h * 0.35;
      for (const vine of this.level.vines) {
        const endX = vine.anchorX + Math.sin(vine.angle) * vine.length;
        const endY = vine.anchorY + Math.cos(vine.angle) * vine.length;
        const midX = (vine.anchorX + endX) / 2;
        const midY = (vine.anchorY + endY) / 2;
        if (
          Math.hypot(pcx - endX, pcy - endY) < 42 ||
          Math.hypot(pcx - midX, pcy - midY) < 42
        ) {
          p.grabbedVineId = vine.id;
          p.vineOffset = 0.78;
          vine.angVel = p.vx * 0.008;
          p.isCrouching = false;
          p.isSliding = false;
          p.isSpringLaunch = false;
          soundEngine.checkpoint();
          this.addText(p.x, p.y - 12, this.t().floatVine, '#4ade80');
          break;
        }
      }
    }

    // Ladder Grab Check
    const overlappingLadder = this.checkLadderOverlap(8);
    if (!p.onLadder && overlappingLadder && (input.up || (input.down && !p.onGround))) {
      if (p.isCrouching) {
        p.y -= BASE_STAND_H - p.h;
        p.h = BASE_STAND_H;
        p.w = BASE_STAND_W;
        p.isCrouching = false;
      }
      p.onLadder = true;
      p.isSliding = false;
      p.isSpringLaunch = false;
      p.jumpsRemaining = 2;
    } else if (p.onLadder && !this.checkLadderOverlap(18)) {
      p.onLadder = false;
    }

    const hasTurbo = this.hasTool('turbo_boots');
    const jumpPower = this.level.theme.lowGravity
      ? -12.6
      : hasTurbo
      ? -15.0
      : -14.2;
    const doubleJumpPower = this.level.theme.lowGravity
      ? -11.4
      : hasTurbo
      ? -13.6
      : -12.8;

    if (p.onLadder) {
      p.vx = input.left ? -3.4 : input.right ? 3.4 : 0;
      p.vy = input.up ? -4.8 : input.down ? 4.8 : 0;
      if (input.left) p.facingRight = false;
      if (input.right) p.facingRight = true;
      p.onGround = false;
      p.jumpsRemaining = 2;

      if (Math.abs(p.vy) > 0.2) {
        p.animTimer += 0.28;
      }

      if (input.jumpJustPressed) {
        input.jumpJustPressed = false;
        p.onLadder = false;
        p.vy = jumpPower;
        p.jumpsRemaining = 1;
        soundEngine.jump();
      } else {
        input.jumpJustPressed = false;
      }

      p.x += p.vx;
      const minCamBound = this.level.boss.active ? this.level.boss.arenaMinX : 0;
      const maxWorldBound = this.level.boss.active
        ? this.level.boss.arenaMaxX - p.w
        : this.level.width - p.w;
      p.x = Math.max(minCamBound, Math.min(maxWorldBound, p.x));
      p.y += p.vy;

      for (const t of this.level.tiles) {
        if (isNonSolidTile(t.kind)) continue;
        if (this.overlaps(p, t)) {
          if (p.vy > 0) {
            p.y = t.y - p.h;
            p.vy = 0;
            p.onGround = true;
            p.onLadder = false;
          } else if (p.vy < 0) {
            p.y = t.y + t.h;
            p.vy = 0;
          }
        }
      }
      input.attackJustPressed = false;
      input.toolJustPressed = false;

      for (const col of this.level.collectibles) {
        if (!col.collected && this.overlaps(p, col)) {
          this.collectItem(col);
        }
      }
      this.updateProjectiles();
      this.updateEnemies();
      this.updateBoss();
      const desiredCam = Math.max(
        0,
        Math.min(this.level.width - this.viewW, p.x - this.viewW * 0.36)
      );
      this.cameraX += (desiredCam - this.cameraX) * 0.14;
      return;
    }

    // Crouch
    if (input.down && p.onGround && !p.isSliding) {
      if (!p.isCrouching) {
        p.y += p.h - CROUCH_H;
        p.h = CROUCH_H;
        p.w = CROUCH_W;
        p.isCrouching = true;
      }
    } else if (p.isCrouching && this.canStandUp()) {
      p.y -= BASE_STAND_H - p.h;
      p.h = BASE_STAND_H;
      p.w = BASE_STAND_W;
      p.isCrouching = false;
    }

    // Horizontal Movement
    const isBoosted = p.boostTimer > 0;
    const baseMaxSpeed = isBoosted ? 11.2 : hasTurbo ? 7.1 : 5.6;
    const maxSpeed = p.isCrouching ? baseMaxSpeed * 0.55 : baseMaxSpeed;
    const accel = isBoosted ? 1.2 : hasTurbo ? 0.85 : 0.68;

    if (input.left) {
      p.vx = Math.max(p.vx - accel, -maxSpeed);
      p.facingRight = false;
    } else if (input.right) {
      p.vx = Math.min(p.vx + accel, maxSpeed);
      p.facingRight = true;
    } else if (!isBoosted && !p.isSliding) {
      p.vx *= 0.8;
      if (Math.abs(p.vx) < 0.12) p.vx = 0;
    }

    if ((hasTurbo || isBoosted) && Math.abs(p.vx) > 5.5 && this.tick % 2 === 0) {
      this.particles.push({
        x: p.x + p.w / 2,
        y: p.y + p.h - 10,
        vx: -p.vx * 0.2,
        vy: -0.4,
        size: isBoosted ? 7 : 5,
        color: isBoosted ? '#facc15' : '#22d3ee',
        life: 14,
        maxLife: 14,
        gravity: 0,
        glow: true,
      });
    }

    // Jump & Double Jump
    if (input.jumpJustPressed) {
      p.jumpBufferTimer = 8;
    } else if (p.jumpBufferTimer > 0) {
      p.jumpBufferTimer--;
    }
    input.jumpJustPressed = false;

    if (p.onGround) p.coyoteTimer = 8;
    else if (p.coyoteTimer > 0) p.coyoteTimer--;

    if (p.jumpBufferTimer > 0) {
      if (p.coyoteTimer > 0) {
        if (p.isCrouching && this.canStandUp()) {
          p.y -= BASE_STAND_H - p.h;
          p.h = BASE_STAND_H;
          p.w = BASE_STAND_W;
          p.isCrouching = false;
        }
        p.vy = jumpPower;
        p.onGround = false;
        p.isSliding = false;
        p.isSpringLaunch = false;
        p.coyoteTimer = 0;
        p.jumpBufferTimer = 0;
        p.jumpsRemaining = 1;
        soundEngine.jump();
        this.addParticles(p.x + p.w / 2, p.y + p.h, '#e2e8f0', 6, 3, 0.1);
      } else if (p.jumpsRemaining >= 2) {
        p.isSpringLaunch = false;
        p.vy = p.vy < -8 ? Math.max(-23, p.vy - 6) : jumpPower;
        p.jumpsRemaining = 1;
        p.jumpBufferTimer = 0;
        soundEngine.jump();
        this.addParticles(p.x + p.w / 2, p.y + p.h, '#e2e8f0', 8, 4, 0.08);
      } else if (p.jumpsRemaining > 0) {
        p.isSpringLaunch = false;
        p.vy = p.vy < -8 ? Math.max(-23, p.vy - 5.5) : doubleJumpPower;
        p.jumpsRemaining = 0;
        p.jumpBufferTimer = 0;
        soundEngine.doubleJump();
        this.addParticles(p.x + p.w / 2, p.y + p.h, '#38bdf8', 12, 5, 0.05, true);
        this.addText(p.x - 10, p.y + p.h, this.t().floatDoubleJump, '#bae6fd');
      }
    }

    if (!input.jumpHeld && !p.isSpringLaunch && p.vy < -5.2) {
      p.vy *= 0.85;
    }

    // Melee & Weapon Attack
    if (input.attackJustPressed && p.attackCooldown <= 0 && !p.isCrouching) {
      const hasGloves = this.hasTool('power_gloves');
      const hasSword = this.hasTool('sun_sword');
      const hasFire = this.hasTool('fire_blaster');
      const hasHammer = this.hasTool('thunder_hammer');

      p.attackTimer = 14;
      p.attackCooldown = 19;
      if (hasFire && !hasHammer) {
        soundEngine.fire();
      } else {
        soundEngine.punch(hasGloves || hasSword || hasHammer);
      }

      const atkBox = this.getAttackHitbox();
      for (const t of [...this.level.tiles]) {
        if (
          (t.kind === 'brick' ||
            t.kind === 'cracked' ||
            (t.kind === 'question' && !t.used)) &&
          this.overlaps(atkBox, t)
        ) {
          this.hitBlock(t, false);
        }
      }

      if (hasHammer) {
        this.screenShake = Math.max(this.screenShake, 4.5);
        this.projectiles.push({
          id: this.nextProjId++,
          fromPlayer: true,
          kind: 'lightning',
          x: p.facingRight ? p.x + p.w : p.x - 36,
          y: p.y + 8,
          w: 36,
          h: 44,
          vx: p.facingRight ? 11.5 : -11.5,
          vy: 0,
          damage: 3,
          life: 28,
          maxLife: 28,
          rotation: 0,
        });
      } else if (hasGloves || hasSword) {
        this.projectiles.push({
          id: this.nextProjId++,
          fromPlayer: true,
          kind: 'shockwave',
          x: p.facingRight ? p.x + p.w : p.x - 28,
          y: p.y + 12,
          w: 28,
          h: 36,
          vx: p.facingRight ? 9.5 : -9.5,
          vy: 0,
          damage: hasSword ? 2 : 1,
          life: hasSword ? 22 : 13,
          maxLife: hasSword ? 22 : 13,
          rotation: 0,
        });
      }

      if (hasFire) {
        soundEngine.fire();
        this.projectiles.push({
          id: this.nextProjId++,
          fromPlayer: true,
          kind: 'fire_orb',
          x: p.facingRight ? p.x + p.w : p.x - 24,
          y: p.y + 18,
          w: 24,
          h: 24,
          vx: p.facingRight ? 11.0 : -11.0,
          vy: 0,
          damage: 2,
          life: 44,
          maxLife: 44,
          rotation: 0,
        });
      }
    }
    input.attackJustPressed = false;

    // Special Tool: Star Boomerang & Star Rocket Pod
    if (input.toolJustPressed) {
      const hasRocket = this.hasTool('rocket_pod');
      const hasBoomerang = this.hasTool('star_boomerang');
      if ((hasRocket || hasBoomerang) && p.boomerangCooldown <= 0 && p.toolEnergy >= 25) {
        p.toolEnergy -= 25;
        p.boomerangCooldown = 28;
        if (hasRocket) {
          this.spawnHomingRocket(
            p.facingRight ? p.x + p.w : p.x - 30,
            p.y + 18,
            p.facingRight
          );
        }
        if (hasBoomerang) {
          soundEngine.boomerang();
          this.projectiles.push({
            id: this.nextProjId++,
            fromPlayer: true,
            kind: 'boomerang',
            x: p.x + p.w / 2 - 15,
            y: p.y + 16,
            w: 30,
            h: 30,
            vx: p.facingRight ? 10.5 : -10.5,
            vy: 0,
            damage: 2,
            life: 62,
            maxLife: 62,
            returning: false,
            rotation: 0,
          });
        }
      }
    }
    input.toolJustPressed = false;

    // Gravity & X Collision
    p.vy = Math.min(p.vy + gravity, this.level.theme.lowGravity ? 10 : MAX_FALL);
    p.x += p.vx;
    const minCamBound = this.level.boss.active ? this.level.boss.arenaMinX : 0;
    const maxWorldBound = this.level.boss.active
      ? this.level.boss.arenaMaxX - p.w
      : this.level.width - p.w;

    if (p.x < minCamBound) {
      p.x = minCamBound;
      p.vx = 0;
    }
    if (p.x > maxWorldBound) {
      p.x = maxWorldBound;
      p.vx = 0;
    }

    for (const t of this.level.tiles) {
      if (isNonSolidTile(t.kind)) continue;
      if (this.overlaps(p, t)) {
        if (p.vx > 0) p.x = t.x - p.w;
        else if (p.vx < 0) p.x = t.x + t.w;
        p.vx = 0;
      }
    }

    // Y Collision
    p.y += p.vy;
    p.onGround = false;
    p.isSliding = false;

    for (const t of this.level.tiles) {
      if (t.kind === 'lava') {
        if (this.overlaps(p, t)) {
          this.damagePlayer(35, true);
          return;
        }
        continue;
      }
      if (t.kind === 'boost_pad') {
        if (this.overlaps(p, t) && p.boostTimer <= 30) {
          p.boostTimer = 42;
          p.vx = p.facingRight ? 11.2 : -11.2;
          soundEngine.boost();
          this.addText(p.x, p.y - 16, this.t().floatTurbo, '#facc15');
        }
        continue;
      }
      if (t.kind === 'bumper') {
        const pcx = p.x + p.w / 2;
        const pcy = p.y + p.h / 2;
        const bcx = t.x + t.w / 2;
        const bcy = t.y + t.h / 2;
        const dx = pcx - bcx;
        const dy = pcy - bcy;
        const dist = Math.hypot(dx, dy);
        if (dist < 36 && (!t.springAnim || t.springAnim < 10)) {
          const nx = dist > 0 ? dx / dist : 0;
          const ny = dist > 0 ? dy / dist : -1;
          p.vx = nx * 10.5;
          p.vy = Math.min(-11.5, ny * 13.5);
          p.isSpringLaunch = true;
          p.onGround = false;
          p.jumpsRemaining = 2;
          t.springAnim = 18;
          this.score += 100;
          soundEngine.bumper();
          this.addParticles(bcx, bcy, '#f43f5e', 14, 6, 0.1, true);
          this.addText(bcx - 10, bcy - 24, this.t().floatBumper, '#fde047');
        }
        continue;
      }
      if (t.kind === 'ladder' || t.kind === 'slide_right' || t.kind === 'slide_left') {
        continue;
      }

      if (this.overlaps(p, t)) {
        if (p.vy > 0) {
          p.y = t.y - p.h;
          p.vy = 0;
          p.onGround = true;
          p.jumpsRemaining = 2;

          if (t.kind === 'spring' || t.kind === 'jelly_pad') {
            p.vy = t.kind === 'jelly_pad' ? -22.0 : -21.0;
            p.onGround = false;
            p.isSpringLaunch = true;
            p.coyoteTimer = 0;
            p.jumpBufferTimer = 0;
            p.jumpsRemaining = 2;
            t.springAnim = 18;
            soundEngine.spring();
            this.addParticles(
              t.x + 24,
              t.y,
              t.kind === 'jelly_pad' ? '#f472b6' : '#facc15',
              14,
              6,
              0.15,
              true
            );
          } else {
            p.isSpringLaunch = false;
            if (t.kind === 'rope_bridge') {
              t.bumpY = 4;
            }
            if (
              t.kind === 'grass' ||
              t.kind === 'stone' ||
              t.kind === 'crystal' ||
              t.kind === 'cloud' ||
              t.kind === 'coral' ||
              t.kind === 'ice' ||
              t.kind === 'jungle_wood' ||
              t.kind === 'bridge' ||
              t.kind === 'rope_bridge'
            ) {
              p.safeX = Math.max(t.x, Math.min(t.x + t.w - p.w, p.x));
              p.safeY = t.y - BASE_STAND_H;
            }
          }
        } else if (p.vy < 0) {
          p.y = t.y + t.h;
          p.vy = 1.5;
          this.hitBlock(t, true);
        }
      }
    }

    // Sloped Slides Physics ('slide_right' / 'slide_left')
    const pCenterX = p.x + p.w / 2;
    for (const t of this.level.tiles) {
      if (t.kind !== 'slide_right' && t.kind !== 'slide_left') continue;
      if (pCenterX >= t.x - 6 && pCenterX <= t.x + t.w + 6) {
        const u = Math.max(0, Math.min(1, (pCenterX - t.x) / t.w));
        const surfY =
          t.kind === 'slide_right' ? t.y + u * t.h : t.y + (1 - u) * t.h;
        const feetY = p.y + p.h;
        if (feetY >= surfY - 8 && feetY <= surfY + 28 && p.vy >= -2) {
          p.y = surfY - p.h;
          p.vy = Math.max(0, p.vy);
          p.onGround = true;
          p.isSliding = true;
          p.isSpringLaunch = false;
          p.jumpsRemaining = 2;
          if (t.kind === 'slide_right') {
            p.vx = Math.max(p.vx + 0.6, 7.6);
            p.facingRight = true;
          } else {
            p.vx = Math.min(p.vx - 0.6, -7.6);
            p.facingRight = false;
          }
          if (this.tick % 4 === 0) {
            this.addParticles(
              pCenterX,
              surfY,
              this.level.theme.backdropStyle === 'mountain' ? '#bae6fd' : '#fde047',
              2,
              2.5,
              0.08,
              true
            );
          }
          break;
        }
      }
    }

    for (const plat of this.level.platforms) {
      if (
        p.vy >= 0 &&
        p.x + p.w > plat.x + 4 &&
        p.x < plat.x + plat.w - 4 &&
        p.y + p.h >= plat.y &&
        p.y + p.h - p.vy <= plat.y + 14
      ) {
        p.y = plat.y - p.h;
        p.vy = 0;
        p.onGround = true;
        p.isSpringLaunch = false;
        p.jumpsRemaining = 2;
        p.x += plat.dx;
        p.y += plat.dy;
      }
    }

    if (Math.abs(p.vx) > 0.25 && p.onGround && !p.isSliding) {
      p.animTimer += p.isCrouching
        ? 0.24
        : hasTurbo || isBoosted
        ? 0.32
        : 0.22;
    } else if (!p.isSliding) {
      p.animTimer = 0;
    }

    if (p.y > GAME_H + 36) {
      this.damagePlayer(35, true);
      return;
    }

    for (const cp of this.level.checkpoints) {
      if (
        !cp.activated &&
        Math.abs(p.x + p.w / 2 - cp.x) < 52 &&
        Math.abs(p.y + p.h - (cp.y + 72)) < 110
      ) {
        cp.activated = true;
        p.checkpointX = cp.x - 10;
        p.checkpointY = cp.y + 72 - BASE_STAND_H;
        p.safeX = p.checkpointX;
        p.safeY = p.checkpointY;
        p.healthStamina = Math.min(p.maxHealthStamina, p.healthStamina + 25);
        soundEngine.checkpoint();
        this.addParticles(cp.x + 12, cp.y + 20, '#34d399', 18, 6, 0.1, true);
        this.addText(cp.x - 20, cp.y - 10, this.t().floatCheckpoint, '#34d399');
        this.emitHud();
      }
    }

    for (const col of this.level.collectibles) {
      if (!col.collected && this.overlaps(p, col)) {
        this.collectItem(col);
      }
    }

    this.updateProjectiles();
    this.updateEnemies();
    this.updateBoss();

    if (this.level.boss.active) {
      const targetCam = Math.max(
        0,
        this.level.boss.arenaMaxX - this.viewW + 40
      );
      this.cameraX += (targetCam - this.cameraX) * 0.12;
    } else {
      const desiredCam = Math.max(
        0,
        Math.min(this.level.width - this.viewW, p.x - this.viewW * 0.36)
      );
      this.cameraX += (desiredCam - this.cameraX) * 0.14;
    }
  }

  private collectItem(col: LevelDefinition['collectibles'][number]) {
    col.collected = true;
    if (col.kind === 'coin') {
      this.addCoins(1);
      this.score += 100;
      soundEngine.coin();
      this.addParticles(col.x + 13, col.y + 15, '#facc15', 7, 4);
    } else if (col.kind === 'gem') {
      this.addCoins(3);
      this.score += 300;
      soundEngine.gem();
      this.addParticles(col.x + 15, col.y + 16, '#38bdf8', 12, 6, 0.15, true);
      this.addText(col.x, col.y - 10, '+300', '#38bdf8');
    } else if (col.kind === 'super_star') {
      this.starsCollected++;
      this.score += 750;
      this.player.healthStamina = Math.min(
        this.player.maxHealthStamina,
        this.player.healthStamina + 30
      );
      soundEngine.chest();
      this.addParticles(col.x + 18, col.y + 18, '#fde047', 22, 8, 0.1, true);
      this.addText(
        col.x - 16,
        col.y - 16,
        `${this.t().floatStar} (${this.starsCollected}/${this.totalStars})`,
        '#fde047'
      );
    } else if (col.kind === 'heart' || col.kind === 'apple') {
      const heal = col.kind === 'apple' ? 60 : 35;
      this.player.healthStamina = Math.min(
        this.player.maxHealthStamina,
        this.player.healthStamina + heal
      );
      this.score += 150;
      soundEngine.heal();
      this.addParticles(col.x + 15, col.y + 15, '#fb7185', 12, 5, 0.1, true);
      this.addText(col.x, col.y - 12, `+${heal} ${this.t().energy}`, '#34d399');
    } else if (col.kind === 'chest' && col.toolReward) {
      const toolId = col.toolReward;
      if (!this.player.tools.includes(toolId)) {
        this.player.tools.push(toolId);
      }
      const info = TOOLS_CATALOG[toolId];
      const toolName = this.lang === 'de' ? info.nameDe : info.nameEn;
      this.recentToolUnlock = info;
      this.recentToolTimer = 280;
      this.score += 1000;
      this.player.healthStamina = this.player.maxHealthStamina;
      soundEngine.chest();
      this.addParticles(col.x + 26, col.y + 18, info.color, 26, 8, 0.12, true);
      this.addText(
        col.x - 30,
        col.y - 24,
        `${this.t().newToolPrefix}: ${toolName}!`,
        info.color
      );
    }
    this.emitHud();
  }

  private findNearestHomingTarget(px: number, py: number): { x: number; y: number } | null {
    let best: { x: number; y: number } | null = null;
    let bestDist = 650;

    const boss = this.level.boss;
    if (boss.active && !boss.defeated) {
      const bx = boss.x + boss.w / 2;
      const by = boss.y + boss.h / 2;
      const d = Math.hypot(bx - px, by - py);
      if (d < bestDist) {
        bestDist = d;
        best = { x: bx, y: by };
      }
    }

    for (const e of this.level.enemies) {
      if (!e.alive) continue;
      const ex = e.x + e.w / 2;
      const ey = e.y + e.h / 2;
      const d = Math.hypot(ex - px, ey - py);
      if (d < bestDist) {
        bestDist = d;
        best = { x: ex, y: ey };
      }
    }

    for (const obs of this.level.boatObstacles) {
      if (!obs.alive) continue;
      if (
        obs.kind !== 'mine' &&
        obs.kind !== 'asteroid' &&
        obs.kind !== 'crate' &&
        obs.kind !== 'heart_crate'
      ) {
        continue;
      }
      const ox = obs.x + obs.w / 2;
      const oy = obs.y + obs.h / 2;
      const d = Math.hypot(ox - px, oy - py);
      if (d < bestDist) {
        bestDist = d;
        best = { x: ox, y: oy };
      }
    }

    return best;
  }

  private updateProjectiles() {
    const p = this.player;
    const isVeh = isVehicleMode(this.level.theme.mode);

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.life--;
      if (proj.kind !== 'rocket' && proj.kind !== 'laser') {
        proj.rotation += 0.35;
      }

      if (proj.kind === 'rocket' && proj.homing) {
        const target = this.findNearestHomingTarget(
          proj.x + proj.w / 2,
          proj.y + proj.h / 2
        );
        if (target) {
          const dx = target.x - (proj.x + proj.w / 2);
          const dy = target.y - (proj.y + proj.h / 2);
          const dist = Math.hypot(dx, dy) || 1;
          const desiredVx = (dx / dist) * 11.5;
          const desiredVy = (dy / dist) * 11.5;
          proj.vx += (desiredVx - proj.vx) * 0.14;
          proj.vy += (desiredVy - proj.vy) * 0.14;
        }
        proj.rotation = Math.atan2(proj.vy, proj.vx);
        if (this.tick % 2 === 0) {
          this.particles.push({
            x: proj.x + proj.w / 2 - Math.cos(proj.rotation) * 12,
            y: proj.y + proj.h / 2 - Math.sin(proj.rotation) * 12,
            vx: -proj.vx * 0.15 + (Math.random() - 0.5) * 0.6,
            vy: -proj.vy * 0.15 + (Math.random() - 0.5) * 0.6,
            size: 5 + Math.random() * 4,
            color: this.tick % 4 === 0 ? '#fb923c' : 'rgba(226, 232, 240, 0.75)',
            life: 16,
            maxLife: 16,
            gravity: 0,
          });
        }
      }

      if (proj.kind === 'boomerang' && !isVeh) {
        if (proj.life < proj.maxLife * 0.55) proj.returning = true;
        if (proj.returning) {
          const tx = p.x + p.w / 2 - proj.w / 2;
          const ty = p.y + p.h / 2 - proj.h / 2;
          const dx = tx - proj.x;
          const dy = ty - proj.y;
          const dist = Math.hypot(dx, dy) || 1;
          proj.vx = (dx / dist) * 12;
          proj.vy = (dy / dist) * 12;
          if (dist < 28) {
            this.projectiles.splice(i, 1);
            continue;
          }
        }
        proj.x += proj.vx;
        proj.y += proj.vy;

        for (const col of this.level.collectibles) {
          if (
            !col.collected &&
            (col.kind === 'coin' || col.kind === 'gem') &&
            this.overlaps(proj, col)
          ) {
            this.collectItem(col);
          }
        }
        for (const t of this.level.tiles) {
          if (t.kind === 'question' && !t.used && this.overlaps(proj, t)) {
            this.hitBlock(t, false);
          }
        }
      } else {
        proj.x += proj.vx;
        proj.y += proj.vy;
      }

      if (proj.fromPlayer) {
        for (const e of this.level.enemies) {
          if (e.alive && this.overlaps(proj, e)) {
            this.damageEnemy(e, proj.damage);
            if (proj.kind === 'rocket') {
              this.addParticles(proj.x, proj.y, '#fb923c', 16, 7, 0.1, true);
            }
            if (
              proj.kind === 'shockwave' ||
              proj.kind === 'fire_orb' ||
              proj.kind === 'lightning' ||
              proj.kind === 'rocket' ||
              proj.kind === 'laser' ||
              isVeh
            ) {
              proj.life = 0;
              break;
            }
          }
        }

        if (isVeh) {
          for (const obs of this.level.boatObstacles) {
            if (!obs.alive) continue;
            if (
              (obs.kind === 'crate' ||
                obs.kind === 'heart_crate' ||
                obs.kind === 'mine' ||
                obs.kind === 'asteroid') &&
              this.overlaps(proj, obs)
            ) {
              if (obs.kind === 'mine' || obs.kind === 'asteroid') {
                obs.alive = false;
                this.score += 150;
                soundEngine.enemyHit();
                this.addParticles(obs.x + 22, obs.y + 22, '#fb923c', 14, 6, 0.1, true);
              } else {
                this.smashBoatCrate(obs);
              }
              proj.life = 0;
              break;
            }
          }
        }

        const boss = this.level.boss;
        if (
          boss.active &&
          !boss.defeated &&
          boss.invulnTimer <= 0 &&
          this.overlaps(proj, boss)
        ) {
          this.damageBoss(proj.damage);
          if (proj.kind === 'rocket') {
            this.addParticles(proj.x, proj.y, '#fb923c', 18, 7, 0.1, true);
          }
          if (
            proj.kind === 'shockwave' ||
            proj.kind === 'fire_orb' ||
            proj.kind === 'lightning' ||
            proj.kind === 'rocket' ||
            proj.kind === 'laser' ||
            isVeh
          ) {
            proj.life = 0;
          }
        }
      } else {
        if (this.overlaps(proj, p)) {
          if (p.isShielding) {
            soundEngine.checkpoint();
            this.addParticles(
              p.x + p.w / 2,
              p.y + p.h / 2,
              '#38bdf8',
              12,
              5,
              0.1,
              true
            );
            this.addText(p.x, p.y - 16, this.t().floatShieldBlock, '#38bdf8');
          } else {
            this.damagePlayer(proj.damage, false);
          }
          this.projectiles.splice(i, 1);
          continue;
        }
      }

      if (proj.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  private damageEnemy(e: LevelDefinition['enemies'][number], dmg: number) {
    e.hp -= dmg;
    e.hitFlash = 10;
    if (e.hp <= 0) {
      e.alive = false;
      e.squashTimer = e.kind === 'bat' || e.kind === 'sky_drone' ? 0 : 22;
      this.score += 200;
      soundEngine.enemyHit();
      this.addParticles(e.x + e.w / 2, e.y + e.h / 2, '#facc15', 12, 6);
      this.addText(e.x, e.y - 10, '+200', '#facc15');
      this.emitHud();
    } else {
      soundEngine.enemyHit();
      this.addParticles(e.x + e.w / 2, e.y + e.h / 2, '#fb923c', 7, 4);
    }
  }

  private updateEnemies() {
    const p = this.player;
    const activeAtk = p.attackTimer > 0 ? this.getAttackHitbox() : null;
    const meleeDmg = this.getMeleeDamage();

    for (const e of this.level.enemies) {
      if (!e.alive) {
        if (e.squashTimer > 0) e.squashTimer--;
        continue;
      }
      if (e.hitFlash > 0) e.hitFlash--;
      if (e.x < this.cameraX - 240 || e.x > this.cameraX + this.viewW + 240) continue;

      if (activeAtk && e.hitFlash <= 0 && this.overlaps(activeAtk, e)) {
        this.damageEnemy(e, meleeDmg);
        if (!e.alive) continue;
      }

      if (e.kind === 'bat' || e.kind === 'sky_drone') {
        e.x += e.vx;
        e.y = e.baseY + Math.sin(this.tick * 0.06 + e.phase) * 38;
        if (
          (e.patrolMinX !== undefined && e.x < e.patrolMinX) ||
          (e.patrolMaxX !== undefined && e.x + e.w > e.patrolMaxX)
        ) {
          e.vx *= -1;
        }
      } else {
        e.vy = Math.min(e.vy + BASE_GRAVITY, MAX_FALL);
        e.x += e.vx;

        if (e.patrolMinX !== undefined && e.x < e.patrolMinX) {
          e.x = e.patrolMinX;
          e.vx = Math.abs(e.vx);
        }
        if (e.patrolMaxX !== undefined && e.x + e.w > e.patrolMaxX) {
          e.x = e.patrolMaxX - e.w;
          e.vx = -Math.abs(e.vx);
        }

        for (const t of this.level.tiles) {
          if (isNonSolidTile(t.kind)) continue;
          if (this.overlaps(e, t)) {
            if (e.vx > 0) e.x = t.x - e.w;
            else e.x = t.x + t.w;
            e.vx *= -1;
          }
        }

        e.y += e.vy;
        for (const t of this.level.tiles) {
          if (isNonSolidTile(t.kind)) continue;
          if (this.overlaps(e, t) && e.vy > 0) {
            e.y = t.y - e.h;
            e.vy = 0;
          }
        }
      }

      if (this.overlaps(p, e)) {
        const stomped = p.vy > 0 && p.y + p.h - p.vy <= e.y + e.h * 0.58;
        if (stomped) {
          p.vy = -10.5;
          p.jumpsRemaining = 2;
          soundEngine.stomp();
          this.damageEnemy(e, 2);
        } else {
          this.damagePlayer(20, false);
        }
      }
    }
  }

  private damageBoss(dmg: number) {
    const boss = this.level.boss;
    if (boss.defeated || boss.invulnTimer > 0) return;

    boss.hp = Math.max(0, boss.hp - dmg);
    boss.hitFlash = 14;
    boss.invulnTimer = 20;
    this.screenShake = 9;
    soundEngine.bossHit();
    this.addParticles(
      boss.x + boss.w / 2,
      boss.y + boss.h / 2,
      '#facc15',
      18,
      7,
      0.18,
      true
    );
    this.addText(
      boss.x + boss.w / 2 - 20,
      boss.y - 12,
      `-${dmg} ${this.t().floatHit}`,
      '#facc15'
    );

    if (boss.hp <= 0) {
      boss.defeated = true;
      boss.phaseState = 'DEFEATED';
      this.score += 3000;
      soundEngine.victory();
      this.addParticles(
        boss.x + boss.w / 2,
        boss.y + boss.h / 2,
        '#fbbf24',
        45,
        10,
        0.15,
        true
      );
      const bName = this.lang === 'de' ? boss.nameDe : boss.nameEn;
      this.addText(
        boss.x,
        boss.y - 30,
        `${bName} ${this.t().floatBossDefeated}`,
        '#34d399'
      );
      this.levelFinishTimer = 85;
    }
    this.emitHud();
  }

  private updateBoss() {
    const boss = this.level.boss;
    const p = this.player;

    if (!boss.active && !boss.defeated && p.x >= this.level.bossTriggerX) {
      boss.active = true;
      boss.phaseState = 'PATROL';
      boss.stateTimer = 70;
      soundEngine.bossWarn();
      soundEngine.startMusic('boss');
      const bName = this.lang === 'de' ? boss.nameDe : boss.nameEn;
      this.addText(
        boss.x - 40,
        boss.y - 32,
        `${bName} ${this.t().floatBossAppears}`,
        '#fb7185'
      );
      this.emitHud();
    }

    if (!boss.active || boss.defeated) return;

    boss.animTick++;
    if (boss.hitFlash > 0) boss.hitFlash--;
    if (boss.invulnTimer > 0) boss.invulnTimer--;

    const isVeh = isVehicleMode(this.level.theme.mode);

    if (!isVeh && p.attackTimer > 0 && boss.invulnTimer <= 0) {
      const atkBox = this.getAttackHitbox();
      if (this.overlaps(atkBox, boss)) {
        this.damageBoss(this.getMeleeDamage());
        if (boss.defeated) return;
      }
    }

    const playerCenterX = p.x + p.w / 2;
    const bossCenterX = boss.x + boss.w / 2;
    boss.facingRight = playerCenterX > bossCenterX;
    boss.stateTimer--;

    if (
      boss.kind === 'beetle_king' ||
      boss.kind === 'goo_king' ||
      boss.kind === 'jungle_kong' ||
      boss.kind === 'yeti_king'
    ) {
      const isGoo = boss.kind === 'goo_king';
      const isKong = boss.kind === 'jungle_kong';
      const isYeti = boss.kind === 'yeti_king';
      if (boss.phaseState === 'PATROL') {
        const patrolSpd = isKong || isYeti ? 2.9 : isGoo ? 2.6 : 2.1;
        boss.vx = (boss.facingRight ? 1 : -1) * patrolSpd;
        boss.x += boss.vx;
        if (boss.stateTimer <= 0) {
          boss.phaseState = 'TELEGRAPH';
          boss.stateTimer = 40;
          boss.vx = 0;
          boss.attackPattern = (boss.attackPattern + 1) % 3;
        }
      } else if (boss.phaseState === 'TELEGRAPH') {
        if (boss.stateTimer <= 0) {
          boss.phaseState = 'ATTACK';
          if (boss.attackPattern === 0) {
            boss.vx = (boss.facingRight ? 1 : -1) * (isYeti || isKong ? 8.8 : 7.8);
            boss.stateTimer = 54;
          } else if (boss.attackPattern === 1) {
            boss.vy = -14.2;
            boss.vx = (boss.facingRight ? 1 : -1) * 4.5;
            boss.stateTimer = 60;
          } else {
            // Throw projectile toward player
            const dir = boss.facingRight ? 1 : -1;
            this.projectiles.push({
              id: this.nextProjId++,
              fromPlayer: false,
              kind: isYeti ? 'water_orb' : isKong ? 'stone_wave' : isGoo ? 'goo_blob' : 'stone_wave',
              x: boss.facingRight ? boss.x + boss.w : boss.x - 28,
              y: boss.floorY - 58,
              w: 28,
              h: 28,
              vx: dir * 7.8,
              vy: 0,
              damage: 20,
              life: 100,
              maxLife: 100,
              rotation: 0,
            });
            soundEngine.bossWarn();
            boss.stateTimer = 42;
          }
        }
      } else if (boss.phaseState === 'ATTACK') {
        boss.vy = Math.min(boss.vy + BASE_GRAVITY, MAX_FALL);
        boss.x += boss.vx;
        boss.y += boss.vy;
        if (boss.y + boss.h >= boss.floorY) {
          const justLanded = boss.vy > 4;
          boss.y = boss.floorY - boss.h;
          boss.vy = 0;
          if (justLanded && boss.attackPattern === 1) {
            this.screenShake = 8;
            soundEngine.blockBreak();
            [-6.8, 6.8].forEach((wv) => {
              this.projectiles.push({
                id: this.nextProjId++,
                fromPlayer: false,
                kind: isYeti ? 'water_orb' : isGoo ? 'goo_blob' : 'stone_wave',
                x: boss.x + boss.w / 2 - 14,
                y: boss.floorY - 30,
                w: 28,
                h: 28,
                vx: wv,
                vy: 0,
                damage: 20,
                life: 95,
                maxLife: 95,
                rotation: 0,
              });
            });
          }
        }
        if (boss.stateTimer <= 0) {
          boss.phaseState = 'RECOVER';
          boss.stateTimer = 48;
          boss.vx = 0;
        }
      } else if (boss.phaseState === 'RECOVER') {
        if (boss.stateTimer <= 0) {
          boss.phaseState = 'PATROL';
          boss.stateTimer = 70;
        }
      }
    } else if (
      boss.kind === 'ice_leviathan' ||
      boss.kind === 'storm_zeppelin' ||
      boss.kind === 'sky_baron' ||
      boss.kind === 'titan_mecha'
    ) {
      const isTitan = boss.kind === 'titan_mecha';
      const isBaron = boss.kind === 'sky_baron';
      const isZeppelin = boss.kind === 'storm_zeppelin';
      const projKind = isTitan
        ? 'fireball'
        : isBaron
        ? 'fireball'
        : isZeppelin
        ? 'wind_blade'
        : 'water_orb';

      if (boss.phaseState === 'PATROL') {
        boss.y += boss.vy;
        if (boss.y < 100) boss.vy = Math.abs(boss.vy);
        if (boss.y + boss.h > GAME_H - 100) boss.vy = -Math.abs(boss.vy);
        boss.x += (boss.arenaMaxX - 190 - boss.x) * 0.08;
        if (boss.stateTimer <= 0) {
          boss.phaseState = 'TELEGRAPH';
          boss.stateTimer = 36;
          boss.attackPattern = (boss.attackPattern + 1) % 2;
        }
      } else if (boss.phaseState === 'TELEGRAPH') {
        boss.y += (p.y - 24 - boss.y) * 0.07;
        if (boss.stateTimer <= 0) {
          boss.phaseState = 'ATTACK';
          if (boss.attackPattern === 0) {
            const angles = isTitan ? [-2.6, -0.9, 0.9, 2.6] : [-1.8, 0, 1.8];
            angles.forEach((vy) => {
              this.projectiles.push({
                id: this.nextProjId++,
                fromPlayer: false,
                kind: projKind,
                x: boss.x - 16,
                y: boss.y + boss.h / 2 - 12,
                w: 28,
                h: 28,
                vx: isTitan ? -8.4 : -7.4,
                vy,
                damage: isTitan ? 25 : 20,
                life: 130,
                maxLife: 130,
                rotation: 0,
              });
            });
            soundEngine.bossWarn();
            boss.stateTimer = 46;
          } else {
            boss.vx = isTitan || isBaron ? -9.4 : -8.2;
            boss.stateTimer = 64;
          }
        }
      } else if (boss.phaseState === 'ATTACK') {
        if (boss.attackPattern === 1) {
          boss.x += boss.vx;
          if (boss.x < boss.arenaMinX + 180) boss.vx = 6.5;
        }
        if (boss.stateTimer <= 0) {
          boss.phaseState = 'RECOVER';
          boss.stateTimer = 44;
          boss.vx = 0;
        }
      } else if (boss.phaseState === 'RECOVER') {
        boss.x += (boss.arenaMaxX - 190 - boss.x) * 0.1;
        if (boss.stateTimer <= 0) {
          boss.phaseState = 'PATROL';
          boss.stateTimer = 62;
        }
      }
    } else {
      const isGriffin = boss.kind === 'storm_griffin';
      const hoverY =
        boss.floorY - boss.h - 80 + Math.sin(boss.animTick * 0.055) * 20;

      if (boss.phaseState === 'PATROL') {
        boss.vx = (boss.facingRight ? 1 : -1) * (isGriffin ? 3.1 : 2.5);
        boss.x += boss.vx;
        boss.y += (hoverY - boss.y) * 0.08;
        if (boss.stateTimer <= 0) {
          boss.phaseState = 'TELEGRAPH';
          boss.stateTimer = 40;
          boss.vx = 0;
          boss.attackPattern = (boss.attackPattern + 1) % 2;
        }
      } else if (boss.phaseState === 'TELEGRAPH') {
        boss.y += (hoverY - boss.y) * 0.1;
        if (boss.stateTimer <= 0) {
          boss.phaseState = 'ATTACK';
          if (boss.attackPattern === 0) {
            const dir = boss.facingRight ? 1 : -1;
            const projY = boss.floorY - 62;
            this.projectiles.push({
              id: this.nextProjId++,
              fromPlayer: false,
              kind: isGriffin ? 'wind_blade' : 'fireball',
              x: boss.facingRight ? boss.x + boss.w - 10 : boss.x - 24,
              y: projY,
              w: 32,
              h: 26,
              vx: dir * (isGriffin ? 8.2 : 7.2),
              vy: 0,
              damage: 25,
              life: 110,
              maxLife: 110,
              rotation: 0,
            });
            soundEngine.bossWarn();
            boss.stateTimer = 48;
          } else {
            boss.vx = (boss.facingRight ? 1 : -1) * (isGriffin ? 8.2 : 7.4);
            boss.vy = 5.5;
            boss.stateTimer = 60;
          }
        }
      } else if (boss.phaseState === 'ATTACK') {
        if (boss.attackPattern === 1) {
          boss.x += boss.vx;
          boss.y = Math.min(boss.floorY - boss.h, boss.y + boss.vy);
          if (boss.y + boss.h >= boss.floorY) boss.vy = -3.8;
        }
        if (boss.stateTimer <= 0) {
          boss.phaseState = 'RECOVER';
          boss.stateTimer = 56;
          boss.vx = 0;
          boss.vy = 0;
        }
      } else if (boss.phaseState === 'RECOVER') {
        boss.y += (boss.floorY - boss.h - boss.y) * 0.12;
        if (boss.stateTimer <= 0) {
          boss.phaseState = 'PATROL';
          boss.stateTimer = 70;
        }
      }
    }

    if (boss.x < boss.arenaMinX + 16) {
      boss.x = boss.arenaMinX + 16;
      boss.vx = Math.abs(boss.vx);
    }
    if (boss.x + boss.w > boss.arenaMaxX - 16) {
      boss.x = boss.arenaMaxX - 16 - boss.w;
      boss.vx = -Math.abs(boss.vx);
    }

    if (this.overlaps(p, boss)) {
      const stomped =
        !isVeh && p.vy > 0 && p.y + p.h - p.vy <= boss.y + boss.h * 0.45;
      if (stomped) {
        p.vy = -13.5;
        p.jumpsRemaining = 2;
        this.damageBoss(2);
      } else {
        this.damagePlayer(25, false);
      }
    }
  }

  private updateParticlesAndTexts() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.vy += pt.gravity;
      pt.life--;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 0.9;
      ft.life--;
      if (ft.life <= 0) this.floatingTexts.splice(i, 1);
    }
  }

  public getHudSnapshot(): HudSnapshot {
    const boss = this.level.boss;
    const theme = this.level.theme;
    return {
      mode: theme.mode,
      lives: this.player.lives,
      maxLives: this.player.maxLives,
      healthStamina: Math.round(this.player.healthStamina),
      maxHealthStamina: this.player.maxHealthStamina,
      toolEnergy: Math.round(this.player.toolEnergy),
      maxToolEnergy: this.player.maxToolEnergy,
      coins: this.coins,
      score: this.score,
      starsCollected: this.starsCollected,
      totalStars: this.totalStars,
      levelIndex: this.levelIndex,
      levelName: this.lang === 'de' ? theme.nameDe : theme.nameEn,
      worldCode: this.lang === 'de' ? theme.worldCodeDe : theme.worldCodeEn,
      tools: [...this.player.tools],
      isShielding: this.player.isShielding,
      bossActive: boss.active && !boss.defeated,
      bossName: this.lang === 'de' ? boss.nameDe : boss.nameEn,
      bossHp: boss.hp,
      bossMaxHp: boss.maxHp,
      recentToolUnlock: this.recentToolUnlock,
    };
  }

  private emitHud() {
    this.callbacks.onHudUpdate(this.getHudSnapshot());
  }
}
