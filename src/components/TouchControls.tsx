import React, { useRef, useState } from 'react';
import {
  ArrowUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Flame,
  Hammer,
  Hand,
  Rocket,
  ShieldCheck,
  Sparkles,
  Sword,
} from 'lucide-react';
import { soundEngine } from '../game/audio';
import { Lang, TEXTS } from '../game/i18n';
import { GameMode, InputState, ToolId } from '../game/types';

interface TouchControlsProps {
  inputRef: React.MutableRefObject<InputState>;
  mode: GameMode;
  lang: Lang;
  tools: ToolId[];
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  inputRef,
  mode,
  lang,
  tools,
}) => {
  const t = TEXTS[lang];
  const hasSword = tools.includes('sun_sword');
  const hasHammer = tools.includes('thunder_hammer');
  const hasFire = tools.includes('fire_blaster');
  const hasBoomerang = tools.includes('star_boomerang');
  const hasRocket = tools.includes('rocket_pod');
  const hasShield = tools.includes('aegis_shield');
  const isVehicle = mode !== 'platformer';
  const isBalloon = mode === 'balloon_flight';
  const isJet = mode === 'jet_shooter';

  const padRef = useRef<HTMLDivElement | null>(null);
  const activePointerRef = useRef<number | null>(null);
  const [knob, setKnob] = useState({ x: 0, y: 0, active: false });

  const updateStickFromPointer = (clientX: number, clientY: number) => {
    const pad = padRef.current;
    if (!pad) return;
    const rect = pad.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const maxR = rect.width * 0.38;

    const rawDx = clientX - cx;
    const rawDy = clientY - cy;
    const dist = Math.hypot(rawDx, rawDy);
    const clampedDist = Math.min(dist, maxR);
    const angle = Math.atan2(rawDy, rawDx);

    const kx = dist > 0 ? Math.cos(angle) * clampedDist : 0;
    const ky = dist > 0 ? Math.sin(angle) * clampedDist : 0;
    setKnob({ x: kx, y: ky, active: true });

    const nx = maxR > 0 ? kx / maxR : 0;
    const ny = maxR > 0 ? ky / maxR : 0;

    // 8-way diagonal steering: down + left/right triggers crouch-crawling simultaneously!
    inputRef.current.left = nx < -0.25;
    inputRef.current.right = nx > 0.25;
    inputRef.current.down = ny > 0.28;
    inputRef.current.up = ny < -0.32;
  };

  const resetStick = () => {
    activePointerRef.current = null;
    setKnob({ x: 0, y: 0, active: false });
    inputRef.current.left = false;
    inputRef.current.right = false;
    inputRef.current.down = false;
    inputRef.current.up = false;
  };

  const bindHold = (
    onStart: () => void,
    onEnd: () => void
  ): React.HTMLAttributes<HTMLButtonElement> => ({
    onPointerDown: (e) => {
      e.preventDefault();
      soundEngine.unlock();
      try {
        (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
      } catch {
        // Ignore capture issues
      }
      onStart();
    },
    onPointerUp: (e) => {
      e.preventDefault();
      onEnd();
    },
    onPointerCancel: () => onEnd(),
    onLostPointerCapture: () => onEnd(),
  });

  const ghostBtnBase =
    'rounded-full bg-white/[0.05] active:bg-white/25 border border-white/25 active:border-white/60 text-white/85 flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-sm';

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-20 pointer-events-none flex items-end justify-between px-3 sm:px-5 pb-3 sm:pb-4 select-none"
      style={{ touchAction: 'none' }}
    >
      {/* BOTTOM-LEFT: Compact Circular Analog-Style Joystick (supports diagonal crawl!) */}
      <div
        ref={padRef}
        role="application"
        aria-label="Steuerkreis"
        onPointerDown={(e) => {
          e.preventDefault();
          soundEngine.unlock();
          activePointerRef.current = e.pointerId;
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            // Ignore capture errors
          }
          updateStickFromPointer(e.clientX, e.clientY);
        }}
        onPointerMove={(e) => {
          if (activePointerRef.current !== e.pointerId) return;
          e.preventDefault();
          updateStickFromPointer(e.clientX, e.clientY);
        }}
        onPointerUp={(e) => {
          if (activePointerRef.current !== e.pointerId) return;
          e.preventDefault();
          resetStick();
        }}
        onPointerCancel={resetStick}
        onLostPointerCapture={resetStick}
        className="pointer-events-auto relative w-[104px] h-[104px] sm:w-[114px] sm:h-[114px] rounded-full bg-white/[0.04] border border-white/22 flex items-center justify-center cursor-pointer"
        style={{ touchAction: 'none' }}
      >
        {/* Subtle cardinal direction ticks */}
        <ChevronUp className="absolute top-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 text-white/35 pointer-events-none" />
        <ChevronDown className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 text-white/35 pointer-events-none" />
        <ChevronLeft className="absolute left-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/35 pointer-events-none" />
        <ChevronRight className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/35 pointer-events-none" />

        {/* Movable inner thumb knob */}
        <div
          className={`w-10 h-10 rounded-full border pointer-events-none transition-colors ${
            knob.active
              ? 'bg-white/28 border-white/60'
              : 'bg-white/12 border-white/35'
          }`}
          style={{
            transform: `translate(${knob.x}px, ${knob.y}px)`,
          }}
        />
      </div>

      {/* BOTTOM-RIGHT: Compact Ultra-Transparent Ghost Action Buttons */}
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        {(hasBoomerang || hasRocket || isVehicle || hasShield) && (
          <div className="flex items-center gap-2 pr-0.5">
            {hasShield && (
              <button
                type="button"
                aria-label={t.btnShield}
                className={`w-10 h-10 sm:w-11 sm:h-11 ${ghostBtnBase}`}
                {...bindHold(
                  () => {
                    inputRef.current.shieldHeld = true;
                  },
                  () => {
                    inputRef.current.shieldHeld = false;
                  }
                )}
              >
                <ShieldCheck className="w-4 h-4 drop-shadow" />
              </button>
            )}

            {(hasBoomerang || hasRocket || isVehicle) && (
              <button
                type="button"
                aria-label={
                  hasRocket || isJet
                    ? t.btnRocket
                    : isVehicle
                    ? t.btnShot
                    : t.btnBoomerang
                }
                className={`w-10 h-10 sm:w-11 sm:h-11 ${ghostBtnBase}`}
                {...bindHold(
                  () => {
                    inputRef.current.toolJustPressed = true;
                  },
                  () => {}
                )}
              >
                {hasRocket || isJet ? (
                  <Rocket className="w-4 h-4 drop-shadow" />
                ) : (
                  <Sparkles className="w-4 h-4 drop-shadow" />
                )}
              </button>
            )}
          </div>
        )}

        <div className="flex items-end gap-2.5">
          <button
            type="button"
            aria-label={isVehicle ? t.btnShot : hasSword ? t.btnSword : t.btnPunch}
            className={`w-11 h-11 sm:w-12 sm:h-12 ${ghostBtnBase}`}
            {...bindHold(
              () => {
                inputRef.current.attackJustPressed = true;
              },
              () => {}
            )}
          >
            {isVehicle || hasFire ? (
              <Flame className="w-5 h-5 drop-shadow" />
            ) : hasHammer ? (
              <Hammer className="w-5 h-5 drop-shadow" />
            ) : hasSword ? (
              <Sword className="w-5 h-5 drop-shadow" />
            ) : (
              <Hand className="w-5 h-5 drop-shadow" />
            )}
          </button>

          <button
            type="button"
            aria-label={
              isBalloon ? t.btnBurner : isVehicle ? t.btnBoost : t.btnJump
            }
            className={`w-12 h-12 sm:w-14 sm:h-14 ${ghostBtnBase}`}
            {...bindHold(
              () => {
                if (!inputRef.current.jumpHeld) {
                  inputRef.current.jumpJustPressed = true;
                }
                inputRef.current.jumpHeld = true;
              },
              () => {
                inputRef.current.jumpHeld = false;
              }
            )}
          >
            {isBalloon ? (
              <Flame className="w-6 h-6 drop-shadow" />
            ) : (
              <ArrowUp className="w-6 h-6 drop-shadow" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
