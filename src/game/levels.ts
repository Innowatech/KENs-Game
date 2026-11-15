import {
  Boss,
  Checkpoint,
  Collectible,
  Enemy,
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
  worldCode: string;
  title: string;
  landscape: string;
  bossName: string;
  unlocked: boolean;
  comingSoon?: boolean;
  gradient: string;
  accent: string;
}

export const WORLD_ROADMAP: WorldCardInfo[] = [
  {
    id: 0,
    worldCode: 'Welt 1',
    title: 'Smaragd-Tal & Moos-Ruinen',
    landscape: 'Sonnige Hügel, Wasserfälle & uralte Tempelsteine',
    bossName: 'König Stachelpanzer',
    unlocked: true,
    gradient: 'from-emerald-600 to-teal-800',
    accent: '#34d399',
  },
  {
    id: 1,
    worldCode: 'Welt 2',
    title: 'Kristall-Grotte & Vulkan-Festung',
    landscape: 'Leuchtende Amethyst-Kristalle & glühende Magma-Brücken',
    bossName: 'Flammen-Drache Ignis',
    unlocked: true,
    gradient: 'from-indigo-700 via-purple-800 to-orange-700',
    accent: '#c084fc',
  },
  {
    id: 2,
    worldCode: 'Welt 3',
    title: 'Frost-Gipfel & Gletscher-Burg',
    landscape: 'Glitzernde Eishöhlen & verschneite Berggipfel',
    bossName: 'Frost-Titan Boreas',
    unlocked: false,
    comingSoon: true,
    gradient: 'from-sky-700 to-slate-800',
    accent: '#38bdf8',
  },
  {
    id: 3,
    worldCode: 'Welt 4',
    title: 'Himmels-Archipel',
    landscape: 'Schwebende Inseln & goldene Windmühlen',
    bossName: 'Sturm-Greif Zephyr',
    unlocked: false,
    comingSoon: true,
    gradient: 'from-amber-600 to-sky-800',
    accent: '#fbbf24',
  },
];

class LevelBuilder {
  private tiles: Tile[] = [];
  private platforms: MovingPlatform[] = [];
  private collectibles: Collectible[] = [];
  private checkpoints: Checkpoint[] = [];
  private enemies: Enemy[] = [];
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

  public addSpan(
    startCol: number,
    endCol: number,
    row: number,
    kind: TileKind
  ) {
    for (let c = startCol; c <= endCol; c++) {
      this.addTile(c, row, kind);
    }
  }

  public addColumn(
    col: number,
    startRow: number,
    endRow: number,
    kind: TileKind
  ) {
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

  public addEnemy(
    kind: Enemy['kind'],
    col: number,
    row: number,
    patrolLeftCol?: number,
    patrolRightCol?: number
  ) {
    const dims: Record<Enemy['kind'], { w: number; h: number; hp: number; vx: number }> = {
      shroom: { w: 42, h: 42, hp: 1, vx: -1.4 },
      beetle: { w: 46, h: 36, hp: 2, vx: -2.1 },
      bat: { w: 46, h: 34, hp: 1, vx: -1.7 },
      slime: { w: 44, h: 38, hp: 2, vx: -1.5 },
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
      boss,
    };
  }
}

export function createLevel(levelIndex: number): LevelDefinition {
  if (levelIndex === 0) {
    return buildLevel1();
  }
  return buildLevel2();
}

function buildLevel1(): LevelDefinition {
  const b = new LevelBuilder();

  // Zone 1: Sonniges Tal (Cols 0..30)
  b.groundRow(0, 17, 'grass', 'dirt');
  b.addCoinArc(5, 4, 11);
  b.addTile(9, 10, 'question', 'coin');
  b.addTile(10, 10, 'brick');
  b.addTile(11, 10, 'question', 'heart');
  b.addTile(12, 10, 'brick');
  b.addEnemy('shroom', 13, 12, 8, 16);

  // Small gap 18..19 (easy single jump!)
  b.groundRow(20, 38, 'grass', 'dirt');
  b.addCoin(18.5, 10.5);
  b.addCoin(19.5, 10.5);

  // Duck/Crouch Secret Passage (Cols 22..26): 1-tile gap at row 12 under stone!
  b.addSpan(22, 26, 11, 'stone');
  b.addSpan(22, 26, 10, 'grass');
  b.addGem(23, 12);
  b.addHeart(24, 12);
  b.addGem(25, 12);
  // Also allow jumping over top
  b.addCoinArc(22, 5, 8.5);

  b.addEnemy('shroom', 29, 12, 27, 34);
  b.addTile(31, 10, 'question', 'coins_burst');
  b.addTile(35, 12, 'spring'); // Sonic-style bounce pad up to high bridge!
  b.addSpan(37, 43, 8, 'bridge');
  b.addCoinArc(38, 5, 6.5);
  b.addGem(40, 6.5);

  // Zone 2: Moos-Ruinen & Schatztruhe 1 (Kraft-Handschuhe) (Cols 40..84)
  b.groundRow(41, 66, 'grass', 'dirt');
  b.addCheckpoint(42, 13);

  b.addEnemy('beetle', 46, 12, 44, 52);
  b.addSpan(48, 53, 10, 'stone');
  b.addTile(50, 7, 'question', 'heart');
  b.addChest(50, 9, 'power_gloves'); // Tool 1: Kraft-Handschuhe!

  // Cracked rock barrier immediately after chest so Kenneth can smash it with punch!
  b.addColumn(56, 10, 12, 'cracked');
  b.addColumn(57, 10, 12, 'cracked');
  b.addGem(56.5, 12);
  b.addCoin(56.5, 11);

  b.addEnemy('bat', 60, 8);
  b.addEnemy('shroom', 62, 12, 58, 65);
  b.addTile(63, 10, 'question', 'coin');

  // Gap 67..71 with moving platform
  b.addPlatform(67, 11, 70, 11, 2.5, 0.018);
  b.addCoin(68, 9);
  b.addCoin(70, 9);

  b.groundRow(72, 102, 'grass', 'dirt');
  b.addEnemy('beetle', 76, 12, 73, 81);
  b.addSpan(77, 81, 10, 'brick');
  b.addTile(79, 10, 'question', 'big_heart');
  b.addCoinArc(77, 5, 8.5);
  b.addEnemy('bat', 84, 8);
  b.addEnemy('shroom', 88, 12, 83, 92);

  // High bonus ledge with spring
  b.addTile(92, 12, 'spring');
  b.addSpan(94, 98, 7, 'bridge');
  b.addHeart(95, 6, true);
  b.addGem(96, 6);
  b.addGem(97, 6);

  // Checkpoint + Tool 2: Sternen-Bumerang before Boss Arena
  b.addCheckpoint(100, 13);
  b.addChest(101, 12, 'star_boomerang');

  // Zone 3: Boss Arena (Cols 103..128)
  b.groundRow(103, 129, 'stone', 'stone');
  // Left & Right Arena Pillars/Walls
  b.addColumn(103, 5, 10, 'stone');
  b.addColumn(129, 4, 12, 'stone');
  // Tactical platforms inside Boss Arena for jumping & dodging
  b.addSpan(107, 110, 10, 'bridge');
  b.addSpan(121, 124, 10, 'bridge');
  b.addTile(115, 12, 'spring');
  b.addHeart(108, 9);
  b.addHeart(122, 9);

  const boss: Boss = {
    kind: 'beetle_king',
    name: 'König Stachelpanzer',
    subtitle: 'Wächter der Moos-Ruinen',
    x: 121 * TILE,
    y: 13 * TILE - 92,
    w: 96,
    h: 92,
    vx: 0,
    vy: 0,
    hp: 16,
    maxHp: 16,
    arenaMinX: 104 * TILE,
    arenaMaxX: 128 * TILE,
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
      worldCode: 'Welt 1',
      name: 'Smaragd-Tal & Moos-Ruinen',
      subtitle: 'Grüne Hügel, alte Tempel & König Stachelpanzer',
      skyTop: '#2563eb',
      skyMid: '#60a5fa',
      skyBottom: '#bae6fd',
      farHillColor: '#059669',
      nearHillColor: '#10b981',
      accentColor: '#34d399',
      isCavern: false,
    },
    130,
    3,
    11,
    105,
    boss
  );
}

function buildLevel2(): LevelDefinition {
  const b = new LevelBuilder();

  // Zone 1: Kristall-Grotte (Cols 0..38)
  b.groundRow(0, 18, 'crystal', 'stone');
  b.addCoinArc(5, 4, 11);
  b.addTile(8, 10, 'question', 'coin');
  b.addTile(9, 10, 'stone');
  b.addTile(10, 10, 'question', 'heart');
  b.addEnemy('slime', 13, 12, 9, 17);

  // Moving crystal platform over glowing lava pit (Cols 19..24)
  b.addSpan(19, 24, 14, 'lava');
  b.addPlatform(19, 12, 23, 12, 2.5, 0.016);
  b.addCoin(21, 9.5);
  b.addGem(22, 9.5);

  b.groundRow(25, 45, 'crystal', 'stone');
  b.addEnemy('bat', 28, 7.5);
  // Tool 3: Turbo-Stiefel in crystal shrine!
  b.addSpan(30, 34, 10, 'crystal');
  b.addChest(32, 9, 'turbo_boots');
  b.addTile(31, 7, 'question', 'coins_burst');
  b.addEnemy('slime', 38, 12, 35, 44);
  b.addEnemy('beetle', 41, 12, 36, 44);

  // Crouch Crystal Tunnel (Cols 46..52)
  b.groundRow(46, 56, 'crystal', 'stone');
  b.addSpan(47, 51, 11, 'stone');
  b.addSpan(47, 51, 10, 'crystal');
  b.addGem(48, 12);
  b.addHeart(49, 12, true);
  b.addGem(50, 12);
  b.addCoinArc(47, 5, 8);

  b.addCheckpoint(55, 13);

  // Zone 2: Magma-Brücken & Kristall-Türme (Cols 57..104)
  b.addSpan(57, 68, 14, 'lava');
  b.addSpan(58, 61, 12, 'bridge');
  b.addCoin(59, 10);
  b.addCoin(60, 10);
  b.addPlatform(62, 11.5, 66, 9.5, 2.5, 0.018);
  b.addGem(64, 8);

  b.groundRow(69, 86, 'crystal', 'stone');
  b.addTile(71, 12, 'spring');
  b.addSpan(73, 77, 8, 'bridge');
  b.addTile(75, 5, 'question', 'big_heart');
  b.addCoinArc(73, 5, 6.5);
  b.addEnemy('bat', 76, 10);
  b.addEnemy('beetle', 80, 12, 72, 85);
  b.addColumn(83, 10, 12, 'cracked'); // Smashable with gloves!
  b.addGem(84, 12);

  // Lava leap 87..94
  b.addSpan(87, 94, 14, 'lava');
  b.addSpan(88, 90, 11, 'crystal');
  b.addHeart(89, 10);
  b.addSpan(92, 93, 10, 'crystal');
  b.addEnemy('bat', 91, 7.5);

  b.groundRow(95, 106, 'crystal', 'stone');
  b.addEnemy('slime', 98, 12, 95, 101);
  b.addCheckpoint(102, 13);
  // Tool 4: Sonnen-Klinge before Boss 2!
  b.addChest(104, 12, 'sun_sword');

  // Zone 3: Vulkan-Festung Boss Chamber (Cols 107..134)
  b.groundRow(107, 135, 'stone', 'stone');
  b.addColumn(107, 4, 10, 'stone');
  b.addColumn(135, 3, 12, 'stone');
  b.addSpan(111, 114, 10, 'bridge');
  b.addSpan(126, 129, 10, 'bridge');
  b.addTile(119, 12, 'spring');
  b.addTile(121, 12, 'spring');
  b.addHeart(112, 9, true);
  b.addHeart(127, 9, true);

  const boss: Boss = {
    kind: 'lava_dragon',
    name: 'Flammen-Drache Ignis',
    subtitle: 'Herrscher der Kristall-Festung',
    x: 126 * TILE,
    y: 13 * TILE - 110,
    w: 112,
    h: 110,
    vx: 0,
    vy: 0,
    hp: 24,
    maxHp: 24,
    arenaMinX: 108 * TILE,
    arenaMaxX: 134 * TILE,
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
      worldCode: 'Welt 2',
      name: 'Kristall-Grotte & Vulkan-Festung',
      subtitle: 'Leuchtende Kristalle, Lava-Brücken & Flammen-Drache Ignis',
      skyTop: '#0f172a',
      skyMid: '#3b0764',
      skyBottom: '#7c2d12',
      farHillColor: '#312e81',
      nearHillColor: '#4c1d95',
      accentColor: '#c084fc',
      isCavern: true,
    },
    136,
    3,
    11,
    109,
    boss
  );
}
