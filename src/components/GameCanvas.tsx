import React, { useEffect, useRef } from 'react';
import { soundEngine } from '../game/audio';
import { SuperKennethEngine } from '../game/engine';
import { GAME_H } from '../game/levels';
import { renderGame } from '../game/renderer';
import { InputState } from '../game/types';

interface GameCanvasProps {
  engineRef: React.MutableRefObject<SuperKennethEngine | null>;
  inputRef: React.MutableRefObject<InputState>;
  isActive: boolean;
  onTogglePause: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  engineRef,
  inputRef,
  isActive,
  onTogglePause,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const metricsRef = useRef({ dpr: 1, scale: 1 });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      soundEngine.unlock();

      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        onTogglePause();
        return;
      }

      if (!isActive) return;

      const code = e.code;
      if (code === 'ArrowLeft' || code === 'KeyA') {
        e.preventDefault();
        inputRef.current.left = true;
      } else if (code === 'ArrowRight' || code === 'KeyD') {
        e.preventDefault();
        inputRef.current.right = true;
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        e.preventDefault();
        inputRef.current.down = true;
      } else if (code === 'ArrowUp' || code === 'KeyW') {
        e.preventDefault();
        inputRef.current.up = true;
        if (!inputRef.current.jumpHeld) {
          inputRef.current.jumpJustPressed = true;
        }
        inputRef.current.jumpHeld = true;
      } else if (code === 'Space') {
        e.preventDefault();
        if (!inputRef.current.jumpHeld) {
          inputRef.current.jumpJustPressed = true;
        }
        inputRef.current.jumpHeld = true;
      } else if (
        code === 'KeyX' ||
        code === 'KeyJ' ||
        code === 'Enter' ||
        code === 'ShiftLeft' ||
        code === 'ShiftRight'
      ) {
        e.preventDefault();
        if (!e.repeat) {
          inputRef.current.attackJustPressed = true;
        }
      } else if (code === 'KeyE' || code === 'KeyK' || code === 'KeyF') {
        e.preventDefault();
        if (!e.repeat) {
          inputRef.current.toolJustPressed = true;
        }
      } else if (code === 'KeyC' || code === 'KeyQ') {
        e.preventDefault();
        inputRef.current.shieldHeld = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const code = e.code;
      if (code === 'ArrowLeft' || code === 'KeyA') {
        inputRef.current.left = false;
      } else if (code === 'ArrowRight' || code === 'KeyD') {
        inputRef.current.right = false;
      } else if (code === 'ArrowDown' || code === 'KeyS') {
        inputRef.current.down = false;
      } else if (code === 'ArrowUp' || code === 'KeyW') {
        inputRef.current.up = false;
        inputRef.current.jumpHeld = false;
      } else if (code === 'Space') {
        inputRef.current.jumpHeld = false;
      } else if (code === 'KeyC' || code === 'KeyQ') {
        inputRef.current.shieldHeld = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [inputRef, isActive, onTogglePause]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const scale = rect.height / GAME_H;
      const viewW = rect.width / scale;

      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      metricsRef.current = { dpr, scale };
      engineRef.current?.setViewWidth(viewW);
    };

    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(container);
    window.addEventListener('resize', updateSize);

    let rafId = 0;
    let lastTime = performance.now();
    let accumulator = 0;
    const STEP = 1000 / 60;

    const loop = (now: number) => {
      const dt = Math.min(now - lastTime, 50);
      lastTime = now;
      accumulator += dt;

      const engine = engineRef.current;
      if (engine) {
        while (accumulator >= STEP) {
          engine.update(inputRef.current);
          accumulator -= STEP;
        }
        const { dpr, scale } = metricsRef.current;
        ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);
        renderGame(ctx, engine);
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [engineRef, inputRef]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden">
      <canvas
        ref={canvasRef}
        tabIndex={0}
        onPointerDown={() => {
          soundEngine.unlock();
          canvasRef.current?.focus();
        }}
        className="w-full h-full block outline-none"
      />
    </div>
  );
};
