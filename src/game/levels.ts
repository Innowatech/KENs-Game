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
  Vine,
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
    landscapeDe: 'Große Bäume, Hängebrücken, schwingende Lianen & Wasserfälle',
    landscapeEn: 'Giant trees, rope bridges, swinging vines & waterfalls',
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
    landscapeDe: 'Wolkeninseln, Hängebrücken, Lianen & Sonic-Turbo-Felder',
    landscapeEn: 'Cloud islands, sky rope bridges, vines & Sonic turbo pads',
    bossNameDe: 'Sturm-Greif Zephyr',
    bossNameEn: 'Storm Griffin Zephyr',
    accent: '#fbbf24',
  },
  {
    id: 4,
    mode: 'platformer',
    worldCodeDe: 'Welt 5 · Riff',
    worldCodeEn: 'World 5 · Reef',
    titleDe: 'Blubber-Riff & Glibber-Lagune',
    titleEn: 'Bubble Reef & Gooey Lagoon',
    landscapeDe: 'Schwerelose Korallen-Sprünge, Quallen-Trampoline & Glibber-Monster',
    landscapeEn: 'Floaty coral jumps, bouncy jellyfish pads & gooey monsters',
    bossNameDe: 'Glibber-König Gloop',
    bossNameEn: 'Goo-King Gloop',
    accent: '#f472b6',
  },
  {
    id: 5,
    mode: 'platformer',
    worldCodeDe: 'Welt 6 · Dschungel',
    worldCodeEn: 'World 6 · Jungle',
    titleDe: 'Wilder Urwald & Tempel-Rutschen',
    titleEn: 'Wild Jungle & Temple Slides',
    landscapeDe: 'Baumhaus-Leitern, Moos-Rutschen, Lianen-Ketten & Feuer-Blaster',
    landscapeEn: 'Treehouse ladders, moss slides, vine chains & Fire Blaster',
    bossNameDe: 'Dschungel-Wächter Konga',
    bossNameEn: 'Jungle Guardian Konga',
    accent: '#22c55e',
  },
  {
    id: 6,
    mode: 'platformer',
    worldCodeDe: 'Welt 7 · Berg',
    worldCodeEn: 'World 7 · Mountain',
    titleDe: 'Eisgipfel-Aufstieg & Schnee-Grat',
    titleEn: 'Ice Peak Climb & Snow Ridge',
    landscapeDe: 'Kletterwände hochsteigen, Eis-Rutschen, Hängebrücken & Donner-Hammer',
    landscapeEn: 'Climb up mountain walls, icy slides, rope bridges & Thunder Hammer',
    bossNameDe: 'Gipfel-Yeti Frosthorn',
    bossNameEn: 'Summit Yeti Frosthorn',
    accent: '#38bdf8',
  },
  {
    id: 7,
    mode: 'balloon_flight',
    worldCodeDe: 'Welt 8 · Ballon',
    worldCodeEn: 'World 8 · Balloon',
    titleDe: 'Wolkenmeer & Heißluftballon',
    titleEn: 'Cloud Sea & Hot-Air Balloon',
    landscapeDe: 'Mit Brenner-Schub schweben, Goldringe sammeln & Gewittern ausweichen',
    landscapeEn: 'Float with burner boost, collect gold rings & dodge storm clouds',
    bossNameDe: 'Sturm-Zeppelin Nimbus',
    bossNameEn: 'Storm Zeppelin Nimbus',
    accent: '#fb923c',
  },
  {
    id: 8,
    mode: 'plane_shooter',
    worldCodeDe: 'Welt 9 · Flieger',
    worldCodeEn: 'World 9 · Biplane',
    titleDe: 'Sonnen-Schlucht & Propeller-Flieger',
    titleEn: 'Sun Canyon & Stunt Biplane',
    landscapeDe: 'Durch Sonic-Ringe fliegen, Kisten abschießen & Stern-Raketen finden',
    landscapeEn: 'Fly through Sonic rings, blast crates & unlock Star Rockets',
    bossNameDe: 'Wolken-Fregatte Baron Blitz',
    bossNameEn: 'Sky Frigate Baron Blitz',
    accent: '#ef4444',
  },
  {
    id: 9,
    mode: 'jet_shooter',
    worldCodeDe: 'Welt 10 · Kampfjet',
    worldCodeEn: 'World 10 · Jet',
    titleDe: 'Stratosphäre & Raketen-Kampfjet',
    titleEn: 'Stratosphere & Rocket Fighter Jet',
    landscapeDe: 'Überschall-Jet mit Laser-Kanone & zielsuchenden Raketen im Weltall',
    landscapeEn: 'Supersonic jet with twin lasers & homing rockets in upper space',
    bossNameDe: 'Mega-Luftschiff Titan-X',
    bossNameEn: 'Mega Dreadnought Titan-X',
    accent: '#a855f7',
  },
];

class LevelBuilder {
  private tiles: Tile[] = [];
  private vines: Vine[] = [];
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

  public addRopeBridge(startCol: number, endCol: number, row: number) {
    for (let c = startCol; c <= endCol; c++) {
      this.addTile(c, row, 'rope_bridge');
    }
  }

  public addColumn(col: number, startRow: number, endRow: number, kind: TileKind) {
    for (let r = startRow; r <= endRow; r++) {
      this.addTile(col, r, kind);
    }
  }

  public addVine(col: number, anchorRow: number, lengthTiles = 5.5) {
    this.vines.push({
      id: this.nextId++,
      anchorX: col * TILE + TILE / 2,
      anchorY: anchorRow * TILE,
      length: lengthTiles * TILE,
      angle: 0.25,
      angVel: 0,
    });
  }

  public addLadder(col: number, topRow: number, bottomRow: number) {
    for (let r = topRow; r <= bottomRow; r++) {
      this.addTile(col, r, 'ladder');
    }
  }

  public addSlideRight(startCol: number, startRow: number, steps: number) {
    for (let i = 0; i < steps; i++) {
      this.addTile(startCol + i, startRow + i, 'slide_right');
    }
  }

  public addSlideLeft(startCol: number, startRow: number, steps: number) {
    for (let i = 0; i < steps; i++) {
      this.addTile(startCol - i, startRow + i, 'slide_left');
    }
  }

  public addBumper(col: number, row: number) {
    this.addTile(col, row, 'bumper');
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
      gooey: { w: 46, h: 42, hp: 2, vx: -1.6 },
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
      storm_cloud: { w: 72, h: 58, hp: 99 },
      ring_gate: { w: 54, h: 96, hp: 99 },
      asteroid: { w: 56, h: 56, hp: 1 },
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
      vines: this.vines,
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
  if (levelIndex === 3) return buildLevel4Sky();
  if (levelIndex === 4) return buildLevel5Reef();
  if (levelIndex === 5) return buildLevel6Jungle();
  if (levelIndex === 6) return buildLevel7Mountain();
  if (levelIndex === 7) return buildLevel8Balloon();
  if (levelIndex === 8) return buildLevel9Plane();
  return buildLevel10Jet();
}

function buildLevel1(): LevelDefinition {
  const b = new LevelBuilder();

  // Abschnitt 1: Sonniges Tal & erste Hängebrücke (Cols 0..48)
  b.groundRow(0, 17, 'grass', 'dirt');
  b.addCoinArc(5, 4, 11);
  b.addTile(9, 10, 'question', 'coin');
  b.addTile(10, 10, 'brick');
  b.addTile(11, 10, 'question', 'heart');
  b.addTile(12, 10, 'brick');
  b.addEnemy('shroom', 14, 12, 8, 16);

  // Hängebrücke über die erste kleine Schlucht (Cols 18..22)!
  b.addRopeBridge(18, 22, 13);
  b.addCoinArc(18, 5, 11);

  b.groundRow(23, 47, 'grass', 'dirt');
  // Bück-Tunnel mit Super-Stern #1!
  b.addSpan(25, 29, 11, 'stone');
  b.addSpan(25, 29, 10, 'grass');
  b.addGem(26, 12);
  b.addSuperStar(27, 12);
  b.addGem(28, 12);
  b.addCoinArc(25, 5, 8.5);

  b.addEnemy('shroom', 32, 12, 30, 37);
  b.addTile(35, 10, 'question', 'coins_burst');
  b.addTile(39, 12, 'spring');
  b.addSpan(41, 46, 8, 'bridge');
  b.addCoinArc(41, 5, 6.5);
  b.addGem(43, 6.5);

  // Checkpoint 1 + Abschnitt 2: Moos-Ruinen, Lianen & Kraft-Handschuhe (Cols 49..104)
  b.groundRow(49, 70, 'grass', 'dirt');
  b.addCheckpoint(50, 13);
  b.addTile(52, 12, 'boost_pad'); // Sonic Turbo-Feld!
  b.addEnemy('beetle', 56, 12, 53, 61);
  b.addSpan(57, 61, 10, 'stone');
  b.addTile(59, 7, 'question', 'heart');
  b.addChest(59, 9, 'power_gloves');

  b.addColumn(64, 10, 12, 'cracked');
  b.addColumn(65, 10, 12, 'cracked');
  b.addGem(64.5, 12);
  b.addHeart(67, 12);
  b.addEnemy('bat', 69, 8, 66, 73);

  // Lianen-Schlucht (Cols 71..80)! Kenneth schwingt von Liane zu Liane!
  b.addVine(73, 3.5, 5.5);
  b.addCoin(73, 9);
  b.addVine(77, 3.5, 5.5);
  b.addGem(77, 9);

  b.groundRow(81, 104, 'grass', 'dirt');
  b.addEnemy('beetle', 85, 12, 82, 90);
  b.addSpan(87, 92, 9.5, 'brick');
  b.addTile(89, 9.5, 'question', 'big_heart');
  b.addSuperStar(90, 7.5); // Super-Stern #2!
  b.addEnemy('shroom', 95, 12, 91, 99);
  b.addTile(98, 12, 'spring');
  b.addSpan(100, 103, 7, 'bridge');
  b.addGem(101, 5.5);

  // Checkpoint 2 + Abschnitt 3: Lange Hängebrücke & Tempelpfad (Cols 105..168)
  b.groundRow(105, 126, 'grass', 'dirt');
  b.addCheckpoint(106, 13);
  b.addEnemy('bat', 111, 7.5, 108, 116);
  b.addSpan(113, 117, 10, 'stone');
  b.addTile(115, 10, 'question', 'coins_burst');
  b.addEnemy('beetle', 120, 12, 116, 125);
  b.addColumn(125, 10, 12, 'cracked');

  // Lange Hängebrücke über die Tal-Schlucht (Cols 127..134)
  b.addRopeBridge(127, 134, 12);
  b.addCoinArc(128, 6, 10);
  b.addPlatform(136, 11, 140, 9, 2.5, 0.018);
  b.addSuperStar(138, 7); // Super-Stern #3!
  b.addVine(143, 3.5, 5.5);

  b.groundRow(147, 171, 'grass', 'dirt');
  b.addTile(150, 12, 'boost_pad');
  b.addEnemy('shroom', 153, 12, 148, 157);
  // Kletter-Turm + Rutschbahn auf der anderen Seite!
  b.addLadder(156, 9, 12);
  b.addSpan(157, 159, 9, 'bridge');
  b.addTile(158, 6.5, 'question', 'heart');
  b.addSlideRight(160, 9, 4);
  b.addCoin(160, 8);
  b.addCoin(161, 9);
  b.addCoin(162, 10);
  b.addCoin(163, 11);
  b.addEnemy('beetle', 164, 12, 161, 166);

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
      subtitleDe: 'Hängebrücken, Lianen & König Stachelpanzer',
      subtitleEn: 'Rope bridges, vines & King Spike-Shell',
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

  b.groundRow(0, 19, 'crystal', 'stone');
  b.addCoinArc(5, 4, 11);
  b.addTile(9, 10, 'question', 'coin');
  b.addTile(10, 10, 'stone');
  b.addTile(11, 10, 'question', 'heart');
  b.addEnemy('slime', 14, 12, 10, 18);

  b.addSpan(20, 25, 14, 'lava');
  b.addPlatform(20, 12, 24, 12, 2.5, 0.017);
  b.addCoin(22, 9.5);
  b.addGem(23, 9.5);

  b.groundRow(26, 49, 'crystal', 'stone');
  b.addEnemy('bat', 29, 7.5, 26, 35);
  b.addSpan(31, 35, 10, 'crystal');
  b.addChest(33, 9, 'turbo_boots');
  b.addTile(32, 7, 'question', 'coins_burst');
  b.addEnemy('slime', 39, 12, 36, 44);
  b.addEnemy('beetle', 43, 12, 38, 48);

  b.groundRow(50, 62, 'crystal', 'stone');
  b.addCheckpoint(51, 13);
  b.addSpan(53, 57, 11, 'stone');
  b.addSpan(53, 57, 10, 'crystal');
  b.addGem(54, 12);
  b.addSuperStar(55, 12);
  b.addHeart(56, 12, true);
  b.addCoinArc(53, 5, 8);

  // Magma-Schlucht mit Hängebrücke!
  b.addSpan(63, 74, 14, 'lava');
  b.addRopeBridge(64, 68, 12);
  b.addCoin(65, 10);
  b.addCoin(67, 10);
  b.addPlatform(69, 11.5, 73, 9.5, 2.5, 0.019);
  b.addGem(71, 8);

  b.groundRow(75, 96, 'crystal', 'stone');
  b.addTile(78, 12, 'spring');
  b.addSpan(80, 85, 8, 'bridge');
  b.addTile(82, 5, 'question', 'big_heart');
  b.addSuperStar(84, 6.5);
  b.addEnemy('bat', 83, 10, 77, 88);
  b.addEnemy('beetle', 89, 12, 85, 95);
  b.addColumn(92, 10, 12, 'cracked');
  b.addGem(93, 12);

  b.addSpan(97, 108, 14, 'lava');
  b.addVine(100, 3.5, 5.5);
  b.addSpan(102, 104, 10, 'crystal');
  b.addCoinArc(102, 3, 8.5);
  b.addSpan(106, 107, 11, 'crystal');
  b.addEnemy('bat', 103, 7, 98, 107);

  b.groundRow(109, 134, 'crystal', 'stone');
  b.addCheckpoint(110, 13);
  b.addTile(112, 12, 'boost_pad');
  b.addEnemy('slime', 115, 12, 112, 122);
  b.addTile(118, 10, 'question', 'coins_burst');
  b.addSpan(121, 126, 9, 'stone');
  b.addTile(123, 9, 'question', 'heart');
  b.addEnemy('beetle', 127, 12, 123, 133);

  b.addSpan(135, 152, 14, 'lava');
  b.addPlatform(136, 12, 140, 10, 2.5, 0.018);
  b.addRopeBridge(142, 145, 9.5);
  b.addSuperStar(143.5, 8);
  b.addPlatform(147, 10, 150, 11.5, 2.5, 0.018);

  b.groundRow(153, 175, 'crystal', 'stone');
  b.addEnemy('slime', 158, 12, 154, 165);
  b.addEnemy('bat', 162, 7.5, 156, 168);
  b.addTile(164, 10, 'question', 'big_heart');

  b.addCheckpoint(170, 13);
  b.addChest(172, 12, 'sun_sword');

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
  b.addSuperStar(46, 3);
  b.addBoatObstacle('rock', 49, 390);
  b.addBoatObstacle('mine', 53, 270, 1.4);

  b.addBoatCheckpoint(58, 324);
  b.addChest(63, 6.5, 'aegis_shield');

  b.addBoatObstacle('iceberg', 70, 200);
  b.addBoatObstacle('iceberg', 72, 460);
  b.addCoinArc(74, 5, 7);
  b.addBoatObstacle('mine', 79, 240, 1.8);
  b.addBoatObstacle('mine', 81, 430, -1.8);
  b.addBoatObstacle('crate', 85, 320);
  b.addBoatObstacle('heart_crate', 86, 480);
  b.addBoatObstacle('whirlpool', 91, 350);
  b.addBoatObstacle('iceberg', 96, 160);
  b.addSuperStar(98, 10.5);
  b.addBoatObstacle('rock', 102, 290);
  b.addBoatObstacle('crate', 106, 210);
  b.addBoatObstacle('crate', 106, 430);
  b.addBoatObstacle('mine', 111, 330, 2.0);

  b.addBoatCheckpoint(116, 324);
  b.addCoinArc(120, 5, 5);
  b.addBoatObstacle('iceberg', 124, 240);
  b.addBoatObstacle('whirlpool', 128, 440);
  b.addBoatObstacle('heart_crate', 132, 320);
  b.addBoatObstacle('mine', 136, 180, 2.1);
  b.addBoatObstacle('mine', 138, 470, -2.1);
  b.addSuperStar(142, 7);
  b.addBoatObstacle('crate', 145, 200);
  b.addBoatObstacle('crate', 145, 450);
  b.addBoatObstacle('rock', 150, 340);
  b.addGem(152, 4);
  b.addGem(152, 10);

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

  b.groundRow(0, 16, 'cloud', 'stone');
  b.addCoinArc(5, 4, 11);
  b.addTile(9, 10, 'question', 'coin');
  b.addTile(11, 10, 'question', 'heart');
  b.addEnemy('sky_drone', 13, 8, 9, 17);

  b.addRopeBridge(17, 21, 12);
  b.addSpan(22, 24, 12, 'cloud');
  b.addTile(23, 11, 'spring');
  b.addSpan(25, 30, 8, 'bridge');
  b.addSuperStar(27.5, 6.5);
  b.addCoinArc(25, 5, 6.5);

  b.groundRow(31, 48, 'cloud', 'stone');
  b.addTile(33, 12, 'boost_pad');
  b.addEnemy('beetle', 36, 12, 32, 41);
  b.addSpan(38, 42, 9.5, 'stone');
  b.addTile(40, 9.5, 'question', 'coins_burst');
  b.addEnemy('sky_drone', 44, 8, 40, 48);

  b.groundRow(49, 60, 'cloud', 'stone');
  b.addCheckpoint(50, 13);
  b.addHeart(54, 12, true);
  b.addColumn(58, 10, 12, 'cracked');
  b.addGem(59, 12);

  b.addVine(63, 3.5, 5.5);
  b.addSpan(66, 73, 10, 'cloud');
  b.addEnemy('beetle', 69, 9, 66, 73);
  b.addPlatform(75, 10, 81, 12, 2.5, 0.018);
  b.addSuperStar(78, 7.5);

  b.groundRow(84, 106, 'cloud', 'stone');
  b.addEnemy('sky_drone', 88, 7.5, 85, 95);
  b.addTile(92, 10, 'question', 'big_heart');
  b.addSpan(95, 99, 11, 'stone');
  b.addSpan(95, 99, 10, 'cloud');
  b.addGem(96, 12);
  b.addGem(97, 12);
  b.addGem(98, 12);

  b.groundRow(107, 126, 'cloud', 'stone');
  b.addCheckpoint(108, 13);
  b.addEnemy('beetle', 114, 12, 110, 120);
  b.addTile(122, 12, 'spring');
  b.addSpan(124, 130, 8, 'bridge');
  b.addCoinArc(124, 6, 6.5);
  b.addEnemy('sky_drone', 128, 6, 123, 134);

  b.addRopeBridge(132, 137, 11);
  b.addHeart(134, 9.5);
  b.addPlatform(139, 11, 144, 9, 2.5, 0.019);
  b.addSuperStar(141.5, 7);
  b.addSpan(146, 151, 10.5, 'cloud');
  b.addEnemy('beetle', 148, 9.5, 146, 151);

  b.groundRow(153, 173, 'cloud', 'stone');
  b.addTile(155, 12, 'boost_pad');
  b.addEnemy('sky_drone', 158, 7.5, 154, 164);
  b.addTile(161, 10, 'question', 'big_heart');
  b.addEnemy('beetle', 166, 12, 160, 170);

  b.addCheckpoint(169, 13);
  b.addHeart(171, 12, true);

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
      subtitleDe: 'Wolkeninseln, Hängebrücken & Sturm-Greif Zephyr',
      subtitleEn: 'Cloud islands, rope bridges & Storm Griffin Zephyr',
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

function buildLevel5Reef(): LevelDefinition {
  const b = new LevelBuilder();

  // Abschnitt 1: Korallen-Lagune mit schwerelosen Sprüngen & Quallen-Trampolinen!
  b.groundRow(0, 20, 'coral', 'sand');
  b.addCoinArc(5, 4, 10);
  b.addTile(9, 9.5, 'question', 'coin');
  b.addTile(11, 9.5, 'question', 'heart');
  b.addTile(15, 12, 'jelly_pad'); // Hüpfende Qualle!
  b.addCoinArc(15, 4, 6.5);
  b.addEnemy('gooey', 17, 12, 11, 19);

  b.addRopeBridge(21, 25, 12);
  b.addSuperStar(23, 10); // Super-Stern #1!

  b.groundRow(26, 50, 'coral', 'sand');
  b.addEnemy('gooey', 30, 12, 27, 36);
  b.addTile(34, 12, 'jelly_pad');
  b.addSpan(36, 41, 8, 'coral');
  b.addTile(38, 8, 'question', 'coins_burst');
  b.addEnemy('bat', 43, 7, 37, 48);
  b.addTile(46, 12, 'boost_pad');

  // Checkpoint 1 + Abschnitt 2: Quallenfelder & Blubber-Gräben (Cols 51..108)
  b.groundRow(51, 66, 'coral', 'sand');
  b.addCheckpoint(52, 13);
  b.addHeart(55, 12, true);
  b.addSpan(58, 62, 11, 'stone');
  b.addSpan(58, 62, 10, 'coral'); // Bück-Korallentunnel!
  b.addGem(59, 12);
  b.addGem(60, 12);
  b.addGem(61, 12);

  b.addTile(68, 11.5, 'jelly_pad');
  b.addCoin(68, 7.5);
  b.addTile(73, 11, 'jelly_pad');
  b.addSuperStar(73, 6.5); // Super-Stern #2!
  b.addTile(78, 11.5, 'jelly_pad');

  b.groundRow(82, 108, 'coral', 'sand');
  b.addEnemy('gooey', 86, 12, 83, 93);
  b.addTile(90, 9.5, 'question', 'big_heart');
  b.addEnemy('gooey', 96, 12, 92, 102);
  b.addVine(103, 3.5, 5.5);

  // Checkpoint 2 + Abschnitt 3: Tiefsee-Tempel (Cols 109..170)
  b.groundRow(109, 130, 'coral', 'sand');
  b.addCheckpoint(110, 13);
  b.addTile(113, 12, 'boost_pad');
  b.addEnemy('gooey', 117, 12, 114, 124);
  b.addSpan(120, 125, 9, 'bridge');
  b.addTile(122, 9, 'question', 'coins_burst');

  b.addPlatform(132, 11.5, 137, 9.5, 2.5, 0.018);
  b.addSuperStar(134.5, 7.5); // Super-Stern #3!
  b.addRopeBridge(139, 144, 11);
  b.addPlatform(146, 10.5, 150, 12, 2.5, 0.018);

  b.groundRow(152, 173, 'coral', 'sand');
  b.addEnemy('gooey', 156, 12, 153, 163);
  b.addTile(160, 10, 'question', 'big_heart');
  b.addEnemy('bat', 165, 7, 158, 170);

  b.addCheckpoint(169, 13);
  b.addHeart(171, 12, true);

  // Boss 5 Arena: Glibber-König Gloop! (Cols 174..201)
  b.groundRow(174, 201, 'stone', 'sand');
  b.addColumn(174, 3, 10, 'stone');
  b.addColumn(201, 3, 12, 'stone');
  b.addSpan(178, 181, 10, 'coral');
  b.addSpan(193, 196, 10, 'coral');
  b.addTile(186, 12, 'jelly_pad');
  b.addTile(188, 12, 'jelly_pad');
  b.addHeart(179, 9, true);
  b.addHeart(194, 9, true);

  const boss: Boss = {
    kind: 'goo_king',
    nameDe: 'Glibber-König Gloop',
    nameEn: 'Goo-King Gloop',
    subtitleDe: 'Herrscher der Glibber-Lagune',
    subtitleEn: 'Ruler of the Gooey Lagoon',
    x: 192 * TILE,
    y: 13 * TILE - 112,
    w: 118,
    h: 112,
    vx: 0,
    vy: 0,
    hp: 32,
    maxHp: 32,
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
      id: 4,
      mode: 'platformer',
      worldCodeDe: 'Welt 5 · Riff',
      worldCodeEn: 'World 5 · Reef',
      nameDe: 'Blubber-Riff & Glibber-Lagune',
      nameEn: 'Bubble Reef & Gooey Lagoon',
      subtitleDe: 'Quallen-Trampoline, Blubberblasen & Glibber-König Gloop',
      subtitleEn: 'Bouncy jellyfish, bubble leaps & Goo-King Gloop',
      skyTop: '#0284c7',
      skyMid: '#06b6d4',
      skyBottom: '#67e8f9',
      farHillColor: '#0e7490',
      nearHillColor: '#14b8a6',
      accentColor: '#f472b6',
      backdropStyle: 'reef',
      lowGravity: true,
    },
    202,
    3,
    11,
    176,
    boss
  );
}

function buildLevel6Jungle(): LevelDefinition {
  const b = new LevelBuilder();

  // Abschnitt 1: Baumhaus-Leitern & erste Dschungel-Rutsche (Cols 0..48)
  b.groundRow(0, 24, 'grass', 'jungle_wood');
  b.addCoinArc(5, 4, 11);
  b.addLadder(10, 8, 12);
  b.addSpan(11, 14, 8, 'jungle_wood');
  b.addTile(12, 5.5, 'question', 'coins_burst');
  b.addSlideRight(15, 8, 5);
  b.addCoin(15, 7);
  b.addCoin(16, 8);
  b.addCoin(17, 9);
  b.addCoin(18, 10);
  b.addCoin(19, 11);
  b.addEnemy('beetle', 21, 12, 19, 24);

  // Dschungel-Lianen-Kette über Schlucht (Cols 25..37)
  b.addVine(27, 3, 5.8);
  b.addCoin(27, 8.5);
  b.addVine(31, 3, 5.8);
  b.addSuperStar(31, 7.5); // Super-Stern #1!
  b.addVine(35, 3, 5.8);

  b.groundRow(38, 58, 'grass', 'jungle_wood');
  b.addEnemy('shroom', 42, 12, 39, 47);
  b.addBumper(46, 10);
  b.addSpan(48, 52, 8, 'jungle_wood');
  b.addTile(50, 8, 'question', 'heart');
  b.addChest(50, 7, 'fire_blaster'); // NEUE WAFFE: Feuer-Blaster!

  // Checkpoint 1 + Abschnitt 2: Kletter-Tempel & Sonic-Bumper (Cols 59..114)
  b.groundRow(59, 80, 'grass', 'jungle_wood');
  b.addCheckpoint(60, 13);
  b.addTile(63, 12, 'boost_pad');
  b.addLadder(68, 7, 12);
  b.addSpan(69, 72, 7, 'stone');
  b.addSuperStar(70.5, 5.5); // Super-Stern #2!
  b.addSlideRight(73, 7, 6);
  b.addGem(75, 8);
  b.addGem(77, 10);

  b.addRopeBridge(81, 88, 12);
  b.addBumper(84, 9);
  b.addEnemy('bat', 86, 7.5, 81, 90);

  b.groundRow(89, 115, 'grass', 'jungle_wood');
  b.addCheckpoint(90, 13);
  b.addEnemy('beetle', 94, 12, 91, 100);
  b.addTile(98, 12, 'spring');
  b.addSpan(100, 105, 7.5, 'jungle_wood');
  b.addTile(102, 7.5, 'question', 'big_heart');
  b.addVine(109, 3, 5.5);

  // Abschnitt 3: Hohe Tempelpyramide (klettern + rutschen) (Cols 116..165)
  b.groundRow(116, 165, 'grass', 'jungle_wood');
  b.addCheckpoint(118, 13);
  b.addLadder(123, 8, 12);
  b.addSpan(124, 127, 8, 'stone');
  b.addLadder(127, 5, 7);
  b.addSpan(128, 131, 5, 'stone');
  b.addSuperStar(129.5, 3.5); // Super-Stern #3!
  b.addSlideRight(132, 5, 8);
  b.addCoinArc(133, 5, 7);
  b.addEnemy('beetle', 144, 12, 140, 150);
  b.addBumper(151, 10);
  b.addHeart(158, 12, true);
  b.addCheckpoint(162, 13);

  // Boss 6 Arena: Dschungel-Wächter Konga! (Cols 166..193)
  b.groundRow(166, 193, 'stone', 'jungle_wood');
  b.addColumn(166, 3, 10, 'stone');
  b.addColumn(193, 3, 12, 'stone');
  b.addSpan(170, 173, 9.5, 'jungle_wood');
  b.addSpan(185, 188, 9.5, 'jungle_wood');
  b.addTile(179, 12, 'spring');
  b.addHeart(171, 8.5, true);
  b.addHeart(186, 8.5, true);

  const boss: Boss = {
    kind: 'jungle_kong',
    nameDe: 'Dschungel-Wächter Konga',
    nameEn: 'Jungle Guardian Konga',
    subtitleDe: 'Herr des Urwald-Tempels',
    subtitleEn: 'Lord of the Jungle Temple',
    x: 184 * TILE,
    y: 13 * TILE - 114,
    w: 118,
    h: 114,
    vx: 0,
    vy: 0,
    hp: 34,
    maxHp: 34,
    arenaMinX: 167 * TILE,
    arenaMaxX: 192 * TILE,
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
      id: 5,
      mode: 'platformer',
      worldCodeDe: 'Welt 6 · Dschungel',
      worldCodeEn: 'World 6 · Jungle',
      nameDe: 'Wilder Urwald & Tempel-Rutschen',
      nameEn: 'Wild Jungle & Temple Slides',
      subtitleDe: 'Kletter-Leitern, Moos-Rutschen & Wächter Konga',
      subtitleEn: 'Climbing ladders, moss slides & Guardian Konga',
      skyTop: '#065f46',
      skyMid: '#059669',
      skyBottom: '#a7f3d0',
      farHillColor: '#064e3b',
      nearHillColor: '#047857',
      accentColor: '#22c55e',
      backdropStyle: 'jungle',
    },
    194,
    3,
    11,
    168,
    boss
  );
}

function buildLevel7Mountain(): LevelDefinition {
  const b = new LevelBuilder();

  // Aufstieg auf den Berg: von row 13 hoch bis row 4 & auf der anderen Seite runter!
  b.groundRow(0, 20, 'ice', 'stone');
  b.addCoinArc(4, 4, 11);
  b.addTile(9, 10, 'question', 'coin');
  b.addEnemy('beetle', 13, 12, 10, 18);

  // Stufe 1 Bergaufstieg (Kletterwand + Eis-Stufen)
  b.addLadder(18, 9, 12);
  b.addSpan(19, 30, 9, 'ice');
  b.addSpan(19, 30, 10, 'stone');
  b.addEnemy('slime', 24, 8, 20, 29);

  // Stufe 2 höher auf row 6!
  b.addLadder(29, 6, 8);
  b.addSpan(30, 40, 6, 'ice');
  b.addSuperStar(34, 4.5); // Super-Stern #1 auf dem ersten Gipfel!
  b.addChest(37, 5, 'thunder_hammer'); // NEUE WAFFE: Donner-Hammer!

  // Gipfel-Hängebrücke hoch über dem Tal!
  b.addRopeBridge(41, 48, 6);
  b.addCoinArc(42, 6, 4.5);

  // Lange Eis-Rutschbahn runter ins Berg-Camp!
  b.addSpan(49, 51, 6, 'ice');
  b.addSlideRight(52, 6, 7);
  b.addCoin(52, 5);
  b.addCoin(54, 7);
  b.addCoin(56, 9);
  b.addCoin(58, 11);

  b.groundRow(59, 86, 'ice', 'stone');
  b.addCheckpoint(60, 13);
  b.addHeart(63, 12, true);
  b.addTile(66, 12, 'boost_pad');
  b.addBumper(73, 10);
  b.addEnemy('bat', 76, 7, 70, 82);
  b.addTile(78, 12, 'spring');
  b.addSpan(80, 85, 7.5, 'ice');
  b.addSuperStar(82.5, 6); // Super-Stern #2!

  // Zweiter Steil-Aufstieg (Kletter-Zickzack + Plattformen)
  b.groundRow(87, 110, 'ice', 'stone');
  b.addCheckpoint(89, 13);
  b.addLadder(93, 9, 12);
  b.addSpan(94, 99, 9, 'ice');
  b.addLadder(98, 5, 8);
  b.addSpan(99, 106, 5, 'ice');
  b.addTile(102, 5, 'question', 'big_heart');
  b.addSlideRight(107, 5, 8);
  b.addGem(109, 6.5);
  b.addGem(111, 8.5);
  b.addGem(113, 10.5);

  b.groundRow(115, 148, 'ice', 'stone');
  b.addCheckpoint(117, 13);
  b.addEnemy('beetle', 122, 12, 118, 128);
  b.addRopeBridge(129, 135, 11);
  b.addSuperStar(132, 9.5); // Super-Stern #3!
  b.addEnemy('bat', 140, 7.5, 135, 146);
  b.addHeart(145, 12, true);
  b.addCheckpoint(147, 13);

  // Boss 7 Arena: Gipfel-Yeti Frosthorn! (Cols 149..176)
  b.groundRow(149, 176, 'ice', 'stone');
  b.addColumn(149, 3, 10, 'stone');
  b.addColumn(176, 3, 12, 'stone');
  b.addSpan(153, 156, 9.5, 'ice');
  b.addSpan(168, 171, 9.5, 'ice');
  b.addTile(162, 12, 'spring');
  b.addHeart(154, 8.5, true);
  b.addHeart(169, 8.5, true);

  const boss: Boss = {
    kind: 'yeti_king',
    nameDe: 'Gipfel-Yeti Frosthorn',
    nameEn: 'Summit Yeti Frosthorn',
    subtitleDe: 'Riese des Ewigen Schnees',
    subtitleEn: 'Giant of the Eternal Snow',
    x: 167 * TILE,
    y: 13 * TILE - 116,
    w: 120,
    h: 116,
    vx: 0,
    vy: 0,
    hp: 36,
    maxHp: 36,
    arenaMinX: 150 * TILE,
    arenaMaxX: 175 * TILE,
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
      id: 6,
      mode: 'platformer',
      worldCodeDe: 'Welt 7 · Berg',
      worldCodeEn: 'World 7 · Mountain',
      nameDe: 'Eisgipfel-Aufstieg & Schnee-Grat',
      nameEn: 'Ice Peak Climb & Snow Ridge',
      subtitleDe: 'Kletterwände, Eis-Rutschen & Yeti Frosthorn',
      subtitleEn: 'Mountain climbs, ice slides & Yeti Frosthorn',
      skyTop: '#0c4a6e',
      skyMid: '#38bdf8',
      skyBottom: '#f1f5f9',
      farHillColor: '#475569',
      nearHillColor: '#94a3b8',
      accentColor: '#38bdf8',
      backdropStyle: 'mountain',
    },
    177,
    3,
    11,
    151,
    boss
  );
}

function buildLevel8Balloon(): LevelDefinition {
  const b = new LevelBuilder();

  b.addCoinArc(14, 5, 5);
  b.addBoatObstacle('ring_gate', 21, 240);
  b.addBoatObstacle('storm_cloud', 28, 410);
  b.addBoatObstacle('ring_gate', 35, 190);
  b.addBoatObstacle('heart_crate', 40, 320);
  b.addSuperStar(45, 5);
  b.addBoatObstacle('storm_cloud', 50, 220);
  b.addBoatObstacle('mine', 55, 360, 1.4);

  b.addBoatCheckpoint(60, 300);
  b.addBoatObstacle('ring_gate', 66, 280);
  b.addBoatObstacle('storm_cloud', 73, 180);
  b.addBoatObstacle('storm_cloud', 75, 450);
  b.addCoinArc(78, 5, 6);
  b.addBoatObstacle('crate', 84, 300);
  b.addBoatObstacle('mine', 90, 240, 1.8);
  b.addSuperStar(96, 8);
  b.addBoatObstacle('ring_gate', 102, 220);
  b.addBoatObstacle('heart_crate', 108, 360);

  b.addBoatCheckpoint(114, 300);
  b.addBoatObstacle('storm_cloud', 120, 280);
  b.addBoatObstacle('ring_gate', 127, 170);
  b.addBoatObstacle('mine', 133, 380, -1.9);
  b.addSuperStar(139, 4.5);
  b.addBoatObstacle('crate', 144, 290);
  b.addBoatObstacle('storm_cloud', 150, 420);
  b.addHeart(154, 6, true);
  b.addBoatCheckpoint(156, 300);

  const boss: Boss = {
    kind: 'storm_zeppelin',
    nameDe: 'Sturm-Zeppelin Nimbus',
    nameEn: 'Storm Zeppelin Nimbus',
    subtitleDe: 'Fliegender Wolken-Kreuzer',
    subtitleEn: 'Flying Cloud Cruiser',
    x: 178 * TILE,
    y: 260,
    w: 132,
    h: 92,
    vx: 0,
    vy: 2.4,
    hp: 32,
    maxHp: 32,
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
      id: 7,
      mode: 'balloon_flight',
      worldCodeDe: 'Welt 8 · Ballon',
      worldCodeEn: 'World 8 · Balloon',
      nameDe: 'Wolkenmeer & Heißluftballon',
      nameEn: 'Cloud Sea & Hot-Air Balloon',
      subtitleDe: 'Brenner-Schub, Goldringe & Sturm-Zeppelin Nimbus',
      subtitleEn: 'Burner lift, gold rings & Storm Zeppelin Nimbus',
      skyTop: '#0284c7',
      skyMid: '#38bdf8',
      skyBottom: '#fed7aa',
      farHillColor: '#e0f2fe',
      nearHillColor: '#bae6fd',
      accentColor: '#fb923c',
      backdropStyle: 'balloon_sky',
    },
    185,
    3,
    6,
    161,
    boss
  );
}

function buildLevel9Plane(): LevelDefinition {
  const b = new LevelBuilder();

  b.addBoatObstacle('ring_gate', 18, 280);
  b.addCoinArc(22, 4, 5);
  b.addBoatObstacle('rock', 27, 420);
  b.addBoatObstacle('crate', 32, 220);
  b.addBoatObstacle('ring_gate', 37, 200);
  b.addBoatObstacle('mine', 43, 330, 1.8);
  b.addSuperStar(48, 6);
  b.addBoatObstacle('heart_crate', 52, 260);

  b.addBoatCheckpoint(58, 300);
  b.addChest(63, 6, 'rocket_pod'); // NEUE WAFFE: Stern-Raketenwerfer!
  b.addBoatObstacle('ring_gate', 70, 340);
  b.addBoatObstacle('mine', 76, 200, 2.0);
  b.addBoatObstacle('mine', 78, 430, -2.0);
  b.addBoatObstacle('crate', 84, 300);
  b.addBoatObstacle('storm_cloud', 90, 220);
  b.addSuperStar(96, 4);
  b.addBoatObstacle('ring_gate', 102, 310);

  b.addBoatCheckpoint(112, 300);
  b.addBoatObstacle('rock', 118, 180);
  b.addBoatObstacle('rock', 120, 440);
  b.addBoatObstacle('ring_gate', 126, 270);
  b.addBoatObstacle('heart_crate', 132, 330);
  b.addBoatObstacle('mine', 138, 250, 2.2);
  b.addSuperStar(144, 7.5);
  b.addBoatObstacle('crate', 149, 200);
  b.addHeart(154, 6, true);
  b.addBoatCheckpoint(156, 300);

  const boss: Boss = {
    kind: 'sky_baron',
    nameDe: 'Wolken-Fregatte Baron Blitz',
    nameEn: 'Sky Frigate Baron Blitz',
    subtitleDe: 'Ass der Lüfte',
    subtitleEn: 'Ace of the Sky Canyon',
    x: 178 * TILE,
    y: 260,
    w: 128,
    h: 96,
    vx: 0,
    vy: 3.1,
    hp: 36,
    maxHp: 36,
    arenaMinX: 159 * TILE,
    arenaMaxX: 184 * TILE,
    floorY: 620,
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
      id: 8,
      mode: 'plane_shooter',
      worldCodeDe: 'Welt 9 · Flieger',
      worldCodeEn: 'World 9 · Biplane',
      nameDe: 'Sonnen-Schlucht & Propeller-Flieger',
      nameEn: 'Sun Canyon & Stunt Biplane',
      subtitleDe: 'Sonic-Ringe, Raketen-Truhe & Baron Blitz',
      subtitleEn: 'Sonic rings, rocket chest & Baron Blitz',
      skyTop: '#9a3412',
      skyMid: '#f97316',
      skyBottom: '#fde047',
      farHillColor: '#7c2d12',
      nearHillColor: '#b45309',
      accentColor: '#ef4444',
      backdropStyle: 'canyon_sky',
    },
    185,
    3,
    6,
    161,
    boss
  );
}

function buildLevel10Jet(): LevelDefinition {
  const b = new LevelBuilder();

  b.addBoatObstacle('ring_gate', 18, 250);
  b.addBoatObstacle('asteroid', 24, 380);
  b.addBoatObstacle('crate', 29, 200);
  b.addBoatObstacle('mine', 35, 300, 2.2);
  b.addBoatObstacle('ring_gate', 41, 180);
  b.addSuperStar(46, 5);
  b.addBoatObstacle('asteroid', 51, 420);
  b.addBoatObstacle('heart_crate', 55, 290);

  b.addBoatCheckpoint(60, 300);
  b.addBoatObstacle('asteroid', 67, 210);
  b.addBoatObstacle('asteroid', 69, 440);
  b.addBoatObstacle('ring_gate', 75, 290);
  b.addBoatObstacle('mine', 82, 230, 2.4);
  b.addBoatObstacle('mine', 84, 410, -2.4);
  b.addBoatObstacle('crate', 90, 310);
  b.addSuperStar(96, 8);
  b.addBoatObstacle('ring_gate', 103, 220);
  b.addBoatObstacle('heart_crate', 109, 360);

  b.addBoatCheckpoint(115, 300);
  b.addBoatObstacle('asteroid', 122, 280);
  b.addBoatObstacle('mine', 128, 190, 2.5);
  b.addBoatObstacle('ring_gate', 135, 330);
  b.addSuperStar(142, 4.5);
  b.addBoatObstacle('crate', 148, 240);
  b.addBoatObstacle('asteroid', 152, 430);
  b.addHeart(156, 6, true);
  b.addBoatCheckpoint(158, 300);

  const boss: Boss = {
    kind: 'titan_mecha',
    nameDe: 'Mega-Luftschiff Titan-X',
    nameEn: 'Mega Dreadnought Titan-X',
    subtitleDe: 'Endgegner der Stratosphäre',
    subtitleEn: 'Final Stratosphere Boss',
    x: 178 * TILE,
    y: 250,
    w: 140,
    h: 124,
    vx: 0,
    vy: 3.2,
    hp: 44,
    maxHp: 44,
    arenaMinX: 160 * TILE,
    arenaMaxX: 185 * TILE,
    floorY: 620,
    active: false,
    defeated: false,
    facingRight: false,
    phaseState: 'IDLE',
    stateTimer: 48,
    hitFlash: 0,
    invulnTimer: 0,
    attackPattern: 0,
    animTick: 0,
  };

  return b.build(
    {
      id: 9,
      mode: 'jet_shooter',
      worldCodeDe: 'Welt 10 · Kampfjet',
      worldCodeEn: 'World 10 · Jet',
      nameDe: 'Stratosphäre & Raketen-Kampfjet',
      nameEn: 'Stratosphere & Rocket Fighter Jet',
      subtitleDe: 'Überschall-Laser, Raketen & Titan-X',
      subtitleEn: 'Supersonic lasers, homing rockets & Titan-X',
      skyTop: '#090d1f',
      skyMid: '#312e81',
      skyBottom: '#7e22ce',
      farHillColor: '#1e1b4b',
      nearHillColor: '#4c1d95',
      accentColor: '#a855f7',
      backdropStyle: 'space_sky',
    },
    186,
    3,
    6,
    162,
    boss
  );
}
