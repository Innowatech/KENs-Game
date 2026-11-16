import React from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Hand,
  Shield,
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
  const hasBoomerang = tools.includes('star_boomerang');
  const hasShield = tools.includes('aegis_shield');
  const isBoat = mode === 'topdown_boat';

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

  const dpadBtn =
    'w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-950/35 active:bg-sky-500/60 border border-white/25 backdrop-blur-[2px] text-white/95 flex items-center justify-center shadow-md cursor-pointer transition-colors';

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-20 pointer-events-none flex items-end justify-between px-3 sm:px-6 pb-3 sm:pb-5 select-none"
      style={{ touchAction: 'none' }}
    >
      {/* BOTTOM-LEFT: Semi-transparent D-Pad Cross (Up, Left, Center Hub, Right, Down/Crouch) */}
      <div className="pointer-events-auto grid grid-cols-3 gap-1.5 items-center justify-items-center">
        <div />
        <button
          type="button"
          aria-label={t.btnUp}
          className={dpadBtn}
          {...bindHold(
            () => {
              inputRef.current.up = true;
            },
            () => {
              inputRef.current.up = false;
            }
          )}
        >
          <ArrowUp className="w-6 h-6" />
        </button>
        <div />

        <button
          type="button"
          aria-label={t.btnLeft}
          className={dpadBtn}
          {...bindHold(
            () => {
              inputRef.current.left = true;
            },
            () => {
              inputRef.current.left = false;
            }
          )}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Center D-Pad Button (Shield if unlocked, otherwise quick Crouch/Hub) */}
        <button
          type="button"
          aria-label={hasShield ? t.btnShield : t.btnDown}
          className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-slate-950/30 active:bg-cyan-500/55 border border-white/20 backdrop-blur-[2px] text-white/80 flex items-center justify-center cursor-pointer"
          {...bindHold(
            () => {
              if (hasShield) {
                inputRef.current.shieldHeld = true;
              } else {
                inputRef.current.down = true;
              }
            },
            () => {
              inputRef.current.shieldHeld = false;
              inputRef.current.down = false;
            }
          )}
        >
          {hasShield ? (
            <Shield className="w-4 h-4 text-sky-300" />
          ) : (
            <span className="w-3 h-3 rounded-full bg-white/40" />
          )}
        </button>

        <button
          type="button"
          aria-label={t.btnRight}
          className={dpadBtn}
          {...bindHold(
            () => {
              inputRef.current.right = true;
            },
            () => {
              inputRef.current.right = false;
            }
          )}
        >
          <ArrowRight className="w-6 h-6" />
        </button>

        <div />
        <button
          type="button"
          aria-label={isBoat ? t.btnBoatDown : t.btnDown}
          className={dpadBtn}
          {...bindHold(
            () => {
              inputRef.current.down = true;
            },
            () => {
              inputRef.current.down = false;
            }
          )}
        >
          <ArrowDown className="w-6 h-6" />
        </button>
        <div />
      </div>

      {/* BOTTOM-RIGHT: Semi-transparent Round Action Buttons */}
      <div className="pointer-events-auto flex flex-col items-end gap-2">
        {/* Top Row: Optional Special Tool Buttons */}
        {(hasBoomerang || isBoat || hasShield) && (
          <div className="flex items-center gap-2 pr-1">
            {hasShield && (
              <button
                type="button"
                aria-label={t.btnShield}
                className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-sky-500/40 active:bg-sky-500/75 border-2 border-white/30 backdrop-blur-[2px] text-white flex flex-col items-center justify-center shadow-md cursor-pointer"
                {...bindHold(
                  () => {
                    inputRef.current.shieldHeld = true;
                  },
                  () => {
                    inputRef.current.shieldHeld = false;
                  }
                )}
              >
                <ShieldCheck className="w-5 h-5" />
                <span className="text-[8px] font-bold leading-none mt-0.5">
                  {t.btnShield}
                </span>
              </button>
            )}

            {(hasBoomerang || isBoat) && (
              <button
                type="button"
                aria-label={isBoat ? t.btnShot : t.btnBoomerang}
                className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-amber-500/45 active:bg-amber-500/80 border-2 border-white/30 backdrop-blur-[2px] text-white flex flex-col items-center justify-center shadow-md cursor-pointer"
                {...bindHold(
                  () => {
                    inputRef.current.toolJustPressed = true;
                  },
                  () => {}
                )}
              >
                <Sparkles className="w-5 h-5" />
                <span className="text-[8px] font-bold leading-none mt-0.5">
                  {isBoat ? t.btnShot : t.btnBoomerang}
                </span>
              </button>
            )}
          </div>
        )}

        {/* Bottom Row: Primary Jump + Punch/Sword */}
        <div className="flex items-end gap-2.5 sm:gap-3">
          <button
            type="button"
            aria-label={isBoat ? t.btnShot : hasSword ? t.btnSword : t.btnPunch}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-purple-600/45 active:bg-purple-500/80 border-2 border-white/35 backdrop-blur-[2px] text-white flex flex-col items-center justify-center shadow-lg cursor-pointer"
            {...bindHold(
              () => {
                inputRef.current.attackJustPressed = true;
              },
              () => {}
            )}
          >
            {hasSword ? (
              <Sword className="w-6 h-6" />
            ) : (
              <Hand className="w-6 h-6" />
            )}
            <span className="text-[9px] font-bold leading-none mt-0.5">
              {isBoat ? t.btnShot : hasSword ? t.btnSword : t.btnPunch}
            </span>
          </button>

          <button
            type="button"
            aria-label={isBoat ? t.btnBoost : t.btnJump}
            className="w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full bg-rose-600/50 active:bg-rose-500/85 border-2 border-white/40 backdrop-blur-[2px] text-white flex flex-col items-center justify-center shadow-lg cursor-pointer"
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
            <ArrowUp className="w-7 h-7" />
            <span className="text-[10px] font-bold leading-none mt-0.5">
              {isBoat ? t.btnBoost : t.btnJump}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
