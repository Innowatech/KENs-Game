import React, { useEffect, useRef } from 'react';
import { SuperKennethEngine } from '../game/engine';
import { GAME_H, GAME_W } from '../game/levels';
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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
      } else if (
        code === 'Space' ||
        code === 'ArrowUp' ||
        code === 'KeyW'
      ) {
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
      } else if (
        code === 'Space' ||
        code === 'ArrowUp' ||
        code === 'KeyW'
      ) {
        inputRef.current.jumpHeld = false;
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = GAME_W * dpr;
    canvas.height = GAME_H * dpr;

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
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        renderGame(ctx, engine);
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [engineRef, inputRef]);

  return (
    <canvas
      ref={canvasRef}
      tabIndex={0}
      onPointerDown={() => canvasRef.current?.focus()}
      className="w-full h-full max-w-full max-h-full aspect-video object-contain outline-none block"
    />
  );
};
