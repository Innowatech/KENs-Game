export type GameScreenState =
  | 'TITLE_MENU'
  | 'WORLD_MAP'
  | 'CHANGELOG'
  | 'PLAYING'
  | 'PAUSED'
  | 'LEVEL_CLEAR'
  | 'GAME_OVER'
  | 'VICTORY';

export type GameMode =
  | 'platformer'
  | 'topdown_boat'
  | 'balloon_flight'
  | 'plane_shooter'
  | 'jet_shooter';

export type ToolId =
  | 'power_gloves'
  | 'star_boomerang'
  | 'turbo_boots'
  | 'aegis_shield'
  | 'sun_sword'
  | 'fire_blaster'
  | 'thunder_hammer'
  | 'rocket_pod';

export interface ToolInfo {
  id: ToolId;
  nameDe: string;
  nameEn: string;
  shortDe: string;
  shortEn: string;
  descDe: string;
  descEn: string;
  keyHint: string;
  color: string;
}

export const TOOLS_CATALOG: Record<ToolId, ToolInfo> = {
  power_gloves: {
    id: 'power_gloves',
    nameDe: 'Kraft-Handschuhe',
    nameEn: 'Power Gloves',
    shortDe: 'Kraft',
    shortEn: 'Power',
    descDe: 'Doppelte Schlagkraft und zerschmettert rissige Felsblöcke!',
    descEn: 'Double punch damage and smashes cracked boulders!',
    keyHint: 'X',
    color: '#f97316',
  },
  star_boomerang: {
    id: 'star_boomerang',
    nameDe: 'Sternen-Bumerang',
    nameEn: 'Star Boomerang',
    shortDe: 'Bumerang',
    shortEn: 'Boomerang',
    descDe: 'Fliegt voraus, trifft Gegner und sammelt Münzen ein!',
    descEn: 'Flies forward, hits enemies, and grabs coins!',
    keyHint: 'E',
    color: '#eab308',
  },
  turbo_boots: {
    id: 'turbo_boots',
    nameDe: 'Turbo-Stiefel',
    nameEn: 'Turbo Boots',
    shortDe: 'Turbo',
    shortEn: 'Turbo',
    descDe: 'Schnelleres Rennen, höheres Springen & schnelleres Fahrzeug!',
    descEn: 'Faster running, higher jumps, and faster vehicle speed!',
    keyHint: 'Passiv',
    color: '#06b6d4',
  },
  aegis_shield: {
    id: 'aegis_shield',
    nameDe: 'Aegis-Schild',
    nameEn: 'Aegis Shield',
    shortDe: 'Schild',
    shortEn: 'Shield',
    descDe: 'Blockt feindliche Geschosse und schützt vor Schaden!',
    descEn: 'Blocks enemy projectiles and protects from hits!',
    keyHint: 'C / Q',
    color: '#38bdf8',
  },
  sun_sword: {
    id: 'sun_sword',
    nameDe: 'Sonnen-Klinge',
    nameEn: 'Sun Blade',
    shortDe: 'Schwert',
    shortEn: 'Blade',
    descDe: 'Verstärkt deinen Schlag mit einer goldenen Lichtklinge!',
    descEn: 'Upgrades your punch with a radiant golden light blade!',
    keyHint: 'X',
    color: '#facc15',
  },
  fire_blaster: {
    id: 'fire_blaster',
    nameDe: 'Feuer-Blaster',
    nameEn: 'Fire Blaster',
    shortDe: 'Feuer',
    shortEn: 'Fire',
    descDe: 'Schleudert beim Angreifen brennende Feuerbälle voraus!',
    descEn: 'Launches blazing fireballs forward whenever you attack!',
    keyHint: 'X',
    color: '#ef4444',
  },
  thunder_hammer: {
    id: 'thunder_hammer',
    nameDe: 'Donner-Hammer',
    nameEn: 'Thunder Hammer',
    shortDe: 'Donner',
    shortEn: 'Thunder',
    descDe: 'Entfesselt gewaltige Blitzwellen mit extra hoher Wucht!',
    descEn: 'Unleashes heavy lightning waves with massive impact!',
    keyHint: 'X',
    color: '#a855f7',
  },
  rocket_pod: {
    id: 'rocket_pod',
    nameDe: 'Stern-Raketenwerfer',
    nameEn: 'Star Rocket Pod',
    shortDe: 'Raketen',
    shortEn: 'Rockets',
    descDe: 'Feuert zielsuchende Mini-Raketen mit Rauchschweif ab!',
    descEn: 'Fires homing mini-rockets with glowing smoke trails!',
    keyHint: 'E',
    color: '#f43f5e',
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
  | 'rope_bridge'
  | 'crystal'
  | 'cloud'
  | 'coral'
  | 'sand'
  | 'ice'
  | 'jungle_wood'
  | 'lava'
  | 'spring'
  | 'boost_pad'
  | 'jelly_pad'
  | 'ladder'
  | 'slide_right'
  | 'slide_left'
  | 'bumper';

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

export interface Vine {
  id: number;
  anchorX: number;
  anchorY: number;
  length: number;
  angle: number;
  angVel: number;
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

export type CollectibleKind = 'coin' | 'gem' | 'heart' | 'apple' | 'chest' | 'super_star';

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

export type EnemyKind = 'shroom' | 'beetle' | 'bat' | 'slime' | 'sky_drone' | 'gooey';

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

export type BoatObstacleKind =
  | 'rock'
  | 'iceberg'
  | 'whirlpool'
  | 'mine'
  | 'crate'
  | 'heart_crate'
  | 'storm_cloud'
  | 'ring_gate'
  | 'asteroid';

export interface BoatObstacle {
  id: number;
  kind: BoatObstacleKind;
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  hp: number;
  alive: boolean;
  hitFlash: number;
  phase: number;
}

export type BossKind =
  | 'beetle_king'
  | 'lava_dragon'
  | 'ice_leviathan'
  | 'storm_griffin'
  | 'goo_king'
  | 'jungle_kong'
  | 'yeti_king'
  | 'storm_zeppelin'
  | 'sky_baron'
  | 'titan_mecha';

export type BossPhaseState =
  | 'IDLE'
  | 'PATROL'
  | 'TELEGRAPH'
  | 'ATTACK'
  | 'RECOVER'
  | 'DEFEATED';

export interface Boss {
  kind: BossKind;
  nameDe: string;
  nameEn: string;
  subtitleDe: string;
  subtitleEn: string;
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
  kind:
    | 'boomerang'
    | 'shockwave'
    | 'fireball'
    | 'fire_orb'
    | 'lightning'
    | 'rocket'
    | 'laser'
    | 'stone_wave'
    | 'water_orb'
    | 'wind_blade'
    | 'goo_blob';
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
  homing?: boolean;
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
  onLadder: boolean;
  isSliding: boolean;
  jumpsRemaining: number;
  isCrouching: boolean;
  isShielding: boolean;
  grabbedVineId: number | null;
  vineOffset: number;
  vineCooldown: number;
  boostTimer: number;
  isSpringLaunch: boolean;
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
  checkpointX: number;
  checkpointY: number;
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
  up: boolean;
  down: boolean;
  jumpHeld: boolean;
  jumpJustPressed: boolean;
  attackJustPressed: boolean;
  toolJustPressed: boolean;
  shieldHeld: boolean;
}

export interface LevelTheme {
  id: number;
  mode: GameMode;
  worldCodeDe: string;
  worldCodeEn: string;
  nameDe: string;
  nameEn: string;
  subtitleDe: string;
  subtitleEn: string;
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  farHillColor: string;
  nearHillColor: string;
  accentColor: string;
  backdropStyle:
    | 'meadow'
    | 'cavern'
    | 'river'
    | 'sky'
    | 'reef'
    | 'jungle'
    | 'mountain'
    | 'balloon_sky'
    | 'canyon_sky'
    | 'space_sky';
  lowGravity?: boolean;
}

export interface LevelDefinition {
  theme: LevelTheme;
  width: number;
  height: number;
  spawnX: number;
  spawnY: number;
  bossTriggerX: number;
  tiles: Tile[];
  vines: Vine[];
  platforms: MovingPlatform[];
  collectibles: Collectible[];
  checkpoints: Checkpoint[];
  enemies: Enemy[];
  boatObstacles: BoatObstacle[];
  boss: Boss;
}

export interface HudSnapshot {
  mode: GameMode;
  lives: number;
  maxLives: number;
  healthStamina: number;
  maxHealthStamina: number;
  toolEnergy: number;
  maxToolEnergy: number;
  coins: number;
  score: number;
  starsCollected: number;
  totalStars: number;
  levelIndex: number;
  levelName: string;
  worldCode: string;
  tools: ToolId[];
  isShielding: boolean;
  bossActive: boolean;
  bossName: string;
  bossHp: number;
  bossMaxHp: number;
  recentToolUnlock: ToolInfo | null;
}
