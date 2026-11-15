import { SuperKennethEngine } from './engine';
import { GAME_H, GAME_W } from './levels';
import { BoatObstacle, Boss, Collectible, Enemy, Tile } from './types';

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
  const { level, player, cameraX, tick } = engine;
  const theme = level.theme;

  ctx.save();

  if (engine.screenShake > 0.5) {
    const sx = (Math.random() - 0.5) * engine.screenShake * 1.6;
    const sy = (Math.random() - 0.5) * engine.screenShake * 1.6;
    ctx.translate(sx, sy);
  }

  if (theme.mode === 'topdown_boat') {
    renderTopDownRiverWorld(ctx, engine);
  } else {
    renderPlatformerWorld(ctx, engine);
  }

  // Particles (both modes)
  for (const pt of engine.particles) {
    const px = Math.floor(pt.x - cameraX);
    if (px < -24 || px > GAME_W + 24) continue;
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
  const { level, player, cameraX, tick } = engine;

  // Water Base Gradient
  const waterGrad = ctx.createLinearGradient(0, 80, 0, GAME_H - 80);
  waterGrad.addColorStop(0, '#0284c7');
  waterGrad.addColorStop(0.5, '#0ea5e9');
  waterGrad.addColorStop(1, '#0284c7');
  ctx.fillStyle = waterGrad;
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  // Animated Flowing Water Currents
  ctx.strokeStyle = 'rgba(224, 242, 254, 0.28)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let row = 0; row < 9; row++) {
    const y = 125 + row * 58;
    for (let i = -1; i < 6; i++) {
      const wx = ((i * 280 - (cameraX * 0.9 + tick * 2.5)) % (GAME_W + 300)) - 100;
      const adjustedX = wx < -140 ? wx + GAME_W + 300 : wx;
      ctx.beginPath();
      ctx.moveTo(adjustedX, y);
      ctx.quadraticCurveTo(adjustedX + 45, y - 6, adjustedX + 90, y);
      ctx.stroke();
    }
  }

  // Canyon / Pine Riverbanks (Top & Bottom)
  drawRiverBanks(ctx, cameraX, tick);

  // River Checkpoints (Floating Buoy Gates)
  for (const cp of level.checkpoints) {
    const cx = Math.floor(cp.x - cameraX);
    if (cx < -60 || cx > GAME_W + 60) continue;
    ctx.save();
    ctx.strokeStyle = cp.activated ? 'rgba(52, 211, 153, 0.7)' : 'rgba(251, 191, 36, 0.5)';
    ctx.setLineDash([10, 8]);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx + 12, 100);
    ctx.lineTo(cx + 12, GAME_H - 100);
    ctx.stroke();
    ctx.setLineDash([]);

    // Top & Bottom Buoys
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

  // Collectibles (Coins, Gems, Hearts, Super Stars, Chest)
  for (const col of level.collectibles) {
    if (col.collected) continue;
    const cx = Math.floor(col.x - cameraX);
    if (cx + col.w < -20 || cx > GAME_W + 20) continue;
    drawCollectible(ctx, col, cx, tick);
  }

  // Boat Obstacles (Rocks, Icebergs, Whirlpools, Mines, Crates)
  for (const obs of level.boatObstacles) {
    if (!obs.alive) continue;
    const ox = Math.floor(obs.x - cameraX);
    if (ox + obs.w < -40 || ox > GAME_W + 40) continue;
    drawBoatObstacle(ctx, obs, ox, tick);
  }

  // Boss 3: Eis-Kreuzer Leviathan
  if (!level.boss.defeated) {
    const bx = Math.floor(level.boss.x - cameraX);
    if (bx + level.boss.w > -80 && bx < GAME_W + 140) {
      drawBoss(ctx, level.boss, bx, tick);
    }
  }

  // Projectiles
  drawProjectiles(ctx, engine);

  // Super-Kenneth's Speedboat!
  const blinkSkip = player.invulnTimer > 0 && Math.floor(tick / 4) % 2 === 0;
  if (!blinkSkip) {
    drawKennethBoat(ctx, engine, Math.floor(player.x - cameraX));
  }
}

function drawRiverBanks(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  tick: number
) {
  // Foam shoreline along top & bottom banks
  ctx.fillStyle = 'rgba(224, 242, 254, 0.45)';
  ctx.fillRect(0, 82, GAME_W, 14);
  ctx.fillRect(0, GAME_H - 96, GAME_W, 14);

  // Grassy & Rocky Canyon Cliffs Top & Bottom
  const topGrad = ctx.createLinearGradient(0, 0, 0, 88);
  topGrad.addColorStop(0, '#065f46');
  topGrad.addColorStop(0.7, '#10b981');
  topGrad.addColorStop(1, '#78350f');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, GAME_W, 86);

  const botGrad = ctx.createLinearGradient(0, GAME_H - 88, 0, GAME_H);
  botGrad.addColorStop(0, '#78350f');
  botGrad.addColorStop(0.3, '#10b981');
  botGrad.addColorStop(1, '#065f46');
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, GAME_H - 86, GAME_W, 86);

  // Scalloped cartoon trees & rocks along riverbanks
  for (let i = -1; i < 12; i++) {
    const tx = i * 140 - ((cameraX * 1.0) % 140);
    // Top pine tree
    ctx.fillStyle = '#047857';
    ctx.beginPath();
    ctx.arc(tx + 40, 38, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc(tx + 34, 30, 14, 0, Math.PI * 2);
    ctx.fill();

    // Bottom pine tree & shoreline boulder
    ctx.fillStyle = '#047857';
    ctx.beginPath();
    ctx.arc(tx + 95, GAME_H - 36, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(tx + 30, GAME_H - 70 + Math.sin(tick * 0.04 + i) * 0.5, 16, 0, Math.PI * 2);
    ctx.fill();
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
    // Cross plank
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

  // Speedboat Hull
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

  // Golden Racing Stripe & Cockpit
  ctx.fillStyle = '#facc15';
  roundedRect(ctx, -w / 2 + 6, -5, w - 18, 10, 4);
  ctx.fill();

  // Glass Windshield
  ctx.fillStyle = '#bae6fd';
  ctx.beginPath();
  ctx.arc(6, 0, 12, -Math.PI * 0.45, Math.PI * 0.45);
  ctx.fill();

  // Super-Kenneth Head + Red "K" Cap inside Boat!
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

  // Glowing Aegis Shield Dome if holding Shield!
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

function renderPlatformerWorld(
  ctx: CanvasRenderingContext2D,
  engine: SuperKennethEngine
) {
  const { level, player, cameraX, tick } = engine;
  const theme = level.theme;

  // 1. Sky / Cavern Backdrop Gradient
  const sky = ctx.createLinearGradient(0, 0, 0, GAME_H);
  sky.addColorStop(0, theme.skyTop);
  sky.addColorStop(0.55, theme.skyMid);
  sky.addColorStop(1, theme.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  // 2. Parallax Landscape
  if (theme.backdropStyle === 'meadow') {
    drawMeadowParallax(ctx, cameraX, tick);
  } else if (theme.backdropStyle === 'cavern') {
    drawCavernParallax(ctx, cameraX, tick);
  } else {
    drawSkyArchipelagoParallax(ctx, cameraX, tick);
  }

  // 3. Boss Arena Barrier Gate
  if (level.boss.active && !level.boss.defeated) {
    const gx = Math.floor(level.boss.arenaMinX - cameraX);
    if (gx >= -20 && gx <= GAME_W + 20) {
      const grad = ctx.createLinearGradient(gx - 8, 0, gx + 14, 0);
      grad.addColorStop(0, 'rgba(251, 191, 36, 0)');
      grad.addColorStop(0.5, 'rgba(251, 191, 36, 0.58)');
      grad.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(gx - 8, 0, 22, GAME_H - 96);
    }
  }

  // 4. Moving Platforms
  for (const plat of level.platforms) {
    const px = Math.floor(plat.x - cameraX);
    if (px + plat.w < -20 || px > GAME_W + 20) continue;
    const grad = ctx.createLinearGradient(px, plat.y, px, plat.y + plat.h);
    grad.addColorStop(0, theme.backdropStyle === 'cavern' ? '#c084fc' : '#fbbf24');
    grad.addColorStop(1, theme.backdropStyle === 'cavern' ? '#6b21a8' : '#b45309');
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

  // 5. Level Tiles (Smooth Cartoon Terrain)
  for (const tile of level.tiles) {
    const tx = Math.floor(tile.x - cameraX);
    if (tx + tile.w < -10 || tx > GAME_W + 10) continue;
    drawTile(ctx, tile, tx, Math.floor(tile.y + tile.bumpY), tick);
  }

  // 6. Checkpoints
  for (const cp of level.checkpoints) {
    const cx = Math.floor(cp.x - cameraX);
    if (cx < -60 || cx > GAME_W + 60) continue;
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

  // 7. Collectibles & Chests
  for (const col of level.collectibles) {
    if (col.collected) continue;
    const cx = Math.floor(col.x - cameraX);
    if (cx + col.w < -20 || cx > GAME_W + 20) continue;
    drawCollectible(ctx, col, cx, tick);
  }

  // 8. Enemies
  for (const e of level.enemies) {
    if (!e.alive && e.squashTimer <= 0) continue;
    const ex = Math.floor(e.x - cameraX);
    if (ex + e.w < -40 || ex > GAME_W + 40) continue;
    drawEnemy(ctx, e, ex, tick);
  }

  // 9. Boss
  if (!level.boss.defeated) {
    const bx = Math.floor(level.boss.x - cameraX);
    if (bx + level.boss.w > -80 && bx < GAME_W + 140) {
      drawBoss(ctx, level.boss, bx, tick);
    }
  }

  // 10. Projectiles
  drawProjectiles(ctx, engine);

  // 11. Super-Kenneth
  const blinkSkip = player.invulnTimer > 0 && Math.floor(tick / 4) % 2 === 0;
  if (!blinkSkip) {
    drawSuperKenneth(ctx, engine, Math.floor(player.x - cameraX));
  }
}

function drawProjectiles(
  ctx: CanvasRenderingContext2D,
  engine: SuperKennethEngine
) {
  for (const proj of engine.projectiles) {
    const px = Math.floor(proj.x - engine.cameraX);
    if (px + proj.w < -40 || px > GAME_W + 40) continue;

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
    }
    ctx.restore();
  }
}

function drawMeadowParallax(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  tick: number
) {
  // Glowing Sun
  const sunGrad = ctx.createRadialGradient(1080, 110, 14, 1080, 110, 130);
  sunGrad.addColorStop(0, '#fef08a');
  sunGrad.addColorStop(0.45, 'rgba(253, 224, 71, 0.42)');
  sunGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(1080, 110, 130, 0, Math.PI * 2);
  ctx.fill();

  // Volumetric Cartoon Clouds
  for (let i = 0; i < 8; i++) {
    const cx = ((i * 320 - cameraX * 0.14 + tick * 0.16) % (GAME_W + 400)) - 140;
    const cy = 78 + (i % 3) * 46;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.arc(cx + 28, cy - 12, 34, 0, Math.PI * 2);
    ctx.arc(cx + 60, cy, 26, 0, Math.PI * 2);
    ctx.fill();
  }

  // Snow-capped Cartoon Mountains
  for (let i = -1; i < 6; i++) {
    const mx = i * 380 - ((cameraX * 0.2) % 380);
    ctx.fillStyle = 'rgba(14, 116, 144, 0.42)';
    ctx.beginPath();
    ctx.moveTo(mx, GAME_H);
    ctx.quadraticCurveTo(mx + 130, 310, mx + 190, 265);
    ctx.quadraticCurveTo(mx + 250, 310, mx + 380, GAME_H);
    ctx.closePath();
    ctx.fill();
    // Snow Peak
    ctx.fillStyle = 'rgba(248, 250, 252, 0.55)';
    ctx.beginPath();
    ctx.moveTo(mx + 150, 322);
    ctx.lineTo(mx + 190, 265);
    ctx.lineTo(mx + 230, 322);
    ctx.quadraticCurveTo(mx + 190, 305, mx + 150, 322);
    ctx.fill();
  }

  // Rolling Emerald Hills, Waterfalls & Cartoon Pine Trees
  for (let i = -1; i < 6; i++) {
    const hx = i * 340 - ((cameraX * 0.36) % 340);
    const hillGrad = ctx.createLinearGradient(0, 420, 0, GAME_H);
    hillGrad.addColorStop(0, '#34d399');
    hillGrad.addColorStop(1, '#047857');
    ctx.fillStyle = hillGrad;
    ctx.beginPath();
    ctx.arc(hx + 170, GAME_H - 35, 215, Math.PI, 0);
    ctx.fill();

    // Soft distant pine silhouettes
    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    ctx.arc(hx + 80, 485, 22, 0, Math.PI * 2);
    ctx.arc(hx + 106, 495, 18, 0, Math.PI * 2);
    ctx.fill();

    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(186, 230, 253, 0.42)';
      roundedRect(ctx, hx + 155, 480, 26, 200, 8);
      ctx.fill();
    }
  }
}

function drawCavernParallax(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  tick: number
) {
  for (let i = 0; i < 30; i++) {
    const sx = ((i * 197 - cameraX * 0.12) % GAME_W + GAME_W) % GAME_W;
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

  for (let i = -1; i < 7; i++) {
    const cx = i * 280 - ((cameraX * 0.25) % 280);
    ctx.fillStyle = 'rgba(88, 28, 135, 0.6)';
    ctx.beginPath();
    ctx.moveTo(cx + 30, GAME_H);
    ctx.lineTo(cx + 85, 295);
    ctx.lineTo(cx + 140, GAME_H);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(192, 132, 252, 0.35)';
    ctx.beginPath();
    ctx.moveTo(cx + 85, 295);
    ctx.lineTo(cx + 140, GAME_H);
    ctx.lineTo(cx + 95, GAME_H);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = '#1e1b4b';
  for (let i = -1; i < 12; i++) {
    const sx = i * 140 - ((cameraX * 0.4) % 140);
    const h = 55 + ((i * 29) % 45);
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.quadraticCurveTo(sx + 38, h + 12, sx + 76, 0);
    ctx.closePath();
    ctx.fill();
  }
}

function drawSkyArchipelagoParallax(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  tick: number
) {
  // Golden Sun & Halo
  const sunGrad = ctx.createRadialGradient(240, 120, 18, 240, 120, 150);
  sunGrad.addColorStop(0, '#fef9c3');
  sunGrad.addColorStop(0.5, 'rgba(253, 224, 71, 0.38)');
  sunGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(240, 120, 150, 0, Math.PI * 2);
  ctx.fill();

  // Floating Distant Sky Islands
  for (let i = -1; i < 6; i++) {
    const ix = i * 360 - ((cameraX * 0.22) % 360);
    const iy = 340 + (i % 2) * 55 + Math.sin(tick * 0.02 + i) * 6;
    ctx.fillStyle = 'rgba(186, 230, 253, 0.48)';
    ctx.beginPath();
    ctx.moveTo(ix, iy);
    ctx.lineTo(ix + 140, iy);
    ctx.quadraticCurveTo(ix + 70, iy + 70, ix, iy);
    ctx.fill();
    ctx.fillStyle = 'rgba(52, 211, 153, 0.45)';
    roundedRect(ctx, ix - 4, iy - 10, 148, 16, 8);
    ctx.fill();
  }

  // Fluffy Clouds
  for (let i = 0; i < 9; i++) {
    const cx = ((i * 290 - cameraX * 0.16 + tick * 0.2) % (GAME_W + 400)) - 140;
    const cy = 90 + (i % 3) * 70;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.86)';
    ctx.beginPath();
    ctx.arc(cx, cy, 28, 0, Math.PI * 2);
    ctx.arc(cx + 30, cy - 12, 36, 0, Math.PI * 2);
    ctx.arc(cx + 62, cy, 28, 0, Math.PI * 2);
    ctx.fill();
  }
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
    const spinW = Math.max(7, Math.abs(Math.cos(tick * 0.09 + col.bobOffset)) * col.w);
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
    ctx.quadraticCurveTo(x + e.w + 4, e.y + 2 + flap, x + e.w + 8, e.y + 12 + flap);
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
  } else if (e.kind === 'slime') {
    const wobble = Math.sin(tick * 0.16) * 3;
    const grad = ctx.createLinearGradient(x, e.y, x, e.y + e.h);
    grad.addColorStop(0, '#fb923c');
    grad.addColorStop(1, '#dc2626');
    ctx.fillStyle = grad;
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(x + e.w / 2, e.y + e.h - 4, 21 + wobble, Math.PI, 0);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(x + 15, e.y + 20, 3.5, 0, Math.PI * 2);
    ctx.arc(x + 29, e.y + 20, 3.5, 0, Math.PI * 2);
    ctx.fill();
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

  if (boss.kind === 'beetle_king') {
    const shellGrad = ctx.createLinearGradient(x, boss.y, x, boss.y + boss.h);
    shellGrad.addColorStop(0, '#10b981');
    shellGrad.addColorStop(1, '#064e3b');
    ctx.fillStyle = shellGrad;
    ctx.beginPath();
    ctx.arc(cx, boss.y + boss.h - 16, boss.w * 0.48, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

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
    ctx.fillStyle = '#fef08a';
    roundedRect(ctx, cx + faceOffset - 13, boss.y + 42, 26, 15, 6);
    ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(cx + faceOffset - 4, boss.y + 49, 4, 0, Math.PI * 2);
    ctx.arc(cx + faceOffset + 6, boss.y + 49, 4, 0, Math.PI * 2);
    ctx.fill();

    const step = Math.sin(tick * 0.2) * 5;
    ctx.fillStyle = '#f59e0b';
    roundedRect(ctx, x + 14, boss.y + boss.h - 18 + step, 22, 18, 7);
    ctx.fill();
    roundedRect(ctx, x + boss.w - 36, boss.y + boss.h - 18 - step, 22, 18, 7);
    ctx.fill();
  } else if (boss.kind === 'ice_leviathan') {
    // Top-Down Armored Ice Dreadnought Boss
    const hullGrad = ctx.createLinearGradient(x, boss.y, x + boss.w, boss.y + boss.h);
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

    // Ice Spikes & Glowing Cannon Core
    ctx.fillStyle = '#e0f2fe';
    roundedRect(ctx, cx - 10, boss.y + 24, 34, boss.h - 48, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(cx - 12, boss.y + boss.h / 2, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else {
    // Lava Dragon Ignis OR Storm Griffin Zephyr
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

  ctx.save();
  const centerX = x + w / 2;
  ctx.translate(centerX, y);
  if (!player.facingRight) {
    ctx.scale(-1, 1);
  }

  const runWave =
    player.onGround && Math.abs(player.vx) > 0.3
      ? Math.sin(player.animTimer * 1.4) * 7
      : 0;

  // Flowing Hero Cape with soft cartoon outline
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

  // Expressive Eye
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

  // Punch / Sun Blade Arm
  if (player.attackTimer > 0) {
    if (hasSword) {
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
    ctx.arc(10 - runWave * 0.4, h * 0.56, hasGloves ? 7.5 : 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  // Glowing Aegis Shield Barrier when Shielding!
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
