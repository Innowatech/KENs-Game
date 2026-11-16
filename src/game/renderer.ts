import { SuperKennethEngine } from './engine';
import { GAME_H } from './levels';
import { BoatObstacle, Boss, Collectible, Enemy, Tile, Vine } from './types';

function hashSeed(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.lineTo(x + w - rad, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rad);
  ctx.lineTo(x + w, y + h - rad);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rad, y + h);
  ctx.lineTo(x + rad, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rad);
  ctx.lineTo(x, y + rad);
  ctx.quadraticCurveTo(x, y, x + rad, y);
  ctx.closePath();
}

function drawStarShape(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerR: number,
  innerR: number
) {
  let rot = (Math.PI / 2) * 3;
  const step = Math.PI / spikes;
  ctx.beginPath();
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.closePath();
}

export function renderGame(
  ctx: CanvasRenderingContext2D,
  engine: SuperKennethEngine
) {
  const { level, player, cameraX, tick, viewW } = engine;
  const theme = level.theme;

  ctx.save();

  if (engine.screenShake > 0.5) {
    const sx = (Math.random() - 0.5) * engine.screenShake * 1.6;
    const sy = (Math.random() - 0.5) * engine.screenShake * 1.6;
    ctx.translate(sx, sy);
  }

  if (theme.mode === 'topdown_boat') {
    renderTopDownRiverWorld(ctx, engine);
  } else if (
    theme.mode === 'balloon_flight' ||
    theme.mode === 'plane_shooter' ||
    theme.mode === 'jet_shooter'
  ) {
    renderAerialFlightWorld(ctx, engine);
  } else {
    renderPlatformerWorld(ctx, engine);
  }

  // Particles
  for (const pt of engine.particles) {
    const px = Math.floor(pt.x - cameraX);
    if (px < -30 || px > viewW + 30) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    if (pt.glow) {
      ctx.shadowColor = pt.color;
      ctx.shadowBlur = 12;
    }
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(px, pt.y, pt.size * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Floating Feedback Texts
  ctx.save();
  ctx.font = '700 18px Fredoka, Nunito, sans-serif';
  ctx.textAlign = 'center';
  for (const ft of engine.floatingTexts) {
    const fx = Math.floor(ft.x - cameraX + 20);
    if (fx < -120 || fx > viewW + 120) continue;
    ctx.globalAlpha = Math.min(1, (ft.life / ft.maxLife) * 1.4);
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.92)';
    ctx.strokeText(ft.text, fx, ft.y);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, fx, ft.y);
  }
  ctx.restore();

  ctx.restore();
}

function renderTopDownRiverWorld(
  ctx: CanvasRenderingContext2D,
  engine: SuperKennethEngine
) {
  const { level, player, cameraX, tick, viewW } = engine;

  // Water Base Gradient
  const waterGrad = ctx.createLinearGradient(0, 80, 0, GAME_H - 80);
  waterGrad.addColorStop(0, '#0284c7');
  waterGrad.addColorStop(0.5, '#0ea5e9');
  waterGrad.addColorStop(1, '#0284c7');
  ctx.fillStyle = waterGrad;
  ctx.fillRect(0, 0, viewW, GAME_H);

  // Flowing Water Currents across full dynamic viewW
  ctx.strokeStyle = 'rgba(224, 242, 254, 0.28)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  const streamCount = Math.ceil(viewW / 260) + 3;
  for (let row = 0; row < 9; row++) {
    const y = 125 + row * 58;
    const wrapW = streamCount * 260;
    for (let i = 0; i < streamCount; i++) {
      let wx = ((i * 260 - (cameraX * 0.9 + tick * 2.6 + row * 73)) % wrapW);
      if (wx < -130) wx += wrapW;
      ctx.beginPath();
      ctx.moveTo(wx, y);
      ctx.quadraticCurveTo(wx + 45, y - 6, wx + 90, y);
      ctx.stroke();
    }
  }

  // Individualized Riverbanks
  drawRiverBanks(ctx, cameraX, tick, viewW);

  // River Checkpoints
  for (const cp of level.checkpoints) {
    const cx = Math.floor(cp.x - cameraX);
    if (cx < -60 || cx > viewW + 60) continue;
    ctx.save();
    ctx.strokeStyle = cp.activated
      ? 'rgba(52, 211, 153, 0.7)'
      : 'rgba(251, 191, 36, 0.5)';
    ctx.setLineDash([10, 8]);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx + 12, 100);
    ctx.lineTo(cx + 12, GAME_H - 100);
    ctx.stroke();
    ctx.setLineDash([]);

    [106, GAME_H - 106].forEach((by) => {
      ctx.fillStyle = cp.activated ? '#10b981' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx + 12, by, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    });
    ctx.restore();
  }

  // Collectibles
  for (const col of level.collectibles) {
    if (col.collected) continue;
    const cx = Math.floor(col.x - cameraX);
    if (cx + col.w < -20 || cx > viewW + 20) continue;
    drawCollectible(ctx, col, cx, tick);
  }

  // Obstacles
  for (const obs of level.boatObstacles) {
    if (!obs.alive) continue;
    const ox = Math.floor(obs.x - cameraX);
    if (ox + obs.w < -40 || ox > viewW + 40) continue;
    drawBoatObstacle(ctx, obs, ox, tick);
  }

  // Boss 3: Eis-Kreuzer Leviathan
  if (!level.boss.defeated) {
    const bx = Math.floor(level.boss.x - cameraX);
    if (bx + level.boss.w > -80 && bx < viewW + 140) {
      drawBoss(ctx, level.boss, bx, tick);
    }
  }

  drawProjectiles(ctx, engine);

  const blinkSkip = player.invulnTimer > 0 && Math.floor(tick / 4) % 2 === 0;
  if (!blinkSkip) {
    drawKennethBoat(ctx, engine, Math.floor(player.x - cameraX));
  }
}

function renderAerialFlightWorld(
  ctx: CanvasRenderingContext2D,
  engine: SuperKennethEngine
) {
  const { level, player, cameraX, tick, viewW } = engine;
  const theme = level.theme;

  // Sky / Space Backdrop Gradient
  const sky = ctx.createLinearGradient(0, 0, 0, GAME_H);
  sky.addColorStop(0, theme.skyTop);
  sky.addColorStop(0.55, theme.skyMid);
  sky.addColorStop(1, theme.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, viewW, GAME_H);

  if (theme.backdropStyle === 'balloon_sky') {
    drawBalloonSkyParallax(ctx, cameraX, tick, viewW);
  } else if (theme.backdropStyle === 'canyon_sky') {
    drawCanyonSkyParallax(ctx, cameraX, tick, viewW);
  } else {
    drawSpaceSkyParallax(ctx, cameraX, tick, viewW);
  }

  // Sky Checkpoints
  for (const cp of level.checkpoints) {
    const cx = Math.floor(cp.x - cameraX);
    if (cx < -60 || cx > viewW + 60) continue;
    ctx.save();
    ctx.strokeStyle = cp.activated
      ? 'rgba(52, 211, 153, 0.72)'
      : 'rgba(251, 191, 36, 0.55)';
    ctx.setLineDash([12, 10]);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx + 12, 70);
    ctx.lineTo(cx + 12, GAME_H - 70);
    ctx.stroke();
    ctx.setLineDash([]);

    [76, GAME_H - 76].forEach((by) => {
      ctx.fillStyle = cp.activated ? '#10b981' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx + 12, by, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    });
    ctx.restore();
  }

  // Collectibles
  for (const col of level.collectibles) {
    if (col.collected) continue;
    const cx = Math.floor(col.x - cameraX);
    if (cx + col.w < -20 || cx > viewW + 20) continue;
    drawCollectible(ctx, col, cx, tick);
  }

  // Aerial Obstacles & Rings
  for (const obs of level.boatObstacles) {
    if (!obs.alive) continue;
    const ox = Math.floor(obs.x - cameraX);
    if (ox + obs.w < -60 || ox > viewW + 60) continue;
    drawBoatObstacle(ctx, obs, ox, tick);
  }

  // Boss
  if (!level.boss.defeated) {
    const bx = Math.floor(level.boss.x - cameraX);
    if (bx + level.boss.w > -80 && bx < viewW + 160) {
      drawBoss(ctx, level.boss, bx, tick);
    }
  }

  drawProjectiles(ctx, engine);

  const blinkSkip = player.invulnTimer > 0 && Math.floor(tick / 4) % 2 === 0;
  if (!blinkSkip) {
    const px = Math.floor(player.x - cameraX);
    if (theme.mode === 'balloon_flight') {
      drawKennethBalloon(ctx, engine, px);
    } else if (theme.mode === 'plane_shooter') {
      drawKennethBiplane(ctx, engine, px);
    } else {
      drawKennethFighterJet(ctx, engine, px);
    }
  }
}

function drawRiverBanks(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  tick: number,
  viewW: number
) {
  ctx.fillStyle = 'rgba(224, 242, 254, 0.45)';
  ctx.fillRect(0, 82, viewW, 14);
  ctx.fillRect(0, GAME_H - 96, viewW, 14);

  const topGrad = ctx.createLinearGradient(0, 0, 0, 88);
  topGrad.addColorStop(0, '#065f46');
  topGrad.addColorStop(0.7, '#10b981');
  topGrad.addColorStop(1, '#78350f');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, viewW, 86);

  const botGrad = ctx.createLinearGradient(0, GAME_H - 88, 0, GAME_H);
  botGrad.addColorStop(0, '#78350f');
  botGrad.addColorStop(0.3, '#10b981');
  botGrad.addColorStop(1, '#065f46');
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, GAME_H - 86, viewW, 86);

  const span = 160;
  const startIdx = Math.floor((cameraX - span) / span);
  const endIdx = Math.ceil((cameraX + viewW + span) / span);

  for (let idx = startIdx; idx <= endIdx; idx++) {
    const tx = idx * span - cameraX;
    const s1 = hashSeed(idx * 3.1);
    const s2 = hashSeed(idx * 7.7);

    // Varied top bank trees / boulders / waterfalls
    if (s1 < 0.4) {
      // Giant leafy tree
      ctx.fillStyle = '#047857';
      ctx.beginPath();
      ctx.arc(tx + 46, 36, 30 + s2 * 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(tx + 38, 28, 15, 0, Math.PI * 2);
      ctx.fill();
    } else if (s1 < 0.78) {
      // Pine cluster
      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.moveTo(tx + 24, 62);
      ctx.lineTo(tx + 48, 8);
      ctx.lineTo(tx + 72, 62);
      ctx.closePath();
      ctx.fill();
    } else {
      // Ice-crystal canyon outcrop
      ctx.fillStyle = '#64748b';
      roundedRect(ctx, tx + 20, 32, 48, 42, 12);
      ctx.fill();
      ctx.fillStyle = '#bae6fd';
      roundedRect(ctx, tx + 28, 36, 18, 12, 5);
      ctx.fill();
    }

    // Varied bottom bank features
    if (s2 < 0.5) {
      ctx.fillStyle = '#047857';
      ctx.beginPath();
      ctx.arc(tx + 92, GAME_H - 36, 26 + s1 * 7, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(
        tx + 55,
        GAME_H - 68 + Math.sin(tick * 0.04 + idx) * 0.6,
        18 + s1 * 6,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
  }
}

function drawBoatObstacle(
  ctx: CanvasRenderingContext2D,
  obs: BoatObstacle,
  x: number,
  tick: number
) {
  const cx = x + obs.w / 2;
  const cy = obs.y + obs.h / 2;

  ctx.save();
  if (obs.kind === 'rock') {
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 10, obs.y + obs.h - 6);
    ctx.quadraticCurveTo(x, cy, x + 16, obs.y + 8);
    ctx.quadraticCurveTo(cx, obs.y - 2, x + obs.w - 12, obs.y + 14);
    ctx.quadraticCurveTo(x + obs.w, cy + 8, x + obs.w - 8, obs.y + obs.h - 6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.ellipse(cx - 6, obs.y + 18, 12, 6, -0.3, 0, Math.PI * 2);
    ctx.fill();
  } else if (obs.kind === 'iceberg') {
    ctx.fillStyle = '#bae6fd';
    ctx.strokeStyle = '#0369a1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 6, cy + 12);
    ctx.lineTo(x + 18, obs.y + 6);
    ctx.lineTo(cx + 8, obs.y + 2);
    ctx.lineTo(x + obs.w - 6, cy + 4);
    ctx.lineTo(x + obs.w - 14, obs.y + obs.h - 6);
    ctx.lineTo(x + 16, obs.y + obs.h - 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x + 22, obs.y + 10);
    ctx.lineTo(cx + 6, obs.y + 6);
    ctx.lineTo(cx - 2, cy);
    ctx.closePath();
    ctx.fill();
  } else if (obs.kind === 'whirlpool') {
    ctx.translate(cx, cy);
    ctx.rotate(tick * 0.09);
    for (let r = 3; r >= 1; r--) {
      ctx.strokeStyle = r % 2 === 0 ? '#e0f2fe' : '#38bdf8';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(0, 0, r * 11, 0, Math.PI * 1.65);
      ctx.stroke();
    }
    ctx.fillStyle = '#0c4a6e';
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
  } else if (obs.kind === 'mine') {
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    for (let a = 0; a < 8; a++) {
      const ang = (a * Math.PI) / 4 + tick * 0.02;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(ang) * 14, cy + Math.sin(ang) * 14);
      ctx.lineTo(cx + Math.cos(ang) * 23, cy + Math.sin(ang) * 23);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(cx, cy, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = Math.floor(tick / 10) % 2 === 0 ? '#ef4444' : '#facc15';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (obs.kind === 'crate' || obs.kind === 'heart_crate') {
    const isHeart = obs.kind === 'heart_crate';
    ctx.fillStyle = isHeart ? '#e11d48' : '#d97706';
    roundedRect(ctx, x, obs.y, obs.w, obs.h, 8);
    ctx.fill();
    ctx.strokeStyle = isHeart ? '#881337' : '#78350f';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 6, obs.y + 6);
    ctx.lineTo(x + obs.w - 6, obs.y + obs.h - 6);
    ctx.stroke();
    if (isHeart) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx - 5, cy - 2, 5, 0, Math.PI * 2);
      ctx.arc(cx + 5, cy - 2, 5, 0, Math.PI * 2);
      ctx.moveTo(cx - 10, cy);
      ctx.lineTo(cx, cy + 10);
      ctx.lineTo(cx + 10, cy);
      ctx.fill();
    }
  } else if (obs.kind === 'storm_cloud') {
    const pulse = Math.sin(tick * 0.25 + obs.phase);
    ctx.fillStyle = '#334155';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx - 18, cy + 4, 18, 0, Math.PI * 2);
    ctx.arc(cx, cy - 8, 24, 0, Math.PI * 2);
    ctx.arc(cx + 20, cy + 4, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (pulse > 0.1) {
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.moveTo(cx + 2, cy + 10);
      ctx.lineTo(cx - 8, cy + 28);
      ctx.lineTo(cx, cy + 28);
      ctx.lineTo(cx - 6, cy + 44);
      ctx.lineTo(cx + 10, cy + 22);
      ctx.lineTo(cx + 2, cy + 22);
      ctx.closePath();
      ctx.fill();
    }
  } else if (obs.kind === 'ring_gate') {
    const glow = 10 + Math.sin(tick * 0.16) * 5;
    ctx.shadowColor = '#fde047';
    ctx.shadowBlur = glow;
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(cx, cy, obs.w * 0.34, obs.h * 0.46, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = '#fef9c3';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(cx - 2, cy, obs.w * 0.28, obs.h * 0.4, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (obs.kind === 'asteroid') {
    ctx.translate(cx, cy);
    ctx.rotate(obs.phase);
    ctx.fillStyle = '#581c87';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const rx = obs.w * 0.48;
    const ry = obs.h * 0.48;
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const rad = i % 2 === 0 ? 1 : 0.78;
      const px = Math.cos(ang) * rx * rad;
      const py = Math.sin(ang) * ry * rad;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#3b0764';
    ctx.beginPath();
    ctx.arc(-6, -5, 6, 0, Math.PI * 2);
    ctx.arc(8, 7, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawKennethBoat(
  ctx: CanvasRenderingContext2D,
  engine: SuperKennethEngine,
  x: number
) {
  const { player, tick } = engine;
  const y = Math.floor(player.y);
  const w = player.w;
  const h = player.h;

  ctx.save();
  const cx = x + w / 2;
  const cy = y + h / 2;
  ctx.translate(cx, cy);
  ctx.rotate(player.vy * 0.045);

  const hullGrad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
  hullGrad.addColorStop(0, '#ef4444');
  hullGrad.addColorStop(1, '#b91c1c');
  ctx.fillStyle = hullGrad;
  ctx.strokeStyle = '#450a0a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-w / 2, -h / 2 + 6);
  ctx.lineTo(w / 4, -h / 2);
  ctx.quadraticCurveTo(w / 2 + 12, 0, w / 4, h / 2);
  ctx.lineTo(-w / 2, h / 2 - 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#facc15';
  roundedRect(ctx, -w / 2 + 6, -5, w - 18, 10, 4);
  ctx.fill();

  ctx.fillStyle = '#bae6fd';
  ctx.beginPath();
  ctx.arc(6, 0, 12, -Math.PI * 0.45, Math.PI * 0.45);
  ctx.fill();

  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(-6, 0, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(-8, 0, 11, Math.PI * 0.45, Math.PI * 1.55);
  ctx.fill();
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(-6, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();

  if (player.isShielding) {
    const pulse = 0.5 + 0.5 * Math.sin(tick * 0.25);
    ctx.strokeStyle = '#38bdf8';
    ctx.fillStyle = `rgba(56, 189, 248, ${0.22 + pulse * 0.12})`;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

function drawKennethBalloon(
  ctx: CanvasRenderingContext2D,
  engine: SuperKennethEngine,
  x: number
) {
  const { player, tick } = engine;
  const y = Math.floor(player.y);
  const cx = x + player.w / 2;
  const cy = y + player.h / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(player.vx * 0.025);

  // Ropes connecting envelope to basket
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-14, 4);
  ctx.lineTo(-9, 18);
  ctx.moveTo(14, 4);
  ctx.lineTo(9, 18);
  ctx.stroke();

  // Animated burner flame when lifting
  if (player.vy < -0.5) {
    ctx.fillStyle = tick % 4 < 2 ? '#facc15' : '#f97316';
    ctx.beginPath();
    ctx.moveTo(-5, 16);
    ctx.lineTo(0, 6 + (tick % 3) * 2);
    ctx.lineTo(5, 16);
    ctx.closePath();
    ctx.fill();
  }

  // Colorful striped balloon envelope
  const envGrad = ctx.createLinearGradient(-24, -34, 24, 6);
  envGrad.addColorStop(0, '#ef4444');
  envGrad.addColorStop(0.5, '#facc15');
  envGrad.addColorStop(1, '#2563eb');
  ctx.fillStyle = envGrad;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, -14, 23, Math.PI * 0.85, Math.PI * 0.15);
  ctx.lineTo(13, 6);
  ctx.lineTo(-13, 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Basket
  ctx.fillStyle = '#b45309';
  roundedRect(ctx, -12, 16, 24, 16, 4);
  ctx.fill();
  ctx.stroke();

  // Kenneth peeking out
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(0, 12, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(0, 9.5, 8, Math.PI, 0);
  ctx.fill();

  if (player.isShielding) {
    ctx.strokeStyle = '#38bdf8';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.24)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawKennethBiplane(
  ctx: CanvasRenderingContext2D,
  engine: SuperKennethEngine,
  x: number
) {
  const { player, tick } = engine;
  const cx = x + player.w / 2;
  const cy = Math.floor(player.y) + player.h / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(player.vy * 0.045);

  // Tail & Fuselage
  ctx.fillStyle = '#dc2626';
  ctx.strokeStyle = '#450a0a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-32, -12);
  ctx.lineTo(-18, -2);
  ctx.lineTo(24, -6);
  ctx.quadraticCurveTo(34, 0, 24, 10);
  ctx.lineTo(-26, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Racing yellow stripe
  ctx.fillStyle = '#facc15';
  roundedRect(ctx, -18, 0, 38, 4, 2);
  ctx.fill();

  // Biplane top & bottom wings
  ctx.fillStyle = '#ef4444';
  roundedRect(ctx, -10, -18, 28, 7, 3.5);
  ctx.fill();
  ctx.stroke();
  roundedRect(ctx, -6, 9, 24, 7, 3.5);
  ctx.fill();
  ctx.stroke();

  // Kenneth pilot head
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(2, -7, 7.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#38bdf8';
  roundedRect(ctx, 2, -10, 7, 4, 2);
  ctx.fill();

  // Spinning Propeller
  const propH = 6 + Math.abs(Math.sin(tick * 0.85)) * 16;
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(29, -propH, 4, propH * 2);

  if (player.isShielding) {
    ctx.strokeStyle = '#38bdf8';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.24)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawKennethFighterJet(
  ctx: CanvasRenderingContext2D,
  engine: SuperKennethEngine,
  x: number
) {
  const { player, tick } = engine;
  const cx = x + player.w / 2;
  const cy = Math.floor(player.y) + player.h / 2;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(player.vy * 0.04);

  // Supersonic Afterburner Flame
  const flameLen = 14 + (tick % 4) * 5;
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(-30, -6);
  ctx.lineTo(-30 - flameLen, 0);
  ctx.lineTo(-30, 6);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.moveTo(-30, -3);
  ctx.lineTo(-30 - flameLen * 0.55, 0);
  ctx.lineTo(-30, 3);
  ctx.closePath();
  ctx.fill();

  // Sleek Fighter Jet Body
  const jetGrad = ctx.createLinearGradient(-32, -16, 36, 14);
  jetGrad.addColorStop(0, '#1e3a8a');
  jetGrad.addColorStop(0.5, '#2563eb');
  jetGrad.addColorStop(1, '#e2e8f0');
  ctx.fillStyle = jetGrad;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-34, -15);
  ctx.lineTo(-14, -4);
  ctx.lineTo(12, -8);
  ctx.lineTo(36, 2);
  ctx.lineTo(10, 10);
  ctx.lineTo(-28, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Red swept wing + rocket pod
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(-8, 2);
  ctx.lineTo(-22, -16);
  ctx.lineTo(-6, -14);
  ctx.lineTo(8, 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Gold Pilot Canopy
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.ellipse(10, -4, 12, 5.5, 0.1, Math.PI, 0);
  ctx.fill();
  ctx.stroke();

  if (player.isShielding) {
    ctx.strokeStyle = '#38bdf8';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.24)';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, 44, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function renderPlatformerWorld(
  ctx: CanvasRenderingContext2D,
  engine: SuperKennethEngine
) {
  const { level, player, cameraX, tick, viewW } = engine;
  const theme = level.theme;

  // 1. Sky / Cavern / Reef Backdrop Gradient
  const sky = ctx.createLinearGradient(0, 0, 0, GAME_H);
  sky.addColorStop(0, theme.skyTop);
  sky.addColorStop(0.55, theme.skyMid);
  sky.addColorStop(1, theme.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, viewW, GAME_H);

  // 2. Non-Repetitive Seeded Parallax Scenery
  if (theme.backdropStyle === 'meadow') {
    drawMeadowParallax(ctx, cameraX, tick, viewW);
  } else if (theme.backdropStyle === 'cavern') {
    drawCavernParallax(ctx, cameraX, tick, viewW);
  } else if (theme.backdropStyle === 'reef') {
    drawReefParallax(ctx, cameraX, tick, viewW);
  } else if (theme.backdropStyle === 'jungle') {
    drawJungleParallax(ctx, cameraX, tick, viewW);
  } else if (theme.backdropStyle === 'mountain') {
    drawMountainParallax(ctx, cameraX, tick, viewW);
  } else {
    drawSkyArchipelagoParallax(ctx, cameraX, tick, viewW);
  }

  // 3. Boss Arena Barrier Gate
  if (level.boss.active && !level.boss.defeated) {
    const gx = Math.floor(level.boss.arenaMinX - cameraX);
    if (gx >= -20 && gx <= viewW + 20) {
      const grad = ctx.createLinearGradient(gx - 8, 0, gx + 14, 0);
      grad.addColorStop(0, 'rgba(251, 191, 36, 0)');
      grad.addColorStop(0.5, 'rgba(251, 191, 36, 0.58)');
      grad.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(gx - 8, 0, 22, GAME_H - 96);
    }
  }

  // 4. Swinging Vines (behind/with player)
  for (const vine of level.vines) {
    const ax = Math.floor(vine.anchorX - cameraX);
    if (ax < -180 || ax > viewW + 180) continue;
    drawVine(ctx, vine, ax);
  }

  // 5. Moving Platforms
  for (const plat of level.platforms) {
    const px = Math.floor(plat.x - cameraX);
    if (px + plat.w < -20 || px > viewW + 20) continue;
    const grad = ctx.createLinearGradient(px, plat.y, px, plat.y + plat.h);
    grad.addColorStop(
      0,
      theme.backdropStyle === 'cavern'
        ? '#c084fc'
        : theme.backdropStyle === 'reef'
        ? '#f472b6'
        : '#fbbf24'
    );
    grad.addColorStop(
      1,
      theme.backdropStyle === 'cavern'
        ? '#6b21a8'
        : theme.backdropStyle === 'reef'
        ? '#be185d'
        : '#b45309'
    );
    ctx.fillStyle = grad;
    roundedRect(ctx, px, plat.y, plat.w, plat.h, 11);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(px + 14, plat.y + plat.h / 2, 4, 0, Math.PI * 2);
    ctx.arc(px + plat.w - 14, plat.y + plat.h / 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 6. Level Tiles
  for (const tile of level.tiles) {
    const tx = Math.floor(tile.x - cameraX);
    if (tx + tile.w < -16 || tx > viewW + 16) continue;
    drawTile(ctx, tile, tx, Math.floor(tile.y + tile.bumpY), tick);
  }

  // 7. Checkpoints
  for (const cp of level.checkpoints) {
    const cx = Math.floor(cp.x - cameraX);
    if (cx < -60 || cx > viewW + 60) continue;
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    roundedRect(ctx, cx, cp.y, 10, 74, 5);
    ctx.fill();
    ctx.stroke();

    const wave = Math.sin(tick * 0.12) * 3;
    ctx.fillStyle = cp.activated ? '#10b981' : '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(cx + 10, cp.y + 4);
    ctx.quadraticCurveTo(cx + 30, cp.y + 10 + wave, cx + 48, cp.y + 18 + wave);
    ctx.lineTo(cx + 10, cp.y + 34);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = cp.activated ? '#fde047' : '#cbd5e1';
    ctx.beginPath();
    ctx.arc(cx + 5, cp.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // 8. Collectibles
  for (const col of level.collectibles) {
    if (col.collected) continue;
    const cx = Math.floor(col.x - cameraX);
    if (cx + col.w < -20 || cx > viewW + 20) continue;
    drawCollectible(ctx, col, cx, tick);
  }

  // 9. Enemies
  for (const e of level.enemies) {
    if (!e.alive && e.squashTimer <= 0) continue;
    const ex = Math.floor(e.x - cameraX);
    if (ex + e.w < -40 || ex > viewW + 40) continue;
    drawEnemy(ctx, e, ex, tick);
  }

  // 10. Boss
  if (!level.boss.defeated) {
    const bx = Math.floor(level.boss.x - cameraX);
    if (bx + level.boss.w > -80 && bx < viewW + 140) {
      drawBoss(ctx, level.boss, bx, tick);
    }
  }

  // 11. Projectiles
  drawProjectiles(ctx, engine);

  // 12. Super-Kenneth
  const blinkSkip = player.invulnTimer > 0 && Math.floor(tick / 4) % 2 === 0;
  if (!blinkSkip) {
    drawSuperKenneth(ctx, engine, Math.floor(player.x - cameraX));
  }
}

function drawVine(ctx: CanvasRenderingContext2D, vine: Vine, ax: number) {
  const endX = ax + Math.sin(vine.angle) * vine.length;
  const endY = vine.anchorY + Math.cos(vine.angle) * vine.length;
  const ctrlX = (ax + endX) / 2 - Math.sin(vine.angle) * 14;
  const ctrlY = (vine.anchorY + endY) / 2;

  ctx.save();
  // Overhead branch / canopy mount
  ctx.fillStyle = '#065f46';
  ctx.beginPath();
  ctx.arc(ax, vine.anchorY, 14, 0, Math.PI * 2);
  ctx.fill();

  // Vine stem
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(ax, vine.anchorY);
  ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
  ctx.stroke();

  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ax - 1, vine.anchorY);
  ctx.quadraticCurveTo(ctrlX - 1, ctrlY, endX - 1, endY);
  ctx.stroke();

  // Leaves along the vine
  for (let i = 1; i <= 4; i++) {
    const t = i / 5;
    const lx =
      (1 - t) * (1 - t) * ax + 2 * (1 - t) * t * ctrlX + t * t * endX;
    const ly =
      (1 - t) * (1 - t) * vine.anchorY +
      2 * (1 - t) * t * ctrlY +
      t * t * endY;
    const dir = i % 2 === 0 ? 1 : -1;
    ctx.fillStyle = '#22c55e';
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(lx + dir * 10, ly, 10, 5, dir * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Grip handle knot at bottom
  ctx.fillStyle = '#facc15';
  ctx.strokeStyle = '#713f12';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(endX, endY, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawProjectiles(
  ctx: CanvasRenderingContext2D,
  engine: SuperKennethEngine
) {
  for (const proj of engine.projectiles) {
    const px = Math.floor(proj.x - engine.cameraX);
    if (px + proj.w < -40 || px > engine.viewW + 40) continue;

    ctx.save();
    ctx.translate(px + proj.w / 2, proj.y + proj.h / 2);
    if (proj.kind === 'boomerang') {
      ctx.rotate(proj.rotation);
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#713f12';
      ctx.lineWidth = 2.5;
      drawStarShape(ctx, 0, 0, 4, 17, 6);
      ctx.fill();
      ctx.stroke();
    } else if (proj.kind === 'shockwave') {
      ctx.globalAlpha = proj.life / proj.maxLife;
      ctx.fillStyle = engine.hasTool('sun_sword') ? '#facc15' : '#fb923c';
      ctx.beginPath();
      ctx.ellipse(0, 0, 15, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 13, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (proj.kind === 'fireball') {
      ctx.fillStyle = '#f97316';
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 16, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (proj.kind === 'water_orb') {
      ctx.fillStyle = '#38bdf8';
      ctx.strokeStyle = '#075985';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#e0f2fe';
      ctx.beginPath();
      ctx.arc(-4, -4, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (proj.kind === 'wind_blade') {
      ctx.rotate(proj.rotation * 0.5);
      ctx.fillStyle = '#fde047';
      ctx.strokeStyle = '#0369a1';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 18, 9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else if (proj.kind === 'goo_blob') {
      ctx.fillStyle = '#f472b6';
      ctx.strokeStyle = '#831843';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#fbcfe8';
      ctx.beginPath();
      ctx.arc(-4, -5, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (proj.kind === 'stone_wave') {
      ctx.fillStyle = '#64748b';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-15, 14);
      ctx.quadraticCurveTo(0, -20, 15, 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (proj.kind === 'fire_orb') {
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (proj.kind === 'lightning') {
      ctx.shadowColor = '#c084fc';
      ctx.shadowBlur = 14;
      ctx.fillStyle = '#e879f9';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-12, -14);
      ctx.lineTo(6, -4);
      ctx.lineTo(-2, 0);
      ctx.lineTo(14, 14);
      ctx.lineTo(-6, 4);
      ctx.lineTo(2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (proj.kind === 'rocket') {
      ctx.rotate(proj.rotation);
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(-14, -4);
      ctx.lineTo(-24, 0);
      ctx.lineTo(-14, 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      roundedRect(ctx, -12, -6, 20, 12, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(8, -6);
      ctx.lineTo(18, 0);
      ctx.lineTo(8, 6);
      ctx.closePath();
      ctx.fill();
    } else if (proj.kind === 'laser') {
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#38bdf8';
      roundedRect(ctx, -16, -4, 32, 8, 4);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      roundedRect(ctx, -12, -2, 24, 4, 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

function drawMeadowParallax(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  tick: number,
  viewW: number
) {
  // Glowing Sun positioned comfortably inside wide viewports
  const sunX = Math.max(820, viewW - 220);
  const sunGrad = ctx.createRadialGradient(sunX, 108, 14, sunX, 108, 130);
  sunGrad.addColorStop(0, '#fef08a');
  sunGrad.addColorStop(0.45, 'rgba(253, 224, 71, 0.42)');
  sunGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(sunX, 108, 130, 0, Math.PI * 2);
  ctx.fill();

  // Varied Clouds
  const cloudSpan = 340;
  const cCam = cameraX * 0.12 - tick * 0.14;
  const cStart = Math.floor((cCam - cloudSpan) / cloudSpan);
  const cEnd = Math.ceil((cCam + viewW + cloudSpan) / cloudSpan);
  for (let i = cStart; i <= cEnd; i++) {
    const cx = i * cloudSpan - cCam;
    const s = hashSeed(i * 5.3);
    const cy = 62 + s * 95;
    const scale = 0.78 + hashSeed(i * 9.1) * 0.55;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.88)';
    ctx.beginPath();
    ctx.arc(cx, cy, 24 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 26 * scale, cy - 11 * scale, 32 * scale, 0, Math.PI * 2);
    ctx.arc(cx + 56 * scale, cy, 24 * scale, 0, Math.PI * 2);
    ctx.fill();
  }

  // Non-Repetitive Varied Mountains (different heights, twin peaks, widths)
  const mSpan = 410;
  const mCam = cameraX * 0.2;
  const mStart = Math.floor((mCam - mSpan) / mSpan);
  const mEnd = Math.ceil((mCam + viewW + mSpan) / mSpan);
  for (let i = mStart; i <= mEnd; i++) {
    const mx = i * mSpan - mCam;
    const s1 = hashSeed(i * 11.7);
    const s2 = hashSeed(i * 23.4);
    const peakY = 195 + s1 * 140;
    const width = 320 + s2 * 170;
    const peakX = mx + width * (0.42 + s1 * 0.16);

    ctx.fillStyle = i % 2 === 0 ? 'rgba(14, 116, 144, 0.42)' : 'rgba(15, 118, 110, 0.36)';
    ctx.beginPath();
    ctx.moveTo(mx - 20, GAME_H);
    ctx.quadraticCurveTo(peakX - width * 0.16, peakY + 42, peakX, peakY);
    ctx.quadraticCurveTo(peakX + width * 0.18, peakY + 46, mx + width + 20, GAME_H);
    ctx.closePath();
    ctx.fill();

    // Optional secondary ridge shoulder
    if (s2 > 0.45) {
      const subPeakX = mx + width * 0.76;
      const subPeakY = peakY + 75;
      ctx.fillStyle = 'rgba(14, 116, 144, 0.3)';
      ctx.beginPath();
      ctx.moveTo(peakX - 10, GAME_H);
      ctx.lineTo(subPeakX, subPeakY);
      ctx.lineTo(mx + width + 60, GAME_H);
      ctx.closePath();
      ctx.fill();
    }

    // Snow cap on taller mountains
    if (peakY < 285) {
      ctx.fillStyle = 'rgba(248, 250, 252, 0.58)';
      ctx.beginPath();
      ctx.moveTo(peakX - 42, peakY + 58);
      ctx.lineTo(peakX, peakY);
      ctx.lineTo(peakX + 44, peakY + 58);
      ctx.quadraticCurveTo(peakX, peakY + 42, peakX - 42, peakY + 58);
      ctx.fill();
    }
  }

  // Rolling Hills, Giant Oak Trees, Pine Groves, Ruins & Waterfalls (varied per segment!)
  const hSpan = 310;
  const hCam = cameraX * 0.36;
  const hStart = Math.floor((hCam - hSpan) / hSpan);
  const hEnd = Math.ceil((hCam + viewW + hSpan) / hSpan);
  for (let i = hStart; i <= hEnd; i++) {
    const hx = i * hSpan - hCam;
    const s1 = hashSeed(i * 17.3);
    const s2 = hashSeed(i * 29.9);
    const hillRadius = 175 + s1 * 75;
    const hillCenterY = GAME_H - 18 - s2 * 30;

    const hillGrad = ctx.createLinearGradient(0, 400, 0, GAME_H);
    hillGrad.addColorStop(0, s1 > 0.5 ? '#34d399' : '#10b981');
    hillGrad.addColorStop(1, '#047857');
    ctx.fillStyle = hillGrad;
    ctx.beginPath();
    ctx.arc(hx + 155, hillCenterY, hillRadius, Math.PI, 0);
    ctx.fill();

    // Distinct landmarks per hill segment!
    const topY = hillCenterY - hillRadius;
    if (s1 < 0.28) {
      // Giant Ancient Oak Tree
      ctx.fillStyle = '#78350f';
      roundedRect(ctx, hx + 110, topY + 20, 22, 110, 6);
      ctx.fill();
      ctx.fillStyle = '#065f46';
      ctx.beginPath();
      ctx.arc(hx + 121, topY + 12, 48, 0, Math.PI * 2);
      ctx.arc(hx + 88, topY + 26, 32, 0, Math.PI * 2);
      ctx.arc(hx + 154, topY + 26, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(hx + 115, topY + 4, 24, 0, Math.PI * 2);
      ctx.fill();
    } else if (s1 < 0.58) {
      // Tall Pine Trees + Bushes
      for (let p = 0; p < 2; p++) {
        const px = hx + 75 + p * 65;
        const py = topY + 34 + p * 12;
        ctx.fillStyle = '#064e3b';
        ctx.beginPath();
        ctx.moveTo(px - 24, py + 58);
        ctx.lineTo(px, py - 24);
        ctx.lineTo(px + 24, py + 58);
        ctx.closePath();
        ctx.fill();
      }
    } else if (s1 < 0.8) {
      // Mossy Ruin Arch + Waterfall
      ctx.fillStyle = 'rgba(100, 116, 139, 0.72)';
      roundedRect(ctx, hx + 85, topY + 18, 16, 66, 4);
      ctx.fill();
      roundedRect(ctx, hx + 145, topY + 18, 16, 66, 4);
      ctx.fill();
      roundedRect(ctx, hx + 80, topY + 10, 86, 16, 5);
      ctx.fill();

      ctx.fillStyle = 'rgba(186, 230, 253, 0.45)';
      roundedRect(ctx, hx + 185, topY + 42, 26, 190, 8);
      ctx.fill();
    } else {
      // Shrub Cluster
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.arc(hx + 105, topY + 38, 22, 0, Math.PI * 2);
      ctx.arc(hx + 132, topY + 34, 26, 0, Math.PI * 2);
      ctx.arc(hx + 160, topY + 40, 20, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawCavernParallax(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  tick: number,
  viewW: number
) {
  const starCount = Math.ceil(viewW / 40);
  for (let i = 0; i < starCount; i++) {
    const sx = ((i * 197 - cameraX * 0.12) % viewW + viewW) % viewW;
    const sy = 50 + ((i * 83) % 380);
    const pulse = 0.4 + 0.6 * Math.abs(Math.sin(tick * 0.03 + i));
    ctx.fillStyle =
      i % 2 === 0
        ? `rgba(216, 180, 254, ${pulse})`
        : `rgba(56, 189, 248, ${pulse})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 2.8 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }

  const cSpan = 290;
  const cCam = cameraX * 0.25;
  const cStart = Math.floor((cCam - cSpan) / cSpan);
  const cEnd = Math.ceil((cCam + viewW + cSpan) / cSpan);
  for (let i = cStart; i <= cEnd; i++) {
    const cx = i * cSpan - cCam;
    const s = hashSeed(i * 19.1);
    const peakY = 230 + s * 130;
    const w = 85 + s * 55;
    ctx.fillStyle = 'rgba(88, 28, 135, 0.58)';
    ctx.beginPath();
    ctx.moveTo(cx + 20, GAME_H);
    ctx.lineTo(cx + 20 + w * 0.5, peakY);
    ctx.lineTo(cx + 20 + w, GAME_H);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = s > 0.5 ? 'rgba(192, 132, 252, 0.35)' : 'rgba(56, 189, 248, 0.3)';
    ctx.beginPath();
    ctx.moveTo(cx + 20 + w * 0.5, peakY);
    ctx.lineTo(cx + 20 + w, GAME_H);
    ctx.lineTo(cx + 20 + w * 0.62, GAME_H);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = '#1e1b4b';
  const sSpan = 135;
  const sCam = cameraX * 0.4;
  const sStart = Math.floor((sCam - sSpan) / sSpan);
  const sEnd = Math.ceil((sCam + viewW + sSpan) / sSpan);
  for (let i = sStart; i <= sEnd; i++) {
    const sx = i * sSpan - sCam;
    const h = 48 + hashSeed(i * 31.7) * 62;
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.quadraticCurveTo(sx + 38, h + 14, sx + 76, 0);
    ctx.closePath();
    ctx.fill();
  }
}

function drawSkyArchipelagoParallax(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  tick: number,
  viewW: number
) {
  const sunGrad = ctx.createRadialGradient(240, 120, 18, 240, 120, 150);
  sunGrad.addColorStop(0, '#fef9c3');
  sunGrad.addColorStop(0.5, 'rgba(253, 224, 71, 0.38)');
  sunGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(240, 120, 150, 0, Math.PI * 2);
  ctx.fill();

  const iSpan = 350;
  const iCam = cameraX * 0.22;
  const iStart = Math.floor((iCam - iSpan) / iSpan);
  const iEnd = Math.ceil((iCam + viewW + iSpan) / iSpan);
  for (let i = iStart; i <= iEnd; i++) {
    const ix = i * iSpan - iCam;
    const s = hashSeed(i * 13.7);
    const iy = 290 + s * 110 + Math.sin(tick * 0.02 + i) * 6;
    const iw = 120 + s * 60;
    ctx.fillStyle = 'rgba(186, 230, 253, 0.48)';
    ctx.beginPath();
    ctx.moveTo(ix, iy);
    ctx.lineTo(ix + iw, iy);
    ctx.quadraticCurveTo(ix + iw * 0.5, iy + 72, ix, iy);
    ctx.fill();
    ctx.fillStyle = 'rgba(52, 211, 153, 0.48)';
    roundedRect(ctx, ix - 4, iy - 10, iw + 8, 16, 8);
    ctx.fill();

    // Distant tower or tree on some floating islands
    if (s > 0.55) {
      ctx.fillStyle = 'rgba(248, 250, 252, 0.42)';
      roundedRect(ctx, ix + iw * 0.35, iy - 48, 28, 38, 5);
      ctx.fill();
    } else {
      ctx.fillStyle = 'rgba(16, 185, 129, 0.45)';
      ctx.beginPath();
      ctx.arc(ix + iw * 0.4, iy - 22, 18, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const cSpan = 300;
  const cCam = cameraX * 0.16 - tick * 0.18;
  const cStart = Math.floor((cCam - cSpan) / cSpan);
  const cEnd = Math.ceil((cCam + viewW + cSpan) / cSpan);
  for (let i = cStart; i <= cEnd; i++) {
    const cx = i * cSpan - cCam;
    const cy = 76 + hashSeed(i * 7.1) * 140;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.86)';
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.arc(cx + 30, cy - 12, 36, 0, Math.PI * 2);
    ctx.arc(cx + 62, cy, 28, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawReefParallax(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  tick: number,
  viewW: number
) {
  // Shimmering sunbeams from ocean surface above
  ctx.save();
  for (let i = 0; i < 6; i++) {
    const bx = ((i * 290 - cameraX * 0.08) % (viewW + 300) + viewW + 300) % (viewW + 300) - 100;
    const grad = ctx.createLinearGradient(bx, 0, bx + 110, GAME_H);
    grad.addColorStop(0, 'rgba(186, 230, 253, 0.18)');
    grad.addColorStop(1, 'rgba(186, 230, 253, 0)');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(bx, 0);
    ctx.lineTo(bx + 90, 0);
    ctx.lineTo(bx + 210, GAME_H);
    ctx.lineTo(bx + 70, GAME_H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Giant Coral Spires & Swaying Seaweed Kelp (seeded non-repetitive)
  const rSpan = 260;
  const rCam = cameraX * 0.28;
  const rStart = Math.floor((rCam - rSpan) / rSpan);
  const rEnd = Math.ceil((rCam + viewW + rSpan) / rSpan);
  for (let i = rStart; i <= rEnd; i++) {
    const rx = i * rSpan - rCam;
    const s = hashSeed(i * 15.9);
    const sway = Math.sin(tick * 0.04 + i) * 12;

    if (s < 0.5) {
      // Swaying Kelp Forest
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.42)';
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(rx + 80, GAME_H);
      ctx.quadraticCurveTo(rx + 60 + sway, 460, rx + 90 + sway * 1.4, 290 + s * 100);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(52, 211, 153, 0.38)';
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(rx + 125, GAME_H);
      ctx.quadraticCurveTo(rx + 145 - sway, 510, rx + 120 - sway, 370);
      ctx.stroke();
    } else {
      // Glowing Coral Arch / Dome
      ctx.fillStyle = s > 0.75 ? 'rgba(244, 114, 182, 0.32)' : 'rgba(168, 85, 247, 0.32)';
      ctx.beginPath();
      ctx.arc(rx + 110, GAME_H - 60, 80 + s * 40, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = 'rgba(251, 191, 36, 0.26)';
      ctx.beginPath();
      ctx.arc(rx + 180, GAME_H - 70, 48, Math.PI, 0);
      ctx.fill();
    }
  }
}

function drawJungleParallax(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  tick: number,
  viewW: number
) {
  const span = 280;
  const cam = cameraX * 0.24;
  const start = Math.floor((cam - span) / span);
  const end = Math.ceil((cam + viewW + span) / span);

  for (let i = start; i <= end; i++) {
    const x = i * span - cam;
    const s = hashSeed(i * 11.3);
    // Ancient Mayan Pyramid / Temple Ruins in background
    if (s > 0.55) {
      ctx.fillStyle = 'rgba(6, 78, 59, 0.52)';
      ctx.beginPath();
      ctx.moveTo(x + 40, GAME_H);
      ctx.lineTo(x + 95, 290);
      ctx.lineTo(x + 165, 290);
      ctx.lineTo(x + 220, GAME_H);
      ctx.closePath();
      ctx.fill();
    }
    // Giant Jungle Canopy Trees
    ctx.fillStyle = 'rgba(20, 83, 45, 0.58)';
    roundedRect(ctx, x + 20, 220 + s * 60, 26, GAME_H - 220, 8);
    ctx.fill();
    ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
    ctx.beginPath();
    ctx.arc(x + 33, 210 + s * 60, 68, 0, Math.PI * 2);
    ctx.arc(x + 80, 230 + s * 50, 48, 0, Math.PI * 2);
    ctx.fill();

    // Hanging Background Vines
    const sway = Math.sin(tick * 0.03 + i) * 6;
    ctx.strokeStyle = 'rgba(74, 222, 128, 0.35)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 150, 0);
    ctx.quadraticCurveTo(x + 150 + sway, 140, x + 156 + sway, 240);
    ctx.stroke();
  }
}

function drawMountainParallax(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  tick: number,
  viewW: number
) {
  const mSpan = 360;
  const mCam = cameraX * 0.2;
  const mStart = Math.floor((mCam - mSpan) / mSpan);
  const mEnd = Math.ceil((mCam + viewW + mSpan) / mSpan);

  for (let i = mStart; i <= mEnd; i++) {
    const mx = i * mSpan - mCam;
    const s = hashSeed(i * 17.7);
    const peakY = 120 + s * 130;
    const peakX = mx + 170;

    ctx.fillStyle = i % 2 === 0 ? '#475569' : '#334155';
    ctx.beginPath();
    ctx.moveTo(mx - 30, GAME_H);
    ctx.lineTo(peakX, peakY);
    ctx.lineTo(mx + 390, GAME_H);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.moveTo(peakX - 58, peakY + 95);
    ctx.lineTo(peakX, peakY);
    ctx.lineTo(peakX + 62, peakY + 95);
    ctx.lineTo(peakX + 18, peakY + 75);
    ctx.lineTo(peakX - 18, peakY + 86);
    ctx.closePath();
    ctx.fill();
  }

  // Snow Clouds
  const cSpan = 320;
  const cCam = cameraX * 0.14 - tick * 0.2;
  const cStart = Math.floor((cCam - cSpan) / cSpan);
  const cEnd = Math.ceil((cCam + viewW + cSpan) / cSpan);
  for (let i = cStart; i <= cEnd; i++) {
    const cx = i * cSpan - cCam;
    const cy = 80 + hashSeed(i * 8.1) * 90;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.arc(cx + 28, cy - 10, 30, 0, Math.PI * 2);
    ctx.arc(cx + 56, cy, 22, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBalloonSkyParallax(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  tick: number,
  viewW: number
) {
  // Distant Hot Air Balloons + Fluffy Clouds
  const bSpan = 360;
  const bCam = cameraX * 0.15;
  const bStart = Math.floor((bCam - bSpan) / bSpan);
  const bEnd = Math.ceil((bCam + viewW + bSpan) / bSpan);

  for (let i = bStart; i <= bEnd; i++) {
    const bx = i * bSpan - bCam + 90;
    const s = hashSeed(i * 21.3);
    const by = 130 + s * 170 + Math.sin(tick * 0.03 + i) * 8;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(251, 146, 60, 0.55)' : 'rgba(244, 114, 182, 0.55)';
    ctx.beginPath();
    ctx.arc(bx, by, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(120, 53, 15, 0.5)';
    ctx.fillRect(bx - 5, by + 22, 10, 8);
  }

  const cSpan = 300;
  const cCam = cameraX * 0.25 - tick * 0.22;
  const cStart = Math.floor((cCam - cSpan) / cSpan);
  const cEnd = Math.ceil((cCam + viewW + cSpan) / cSpan);
  for (let i = cStart; i <= cEnd; i++) {
    const cx = i * cSpan - cCam;
    const cy = GAME_H - 95 + hashSeed(i * 4.9) * 50;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.arc(cx, cy, 44, 0, Math.PI * 2);
    ctx.arc(cx + 54, cy - 16, 54, 0, Math.PI * 2);
    ctx.arc(cx + 112, cy, 46, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCanyonSkyParallax(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  tick: number,
  viewW: number
) {
  const sunX = Math.max(760, viewW - 220);
  const sunGrad = ctx.createRadialGradient(sunX, 150, 20, sunX, 150, 160);
  sunGrad.addColorStop(0, '#fef08a');
  sunGrad.addColorStop(0.5, 'rgba(251, 146, 60, 0.45)');
  sunGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(sunX, 150, 160, 0, Math.PI * 2);
  ctx.fill();

  const span = 320;
  const cam = cameraX * 0.3;
  const start = Math.floor((cam - span) / span);
  const end = Math.ceil((cam + viewW + span) / span);
  for (let i = start; i <= end; i++) {
    const mx = i * span - cam;
    const s = hashSeed(i * 9.7);
    const topY = 440 + s * 110;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(124, 45, 18, 0.72)' : 'rgba(154, 52, 18, 0.65)';
    ctx.beginPath();
    ctx.moveTo(mx + 20, GAME_H);
    ctx.lineTo(mx + 60, topY);
    ctx.lineTo(mx + 185, topY);
    ctx.lineTo(mx + 235, GAME_H);
    ctx.closePath();
    ctx.fill();
  }
}

function drawSpaceSkyParallax(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  tick: number,
  viewW: number
) {
  // Stars
  const starCount = Math.ceil(viewW / 24);
  for (let i = 0; i < starCount; i++) {
    const sx = ((i * 173 - cameraX * 0.15) % viewW + viewW) % viewW;
    const sy = 30 + ((i * 97) % (GAME_H - 120));
    const pulse = 0.4 + 0.6 * Math.abs(Math.sin(tick * 0.04 + i));
    ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
    ctx.beginPath();
    ctx.arc(sx, sy, (i % 3) + 1.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Ringed Planet in upper sky
  const px = viewW * 0.76 - ((cameraX * 0.05) % 240);
  const py = 140;
  ctx.fillStyle = '#c084fc';
  ctx.beginPath();
  ctx.arc(px, py, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(250, 204, 21, 0.65)';
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.ellipse(px, py, 78, 16, -0.25, 0, Math.PI * 2);
  ctx.stroke();

  // Glowing Blue Earth Curvature below
  const earthGrad = ctx.createLinearGradient(0, GAME_H - 110, 0, GAME_H);
  earthGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
  earthGrad.addColorStop(1, 'rgba(14, 116, 144, 0.75)');
  ctx.fillStyle = earthGrad;
  ctx.beginPath();
  ctx.ellipse(viewW / 2, GAME_H + 140, viewW * 0.85, 220, 0, Math.PI, 0);
  ctx.fill();
}

function drawTile(
  ctx: CanvasRenderingContext2D,
  tile: Tile,
  x: number,
  y: number,
  tick: number
) {
  const s = tile.w;

  if (tile.kind === 'grass') {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x, y + 10, s, s - 10);
    ctx.fillStyle = '#92400e';
    roundedRect(ctx, x + 6, y + 22, 12, 8, 4);
    ctx.fill();
    roundedRect(ctx, x + 28, y + 30, 12, 8, 4);
    ctx.fill();

    const turf = ctx.createLinearGradient(x, y, x, y + 20);
    turf.addColorStop(0, '#4ade80');
    turf.addColorStop(1, '#16a34a');
    ctx.fillStyle = turf;
    roundedRect(ctx, x - 1, y, s + 2, 18, 7);
    ctx.fill();
    ctx.strokeStyle = '#14532d';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (tile.kind === 'dirt') {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x, y, s, s);
    ctx.fillStyle = '#92400e';
    roundedRect(ctx, x + 8, y + 10, 13, 9, 4);
    ctx.fill();
    roundedRect(ctx, x + 26, y + 28, 14, 9, 4);
    ctx.fill();
  } else if (tile.kind === 'sand') {
    ctx.fillStyle = '#eab308';
    ctx.fillRect(x, y, s, s);
    ctx.fillStyle = '#ca8a04';
    roundedRect(ctx, x + 8, y + 12, 12, 8, 4);
    ctx.fill();
    roundedRect(ctx, x + 28, y + 30, 10, 7, 3);
    ctx.fill();
  } else if (tile.kind === 'coral') {
    ctx.fillStyle = '#0e7490';
    ctx.fillRect(x, y + 10, s, s - 10);
    const coralGrad = ctx.createLinearGradient(x, y, x, y + 20);
    coralGrad.addColorStop(0, '#f472b6');
    coralGrad.addColorStop(1, '#db2777');
    ctx.fillStyle = coralGrad;
    roundedRect(ctx, x - 1, y, s + 2, 18, 8);
    ctx.fill();
    ctx.strokeStyle = '#831843';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fbcfe8';
    roundedRect(ctx, x + 6, y + 3, 18, 4, 2);
    ctx.fill();
  } else if (tile.kind === 'crystal') {
    const grad = ctx.createLinearGradient(x, y, x, y + s);
    grad.addColorStop(0, '#581c87');
    grad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, s, s);
    ctx.fillStyle = '#c084fc';
    roundedRect(ctx, x - 1, y, s + 2, 14, 6);
    ctx.fill();
    ctx.fillStyle = '#f5d0fe';
    roundedRect(ctx, x + 6, y + 3, 18, 4, 2);
    ctx.fill();
  } else if (tile.kind === 'cloud') {
    const grad = ctx.createLinearGradient(x, y, x, y + s);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(1, '#bae6fd');
    ctx.fillStyle = grad;
    roundedRect(ctx, x, y + 2, s, s - 4, 14);
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = '#fef08a';
    roundedRect(ctx, x + 8, y + 6, s - 16, 5, 2.5);
    ctx.fill();
  } else if (tile.kind === 'stone') {
    ctx.fillStyle = '#475569';
    roundedRect(ctx, x + 1, y + 1, s - 2, s - 2, 9);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = '#64748b';
    roundedRect(ctx, x + 6, y + 5, s - 12, 7, 3);
    ctx.fill();
  } else if (tile.kind === 'brick') {
    ctx.fillStyle = '#d97706';
    roundedRect(ctx, x + 1, y + 1, s - 2, s - 2, 8);
    ctx.fill();
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 3, y + s / 2);
    ctx.lineTo(x + s - 3, y + s / 2);
    ctx.moveTo(x + s / 2, y + 3);
    ctx.lineTo(x + s / 2, y + s / 2);
    ctx.stroke();
  } else if (tile.kind === 'cracked') {
    ctx.fillStyle = '#64748b';
    roundedRect(ctx, x + 1, y + 1, s - 2, s - 2, 10);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 6);
    ctx.lineTo(x + 24, y + 22);
    ctx.lineTo(x + 16, y + 36);
    ctx.moveTo(x + 24, y + 22);
    ctx.lineTo(x + 38, y + 32);
    ctx.stroke();
  } else if (tile.kind === 'question' || tile.kind === 'used') {
    const active = tile.kind === 'question';
    const grad = ctx.createLinearGradient(x, y, x, y + s);
    grad.addColorStop(0, active ? '#fde047' : '#78716c');
    grad.addColorStop(1, active ? '#ca8a04' : '#44403c');
    ctx.fillStyle = grad;
    roundedRect(ctx, x + 1, y + 1, s - 2, s - 2, 11);
    ctx.fill();
    ctx.strokeStyle = active ? '#713f12' : '#292524';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    if (active) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '700 28px Fredoka, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', x + s / 2, y + 34 + Math.sin(tick * 0.1) * 1.5);
    }
  } else if (tile.kind === 'bridge') {
    ctx.fillStyle = '#b45309';
    roundedRect(ctx, x, y + 4, s, 20, 7);
    ctx.fill();
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    roundedRect(ctx, x + 6, y + 7, s - 12, 5, 2.5);
    ctx.fill();
  } else if (tile.kind === 'rope_bridge') {
    // Rope handrails + suspended wooden planks
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(x, y - 18);
    ctx.lineTo(x + s, y - 18);
    ctx.stroke();

    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 8, y - 18);
    ctx.lineTo(x + 8, y + 6);
    ctx.moveTo(x + s - 8, y - 18);
    ctx.lineTo(x + s - 8, y + 6);
    ctx.stroke();

    ctx.fillStyle = '#b45309';
    roundedRect(ctx, x + 2, y + 2, s - 4, 18, 6);
    ctx.fill();
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#fde68a';
    roundedRect(ctx, x + 8, y + 5, s - 16, 4, 2);
    ctx.fill();
  } else if (tile.kind === 'lava') {
    const wave = Math.sin(tick * 0.1 + x * 0.05) * 4;
    const grad = ctx.createLinearGradient(x, y, x, y + s);
    grad.addColorStop(0, '#fb923c');
    grad.addColorStop(0.5, '#ef4444');
    grad.addColorStop(1, '#991b1b');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y + 6 + wave, s, s);
    ctx.fillStyle = '#fef08a';
    roundedRect(ctx, x + 8, y + 9 + wave, 14, 5, 2.5);
    ctx.fill();
  } else if (tile.kind === 'spring') {
    const squash = tile.springAnim ? Math.sin(tile.springAnim * 0.5) * 8 : 0;
    ctx.fillStyle = '#334155';
    roundedRect(ctx, x + 6, y + s - 12, s - 12, 12, 5);
    ctx.fill();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 16, y + s - 12);
    ctx.lineTo(x + 32, y + s - 22 + squash);
    ctx.lineTo(x + 16, y + s - 32 + squash);
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    roundedRect(ctx, x + 4, y + 10 + squash, s - 8, 15, 7);
    ctx.fill();
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#facc15';
    roundedRect(ctx, x + 10, y + 12 + squash, s - 20, 4, 2);
    ctx.fill();
  } else if (tile.kind === 'jelly_pad') {
    const bounce = tile.springAnim ? Math.sin(tile.springAnim * 0.5) * 7 : Math.sin(tick * 0.1) * 2;
    ctx.save();
    ctx.shadowColor = '#f472b6';
    ctx.shadowBlur = 12;
    // Tentacles
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 3;
    for (let i = 0; i < 4; i++) {
      const tx = x + 10 + i * 9;
      ctx.beginPath();
      ctx.moveTo(tx, y + 26 + bounce);
      ctx.quadraticCurveTo(tx + Math.sin(tick * 0.15 + i) * 4, y + 38, tx, y + s);
      ctx.stroke();
    }
    // Bouncy Jelly Dome
    const jGrad = ctx.createLinearGradient(x, y + 6, x, y + 30);
    jGrad.addColorStop(0, '#fbcfe8');
    jGrad.addColorStop(1, '#db2777');
    ctx.fillStyle = jGrad;
    ctx.strokeStyle = '#831843';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x + s / 2, y + 28 + bounce, 22, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  } else if (tile.kind === 'boost_pad') {
    // Sonic-style Speed Boost Strip
    ctx.save();
    ctx.fillStyle = '#0f172a';
    roundedRect(ctx, x + 2, y + s - 14, s - 4, 14, 6);
    ctx.fill();
    const glow = 0.65 + 0.35 * Math.sin(tick * 0.25);
    ctx.strokeStyle = `rgba(250, 204, 21, ${glow})`;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    for (let c = 0; c < 2; c++) {
      const cx = x + 14 + c * 14 + ((tick * 1.4) % 8);
      ctx.beginPath();
      ctx.moveTo(cx - 5, y + s - 11);
      ctx.lineTo(cx + 2, y + s - 7);
      ctx.lineTo(cx - 5, y + s - 3);
      ctx.stroke();
    }
    ctx.restore();
  } else if (tile.kind === 'ice') {
    const grad = ctx.createLinearGradient(x, y, x, y + s);
    grad.addColorStop(0, '#e0f2fe');
    grad.addColorStop(1, '#38bdf8');
    ctx.fillStyle = grad;
    roundedRect(ctx, x, y, s, s, 6);
    ctx.fill();
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    roundedRect(ctx, x + 5, y + 3, s - 10, 7, 3);
    ctx.fill();
  } else if (tile.kind === 'jungle_wood') {
    ctx.fillStyle = '#78350f';
    roundedRect(ctx, x, y, s, s, 5);
    ctx.fill();
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#92400e';
    roundedRect(ctx, x + 4, y + 6, s - 8, 8, 3);
    ctx.fill();
    ctx.fillStyle = '#16a34a';
    roundedRect(ctx, x + 4, y + 1, 16, 5, 2);
    ctx.fill();
  } else if (tile.kind === 'ladder') {
    ctx.fillStyle = '#92400e';
    roundedRect(ctx, x + 8, y, 7, s, 3);
    ctx.fill();
    roundedRect(ctx, x + s - 15, y, 7, s, 3);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.5;
    for (let r = 8; r < s; r += 16) {
      roundedRect(ctx, x + 6, y + r, s - 12, 6, 3);
      ctx.fill();
      ctx.stroke();
    }
  } else if (tile.kind === 'slide_right' || tile.kind === 'slide_left') {
    const isRight = tile.kind === 'slide_right';
    ctx.fillStyle = '#0284c7';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (isRight) {
      ctx.moveTo(x, y);
      ctx.lineTo(x + s, y + s);
      ctx.lineTo(x, y + s);
    } else {
      ctx.moveTo(x + s, y);
      ctx.lineTo(x + s, y + s);
      ctx.lineTo(x, y + s);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Bright glossy slide rail
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    if (isRight) {
      ctx.moveTo(x + 2, y + 2);
      ctx.lineTo(x + s - 2, y + s - 2);
    } else {
      ctx.moveTo(x + s - 2, y + 2);
      ctx.lineTo(x + 2, y + s - 2);
    }
    ctx.stroke();
  } else if (tile.kind === 'bumper') {
    const pulse = tile.springAnim ? Math.sin(tile.springAnim * 0.6) * 5 : 0;
    const rad = 20 + pulse;
    const cx = x + s / 2;
    const cy = y + s / 2;
    ctx.save();
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#f43f5e';
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fde047';
    drawStarShape(ctx, cx, cy, 5, 11, 5);
    ctx.fill();
    ctx.restore();
  }
}

function drawCollectible(
  ctx: CanvasRenderingContext2D,
  col: Collectible,
  x: number,
  tick: number
) {
  const bob = Math.sin(tick * 0.08 + col.bobOffset) * 4;
  const y = col.y + bob;

  if (col.kind === 'coin') {
    const spinW = Math.max(
      7,
      Math.abs(Math.cos(tick * 0.09 + col.bobOffset)) * col.w
    );
    const cx = x + col.w / 2;
    const cy = y + col.h / 2;
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.ellipse(cx, cy, spinW / 2, col.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    if (spinW > 12) {
      ctx.fillStyle = '#fef9c3';
      roundedRect(ctx, cx - 2, cy - 6, 4, 12, 2);
      ctx.fill();
    }
  } else if (col.kind === 'gem') {
    const cx = x + col.w / 2;
    const cy = y + col.h / 2;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(cx, cy - 16);
    ctx.lineTo(cx + 14, cy);
    ctx.lineTo(cx, cy + 16);
    ctx.lineTo(cx - 14, cy);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#0369a1';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  } else if (col.kind === 'super_star') {
    const cx = x + col.w / 2;
    const cy = y + col.h / 2;
    ctx.save();
    ctx.shadowColor = '#fde047';
    ctx.shadowBlur = 16;
    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#854d0e';
    ctx.lineWidth = 2.5;
    drawStarShape(ctx, cx, cy, 5, 19, 9);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 2, 2, 0, Math.PI * 2);
    ctx.arc(cx + 4, cy - 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (col.kind === 'heart' || col.kind === 'apple') {
    const cx = x + col.w / 2;
    const cy = y + col.h / 2;
    ctx.fillStyle = col.kind === 'apple' ? '#facc15' : '#f43f5e';
    ctx.beginPath();
    ctx.arc(cx - 6, cy - 3, 8, 0, Math.PI * 2);
    ctx.arc(cx + 6, cy - 3, 8, 0, Math.PI * 2);
    ctx.moveTo(cx - 13.5, cy);
    ctx.lineTo(cx, cy + 14);
    ctx.lineTo(cx + 13.5, cy);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath();
    ctx.arc(cx - 6, cy - 5, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (col.kind === 'chest') {
    const pulse = 0.5 + 0.5 * Math.sin(tick * 0.1);
    ctx.save();
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 14 + pulse * 10;
    ctx.fillStyle = '#92400e';
    roundedRect(ctx, x, col.y + 8, col.w, col.h - 8, 9);
    ctx.fill();
    ctx.fillStyle = '#d97706';
    roundedRect(ctx, x - 2, col.y, col.w + 4, 19, 9);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    roundedRect(ctx, x + 1, col.y + 1, col.w - 2, col.h - 2, 8);
    ctx.stroke();
    ctx.fillStyle = '#fde047';
    roundedRect(ctx, x + col.w / 2 - 6, col.y + 14, 12, 14, 4);
    ctx.fill();
    ctx.restore();
  }
}

function drawEnemy(
  ctx: CanvasRenderingContext2D,
  e: Enemy,
  x: number,
  tick: number
) {
  ctx.save();
  if (!e.alive) {
    ctx.translate(x, e.y + e.h * 0.6);
    ctx.scale(1, 0.4);
    ctx.translate(-x, -e.y);
  }
  if (e.hitFlash > 0) ctx.filter = 'brightness(2)';

  if (e.kind === 'shroom') {
    ctx.fillStyle = '#dc2626';
    ctx.strokeStyle = '#450a0a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x + e.w / 2, e.y + 20, 21, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(x + 14, e.y + 11, 4.5, 0, Math.PI * 2);
    ctx.arc(x + 28, e.y + 13, 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fde68a';
    roundedRect(ctx, x + 8, e.y + 19, e.w - 16, 18, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(x + 15, e.y + 26, 2.8, 0, Math.PI * 2);
    ctx.arc(x + 27, e.y + 26, 2.8, 0, Math.PI * 2);
    ctx.fill();
    const step = Math.sin(tick * 0.25) * 3;
    ctx.fillStyle = '#451a03';
    roundedRect(ctx, x + 8, e.y + 35 + step, 10, 7, 3);
    ctx.fill();
    roundedRect(ctx, x + 24, e.y + 35 - step, 10, 7, 3);
    ctx.fill();
  } else if (e.kind === 'beetle') {
    ctx.fillStyle = '#059669';
    ctx.strokeStyle = '#064e3b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x + e.w / 2, e.y + 24, 22, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    const eyeX = e.vx < 0 ? x + 10 : x + e.w - 18;
    roundedRect(ctx, eyeX, e.y + 16, 9, 8, 3);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(eyeX + 4.5, e.y + 20, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f59e0b';
    roundedRect(ctx, x + 8, e.y + 26, 10, 9, 4);
    ctx.fill();
    roundedRect(ctx, x + e.w - 18, e.y + 26, 10, 9, 4);
    ctx.fill();
  } else if (e.kind === 'bat' || e.kind === 'sky_drone') {
    const isDrone = e.kind === 'sky_drone';
    const flap = Math.sin(tick * 0.35) * 9;
    ctx.fillStyle = isDrone ? '#facc15' : '#7e22ce';
    ctx.strokeStyle = '#1e1b4b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x + e.w / 2, e.y + 16);
    ctx.quadraticCurveTo(x - 4, e.y + 2 + flap, x - 8, e.y + 12 + flap);
    ctx.lineTo(x + 6, e.y + 24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + e.w / 2, e.y + 16);
    ctx.quadraticCurveTo(
      x + e.w + 4,
      e.y + 2 + flap,
      x + e.w + 8,
      e.y + 12 + flap
    );
    ctx.lineTo(x + e.w - 6, e.y + 24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isDrone ? '#0284c7' : '#1e1b4b';
    ctx.beginPath();
    ctx.arc(x + e.w / 2, e.y + 17, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(x + e.w / 2 - 5, e.y + 15, 3, 0, Math.PI * 2);
    ctx.arc(x + e.w / 2 + 5, e.y + 15, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === 'slime' || e.kind === 'gooey') {
    const isGooey = e.kind === 'gooey';
    const wobble = Math.sin(tick * 0.18) * 3.5;
    const grad = ctx.createLinearGradient(x, e.y, x, e.y + e.h);
    grad.addColorStop(0, isGooey ? '#a855f7' : '#fb923c');
    grad.addColorStop(1, isGooey ? '#ec4899' : '#dc2626');
    ctx.fillStyle = grad;
    ctx.strokeStyle = isGooey ? '#581c87' : '#7f1d1d';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x + e.w / 2, e.y + e.h - 4, 21 + wobble, Math.PI, 0);
    ctx.fill();
    ctx.stroke();

    if (isGooey) {
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x + 15, e.y + 20, 5, 0, Math.PI * 2);
      ctx.arc(x + 29, e.y + 20, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(x + 15, e.y + 20, 2.5, 0, Math.PI * 2);
      ctx.arc(x + 29, e.y + 20, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(x + 15, e.y + 20, 3.5, 0, Math.PI * 2);
      ctx.arc(x + 29, e.y + 20, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawBoss(
  ctx: CanvasRenderingContext2D,
  boss: Boss,
  x: number,
  tick: number
) {
  ctx.save();
  if (boss.hitFlash > 0) ctx.filter = 'brightness(2.2)';
  if (boss.phaseState === 'TELEGRAPH' && Math.floor(tick / 4) % 2 === 0) {
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 24;
  }

  const cx = x + boss.w / 2;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3.5;

  if (boss.kind === 'beetle_king' || boss.kind === 'goo_king') {
    const isGoo = boss.kind === 'goo_king';
    const wobble = isGoo ? Math.sin(tick * 0.16) * 5 : 0;
    const shellGrad = ctx.createLinearGradient(x, boss.y, x, boss.y + boss.h);
    shellGrad.addColorStop(0, isGoo ? '#f472b6' : '#10b981');
    shellGrad.addColorStop(1, isGoo ? '#7e22ce' : '#064e3b');
    ctx.fillStyle = shellGrad;
    ctx.beginPath();
    ctx.arc(cx, boss.y + boss.h - 16, boss.w * 0.48 + wobble, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Crown
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(cx - 22, boss.y + 18);
    ctx.lineTo(cx - 24, boss.y - 6);
    ctx.lineTo(cx - 8, boss.y + 8);
    ctx.lineTo(cx, boss.y - 12);
    ctx.lineTo(cx + 8, boss.y + 8);
    ctx.lineTo(cx + 24, boss.y - 6);
    ctx.lineTo(cx + 22, boss.y + 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const faceOffset = boss.facingRight ? 18 : -18;
    ctx.fillStyle = isGoo ? '#ffffff' : '#fef08a';
    roundedRect(ctx, cx + faceOffset - 15, boss.y + 40, 30, 17, 7);
    ctx.fill();
    ctx.fillStyle = isGoo ? '#0f172a' : '#dc2626';
    ctx.beginPath();
    ctx.arc(cx + faceOffset - 5, boss.y + 49, 4.5, 0, Math.PI * 2);
    ctx.arc(cx + faceOffset + 6, boss.y + 49, 4.5, 0, Math.PI * 2);
    ctx.fill();

    if (isGoo) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.beginPath();
      ctx.ellipse(cx - 22, boss.y + 34, 12, 7, -0.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      const step = Math.sin(tick * 0.2) * 5;
      ctx.fillStyle = '#f59e0b';
      roundedRect(ctx, x + 14, boss.y + boss.h - 18 + step, 22, 18, 7);
      ctx.fill();
      roundedRect(ctx, x + boss.w - 36, boss.y + boss.h - 18 - step, 22, 18, 7);
      ctx.fill();
    }
  } else if (boss.kind === 'ice_leviathan') {
    const hullGrad = ctx.createLinearGradient(
      x,
      boss.y,
      x + boss.w,
      boss.y + boss.h
    );
    hullGrad.addColorStop(0, '#38bdf8');
    hullGrad.addColorStop(1, '#1e3a8a');
    ctx.fillStyle = hullGrad;
    ctx.beginPath();
    ctx.moveTo(x + boss.w, boss.y + 18);
    ctx.lineTo(x + 28, boss.y + 8);
    ctx.quadraticCurveTo(x - 14, boss.y + boss.h / 2, x + 28, boss.y + boss.h - 8);
    ctx.lineTo(x + boss.w, boss.y + boss.h - 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#e0f2fe';
    roundedRect(ctx, cx - 10, boss.y + 24, 34, boss.h - 48, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(cx - 12, boss.y + boss.h / 2, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (boss.kind === 'jungle_kong' || boss.kind === 'yeti_king') {
    const isYeti = boss.kind === 'yeti_king';
    const bodyGrad = ctx.createLinearGradient(x, boss.y, x, boss.y + boss.h);
    bodyGrad.addColorStop(0, isYeti ? '#f8fafc' : '#78350f');
    bodyGrad.addColorStop(1, isYeti ? '#38bdf8' : '#451a03');
    ctx.fillStyle = bodyGrad;
    roundedRect(ctx, x + 12, boss.y + 18, boss.w - 24, boss.h - 24, 24);
    ctx.fill();
    ctx.stroke();

    // Chest plate
    ctx.fillStyle = isYeti ? '#bae6fd' : '#d97706';
    roundedRect(ctx, cx - 24, boss.y + 46, 48, 42, 14);
    ctx.fill();

    // Horns or Crown
    ctx.fillStyle = isYeti ? '#e0f2fe' : '#facc15';
    ctx.beginPath();
    ctx.moveTo(cx - 26, boss.y + 20);
    ctx.lineTo(cx - 38, boss.y - 8);
    ctx.lineTo(cx - 12, boss.y + 16);
    ctx.moveTo(cx + 26, boss.y + 20);
    ctx.lineTo(cx + 38, boss.y - 8);
    ctx.lineTo(cx + 12, boss.y + 16);
    ctx.fill();
    ctx.stroke();

    const look = boss.facingRight ? 8 : -8;
    ctx.fillStyle = isYeti ? '#0ea5e9' : '#facc15';
    ctx.beginPath();
    ctx.arc(cx - 13 + look, boss.y + 34, 6, 0, Math.PI * 2);
    ctx.arc(cx + 13 + look, boss.y + 34, 6, 0, Math.PI * 2);
    ctx.fill();
  } else if (
    boss.kind === 'storm_zeppelin' ||
    boss.kind === 'sky_baron' ||
    boss.kind === 'titan_mecha'
  ) {
    const isTitan = boss.kind === 'titan_mecha';
    const isBaron = boss.kind === 'sky_baron';
    const hullGrad = ctx.createLinearGradient(x, boss.y, x + boss.w, boss.y + boss.h);
    hullGrad.addColorStop(0, isTitan ? '#a855f7' : isBaron ? '#ef4444' : '#64748b');
    hullGrad.addColorStop(1, isTitan ? '#3b0764' : isBaron ? '#991b1b' : '#1e293b');
    ctx.fillStyle = hullGrad;
    ctx.beginPath();
    ctx.ellipse(cx, boss.y + boss.h * 0.45, boss.w * 0.48, boss.h * 0.36, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Reactor / Cockpit Window
    ctx.fillStyle = isTitan ? '#facc15' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(cx - 18, boss.y + boss.h * 0.45, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Gondola / Lower Cannons
    ctx.fillStyle = '#0f172a';
    roundedRect(ctx, cx - 26, boss.y + boss.h * 0.72, 52, 22, 8);
    ctx.fill();
    ctx.stroke();
  } else {
    const isGriffin = boss.kind === 'storm_griffin';
    const flap = Math.sin(tick * 0.22) * 20;
    ctx.fillStyle = isGriffin ? '#0284c7' : '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(cx, boss.y + 42);
    ctx.quadraticCurveTo(cx - 56, boss.y - 10 + flap, cx - 68, boss.y + 16 + flap);
    ctx.lineTo(cx - 38, boss.y + 58);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, boss.y + 42);
    ctx.quadraticCurveTo(cx + 56, boss.y - 10 + flap, cx + 68, boss.y + 16 + flap);
    ctx.lineTo(cx + 38, boss.y + 58);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    const bodyGrad = ctx.createLinearGradient(x, boss.y, x, boss.y + boss.h);
    bodyGrad.addColorStop(0, isGriffin ? '#fbbf24' : '#ef4444');
    bodyGrad.addColorStop(1, isGriffin ? '#b45309' : '#7f1d1d');
    ctx.fillStyle = bodyGrad;
    roundedRect(ctx, x + 16, boss.y + 20, boss.w - 32, boss.h - 28, 24);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isGriffin ? '#fef08a' : '#fbbf24';
    roundedRect(ctx, cx - 22, boss.y + 48, 44, 46, 14);
    ctx.fill();

    const look = boss.facingRight ? 8 : -8;
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(cx - 12 + look, boss.y + 38, 6.5, 0, Math.PI * 2);
    ctx.arc(cx + 12 + look, boss.y + 38, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx - 10 + look, boss.y + 38, 3, 0, Math.PI * 2);
    ctx.arc(cx + 14 + look, boss.y + 38, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawSuperKenneth(
  ctx: CanvasRenderingContext2D,
  engine: SuperKennethEngine,
  x: number
) {
  const { player, tick } = engine;
  const y = Math.floor(player.y);
  const w = player.w;
  const h = player.h;
  const hasGloves = engine.hasTool('power_gloves');
  const hasTurbo = engine.hasTool('turbo_boots');
  const hasSword = engine.hasTool('sun_sword');
  const hasHammer = engine.hasTool('thunder_hammer');
  const onVine = player.grabbedVineId !== null;
  const onLadder = player.onLadder;

  ctx.save();
  const centerX = x + w / 2;
  ctx.translate(centerX, y);
  if (onVine) {
    const vine = engine.level.vines.find((v) => v.id === player.grabbedVineId);
    if (vine) ctx.rotate(-vine.angle * 0.45);
  } else if (player.isSliding) {
    ctx.rotate(player.facingRight ? -0.24 : 0.24);
  }
  if (!player.facingRight) {
    ctx.scale(-1, 1);
  }

  const runWave =
    onLadder
      ? Math.sin(player.animTimer * 1.4) * 5
      : player.onGround && !player.isSliding && Math.abs(player.vx) > 0.3
      ? Math.sin(player.animTimer * 1.4) * 7
      : 0;

  // Flowing Hero Cape
  ctx.fillStyle = '#dc2626';
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-8, h * 0.42);
  ctx.quadraticCurveTo(
    -26 - Math.abs(player.vx) * 1.4,
    h * 0.58 + Math.sin(tick * 0.25) * 4,
    -19 - Math.abs(player.vx),
    h * 0.85
  );
  ctx.lineTo(-4, h * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Legs & Boots
  const bootColor = hasTurbo ? '#06b6d4' : '#78350f';
  ctx.fillStyle = '#1d4ed8';
  roundedRect(ctx, -12 + runWave * 0.5, h - 22, 10, 14, 5);
  ctx.fill();
  roundedRect(ctx, 2 - runWave * 0.5, h - 22, 10, 14, 5);
  ctx.fill();

  ctx.fillStyle = bootColor;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  roundedRect(ctx, -14 + runWave * 0.5, h - 11, 15, 11, 5);
  ctx.fill();
  ctx.stroke();
  roundedRect(ctx, 1 - runWave * 0.5, h - 11, 15, 11, 5);
  ctx.fill();
  ctx.stroke();

  // Torso
  ctx.fillStyle = '#ef4444';
  roundedRect(ctx, -15, h * 0.38, 30, h * 0.35, 9);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#2563eb';
  roundedRect(ctx, -13, h * 0.48, 26, h * 0.32, 8);
  ctx.fill();

  // Gold Buttons
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(-6, h * 0.55, 2.8, 0, Math.PI * 2);
  ctx.arc(6, h * 0.55, 2.8, 0, Math.PI * 2);
  ctx.fill();

  // Head
  const headY = player.isCrouching ? 4 : 6;
  ctx.fillStyle = '#fed7aa';
  ctx.strokeStyle = '#7c2d12';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, headY + 13, 14.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Eye
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.ellipse(6, headY + 12, 2.8, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(7, headY + 10.5, 1.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
  ctx.beginPath();
  ctx.arc(3, headY + 17, 3, 0, Math.PI * 2);
  ctx.fill();

  // Red Hero Cap + Gold "K"
  ctx.fillStyle = '#ef4444';
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, headY + 7, 15.5, Math.PI, 0);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#b91c1c';
  roundedRect(ctx, 2, headY + 4, 18, 5.5, 3);
  ctx.fill();
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(2, headY + 1, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#713f12';
  ctx.font = '700 8px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('K', 2, headY + 4);

  // Arms (raised when swinging on vine or climbing ladder!)
  if (onVine || onLadder) {
    ctx.fillStyle = hasGloves ? '#f97316' : '#fed7aa';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    roundedRect(ctx, -4, -4 + (onLadder ? runWave : 0), 10, 20, 5);
    ctx.fill();
    ctx.stroke();
  } else if (player.attackTimer > 0) {
    if (hasHammer) {
      ctx.save();
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#78350f';
      roundedRect(ctx, 12, h * 0.44, 34, 7, 3);
      ctx.fill();
      ctx.fillStyle = '#c084fc';
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2.5;
      roundedRect(ctx, 38, h * 0.25, 22, 32, 6);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    } else if (hasSword) {
      ctx.save();
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 16;
      ctx.fillStyle = '#fef08a';
      roundedRect(ctx, 14, h * 0.42, 48, 10, 5);
      ctx.fill();
      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(16, h * 0.46, 52, -0.7, 0.7);
      ctx.stroke();
      ctx.restore();
    } else {
      ctx.fillStyle = hasGloves ? '#f97316' : '#fed7aa';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      roundedRect(ctx, 8, h * 0.42, 24, 12, 6);
      ctx.fill();
      ctx.stroke();
    }
  } else {
    ctx.fillStyle = hasGloves ? '#f97316' : '#fed7aa';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      10 - runWave * 0.4,
      h * 0.56,
      hasGloves ? 7.5 : 5.5,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();
  }

  // Glowing Aegis Shield
  if (player.isShielding) {
    const pulse = 0.5 + 0.5 * Math.sin(tick * 0.25);
    ctx.strokeStyle = '#38bdf8';
    ctx.fillStyle = `rgba(56, 189, 248, ${0.24 + pulse * 0.12})`;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.ellipse(4, h * 0.5, 34, h * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}
