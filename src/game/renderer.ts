import { SuperKennethEngine } from './engine';
import { GAME_H, GAME_W } from './levels';
import { Boss, Collectible, Enemy, Tile } from './types';

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

export function renderGame(
  ctx: CanvasRenderingContext2D,
  engine: SuperKennethEngine
) {
  const { level, player, cameraX, tick } = engine;
  const theme = level.theme;

  ctx.save();

  // Screen shake on big hits
  if (engine.screenShake > 0.5) {
    const sx = (Math.random() - 0.5) * engine.screenShake * 1.6;
    const sy = (Math.random() - 0.5) * engine.screenShake * 1.6;
    ctx.translate(sx, sy);
  }

  // 1. Sky / Cavern Backdrop Gradient
  const sky = ctx.createLinearGradient(0, 0, 0, GAME_H);
  sky.addColorStop(0, theme.skyTop);
  sky.addColorStop(0.55, theme.skyMid);
  sky.addColorStop(1, theme.skyBottom);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  // 2. Parallax Scenery
  if (!theme.isCavern) {
    drawEmeraldParallax(ctx, cameraX, tick);
  } else {
    drawCrystalCavernParallax(ctx, cameraX, tick);
  }

  // 3. Boss Arena Barrier Gate if active
  if (level.boss.active && !level.boss.defeated) {
    const gx = Math.floor(level.boss.arenaMinX - cameraX);
    if (gx >= -20 && gx <= GAME_W + 20) {
      const grad = ctx.createLinearGradient(gx - 6, 0, gx + 12, 0);
      grad.addColorStop(0, 'rgba(251, 191, 36, 0)');
      grad.addColorStop(0.5, 'rgba(251, 191, 36, 0.55)');
      grad.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(gx - 6, 0, 18, GAME_H - 96);
    }
  }

  // 4. Moving Platforms
  for (const plat of level.platforms) {
    const px = Math.floor(plat.x - cameraX);
    if (px + plat.w < -20 || px > GAME_W + 20) continue;
    const grad = ctx.createLinearGradient(px, plat.y, px, plat.y + plat.h);
    grad.addColorStop(0, theme.isCavern ? '#a855f7' : '#fbbf24');
    grad.addColorStop(1, theme.isCavern ? '#581c87' : '#b45309');
    ctx.fillStyle = grad;
    roundedRect(ctx, px, plat.y, plat.w, plat.h, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Glowing nodes
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(px + 14, plat.y + plat.h / 2, 4, 0, Math.PI * 2);
    ctx.arc(px + plat.w - 14, plat.y + plat.h / 2, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Level Tiles
  for (const tile of level.tiles) {
    const tx = Math.floor(tile.x - cameraX);
    if (tx + tile.w < -10 || tx > GAME_W + 10) continue;
    drawTile(ctx, tile, tx, Math.floor(tile.y + tile.bumpY), tick);
  }

  // 6. Checkpoints
  for (const cp of level.checkpoints) {
    const cx = Math.floor(cp.x - cameraX);
    if (cx < -60 || cx > GAME_W + 60) continue;
    // Pole
    ctx.fillStyle = '#e2e8f0';
    roundedRect(ctx, cx, cp.y, 8, 72, 4);
    ctx.fill();
    // Flag
    const wave = Math.sin(tick * 0.12) * 3;
    ctx.fillStyle = cp.activated ? '#10b981' : '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(cx + 8, cp.y + 4);
    ctx.lineTo(cx + 46, cp.y + 18 + wave);
    ctx.lineTo(cx + 8, cp.y + 34);
    ctx.closePath();
    ctx.fill();
    // Finial orb
    ctx.fillStyle = cp.activated ? '#fde047' : '#cbd5e1';
    ctx.beginPath();
    ctx.arc(cx + 4, cp.y, 7, 0, Math.PI * 2);
    ctx.fill();
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
    if (bx + level.boss.w > -60 && bx < GAME_W + 120) {
      drawBoss(ctx, level.boss, bx, tick);
    }
  }

  // 10. Projectiles
  for (const proj of engine.projectiles) {
    const px = Math.floor(proj.x - cameraX);
    if (px + proj.w < -40 || px > GAME_W + 40) continue;

    ctx.save();
    ctx.translate(px + proj.w / 2, proj.y + proj.h / 2);
    if (proj.kind === 'boomerang') {
      ctx.rotate(proj.rotation);
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#713f12';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let i = 0; i < 4; i++) {
        const a = (i * Math.PI) / 2;
        ctx.lineTo(Math.cos(a) * 16, Math.sin(a) * 16);
        ctx.lineTo(Math.cos(a + 0.45) * 6, Math.sin(a + 0.45) * 6);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (proj.kind === 'shockwave') {
      const alpha = proj.life / proj.maxLife;
      ctx.globalAlpha = alpha;
      const color = engine.hasTool('sun_sword') ? '#facc15' : '#fb923c';
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(0, 0, 14, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, 0, 7, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (proj.kind === 'fireball') {
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (proj.kind === 'stone_wave') {
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.moveTo(-14, 14);
      ctx.lineTo(0, -14);
      ctx.lineTo(14, 14);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    ctx.restore();
  }

  // 11. Super-Kenneth (Hero)
  const blinkSkip =
    player.invulnTimer > 0 && Math.floor(tick / 4) % 2 === 0;
  if (!blinkSkip) {
    drawSuperKenneth(ctx, engine, Math.floor(player.x - cameraX));
  }

  // 12. Particles
  for (const pt of engine.particles) {
    const px = Math.floor(pt.x - cameraX);
    if (px < -20 || px > GAME_W + 20) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    if (pt.glow) {
      ctx.shadowColor = pt.color;
      ctx.shadowBlur = 10;
    }
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(px, pt.y, pt.size * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 13. Floating Feedback Texts
  ctx.save();
  ctx.font = '700 18px Fredoka, Nunito, sans-serif';
  ctx.textAlign = 'center';
  for (const ft of engine.floatingTexts) {
    const fx = Math.floor(ft.x - cameraX + 20);
    ctx.globalAlpha = Math.min(1, (ft.life / ft.maxLife) * 1.4);
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.88)';
    ctx.strokeText(ft.text, fx, ft.y);
    ctx.fillStyle = ft.color;
    ctx.fillText(ft.text, fx, ft.y);
  }
  ctx.restore();

  ctx.restore();
}

function drawEmeraldParallax(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  tick: number
) {
  // Glowing Sun
  ctx.save();
  const sunGrad = ctx.createRadialGradient(1080, 110, 12, 1080, 110, 110);
  sunGrad.addColorStop(0, '#fef08a');
  sunGrad.addColorStop(0.45, 'rgba(253, 224, 71, 0.45)');
  sunGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(1080, 110, 110, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Soft Clouds
  ctx.fillStyle = 'rgba(255, 255, 255, 0.86)';
  for (let i = 0; i < 8; i++) {
    const cx = ((i * 320 - cameraX * 0.16 + tick * 0.18) % (GAME_W + 400)) - 140;
    const cy = 75 + (i % 3) * 48;
    ctx.beginPath();
    ctx.arc(cx, cy, 24, 0, Math.PI * 2);
    ctx.arc(cx + 26, cy - 10, 30, 0, Math.PI * 2);
    ctx.arc(cx + 56, cy, 24, 0, Math.PI * 2);
    ctx.fill();
  }

  // Far Mountains
  ctx.fillStyle = '#0ea5e9';
  ctx.globalAlpha = 0.35;
  for (let i = -1; i < 6; i++) {
    const mx = i * 380 - ((cameraX * 0.2) % 380);
    ctx.beginPath();
    ctx.moveTo(mx, GAME_H);
    ctx.lineTo(mx + 190, 290);
    ctx.lineTo(mx + 380, GAME_H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Rolling Emerald Hills & Ancient Ruin Arches
  for (let i = -1; i < 6; i++) {
    const hx = i * 340 - ((cameraX * 0.38) % 340);
    const hillGrad = ctx.createLinearGradient(0, 440, 0, GAME_H);
    hillGrad.addColorStop(0, '#10b981');
    hillGrad.addColorStop(1, '#065f46');
    ctx.fillStyle = hillGrad;
    ctx.beginPath();
    ctx.arc(hx + 170, GAME_H - 40, 210, Math.PI, 0);
    ctx.fill();

    // Distant Waterfall Ribbon on every 2nd hill
    if (i % 2 === 0) {
      ctx.fillStyle = 'rgba(186, 230, 253, 0.35)';
      ctx.fillRect(hx + 150, 490, 24, 180);
    }
  }
}

function drawCrystalCavernParallax(
  ctx: CanvasRenderingContext2D,
  cameraX: number,
  tick: number
) {
  // Glowing Cavern Stars / Spores
  for (let i = 0; i < 28; i++) {
    const sx = ((i * 197 - cameraX * 0.12) % GAME_W + GAME_W) % GAME_W;
    const sy = 50 + ((i * 83) % 380);
    const pulse = 0.4 + 0.6 * Math.abs(Math.sin(tick * 0.03 + i));
    ctx.fillStyle = i % 2 === 0 ? `rgba(192, 132, 252, ${pulse})` : `rgba(56, 189, 248, ${pulse})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 2.5 + (i % 3), 0, Math.PI * 2);
    ctx.fill();
  }

  // Far Crystal Spires
  for (let i = -1; i < 7; i++) {
    const cx = i * 280 - ((cameraX * 0.25) % 280);
    ctx.fillStyle = 'rgba(88, 28, 135, 0.55)';
    ctx.beginPath();
    ctx.moveTo(cx + 30, GAME_H);
    ctx.lineTo(cx + 85, 310);
    ctx.lineTo(cx + 140, GAME_H);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(168, 85, 247, 0.3)';
    ctx.beginPath();
    ctx.moveTo(cx + 85, 310);
    ctx.lineTo(cx + 140, GAME_H);
    ctx.lineTo(cx + 95, GAME_H);
    ctx.closePath();
    ctx.fill();
  }

  // Hanging Stalactites along ceiling
  ctx.fillStyle = '#1e1b4b';
  for (let i = -1; i < 12; i++) {
    const sx = i * 140 - ((cameraX * 0.4) % 140);
    const h = 55 + ((i * 29) % 45);
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx + 38, h);
    ctx.lineTo(sx + 76, 0);
    ctx.closePath();
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
    ctx.fillRect(x + 6, y + 20, 10, 8);
    ctx.fillRect(x + 28, y + 28, 12, 8);
    // Turf Top
    const turf = ctx.createLinearGradient(x, y, x, y + 16);
    turf.addColorStop(0, '#4ade80');
    turf.addColorStop(1, '#16a34a');
    ctx.fillStyle = turf;
    roundedRect(ctx, x, y, s, 16, 4);
    ctx.fill();
  } else if (tile.kind === 'dirt') {
    ctx.fillStyle = '#78350f';
    ctx.fillRect(x, y, s, s);
    ctx.fillStyle = '#92400e';
    ctx.fillRect(x + 8, y + 10, 12, 8);
    ctx.fillRect(x + 26, y + 28, 14, 9);
  } else if (tile.kind === 'crystal') {
    const grad = ctx.createLinearGradient(x, y, x, y + s);
    grad.addColorStop(0, '#4c1d95');
    grad.addColorStop(1, '#1e1b4b');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y, s, s);
    ctx.fillStyle = '#a855f7';
    roundedRect(ctx, x, y, s, 12, 3);
    ctx.fill();
    ctx.fillStyle = '#e879f9';
    ctx.fillRect(x + 6, y + 2, 16, 3);
  } else if (tile.kind === 'stone') {
    ctx.fillStyle = '#475569';
    roundedRect(ctx, x + 1, y + 1, s - 2, s - 2, 5);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#64748b';
    ctx.fillRect(x + 5, y + 5, s - 10, 6);
  } else if (tile.kind === 'brick') {
    ctx.fillStyle = '#b45309';
    roundedRect(ctx, x + 1, y + 1, s - 2, s - 2, 5);
    ctx.fill();
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + 2, y + s / 2);
    ctx.lineTo(x + s - 2, y + s / 2);
    ctx.moveTo(x + s / 2, y + 2);
    ctx.lineTo(x + s / 2, y + s / 2);
    ctx.stroke();
  } else if (tile.kind === 'cracked') {
    ctx.fillStyle = '#64748b';
    roundedRect(ctx, x + 1, y + 1, s - 2, s - 2, 6);
    ctx.fill();
    // Glowing orange cracks showing it can be smashed!
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
    roundedRect(ctx, x + 1, y + 1, s - 2, s - 2, 8);
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
    ctx.fillStyle = '#92400e';
    roundedRect(ctx, x, y + 4, s, 18, 4);
    ctx.fill();
    ctx.fillStyle = '#d97706';
    ctx.fillRect(x + 4, y + 6, s - 8, 5);
  } else if (tile.kind === 'lava') {
    const wave = Math.sin(tick * 0.1 + x * 0.05) * 4;
    const grad = ctx.createLinearGradient(x, y, x, y + s);
    grad.addColorStop(0, '#fb923c');
    grad.addColorStop(0.5, '#ef4444');
    grad.addColorStop(1, '#991b1b');
    ctx.fillStyle = grad;
    ctx.fillRect(x, y + 6 + wave, s, s);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(x + 8, y + 8 + wave, 14, 4);
  } else if (tile.kind === 'spring') {
    const squash = tile.springAnim ? Math.sin(tile.springAnim * 0.5) * 8 : 0;
    // Base
    ctx.fillStyle = '#334155';
    roundedRect(ctx, x + 6, y + s - 12, s - 12, 12, 4);
    ctx.fill();
    // Coil
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 16, y + s - 12);
    ctx.lineTo(x + 32, y + s - 22 + squash);
    ctx.lineTo(x + 16, y + s - 32 + squash);
    ctx.stroke();
    // Bounce Pad
    ctx.fillStyle = '#ef4444';
    roundedRect(ctx, x + 4, y + 10 + squash, s - 8, 14, 6);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.fillRect(x + 10, y + 12 + squash, s - 20, 4);
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
    const spinW = Math.max(6, Math.abs(Math.cos(tick * 0.09 + col.bobOffset)) * col.w);
    const cx = x + col.w / 2;
    const cy = y + col.h / 2;
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.ellipse(cx, cy, spinW / 2, col.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (spinW > 12) {
      ctx.fillStyle = '#fef9c3';
      ctx.fillRect(cx - 2, cy - 6, 4, 12);
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
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 2;
    ctx.stroke();
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
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(cx - 6, cy - 5, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (col.kind === 'chest') {
    // Zelda-inspired Golden Treasure Chest!
    const pulse = 0.5 + 0.5 * Math.sin(tick * 0.1);
    ctx.save();
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 12 + pulse * 10;
    ctx.fillStyle = '#92400e';
    roundedRect(ctx, x, col.y + 8, col.w, col.h - 8, 6);
    ctx.fill();
    ctx.fillStyle = '#b45309';
    roundedRect(ctx, x - 2, col.y, col.w + 4, 18, 6);
    ctx.fill();
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 2, col.y + 2, col.w - 4, col.h - 4);
    // Lock
    ctx.fillStyle = '#fde047';
    roundedRect(ctx, x + col.w / 2 - 6, col.y + 14, 12, 14, 3);
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
  if (e.hitFlash > 0) {
    ctx.filter = 'brightness(2)';
  }

  if (e.kind === 'shroom') {
    // Cap
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(x + e.w / 2, e.y + 20, 21, Math.PI, 0);
    ctx.fill();
    // Spots
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(x + 14, e.y + 11, 4, 0, Math.PI * 2);
    ctx.arc(x + 28, e.y + 13, 3.5, 0, Math.PI * 2);
    ctx.fill();
    // Body & angry brows
    ctx.fillStyle = '#fde68a';
    roundedRect(ctx, x + 8, e.y + 19, e.w - 16, 18, 6);
    ctx.fill();
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(x + 15, e.y + 26, 2.5, 0, Math.PI * 2);
    ctx.arc(x + 27, e.y + 26, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Feet
    const step = Math.sin(tick * 0.25) * 3;
    ctx.fillStyle = '#451a03';
    ctx.fillRect(x + 8, e.y + 35 + step, 10, 7);
    ctx.fillRect(x + 24, e.y + 35 - step, 10, 7);
  } else if (e.kind === 'beetle') {
    // Armored Shell
    ctx.fillStyle = '#059669';
    ctx.beginPath();
    ctx.arc(x + e.w / 2, e.y + 24, 22, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 3;
    ctx.stroke();
    // Eyes
    ctx.fillStyle = '#ffffff';
    const eyeX = e.vx < 0 ? x + 10 : x + e.w - 18;
    ctx.fillRect(eyeX, e.y + 16, 8, 7);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(eyeX + 2, e.y + 18, 4, 4);
    // Feet
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(x + 8, e.y + 26, 10, 9);
    ctx.fillRect(x + e.w - 18, e.y + 26, 10, 9);
  } else if (e.kind === 'bat') {
    const flap = Math.sin(tick * 0.35) * 9;
    // Wings
    ctx.fillStyle = '#7e22ce';
    ctx.beginPath();
    ctx.moveTo(x + e.w / 2, e.y + 16);
    ctx.lineTo(x - 6, e.y + 6 + flap);
    ctx.lineTo(x + 6, e.y + 24);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x + e.w / 2, e.y + 16);
    ctx.lineTo(x + e.w + 6, e.y + 6 + flap);
    ctx.lineTo(x + e.w - 6, e.y + 24);
    ctx.closePath();
    ctx.fill();
    // Body
    ctx.fillStyle = '#1e1b4b';
    ctx.beginPath();
    ctx.arc(x + e.w / 2, e.y + 17, 13, 0, Math.PI * 2);
    ctx.fill();
    // Glowing eyes
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(x + e.w / 2 - 5, e.y + 15, 2.5, 0, Math.PI * 2);
    ctx.arc(x + e.w / 2 + 5, e.y + 15, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (e.kind === 'slime') {
    const wobble = Math.sin(tick * 0.16) * 3;
    const grad = ctx.createLinearGradient(x, e.y, x, e.y + e.h);
    grad.addColorStop(0, '#fb923c');
    grad.addColorStop(1, '#dc2626');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x + e.w / 2, e.y + e.h - 4, 21 + wobble, Math.PI, 0);
    ctx.fill();
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
  if (boss.hitFlash > 0) {
    ctx.filter = 'brightness(2.2)';
  }
  if (boss.phaseState === 'TELEGRAPH' && Math.floor(tick / 4) % 2 === 0) {
    ctx.shadowColor = '#f97316';
    ctx.shadowBlur = 22;
  }

  const cx = x + boss.w / 2;

  if (boss.kind === 'beetle_king') {
    // Huge Armored Shell
    const shellGrad = ctx.createLinearGradient(x, boss.y, x, boss.y + boss.h);
    shellGrad.addColorStop(0, '#10b981');
    shellGrad.addColorStop(1, '#064e3b');
    ctx.fillStyle = shellGrad;
    ctx.beginPath();
    ctx.arc(cx, boss.y + boss.h - 16, boss.w * 0.48, Math.PI, 0);
    ctx.fill();
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Gold Crown on Top!
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

    // Fierce Eyes
    const faceOffset = boss.facingRight ? 18 : -18;
    ctx.fillStyle = '#fef08a';
    roundedRect(ctx, cx + faceOffset - 12, boss.y + 42, 24, 14, 5);
    ctx.fill();
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(cx + faceOffset - 4, boss.y + 49, 4, 0, Math.PI * 2);
    ctx.arc(cx + faceOffset + 6, boss.y + 49, 4, 0, Math.PI * 2);
    ctx.fill();

    // Heavy Feet
    const step = Math.sin(tick * 0.2) * 5;
    ctx.fillStyle = '#f59e0b';
    roundedRect(ctx, x + 14, boss.y + boss.h - 18 + step, 22, 18, 6);
    ctx.fill();
    roundedRect(ctx, x + boss.w - 36, boss.y + boss.h - 18 - step, 22, 18, 6);
    ctx.fill();
  } else {
    // Boss 2: Flammen-Drache Ignis
    const flap = Math.sin(tick * 0.22) * 18;
    // Wings
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.moveTo(cx, boss.y + 42);
    ctx.lineTo(cx - 64, boss.y + 8 + flap);
    ctx.lineTo(cx - 40, boss.y + 58);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx, boss.y + 42);
    ctx.lineTo(cx + 64, boss.y + 8 + flap);
    ctx.lineTo(cx + 40, boss.y + 58);
    ctx.closePath();
    ctx.fill();

    // Dragon Body
    const bodyGrad = ctx.createLinearGradient(x, boss.y, x, boss.y + boss.h);
    bodyGrad.addColorStop(0, '#ef4444');
    bodyGrad.addColorStop(1, '#7f1d1d');
    ctx.fillStyle = bodyGrad;
    roundedRect(ctx, x + 16, boss.y + 20, boss.w - 32, boss.h - 28, 22);
    ctx.fill();

    // Golden Belly Scales
    ctx.fillStyle = '#fbbf24';
    roundedRect(ctx, cx - 22, boss.y + 48, 44, 46, 12);
    ctx.fill();

    // Horns
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.moveTo(cx - 20, boss.y + 22);
    ctx.lineTo(cx - 30, boss.y - 6);
    ctx.lineTo(cx - 8, boss.y + 18);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx + 20, boss.y + 22);
    ctx.lineTo(cx + 30, boss.y - 6);
    ctx.lineTo(cx + 8, boss.y + 18);
    ctx.fill();

    // Glowing Dragon Eyes
    const look = boss.facingRight ? 8 : -8;
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(cx - 12 + look, boss.y + 38, 6, 0, Math.PI * 2);
    ctx.arc(cx + 12 + look, boss.y + 38, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx - 10 + look, boss.y + 38, 2.5, 0, Math.PI * 2);
    ctx.arc(cx + 14 + look, boss.y + 38, 2.5, 0, Math.PI * 2);
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
  // Flip cleanly around player horizontal center
  const centerX = x + w / 2;
  ctx.translate(centerX, y);
  if (!player.facingRight) {
    ctx.scale(-1, 1);
  }

  const runWave =
    player.onGround && Math.abs(player.vx) > 0.3
      ? Math.sin(player.animTimer * 1.4) * 7
      : 0;

  // Flowing Hero Cape
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.moveTo(-8, h * 0.42);
  ctx.quadraticCurveTo(
    -24 - Math.abs(player.vx) * 1.4,
    h * 0.58 + Math.sin(tick * 0.25) * 4,
    -18 - Math.abs(player.vx),
    h * 0.85
  );
  ctx.lineTo(-4, h * 0.72);
  ctx.closePath();
  ctx.fill();

  // Legs & Boots (Cyan Turbo Boots when unlocked!)
  const bootColor = hasTurbo ? '#06b6d4' : '#78350f';
  ctx.fillStyle = '#1d4ed8';
  roundedRect(ctx, -12 + runWave * 0.5, h - 22, 10, 14, 4);
  ctx.fill();
  roundedRect(ctx, 2 - runWave * 0.5, h - 22, 10, 14, 4);
  ctx.fill();

  ctx.fillStyle = bootColor;
  roundedRect(ctx, -14 + runWave * 0.5, h - 10, 14, 10, 4);
  ctx.fill();
  roundedRect(ctx, 1 - runWave * 0.5, h - 10, 14, 10, 4);
  ctx.fill();

  // Torso / Blue Hero Overalls over Red Tunic
  ctx.fillStyle = '#ef4444';
  roundedRect(ctx, -15, h * 0.38, 30, h * 0.35, 8);
  ctx.fill();
  ctx.fillStyle = '#2563eb';
  roundedRect(ctx, -13, h * 0.48, 26, h * 0.32, 7);
  ctx.fill();
  // Gold Overalls Buttons
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(-6, h * 0.55, 2.8, 0, Math.PI * 2);
  ctx.arc(6, h * 0.55, 2.8, 0, Math.PI * 2);
  ctx.fill();

  // Head
  const headY = player.isCrouching ? 4 : 6;
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.arc(0, headY + 13, 14, 0, Math.PI * 2);
  ctx.fill();

  // Hero Eye & Smile
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.ellipse(6, headY + 12, 2.6, 3.8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(7, headY + 10.5, 1.1, 0, Math.PI * 2);
  ctx.fill();

  // Rosy cheek
  ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
  ctx.beginPath();
  ctx.arc(3, headY + 17, 3, 0, Math.PI * 2);
  ctx.fill();

  // Red Hero Cap with Visor & Gold "K" Emblem
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(0, headY + 7, 15, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#b91c1c';
  roundedRect(ctx, 2, headY + 4, 17, 5, 2.5);
  ctx.fill();
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(2, headY + 1, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#713f12';
  ctx.font = '700 8px Fredoka, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('K', 2, headY + 4);

  // Punching / Sword Arm!
  if (player.attackTimer > 0) {
    const ext = 18;
    if (hasSword) {
      // Golden Light Sword Slash Arc!
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
      // Fist / Power Gloves Punch
      ctx.fillStyle = hasGloves ? '#f97316' : '#fed7aa';
      roundedRect(ctx, 8, h * 0.42, ext + 6, 12, 6);
      ctx.fill();
      if (hasGloves) {
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }
  } else {
    // Resting front arm
    ctx.fillStyle = hasGloves ? '#f97316' : '#fed7aa';
    ctx.beginPath();
    ctx.arc(10 - runWave * 0.4, h * 0.56, hasGloves ? 7 : 5.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}
