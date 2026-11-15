import {
  BoatObstacle,
  BoatObstacleKind,
  Boss,
  Checkpoint,
  Collectible,
  Enemy,
  GameMode,
  LevelDefinition,
  MovingPlatform,
  Tile,
  TileKind,
  ToolId,
} from './types';

export const GAME_W = 1280;
export const GAME_H = 720;
export const TILE = 48;

export interface WorldCardInfo {
  id: number;
  mode: GameMode;
  worldCodeDe: string;
  worldCodeEn: string;
  titleDe: string;
  titleEn: string;
  landscapeDe: string;
  landscapeEn: string;
  bossNameDe: string;
  bossNameEn: string;
  accent: string;
}

export const WORLD_ROADMAP: WorldCardInfo[] = [
  {
    id: 0,
    mode: 'platformer',
    worldCodeDe: 'Welt 1',
    worldCodeEn: 'World 1',
    titleDe: 'Smaragd-Tal & Moos-Ruinen',
    titleEn: 'Emerald Valley & Moss Ruins',
    landscapeDe: 'Weite grüne Hügel, Wasserfälle, Ruinentunnel & Sprungfedern',
    landscapeEn: 'Lush green hills, waterfalls, ancient ruins & bounce springs',
    bossNameDe: 'König Stachelpanzer',
    bossNameEn: 'King Spike-Shell',
    accent: '#34d399',
  },
  {
    id: 1,
    mode: 'platformer',
    worldCodeDe: 'Welt 2',
    worldCodeEn: 'World 2',
    titleDe: 'Kristall-Grotte & Vulkan-Festung',
    titleEn: 'Crystal Cavern & Lava Fortress',
    landscapeDe: 'Leuchtende Amethyst-Kristalle, schwebende Inseln & Magma-Flüsse',
    landscapeEn: 'Glowing amethyst crystals, floating lifts & magma rivers',
    bossNameDe: 'Flammen-Drache Ignis',
    bossNameEn: 'Flame Dragon Ignis',
    accent: '#c084fc',
  },
  {
    id: 2,
    mode: 'topdown_boat',
    worldCodeDe: 'Welt 3 · Boot',
    worldCodeEn: 'World 3 · Boat',
    titleDe: 'Wildwasser-Canyon & Eis-Strom',
    titleEn: 'Rapids Canyon & Ice River',
    landscapeDe: 'Draufsicht-Bootsfahrt: Felsen ausweichen, Kisten & Münzen sammeln',
    landscapeEn: 'Top-down speedboat ride: dodge rocks, smash crates & grab coins',
    bossNameDe: 'Eis-Kreuzer Leviathan',
    bossNameEn: 'Ice Cruiser Leviathan',
    accent: '#38bdf8',
  },
  {
    id: 3,
    mode: 'platformer',
    worldCodeDe: 'Welt 4',
    worldCodeEn: 'World 4',
    titleDe: 'Himmels-Archipel & Sturm-Zitadelle',
    titleEn: 'Sky Archipelago & Storm Citadel',
    landscapeDe: 'Schwebende Wolkeninseln, Regenbogenbrücken & goldene Ruinen',
    landscapeEn: 'Floating cloud islands, sky bridges & golden citadels',
    bossNameDe: 'Sturm-Greif Zephyr',
    bossNameEn: 'Storm Griffin Zephyr',
    accent: '#fbbf24',
  },
];

class LevelBuilder {
  private tiles: Tile[] = [];
  private platforms: MovingPlatform[] = [];
  private collectibles: Collectible[] = [];
  private checkpoints: Checkpoint[] = [];
  private enemies: Enemy[] = [];
  private boatObstacles: BoatObstacle[] = [];
  private nextId = 1;

  public groundRow(
    startCol: number,
    endCol: number,
    topKind: TileKind = 'grass',
    subKind: TileKind = 'dirt'
  ) {
    for (let c = startCol; c <= endCol; c++) {
      this.addTile(c, 13, topKind);
      this.addTile(c, 14, subKind);
    }
  }

  public addTile(
    col: number,
    row: number,
    kind: TileKind,
    reward?: 'coin' | 'heart' | 'big_heart' | 'coins_burst'
  ) {
    this.tiles.push({
      id: this.nextId++,
      x: col * TILE,
      y: row * TILE,
      w: TILE,
      h: TILE,
      kind,
      bumpY: 0,
      reward,
      used: false,
      springAnim: 0,
    });
  }

  public addSpan(startCol: number, endCol: number, row: number, kind: TileKind) {
    for (let c = startCol; c <= endCol; c++) {
      this.addTile(c, row, kind);
    }
  }

  public addColumn(col: number, startRow: number, endRow: number, kind: TileKind) {
    for (let r = startRow; r <= endRow; r++) {
      this.addTile(col, r, kind);
    }
  }

  public addPlatform(
    startCol: number,
    startRow: number,
    endCol: number,
    endRow: number,
    widthTiles: number,
    speed: number
  ) {
    this.platforms.push({
      x: startCol * TILE,
      y: startRow * TILE,
      w: widthTiles * TILE,
      h: 22,
      startX: startCol * TILE,
      startY: startRow * TILE,
      endX: endCol * TILE,
      endY: endRow * TILE,
      speed,
      progress: 0,
      dir: 1,
      dx: 0,
      dy: 0,
    });
  }

  public addCoin(col: number, row: number) {
    this.collectibles.push({
      id: this.nextId++,
      x: col * TILE + 11,
      y: row * TILE + 9,
      w: 26,
      h: 30,
      kind: 'coin',
      collected: false,
      bobOffset: col * 0.45,
    });
  }

  public addCoinArc(startCol: number, count: number, baseRow: number) {
    for (let i = 0; i < count; i++) {
      const arc = Math.sin((i / Math.max(1, count - 1)) * Math.PI) * 1.1;
      this.collectibles.push({
        id: this.nextId++,
        x: (startCol + i) * TILE + 11,
        y: (baseRow - arc) * TILE + 9,
        w: 26,
        h: 30,
        kind: 'coin',
        collected: false,
        bobOffset: i * 0.5,
      });
    }
  }

  public addGem(col: number, row: number) {
    this.collectibles.push({
      id: this.nextId++,
      x: col * TILE + 9,
      y: row * TILE + 8,
      w: 30,
      h: 32,
      kind: 'gem',
      collected: false,
      bobOffset: col * 0.6,
    });
  }

  public addHeart(col: number, row: number, isApple = false) {
    this.collectibles.push({
      id: this.nextId++,
      x: col * TILE + 9,
      y: row * TILE + 9,
      w: 30,
      h: 30,
      kind: isApple ? 'apple' : 'heart',
      collected: false,
      bobOffset: col * 0.4,
    });
  }

  public addSuperStar(col: number, row: number) {
    this.collectibles.push({
      id: this.nextId++,
      x: col * TILE + 6,
      y: row * TILE + 4,
      w: 36,
      h: 36,
      kind: 'super_star',
      collected: false,
      bobOffset: col * 0.3,
    });
  }

  public addChest(col: number, row: number, toolReward: ToolId) {
    this.collectibles.push({
      id: this.nextId++,
      x: col * TILE - 2,
      y: row * TILE + 4,
      w: 52,
      h: 44,
      kind: 'chest',
      collected: false,
      toolReward,
      bobOffset: 0,
    });
  }

  public addCheckpoint(col: number, row: number) {
    this.checkpoints.push({
      x: col * TILE + 8,
      y: row * TILE - 72,
      activated: false,
    });
  }

  public addBoatCheckpoint(col: number, yPx = 310) {
    this.checkpoints.push({
      x: col * TILE,
      y: yPx,
      activated: false,
    });
  }

  public addEnemy(
    kind: Enemy['kind'],
    col: number,
    row: number,
    patrolLeftCol?: number,
    patrolRightCol?: number
  ) {
    const dims: Record<Enemy['kind'], { w: number; h: number; hp: number; vx: number }> = {
      shroom: { w: 42, h: 42, hp: 1, vx: -1.45 },
      beetle: { w: 46, h: 36, hp: 2, vx: -2.1 },
      bat: { w: 46, h: 34, hp: 1, vx: -1.75 },
      slime: { w: 44, h: 38, hp: 2, vx: -1.5 },
      sky_drone: { w: 48, h: 36, hp: 2, vx: -2.0 },
    };
    const d = dims[kind];
    const y = row * TILE + (TILE - d.h);
    this.enemies.push({
      id: this.nextId++,
      kind,
      x: col * TILE,
      y,
      w: d.w,
      h: d.h,
      vx: d.vx,
      vy: 0,
      hp: d.hp,
      maxHp: d.hp,
      baseY: y,
      phase: col * 0.7,
      patrolMinX: patrolLeftCol !== undefined ? patrolLeftCol * TILE : undefined,
      patrolMaxX: patrolRightCol !== undefined ? patrolRightCol * TILE : undefined,
      alive: true,
      hitFlash: 0,
      squashTimer: 0,
    });
  }

  public addBoatObstacle(
    kind: BoatObstacleKind,
    col: number,
    yPx: number,
    vy = 0
  ) {
    const sizes: Record<BoatObstacleKind, { w: number; h: number; hp: number }> = {
      rock: { w: 62, h: 56, hp: 99 },
      iceberg: { w: 72, h: 64, hp: 99 },
      whirlpool: { w: 74, h: 74, hp: 99 },
      mine: { w: 42, h: 42, hp: 1 },
      crate: { w: 46, h: 46, hp: 1 },
      heart_crate: { w: 48, h: 48, hp: 1 },
    };
    const s = sizes[kind];
    this.boatObstacles.push({
      id: this.nextId++,
      kind,
      x: col * TILE,
      y: yPx,
      w: s.w,
      h: s.h,
      vx: 0,
      vy,
      hp: s.hp,
      alive: true,
      hitFlash: 0,
      phase: col * 0.5,
    });
  }

  public build(
    theme: LevelDefinition['theme'],
    totalCols: number,
    spawnCol: number,
    spawnRow: number,
    bossTriggerCol: number,
    boss: Boss
  ): LevelDefinition {
    return {
      theme,
      width: totalCols * TILE,
      height: GAME_H,
      spawnX: spawnCol * TILE,
      spawnY: spawnRow * TILE,
      bossTriggerX: bossTriggerCol * TILE,
      tiles: this.tiles,
      platforms: this.platforms,
      collectibles: this.collectibles,
      checkpoints: this.checkpoints,
      enemies: this.enemies,
      boatObstacles: this.boatObstacles,
      boss,
    };
  }
}

export function createLevel(levelIndex: number): LevelDefinition {
  if (levelIndex === 0) return buildLevel1();
  if (levelIndex === 1) return buildLevel2();
  if (levelIndex === 2) return buildLevel3Boat();
  return buildLevel4Sky();
}

function buildLevel1(): LevelDefinition {
  const b = new LevelBuilder();

  // Abschnitt 1: Sonniges Tal (Cols 0..46)
  b.groundRow(0, 18, 'grass', 'dirt');
  b.addCoinArc(5, 4, 11);
  b.addTile(9, 10, 'question', 'coin');
  b.addTile(10, 10, 'brick');
  b.addTile(11, 10, 'question', 'heart');
  b.addTile(12, 10, 'brick');
  b.addEnemy('shroom', 14, 12, 8, 17);

  // Gap 19..20
  b.groundRow(21, 45, 'grass', 'dirt');
  b.addCoin(19.5, 10.5);
  b.addCoin(20.5, 10.5);

  // Geheimgang zum Bücken + Super-Stern #1!
  b.addSpan(23, 27, 11, 'stone');
  b.addSpan(23, 27, 10, 'grass');
  b.addGem(24, 12);
  b.addSuperStar(25, 12);
  b.addGem(26, 12);
  b.addCoinArc(23, 5, 8.5);

  b.addEnemy('shroom', 31, 12, 28, 35);
  b.addTile(33, 10, 'question', 'coins_burst');
  b.addTile(37, 12, 'spring');
  b.addSpan(39, 44, 8, 'bridge');
  b.addCoinArc(39, 5, 6.5);
  b.addGem(41, 6.5);

  // Checkpoint 1 + Abschnitt 2: Moos-Ruinen & Kraft-Handschuhe (Cols 47..102)
  b.groundRow(48, 72, 'grass', 'dirt');
  b.addCheckpoint(49, 13);
  b.addEnemy('beetle', 54, 12, 51, 59);
  b.addSpan(55, 60, 10, 'stone');
  b.addTile(57, 7, 'question', 'heart');
  b.addChest(57, 9, 'power_gloves');

  // Rissige Felsen zum Zerschmettern!
  b.addColumn(63, 10, 12, 'cracked');
  b.addColumn(64, 10, 12, 'cracked');
  b.addGem(63.5, 12);
  b.addHeart(66, 12);
  b.addEnemy('bat', 68, 8, 65, 72);

  // Bewegliche Brücke 73..78
  b.addPlatform(73, 11, 77, 11, 2.5, 0.017);
  b.addCoin(75, 9);
  b.addCoin(76, 9);

  b.groundRow(79, 102, 'grass', 'dirt');
  b.addEnemy('beetle', 83, 12, 80, 88);
  b.addSpan(85, 90, 9.5, 'brick');
  b.addTile(87, 9.5, 'question', 'big_heart');
  b.addSuperStar(88, 7.5); // Super-Stern #2!
  b.addEnemy('shroom', 93, 12, 89, 98);
  b.addTile(96, 12, 'spring');
  b.addSpan(98, 101, 7, 'bridge');
  b.addGem(99, 5.5);
  b.addGem(100, 5.5);

  // Checkpoint 2 + Abschnitt 3: Wasserfall-Schlucht & Tempelpfad (Cols 103..165)
  b.groundRow(104, 128, 'grass', 'dirt');
  b.addCheckpoint(105, 13);
  b.addEnemy('bat', 110, 7.5, 107, 115);
  b.addSpan(112, 116, 10, 'stone');
  b.addTile(114, 10, 'question', 'coins_burst');
  b.addEnemy('beetle', 119, 12, 115, 124);
  b.addColumn(125, 10, 12, 'cracked');
  b.addHeart(126, 12, true);

  // Doppel-Sprung Passage mit Inseln 129..144
  b.addSpan(130, 133, 11.5, 'bridge');
  b.addCoinArc(130, 4, 10);
  b.addPlatform(135, 11, 139, 9, 2.5, 0.018);
  b.addSuperStar(137, 7); // Super-Stern #3!
  b.addSpan(141, 144, 11, 'stone');
  b.addEnemy('bat', 142, 7.5, 139, 146);

  b.groundRow(146, 171, 'grass', 'dirt');
  b.addEnemy('shroom', 150, 12, 147, 155);
  b.addEnemy('beetle', 158, 12, 153, 163);
  b.addTile(155, 10, 'question', 'heart');
  b.addSpan(160, 164, 9.5, 'brick');
  b.addCoinArc(160, 5, 8);

  // Checkpoint 3 + Sternen-Bumerang Truhe vor Boss 1!
  b.addCheckpoint(167, 13);
  b.addChest(169, 12, 'star_boomerang');

  // Boss 1 Arena (Cols 172..199)
  b.groundRow(172, 199, 'stone', 'stone');
  b.addColumn(172, 4, 10, 'stone');
  b.addColumn(199, 3, 12, 'stone');
  b.addSpan(176, 179, 10, 'bridge');
  b.addSpan(191, 194, 10, 'bridge');
  b.addTile(185, 12, 'spring');
  b.addHeart(177, 9);
  b.addHeart(192, 9);

  const boss: Boss = {
    kind: 'beetle_king',
    nameDe: 'König Stachelpanzer',
    nameEn: 'King Spike-Shell',
    subtitleDe: 'Wächter der Moos-Ruinen',
    subtitleEn: 'Guardian of the Moss Ruins',
    x: 191 * TILE,
    y: 13 * TILE - 94,
    w: 98,
    h: 94,
    vx: 0,
    vy: 0,
    hp: 18,
    maxHp: 18,
    arenaMinX: 173 * TILE,
    arenaMaxX: 198 * TILE,
    floorY: 13 * TILE,
    active: false,
    defeated: false,
    facingRight: false,
    phaseState: 'IDLE',
    stateTimer: 60,
    hitFlash: 0,
    invulnTimer: 0,
    attackPattern: 0,
    animTick: 0,
  };

  return b.build(
    {
      id: 0,
      mode: 'platformer',
      worldCodeDe: 'Welt 1',
      worldCodeEn: 'World 1',
      nameDe: 'Smaragd-Tal & Moos-Ruinen',
      nameEn: 'Emerald Valley & Moss Ruins',
      subtitleDe: 'Sonnige Hügel, Tempelruinen & König Stachelpanzer',
      subtitleEn: 'Sunny hills, temple ruins & King Spike-Shell',
      skyTop: '#0284c7',
      skyMid: '#38bdf8',
      skyBottom: '#bae6fd',
      farHillColor: '#047857',
      nearHillColor: '#10b981',
      accentColor: '#34d399',
      backdropStyle: 'meadow',
    },
    200,
    3,
    11,
    174,
    boss
  );
}

function buildLevel2(): LevelDefinition {
  const b = new LevelBuilder();

  // Abschnitt 1: Kristall-Eingang (Cols 0..50)
  b.groundRow(0, 19, 'crystal', 'stone');
  b.addCoinArc(5, 4, 11);
  b.addTile(9, 10, 'question', 'coin');
  b.addTile(10, 10, 'stone');
  b.addTile(11, 10, 'question', 'heart');
  b.addEnemy('slime', 14, 12, 10, 18);

  // Magma-Schlucht mit beweglicher Plattform
  b.addSpan(20, 25, 14, 'lava');
  b.addPlatform(20, 12, 24, 12, 2.5, 0.017);
  b.addCoin(22, 9.5);
  b.addGem(23, 9.5);

  b.groundRow(26, 49, 'crystal', 'stone');
  b.addEnemy('bat', 29, 7.5, 26, 35);
  b.addSpan(31, 35, 10, 'crystal');
  b.addChest(33, 9, 'turbo_boots'); // Turbo-Stiefel!
  b.addTile(32, 7, 'question', 'coins_burst');
  b.addEnemy('slime', 39, 12, 36, 44);
  b.addEnemy('beetle', 43, 12, 38, 48);

  // Bück-Kristalltunnel + Super-Stern #1!
  b.groundRow(50, 62, 'crystal', 'stone');
  b.addCheckpoint(51, 13);
  b.addSpan(53, 57, 11, 'stone');
  b.addSpan(53, 57, 10, 'crystal');
  b.addGem(54, 12);
  b.addSuperStar(55, 12);
  b.addHeart(56, 12, true);
  b.addCoinArc(53, 5, 8);

  // Abschnitt 2: Magma-Brücken & Kristall-Türme (Cols 63..115)
  b.addSpan(63, 74, 14, 'lava');
  b.addSpan(64, 67, 12, 'bridge');
  b.addCoin(65, 10);
  b.addCoin(66, 10);
  b.addPlatform(68, 11.5, 72, 9.5, 2.5, 0.019);
  b.addGem(70, 8);

  b.groundRow(75, 96, 'crystal', 'stone');
  b.addTile(78, 12, 'spring');
  b.addSpan(80, 85, 8, 'bridge');
  b.addTile(82, 5, 'question', 'big_heart');
  b.addSuperStar(84, 6.5); // Super-Stern #2!
  b.addEnemy('bat', 83, 10, 77, 88);
  b.addEnemy('beetle', 89, 12, 85, 95);
  b.addColumn(92, 10, 12, 'cracked');
  b.addGem(93, 12);

  // Lava-Inseln 97..108
  b.addSpan(97, 108, 14, 'lava');
  b.addSpan(98, 100, 11.5, 'crystal');
  b.addHeart(99, 10);
  b.addSpan(102, 104, 10, 'crystal');
  b.addCoinArc(102, 3, 8.5);
  b.addSpan(106, 107, 11, 'crystal');
  b.addEnemy('bat', 103, 7, 98, 107);

  // Checkpoint 2 + Abschnitt 3: Tiefe Vulkan-Kammern (Cols 109..174)
  b.groundRow(109, 134, 'crystal', 'stone');
  b.addCheckpoint(110, 13);
  b.addEnemy('slime', 115, 12, 112, 122);
  b.addTile(118, 10, 'question', 'coins_burst');
  b.addSpan(121, 126, 9, 'stone');
  b.addTile(123, 9, 'question', 'heart');
  b.addEnemy('beetle', 127, 12, 123, 133);

  // Aufstieg über Kristall-Plattformen 135..152
  b.addSpan(135, 152, 14, 'lava');
  b.addPlatform(136, 12, 140, 10, 2.5, 0.018);
  b.addSpan(142, 145, 9.5, 'bridge');
  b.addSuperStar(143.5, 8); // Super-Stern #3!
  b.addPlatform(147, 10, 150, 11.5, 2.5, 0.018);

  b.groundRow(153, 175, 'crystal', 'stone');
  b.addEnemy('slime', 158, 12, 154, 165);
  b.addEnemy('bat', 162, 7.5, 156, 168);
  b.addTile(164, 10, 'question', 'big_heart');

  // Checkpoint 3 + Sonnen-Klinge Truhe vor Boss 2!
  b.addCheckpoint(170, 13);
  b.addChest(172, 12, 'sun_sword');

  // Boss 2 Arena (Cols 176..203)
  b.groundRow(176, 203, 'stone', 'stone');
  b.addColumn(176, 3, 10, 'stone');
  b.addColumn(203, 3, 12, 'stone');
  b.addSpan(180, 183, 10, 'bridge');
  b.addSpan(195, 198, 10, 'bridge');
  b.addTile(188, 12, 'spring');
  b.addTile(190, 12, 'spring');
  b.addHeart(181, 9, true);
  b.addHeart(196, 9, true);

  const boss: Boss = {
    kind: 'lava_dragon',
    nameDe: 'Flammen-Drache Ignis',
    nameEn: 'Flame Dragon Ignis',
    subtitleDe: 'Herrscher der Vulkan-Festung',
    subtitleEn: 'Ruler of the Lava Fortress',
    x: 194 * TILE,
    y: 13 * TILE - 112,
    w: 116,
    h: 112,
    vx: 0,
    vy: 0,
    hp: 26,
    maxHp: 26,
    arenaMinX: 177 * TILE,
    arenaMaxX: 202 * TILE,
    floorY: 13 * TILE,
    active: false,
    defeated: false,
    facingRight: false,
    phaseState: 'IDLE',
    stateTimer: 55,
    hitFlash: 0,
    invulnTimer: 0,
    attackPattern: 0,
    animTick: 0,
  };

  return b.build(
    {
      id: 1,
      mode: 'platformer',
      worldCodeDe: 'Welt 2',
      worldCodeEn: 'World 2',
      nameDe: 'Kristall-Grotte & Vulkan-Festung',
      nameEn: 'Crystal Cavern & Lava Fortress',
      subtitleDe: 'Amethyst-Kristalle, Magma-Brücken & Flammen-Drache Ignis',
      subtitleEn: 'Amethyst crystals, magma bridges & Flame Dragon Ignis',
      skyTop: '#0f172a',
      skyMid: '#4c1d95',
      skyBottom: '#9a3412',
      farHillColor: '#312e81',
      nearHillColor: '#581c87',
      accentColor: '#c084fc',
      backdropStyle: 'cavern',
    },
    204,
    3,
    11,
    178,
    boss
  );
}

function buildLevel3Boat(): LevelDefinition {
  const b = new LevelBuilder();

  // Top-Down Flussfahrt! (Cols 0..184)
  // Flussufer sind in renderer.ts oben (y < 88) & unten (y > 632)
  // Kisten (crate, heart_crate), Felsen (rock), Eisberge (iceberg), Strudel (whirlpool), Minen (mine)

  // Abschnitt 1: Canyon-Start (Cols 12..56)
  b.addCoin(14, 5);
  b.addCoin(15, 6);
  b.addCoin(16, 7);
  b.addBoatObstacle('crate', 18, 220);
  b.addBoatObstacle('crate', 18, 430);
  b.addBoatObstacle('rock', 23, 310);
  b.addCoinArc(25, 4, 4);
  b.addBoatObstacle('rock', 29, 170);
  b.addBoatObstacle('rock', 31, 490);
  b.addBoatObstacle('heart_crate', 34, 330);
  b.addBoatObstacle('whirlpool', 39, 250);
  b.addCoin(40, 9);
  b.addCoin(41, 9);
  b.addBoatObstacle('crate', 44, 190);
  b.addSuperStar(46, 3); // Super-Stern #1 (oben am Canyon-Rand)
  b.addBoatObstacle('rock', 49, 390);
  b.addBoatObstacle('mine', 53, 270, 1.4);

  // Checkpoint 1 + Abschnitt 2: Aegis-Schild & Eis-Strom! (Cols 58..114)
  b.addBoatCheckpoint(58, 324);
  b.addChest(63, 6.5, 'aegis_shield'); // Neues Werkzeug: Aegis-Schild!

  b.addBoatObstacle('iceberg', 70, 200);
  b.addBoatObstacle('iceberg', 72, 460);
  b.addCoinArc(74, 5, 7);
  b.addBoatObstacle('mine', 79, 240, 1.8);
  b.addBoatObstacle('mine', 81, 430, -1.8);
  b.addBoatObstacle('crate', 85, 320);
  b.addBoatObstacle('heart_crate', 86, 480);
  b.addBoatObstacle('whirlpool', 91, 350);
  b.addBoatObstacle('iceberg', 96, 160);
  b.addSuperStar(98, 10.5); // Super-Stern #2!
  b.addBoatObstacle('rock', 102, 290);
  b.addBoatObstacle('crate', 106, 210);
  b.addBoatObstacle('crate', 106, 430);
  b.addBoatObstacle('mine', 111, 330, 2.0);

  // Checkpoint 2 + Abschnitt 3: Stromschnellen (Cols 116..158)
  b.addBoatCheckpoint(116, 324);
  b.addCoinArc(120, 5, 5);
  b.addBoatObstacle('iceberg', 124, 240);
  b.addBoatObstacle('whirlpool', 128, 440);
  b.addBoatObstacle('heart_crate', 132, 320);
  b.addBoatObstacle('mine', 136, 180, 2.1);
  b.addBoatObstacle('mine', 138, 470, -2.1);
  b.addSuperStar(142, 7); // Super-Stern #3!
  b.addBoatObstacle('crate', 145, 200);
  b.addBoatObstacle('crate', 145, 450);
  b.addBoatObstacle('rock', 150, 340);
  b.addGem(152, 4);
  b.addGem(152, 10);

  // Checkpoint 3 vor der Eis-Bucht Boss-Arena
  b.addBoatCheckpoint(156, 324);
  b.addHeart(158, 7, true);

  const boss: Boss = {
    kind: 'ice_leviathan',
    nameDe: 'Eis-Kreuzer Leviathan',
    nameEn: 'Ice Cruiser Leviathan',
    subtitleDe: 'Schrecken des Eis-Stroms',
    subtitleEn: 'Terror of the Ice Rapids',
    x: 178 * TILE,
    y: 290,
    w: 118,
    h: 128,
    vx: 0,
    vy: 2.8,
    hp: 24,
    maxHp: 24,
    arenaMinX: 159 * TILE,
    arenaMaxX: 184 * TILE,
    floorY: 620,
    active: false,
    defeated: false,
    facingRight: false,
    phaseState: 'IDLE',
    stateTimer: 55,
    hitFlash: 0,
    invulnTimer: 0,
    attackPattern: 0,
    animTick: 0,
  };

  return b.build(
    {
      id: 2,
      mode: 'topdown_boat',
      worldCodeDe: 'Welt 3 · Boot',
      worldCodeEn: 'World 3 · Boat',
      nameDe: 'Wildwasser-Canyon & Eis-Strom',
      nameEn: 'Rapids Canyon & Ice River',
      subtitleDe: 'Draufsicht-Bootsfahrt, Felsen & Eis-Kreuzer Leviathan',
      subtitleEn: 'Top-down speedboat ride, rocks & Ice Cruiser Leviathan',
      skyTop: '#0369a1',
      skyMid: '#0284c7',
      skyBottom: '#0ea5e9',
      farHillColor: '#0c4a6e',
      nearHillColor: '#075985',
      accentColor: '#38bdf8',
      backdropStyle: 'river',
    },
    185,
    3,
    7,
    161,
    boss
  );
}

function buildLevel4Sky(): LevelDefinition {
  const b = new LevelBuilder();

  // Abschnitt 1: Wolken-Brücken (Cols 0..48)
  b.groundRow(0, 16, 'cloud', 'stone');
  b.addCoinArc(5, 4, 11);
  b.addTile(9, 10, 'question', 'coin');
  b.addTile(11, 10, 'question', 'heart');
  b.addEnemy('sky_drone', 13, 8, 9, 17);

  b.addSpan(18, 22, 12, 'cloud');
  b.addTile(20, 11, 'spring');
  b.addSpan(23, 28, 8, 'bridge');
  b.addSuperStar(25.5, 6.5); // Super-Stern #1!
  b.addCoinArc(23, 5, 6.5);

  b.groundRow(29, 48, 'cloud', 'stone');
  b.addEnemy('beetle', 34, 12, 30, 39);
  b.addSpan(36, 40, 9.5, 'stone');
  b.addTile(38, 9.5, 'question', 'coins_burst');
  b.addEnemy('sky_drone', 43, 8, 39, 47);

  // Checkpoint 1 + Abschnitt 2: Schwebende Archipel-Inseln (Cols 49..106)
  b.groundRow(49, 60, 'cloud', 'stone');
  b.addCheckpoint(50, 13);
  b.addHeart(54, 12, true);
  b.addColumn(58, 10, 12, 'cracked');
  b.addGem(59, 12);

  b.addPlatform(62, 12, 67, 10, 2.5, 0.018);
  b.addSpan(69, 75, 10, 'cloud');
  b.addEnemy('beetle', 72, 10 - 1, 69, 75);
  b.addPlatform(77, 10, 82, 12, 2.5, 0.018);
  b.addSuperStar(79.5, 7.5); // Super-Stern #2!

  b.groundRow(84, 106, 'cloud', 'stone');
  b.addEnemy('sky_drone', 88, 7.5, 85, 95);
  b.addTile(92, 10, 'question', 'big_heart');
  b.addSpan(95, 99, 11, 'stone');
  b.addSpan(95, 99, 10, 'cloud'); // Bück-Tunnel im Himmelstempel!
  b.addGem(96, 12);
  b.addGem(97, 12);
  b.addGem(98, 12);

  // Checkpoint 2 + Abschnitt 3: Sonnen-Zitadelle Aufstieg (Cols 107..168)
  b.groundRow(107, 126, 'cloud', 'stone');
  b.addCheckpoint(108, 13);
  b.addEnemy('beetle', 114, 12, 110, 120);
  b.addTile(122, 12, 'spring');
  b.addSpan(124, 130, 8, 'bridge');
  b.addCoinArc(124, 6, 6.5);
  b.addEnemy('sky_drone', 128, 6, 123, 134);

  b.addSpan(132, 136, 11, 'cloud');
  b.addHeart(134, 10);
  b.addPlatform(138, 11, 143, 9, 2.5, 0.019);
  b.addSuperStar(140.5, 7); // Super-Stern #3!
  b.addSpan(145, 150, 10.5, 'cloud');
  b.addEnemy('beetle', 147, 9.5, 145, 150);

  b.groundRow(152, 173, 'cloud', 'stone');
  b.addEnemy('sky_drone', 157, 7.5, 153, 163);
  b.addTile(161, 10, 'question', 'big_heart');
  b.addEnemy('beetle', 166, 12, 160, 170);

  // Checkpoint 3 vor Boss 4!
  b.addCheckpoint(169, 13);
  b.addHeart(171, 12, true);

  // Boss 4 Arena (Cols 174..201)
  b.groundRow(174, 201, 'stone', 'stone');
  b.addColumn(174, 3, 10, 'stone');
  b.addColumn(201, 3, 12, 'stone');
  b.addSpan(178, 181, 10, 'bridge');
  b.addSpan(193, 196, 10, 'bridge');
  b.addTile(186, 12, 'spring');
  b.addTile(188, 12, 'spring');
  b.addHeart(179, 9, true);
  b.addHeart(194, 9, true);

  const boss: Boss = {
    kind: 'storm_griffin',
    nameDe: 'Sturm-Greif Zephyr',
    nameEn: 'Storm Griffin Zephyr',
    subtitleDe: 'König der Wolken-Zitadelle',
    subtitleEn: 'King of the Cloud Citadel',
    x: 192 * TILE,
    y: 13 * TILE - 114,
    w: 118,
    h: 114,
    vx: 0,
    vy: 0,
    hp: 30,
    maxHp: 30,
    arenaMinX: 175 * TILE,
    arenaMaxX: 200 * TILE,
    floorY: 13 * TILE,
    active: false,
    defeated: false,
    facingRight: false,
    phaseState: 'IDLE',
    stateTimer: 50,
    hitFlash: 0,
    invulnTimer: 0,
    attackPattern: 0,
    animTick: 0,
  };

  return b.build(
    {
      id: 3,
      mode: 'platformer',
      worldCodeDe: 'Welt 4',
      worldCodeEn: 'World 4',
      nameDe: 'Himmels-Archipel & Sturm-Zitadelle',
      nameEn: 'Sky Archipelago & Storm Citadel',
      subtitleDe: 'Wolkeninseln, Sonnenbrücken & Sturm-Greif Zephyr',
      subtitleEn: 'Cloud islands, sun bridges & Storm Griffin Zephyr',
      skyTop: '#0369a1',
      skyMid: '#0ea5e9',
      skyBottom: '#fef08a',
      farHillColor: '#e0f2fe',
      nearHillColor: '#bae6fd',
      accentColor: '#fbbf24',
      backdropStyle: 'sky',
    },
    202,
    3,
    11,
    176,
    boss
  );
}
