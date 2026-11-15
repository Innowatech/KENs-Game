import { soundEngine } from './audio';
import { createLevel, GAME_H, GAME_W, TILE } from './levels';
import {
  FloatingText,
  HudSnapshot,
  InputState,
  LevelDefinition,
  Particle,
  Player,
  Projectile,
  TOOLS_CATALOG,
  ToolId,
  ToolInfo,
} from './types';

const GRAVITY = 0.62;
const MAX_FALL = 14.5;
const BASE_STAND_W = 42;
const BASE_STAND_H = 64;
const CROUCH_W = 44;
const CROUCH_H = 36;

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
  public screenShake = 0;
  public tick = 0;
  public score = 0;
  public coins = 0;
  public isRunning = false;
  public recentToolUnlock: ToolInfo | null = null;
  private recentToolTimer = 0;
  private levelFinishTimer = -1;
  private nextProjId = 1;
  private callbacks: EngineCallbacks;
  private hudSyncCounter = 0;

  constructor(callbacks: EngineCallbacks) {
    this.callbacks = callbacks;
    this.level = createLevel(0);
    this.player = this.createFreshPlayer([]);
    this.loadLevel(0, true);
  }

  private createFreshPlayer(keepTools: ToolId[]): Player {
    return {
      x: this.level.spawnX,
      y: this.level.spawnY,
      w: BASE_STAND_W,
      h: BASE_STAND_H,
      vx: 0,
      vy: 0,
      facingRight: true,
      onGround: false,
      jumpsRemaining: 2,
      isCrouching: false,
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
    this.loadLevel(startLevelIndex, true);
  }

  public loadLevel(index: number, resetLivesAndTools: boolean) {
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

    if (resetLivesAndTools) {
      this.player = this.createFreshPlayer([]);
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
        vy: Math.sin(angle) * mag - 1.5,
        size: 3 + Math.random() * 5,
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
      if (t.kind === 'lava') continue;
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
        this.addText(this.player.x, this.player.y - 30, '+1 Leben!', '#34d399');
      } else {
        this.addText(this.player.x, this.player.y - 30, 'Energie voll!', '#34d399');
      }
      soundEngine.heal();
    }
  }

  private damagePlayer(amount: number, fromPitOrLava: boolean) {
    const p = this.player;
    if (p.invulnTimer > 0 && !fromPitOrLava) return;

    p.healthStamina = Math.max(0, p.healthStamina - amount);
    this.screenShake = 8;

    if (p.healthStamina > 0) {
      soundEngine.hurt();
      p.invulnTimer = 75;
      p.hitFlash = 16;
      this.addText(p.x, p.y - 16, `-${amount} Energie`, '#fb7185');
      this.addParticles(p.x + p.w / 2, p.y + p.h / 2, '#fb7185', 10, 5, 0.2);

      if (fromPitOrLava) {
        p.x = p.safeX;
        p.y = p.safeY - 12;
        p.vx = 0;
        p.vy = -4;
        p.jumpsRemaining = 2;
        this.addParticles(p.x + p.w / 2, p.y + p.h / 2, '#38bdf8', 16, 6, 0.1, true);
        this.addText(p.x, p.y - 36, 'Rettungs-Blase!', '#38bdf8');
      } else {
        p.vy = -7;
        p.vx = p.facingRight ? -4.5 : 4.5;
      }
      this.emitHud();
      return;
    }

    // Health-Stamina hit 0 -> lose 1 of 10 lives!
    p.lives = Math.max(0, p.lives - 1);
    soundEngine.lifeLost();

    if (p.lives <= 0) {
      this.isRunning = false;
      this.emitHud();
      this.callbacks.onGameOver(this.score, this.coins);
      return;
    }

    // Respawn with fresh 100 Health-Stamina at safe spot / checkpoint
    p.healthStamina = p.maxHealthStamina;
    p.toolEnergy = p.maxToolEnergy;
    p.invulnTimer = 110;
    p.hitFlash = 20;
    p.isCrouching = false;
    p.w = BASE_STAND_W;
    p.h = BASE_STAND_H;
    p.x = p.safeX;
    p.y = p.safeY - 18;
    p.vx = 0;
    p.vy = -3;
    p.jumpsRemaining = 2;
    this.addParticles(p.x + p.w / 2, p.y + p.h / 2, '#fbbf24', 18, 7, 0.12, true);
    this.addText(p.x, p.y - 24, '-1 Leben · Neue Energie!', '#facc15');
    this.emitHud();
  }

  private getAttackHitbox() {
    const p = this.player;
    const hasSword = this.hasTool('sun_sword');
    const hasGloves = this.hasTool('power_gloves');
    const reach = hasSword ? 86 : hasGloves ? 58 : 50;
    return {
      x: p.facingRight ? p.x + p.w - 8 : p.x - reach + 8,
      y: p.y + 4,
      w: reach,
      h: p.h - 6,
    };
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
        this.addText(tile.x, tile.y - 18, '+5 Münzen!', '#facc15');
      } else if (reward === 'heart' || reward === 'big_heart') {
        const heal = reward === 'big_heart' ? 60 : 35;
        this.player.healthStamina = Math.min(
          this.player.maxHealthStamina,
          this.player.healthStamina + heal
        );
        soundEngine.heal();
        this.addParticles(tile.x + 24, tile.y - 10, '#fb7185', 14, 6, 0.15, true);
        this.addText(tile.x, tile.y - 18, `+${heal} Energie!`, '#34d399');
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
      this.addText(tile.x, tile.y - 12, 'Zerschmettert!', '#f97316');
      this.level.tiles = this.level.tiles.filter((t) => t.id !== tile.id);
    } else if (tile.kind === 'cracked' && !fromBelow) {
      this.addText(tile.x - 16, tile.y - 14, 'Kraft-Handschuhe nötig!', '#cbd5e1');
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

    // Handle Victory Delay after Boss defeated
    if (this.levelFinishTimer > 0) {
      this.levelFinishTimer--;
      if (this.tick % 8 === 0) {
        this.addParticles(
          this.cameraX + 180 + Math.random() * (GAME_W - 360),
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
        if (this.levelIndex === 0) {
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
    p.toolEnergy = Math.min(p.maxToolEnergy, p.toolEnergy + 0.55);

    // Tile bounce & spring animations
    for (const t of this.level.tiles) {
      if (t.bumpY < 0) {
        t.bumpY = Math.min(0, t.bumpY + 1.4);
      }
      if (t.springAnim && t.springAnim > 0) {
        t.springAnim--;
      }
    }

    // Moving Platforms
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

    // Crouch handling
    if (input.down && p.onGround) {
      if (!p.isCrouching) {
        const diff = p.h - CROUCH_H;
        p.y += diff;
        p.h = CROUCH_H;
        p.w = CROUCH_W;
        p.isCrouching = true;
      }
    } else if (p.isCrouching && this.canStandUp()) {
      const diff = BASE_STAND_H - p.h;
      p.y -= diff;
      p.h = BASE_STAND_H;
      p.w = BASE_STAND_W;
      p.isCrouching = false;
    }

    // Horizontal Movement (boosted by Turbo-Stiefel)
    const hasTurbo = this.hasTool('turbo_boots');
    const baseMaxSpeed = hasTurbo ? 7.1 : 5.6;
    const maxSpeed = p.isCrouching ? baseMaxSpeed * 0.55 : baseMaxSpeed;
    const accel = hasTurbo ? 0.85 : 0.68;

    if (input.left) {
      p.vx = Math.max(p.vx - accel, -maxSpeed);
      p.facingRight = false;
    } else if (input.right) {
      p.vx = Math.min(p.vx + accel, maxSpeed);
      p.facingRight = true;
    } else {
      p.vx *= 0.8;
      if (Math.abs(p.vx) < 0.12) p.vx = 0;
    }

    if (hasTurbo && Math.abs(p.vx) > 5.5 && this.tick % 3 === 0) {
      this.particles.push({
        x: p.x + p.w / 2,
        y: p.y + p.h - 10,
        vx: -p.vx * 0.2,
        vy: -0.4,
        size: 5,
        color: '#22d3ee',
        life: 14,
        maxLife: 14,
        gravity: 0,
        glow: true,
      });
    }

    // Jump Buffer & Coyote Time
    if (input.jumpJustPressed) {
      p.jumpBufferTimer = 8;
    } else if (p.jumpBufferTimer > 0) {
      p.jumpBufferTimer--;
    }
    input.jumpJustPressed = false;

    if (p.onGround) {
      p.coyoteTimer = 8;
    } else if (p.coyoteTimer > 0) {
      p.coyoteTimer--;
    }

    const jumpPower = hasTurbo ? -15.0 : -14.2;
    const doubleJumpPower = hasTurbo ? -13.6 : -12.8;

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
        p.coyoteTimer = 0;
        p.jumpBufferTimer = 0;
        p.jumpsRemaining = 1;
        soundEngine.jump();
        this.addParticles(p.x + p.w / 2, p.y + p.h, '#e2e8f0', 6, 3, 0.1);
      } else if (p.jumpsRemaining > 0) {
        p.vy = doubleJumpPower;
        p.jumpsRemaining = 0;
        p.jumpBufferTimer = 0;
        soundEngine.doubleJump();
        this.addParticles(p.x + p.w / 2, p.y + p.h, '#38bdf8', 12, 5, 0.05, true);
        this.addText(p.x - 10, p.y + p.h, 'Doppel-Sprung!', '#bae6fd');
      }
    }

    if (!input.jumpHeld && p.vy < -5.2) {
      p.vy *= 0.85;
    }

    // Melee Attack (Punch / Kraft-Handschuhe / Sonnen-Klinge)
    if (input.attackJustPressed && p.attackCooldown <= 0 && !p.isCrouching) {
      const hasGloves = this.hasTool('power_gloves');
      const hasSword = this.hasTool('sun_sword');
      p.attackTimer = 14;
      p.attackCooldown = 19;
      soundEngine.punch(hasGloves || hasSword);

      const atkBox = this.getAttackHitbox();
      // Check blocks hit by punch/sword
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

      // Spawn short-range power wave if Kraft-Handschuhe or Sonnen-Klinge unlocked
      if (hasGloves || hasSword) {
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
    }
    input.attackJustPressed = false;

    // Special Tool Action (Sternen-Bumerang)
    if (input.toolJustPressed) {
      if (
        this.hasTool('star_boomerang') &&
        p.boomerangCooldown <= 0 &&
        p.toolEnergy >= 25
      ) {
        p.toolEnergy -= 25;
        p.boomerangCooldown = 28;
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
    input.toolJustPressed = false;

    // Gravity
    p.vy = Math.min(p.vy + GRAVITY, MAX_FALL);

    // Horizontal Movement & Collision
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
      if (t.kind === 'lava') continue;
      if (this.overlaps(p, t)) {
        if (p.vx > 0) p.x = t.x - p.w;
        else if (p.vx < 0) p.x = t.x + t.w;
        p.vx = 0;
      }
    }

    // Vertical Movement & Collision
    p.y += p.vy;
    p.onGround = false;

    for (const t of this.level.tiles) {
      if (t.kind === 'lava') {
        if (this.overlaps(p, t)) {
          this.damagePlayer(35, true);
          return;
        }
        continue;
      }

      if (this.overlaps(p, t)) {
        if (p.vy > 0) {
          p.y = t.y - p.h;
          p.vy = 0;
          p.onGround = true;
          p.jumpsRemaining = 2;

          if (t.kind === 'spring') {
            p.vy = -20.5;
            p.onGround = false;
            p.jumpsRemaining = 1;
            t.springAnim = 18;
            soundEngine.spring();
            this.addParticles(t.x + 24, t.y, '#facc15', 12, 6, 0.15, true);
          } else if (
            t.kind === 'grass' ||
            t.kind === 'stone' ||
            t.kind === 'crystal' ||
            t.kind === 'bridge'
          ) {
            // Save safe rescue coordinate slightly away from edges
            p.safeX = Math.max(t.x, Math.min(t.x + t.w - p.w, p.x));
            p.safeY = t.y - BASE_STAND_H;
          }
        } else if (p.vy < 0) {
          p.y = t.y + t.h;
          p.vy = 1.5;
          this.hitBlock(t, true);
        }
      }
    }

    // Moving Platform Landing
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
        p.jumpsRemaining = 2;
        p.x += plat.dx;
        p.y += plat.dy;
      }
    }

    if (Math.abs(p.vx) > 0.3 && p.onGround && !p.isCrouching) {
      p.animTimer += hasTurbo ? 0.3 : 0.22;
    } else {
      p.animTimer = 0;
    }

    // Pit fall rescue
    if (p.y > GAME_H + 36) {
      this.damagePlayer(35, true);
      return;
    }

    // Checkpoints
    for (const cp of this.level.checkpoints) {
      if (
        !cp.activated &&
        Math.abs(p.x + p.w / 2 - cp.x) < 48 &&
        Math.abs(p.y + p.h - (cp.y + 72)) < 96
      ) {
        cp.activated = true;
        p.safeX = cp.x - 10;
        p.safeY = cp.y + 72 - BASE_STAND_H;
        p.healthStamina = Math.min(
          p.maxHealthStamina,
          p.healthStamina + 25
        );
        soundEngine.checkpoint();
        this.addParticles(cp.x + 12, cp.y + 20, '#34d399', 16, 6, 0.1, true);
        this.addText(cp.x - 20, cp.y - 10, 'Checkpoint!', '#34d399');
        this.emitHud();
      }
    }

    // Collectibles
    for (const col of this.level.collectibles) {
      if (col.collected) continue;
      if (this.overlaps(p, col)) {
        this.collectItem(col);
      }
    }

    // Update Projectiles
    this.updateProjectiles();

    // Update Enemies
    this.updateEnemies();

    // Boss Activation & AI
    this.updateBoss();

    // Camera Follow
    if (this.level.boss.active) {
      const targetCam = this.level.boss.arenaMinX - 40;
      this.cameraX += (targetCam - this.cameraX) * 0.12;
    } else {
      const desiredCam = Math.max(
        0,
        Math.min(this.level.width - GAME_W, p.x - GAME_W * 0.36)
      );
      this.cameraX += (desiredCam - this.cameraX) * 0.14;
    }

    this.updateParticlesAndTexts();

    this.hudSyncCounter++;
    if (this.hudSyncCounter >= 4) {
      this.hudSyncCounter = 0;
      this.emitHud();
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
    } else if (col.kind === 'heart' || col.kind === 'apple') {
      const heal = col.kind === 'apple' ? 60 : 35;
      this.player.healthStamina = Math.min(
        this.player.maxHealthStamina,
        this.player.healthStamina + heal
      );
      this.score += 150;
      soundEngine.heal();
      this.addParticles(col.x + 15, col.y + 15, '#fb7185', 12, 5, 0.1, true);
      this.addText(col.x, col.y - 12, `+${heal} Energie`, '#34d399');
    } else if (col.kind === 'chest' && col.toolReward) {
      const toolId = col.toolReward;
      if (!this.player.tools.includes(toolId)) {
        this.player.tools.push(toolId);
      }
      const info = TOOLS_CATALOG[toolId];
      this.recentToolUnlock = info;
      this.recentToolTimer = 280;
      this.score += 1000;
      this.player.healthStamina = this.player.maxHealthStamina;
      soundEngine.chest();
      this.addParticles(col.x + 26, col.y + 18, info.color, 26, 8, 0.12, true);
      this.addText(col.x - 30, col.y - 24, `Neues Tool: ${info.name}!`, info.color);
    }
    this.emitHud();
  }

  private updateProjectiles() {
    const p = this.player;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      proj.life--;
      proj.rotation += 0.35;

      if (proj.kind === 'boomerang') {
        if (proj.life < proj.maxLife * 0.55) {
          proj.returning = true;
        }
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

        // Collect coins & gems in boomerang path!
        for (const col of this.level.collectibles) {
          if (
            !col.collected &&
            (col.kind === 'coin' || col.kind === 'gem') &&
            this.overlaps(proj, col)
          ) {
            this.collectItem(col);
          }
        }
        // Trigger ? blocks
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
        // Check enemy hits
        for (const e of this.level.enemies) {
          if (e.alive && this.overlaps(proj, e)) {
            this.damageEnemy(e, proj.damage);
            if (proj.kind === 'shockwave') {
              proj.life = 0;
              break;
            }
          }
        }
        // Check boss hit
        const boss = this.level.boss;
        if (
          boss.active &&
          !boss.defeated &&
          boss.invulnTimer <= 0 &&
          this.overlaps(proj, boss)
        ) {
          this.damageBoss(proj.damage);
          if (proj.kind === 'shockwave') proj.life = 0;
        }
      } else {
        // Enemy / Boss projectile vs Player
        if (this.overlaps(proj, p)) {
          this.damagePlayer(proj.damage, false);
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
      e.squashTimer = e.kind === 'bat' ? 0 : 22;
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
    const meleeDmg = this.hasTool('sun_sword')
      ? 3
      : this.hasTool('power_gloves')
      ? 2
      : 1;

    for (const e of this.level.enemies) {
      if (!e.alive) {
        if (e.squashTimer > 0) e.squashTimer--;
        continue;
      }
      if (e.hitFlash > 0) e.hitFlash--;

      // Only update enemies near camera
      if (e.x < this.cameraX - 240 || e.x > this.cameraX + GAME_W + 240) {
        continue;
      }

      if (activeAtk && e.hitFlash <= 0 && this.overlaps(activeAtk, e)) {
        this.damageEnemy(e, meleeDmg);
        if (!e.alive) continue;
      }

      if (e.kind === 'bat') {
        e.x += e.vx;
        e.y = e.baseY + Math.sin(this.tick * 0.06 + e.phase) * 38;
        if (
          (e.patrolMinX !== undefined && e.x < e.patrolMinX) ||
          (e.patrolMaxX !== undefined && e.x + e.w > e.patrolMaxX)
        ) {
          e.vx *= -1;
        }
      } else {
        e.vy = Math.min(e.vy + GRAVITY, MAX_FALL);
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
          if (t.kind === 'lava') continue;
          if (this.overlaps(e, t)) {
            if (e.vx > 0) e.x = t.x - e.w;
            else e.x = t.x + t.w;
            e.vx *= -1;
          }
        }

        e.y += e.vy;
        for (const t of this.level.tiles) {
          if (t.kind === 'lava') continue;
          if (this.overlaps(e, t) && e.vy > 0) {
            e.y = t.y - e.h;
            e.vy = 0;
          }
        }
      }

      // Player vs Enemy
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
    boss.invulnTimer = 22;
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
      `-${dmg} Treffer!`,
      '#facc15'
    );

    if (boss.hp <= 0) {
      boss.defeated = true;
      boss.phaseState = 'DEFEATED';
      this.score += 2500;
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
      this.addText(boss.x, boss.y - 30, `${boss.name} besiegt!`, '#34d399');
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
      this.addText(boss.x - 40, boss.y - 32, `${boss.name} erscheint!`, '#fb7185');
      this.emitHud();
    }

    if (!boss.active || boss.defeated) return;

    boss.animTick++;
    if (boss.hitFlash > 0) boss.hitFlash--;
    if (boss.invulnTimer > 0) boss.invulnTimer--;

    // Check Kenneth melee strike against Boss
    if (p.attackTimer > 0 && boss.invulnTimer <= 0) {
      const atkBox = this.getAttackHitbox();
      if (this.overlaps(atkBox, boss)) {
        const meleeDmg = this.hasTool('sun_sword')
          ? 3
          : this.hasTool('power_gloves')
          ? 2
          : 1;
        this.damageBoss(meleeDmg);
        if (boss.defeated) return;
      }
    }

    const playerCenterX = p.x + p.w / 2;
    const bossCenterX = boss.x + boss.w / 2;
    boss.facingRight = playerCenterX > bossCenterX;
    boss.stateTimer--;

    if (boss.kind === 'beetle_king') {
      // Boss 1: König Stachelpanzer AI
      if (boss.phaseState === 'PATROL') {
        const dir = boss.facingRight ? 1 : -1;
        boss.vx = dir * 2.1;
        boss.x += boss.vx;
        if (boss.stateTimer <= 0) {
          boss.phaseState = 'TELEGRAPH';
          boss.stateTimer = 42;
          boss.vx = 0;
          boss.attackPattern = (boss.attackPattern + 1) % 2;
        }
      } else if (boss.phaseState === 'TELEGRAPH') {
        if (boss.stateTimer <= 0) {
          boss.phaseState = 'ATTACK';
          if (boss.attackPattern === 0) {
            // Roll Charge
            boss.vx = (boss.facingRight ? 1 : -1) * 7.8;
            boss.stateTimer = 55;
          } else {
            // Leap Slam + Stone Wave
            boss.vy = -13.5;
            boss.vx = (boss.facingRight ? 1 : -1) * 4.2;
            boss.stateTimer = 60;
          }
        }
      } else if (boss.phaseState === 'ATTACK') {
        boss.vy = Math.min(boss.vy + GRAVITY, MAX_FALL);
        boss.x += boss.vx;
        boss.y += boss.vy;
        if (boss.y + boss.h >= boss.floorY) {
          const justLanded = boss.vy > 4;
          boss.y = boss.floorY - boss.h;
          boss.vy = 0;
          if (justLanded && boss.attackPattern === 1) {
            this.screenShake = 8;
            soundEngine.blockBreak();
            // Launch two jumpable stone waves left & right
            [-6.5, 6.5].forEach((wv) => {
              this.projectiles.push({
                id: this.nextProjId++,
                fromPlayer: false,
                kind: 'stone_wave',
                x: boss.x + boss.w / 2 - 14,
                y: boss.floorY - 28,
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
          boss.stateTimer = 50;
          boss.vx = 0;
        }
      } else if (boss.phaseState === 'RECOVER') {
        if (boss.stateTimer <= 0) {
          boss.phaseState = 'PATROL';
          boss.stateTimer = 75;
        }
      }
    } else {
      // Boss 2: Flammen-Drache Ignis AI
      const hoverY = boss.floorY - boss.h - 75 + Math.sin(boss.animTick * 0.05) * 18;
      if (boss.phaseState === 'PATROL') {
        const dir = boss.facingRight ? 1 : -1;
        boss.vx = dir * 2.5;
        boss.x += boss.vx;
        boss.y += (hoverY - boss.y) * 0.08;
        if (boss.stateTimer <= 0) {
          boss.phaseState = 'TELEGRAPH';
          boss.stateTimer = 42;
          boss.vx = 0;
          boss.attackPattern = (boss.attackPattern + 1) % 2;
        }
      } else if (boss.phaseState === 'TELEGRAPH') {
        boss.y += (hoverY - boss.y) * 0.1;
        if (boss.stateTimer <= 0) {
          boss.phaseState = 'ATTACK';
          if (boss.attackPattern === 0) {
            // Fireball Breath at crouchable / jumpable height!
            const dir = boss.facingRight ? 1 : -1;
            const fireY = boss.floorY - 62; // Crouch (36px tall) ducks cleanly underneath!
            this.projectiles.push({
              id: this.nextProjId++,
              fromPlayer: false,
              kind: 'fireball',
              x: boss.facingRight ? boss.x + boss.w - 10 : boss.x - 24,
              y: fireY,
              w: 32,
              h: 26,
              vx: dir * 7.2,
              vy: 0,
              damage: 25,
              life: 110,
              maxLife: 110,
              rotation: 0,
            });
            soundEngine.bossWarn();
            boss.stateTimer = 48;
          } else {
            // Swoop Dive across arena
            boss.vx = (boss.facingRight ? 1 : -1) * 7.4;
            boss.vy = 5.5;
            boss.stateTimer = 60;
          }
        }
      } else if (boss.phaseState === 'ATTACK') {
        if (boss.attackPattern === 1) {
          boss.x += boss.vx;
          boss.y = Math.min(boss.floorY - boss.h, boss.y + boss.vy);
          if (boss.y + boss.h >= boss.floorY) {
            boss.vy = -3.8;
          }
        }
        if (boss.stateTimer <= 0) {
          boss.phaseState = 'RECOVER';
          boss.stateTimer = 58;
          boss.vx = 0;
          boss.vy = 0;
        }
      } else if (boss.phaseState === 'RECOVER') {
        // Lands briefly so Kenneth can easily jump-stomp or combo!
        boss.y += (boss.floorY - boss.h - boss.y) * 0.12;
        if (boss.stateTimer <= 0) {
          boss.phaseState = 'PATROL';
          boss.stateTimer = 75;
        }
      }
    }

    // Clamp Boss inside Arena
    if (boss.x < boss.arenaMinX + 16) {
      boss.x = boss.arenaMinX + 16;
      boss.vx = Math.abs(boss.vx);
    }
    if (boss.x + boss.w > boss.arenaMaxX - 16) {
      boss.x = boss.arenaMaxX - 16 - boss.w;
      boss.vx = -Math.abs(boss.vx);
    }

    // Player vs Boss Collision (Stomp top or take damage)
    if (this.overlaps(p, boss)) {
      const stomped = p.vy > 0 && p.y + p.h - p.vy <= boss.y + boss.h * 0.45;
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
    return {
      lives: this.player.lives,
      maxLives: this.player.maxLives,
      healthStamina: Math.round(this.player.healthStamina),
      maxHealthStamina: this.player.maxHealthStamina,
      toolEnergy: Math.round(this.player.toolEnergy),
      maxToolEnergy: this.player.maxToolEnergy,
      coins: this.coins,
      score: this.score,
      levelIndex: this.levelIndex,
      levelName: this.level.theme.name,
      worldCode: this.level.theme.worldCode,
      tools: [...this.player.tools],
      bossActive: boss.active && !boss.defeated,
      bossName: boss.name,
      bossHp: boss.hp,
      bossMaxHp: boss.maxHp,
      recentToolUnlock: this.recentToolUnlock,
    };
  }

  private emitHud() {
    this.callbacks.onHudUpdate(this.getHudSnapshot());
  }
}
