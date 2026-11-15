export type GameScreenState =
  | 'TITLE_MENU'
  | 'WORLD_MAP'
  | 'PLAYING'
  | 'PAUSED'
  | 'LEVEL_CLEAR'
  | 'GAME_OVER'
  | 'VICTORY';

export type ToolId =
  | 'power_gloves'
  | 'star_boomerang'
  | 'turbo_boots'
  | 'sun_sword';

export interface ToolInfo {
  id: ToolId;
  name: string;
  shortName: string;
  description: string;
  keyHint: string;
  color: string;
}

export const TOOLS_CATALOG: Record<ToolId, ToolInfo> = {
  power_gloves: {
    id: 'power_gloves',
    name: 'Kraft-Handschuhe',
    shortName: 'Kraft',
    description: 'Doppelte Schlagkraft und zerschmettert rissige Felsblöcke!',
    keyHint: 'X',
    color: '#f97316',
  },
  star_boomerang: {
    id: 'star_boomerang',
    name: 'Sternen-Bumerang',
    shortName: 'Bumerang',
    description: 'Wirf einen magischen Bumerang, der Gegner trifft und Münzen sammelt!',
    keyHint: 'E',
    color: '#eab308',
  },
  turbo_boots: {
    id: 'turbo_boots',
    name: 'Turbo-Stiefel',
    shortName: 'Turbo',
    description: 'Schnelleres Rennen, höheres Springen und leuchtender Speed-Schweif!',
    keyHint: 'Passiv',
    color: '#06b6d4',
  },
  sun_sword: {
    id: 'sun_sword',
    name: 'Sonnen-Klinge',
    shortName: 'Schwert',
    description: 'Verstärkt deinen Schlag mit einer goldenen Lichtklinge!',
    keyHint: 'X',
    color: '#facc15',
  },
};

export type TileKind =
  | 'grass'
  | 'dirt'
  | 'stone'
  | 'brick'
  | 'cracked'
  | 'question'
  | 'used'
  | 'bridge'
  | 'crystal'
  | 'lava'
  | 'spring';

export interface Tile {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: TileKind;
  bumpY: number;
  reward?: 'coin' | 'heart' | 'big_heart' | 'coins_burst';
  used?: boolean;
  springAnim?: number;
}

export interface MovingPlatform {
  x: number;
  y: number;
  w: number;
  h: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  speed: number;
  progress: number;
  dir: 1 | -1;
  dx: number;
  dy: number;
}

export type CollectibleKind = 'coin' | 'gem' | 'heart' | 'apple' | 'chest';

export interface Collectible {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  kind: CollectibleKind;
  collected: boolean;
  toolReward?: ToolId;
  bobOffset: number;
}

export interface Checkpoint {
  x: number;
  y: number;
  activated: boolean;
}

export type EnemyKind = 'shroom' | 'beetle' | 'bat' | 'slime';

export interface Enemy {
  id: number;
  kind: EnemyKind;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  baseY: number;
  phase: number;
  patrolMinX?: number;
  patrolMaxX?: number;
  alive: boolean;
  hitFlash: number;
  squashTimer: number;
}

export type BossKind = 'beetle_king' | 'lava_dragon';

export type BossPhaseState =
  | 'IDLE'
  | 'PATROL'
  | 'TELEGRAPH'
  | 'ATTACK'
  | 'RECOVER'
  | 'DEFEATED';

export interface Boss {
  kind: BossKind;
  name: string;
  subtitle: string;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  hp: number;
  maxHp: number;
  arenaMinX: number;
  arenaMaxX: number;
  floorY: number;
  active: boolean;
  defeated: boolean;
  facingRight: boolean;
  phaseState: BossPhaseState;
  stateTimer: number;
  hitFlash: number;
  invulnTimer: number;
  attackPattern: number;
  animTick: number;
}

export interface Projectile {
  id: number;
  fromPlayer: boolean;
  kind: 'boomerang' | 'shockwave' | 'fireball' | 'stone_wave';
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  damage: number;
  life: number;
  maxLife: number;
  returning?: boolean;
  rotation: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  gravity: number;
  glow?: boolean;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface Player {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  facingRight: boolean;
  onGround: boolean;
  jumpsRemaining: number;
  isCrouching: boolean;
  attackTimer: number;
  attackCooldown: number;
  boomerangCooldown: number;
  invulnTimer: number;
  hitFlash: number;
  animTimer: number;
  coyoteTimer: number;
  jumpBufferTimer: number;
  safeX: number;
  safeY: number;
  healthStamina: number;
  maxHealthStamina: number;
  toolEnergy: number;
  maxToolEnergy: number;
  lives: number;
  maxLives: number;
  tools: ToolId[];
}

export interface InputState {
  left: boolean;
  right: boolean;
  down: boolean;
  jumpHeld: boolean;
  jumpJustPressed: boolean;
  attackJustPressed: boolean;
  toolJustPressed: boolean;
}

export interface LevelTheme {
  id: number;
  worldCode: string;
  name: string;
  subtitle: string;
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  farHillColor: string;
  nearHillColor: string;
  accentColor: string;
  isCavern: boolean;
}

export interface LevelDefinition {
  theme: LevelTheme;
  width: number;
  height: number;
  spawnX: number;
  spawnY: number;
  bossTriggerX: number;
  tiles: Tile[];
  platforms: MovingPlatform[];
  collectibles: Collectible[];
  checkpoints: Checkpoint[];
  enemies: Enemy[];
  boss: Boss;
}

export interface HudSnapshot {
  lives: number;
  maxLives: number;
  healthStamina: number;
  maxHealthStamina: number;
  toolEnergy: number;
  maxToolEnergy: number;
  coins: number;
  score: number;
  levelIndex: number;
  levelName: string;
  worldCode: string;
  tools: ToolId[];
  bossActive: boolean;
  bossName: string;
  bossHp: number;
  bossMaxHp: number;
  recentToolUnlock: ToolInfo | null;
}
