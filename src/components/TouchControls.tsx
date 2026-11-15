import React from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Hand,
  ShieldCheck,
  Sparkles,
  Sword,
} from 'lucide-react';
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
      (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
      onStart();
    },
    onPointerUp: (e) => {
      e.preventDefault();
      onEnd();
    },
    onPointerCancel: () => onEnd(),
    onLostPointerCapture: () => onEnd(),
  });

  return (
    <div
      className="w-full bg-slate-900/95 border-t border-slate-700/80 px-2.5 sm:px-5 py-2.5 flex items-center justify-between gap-2 shrink-0 select-none z-20"
      style={{ touchAction: 'none' }}
    >
      {/* LEFT SIDE: Move + Jump (and 4-way steering in Boat Mode) */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        <button
          type="button"
          aria-label={t.btnLeft}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-sky-600 active:bg-sky-500 border-2 border-sky-400 text-white flex items-center justify-center shadow-md active:translate-y-0.5 cursor-pointer"
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

        <button
          type="button"
          aria-label={t.btnRight}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-sky-600 active:bg-sky-500 border-2 border-sky-400 text-white flex items-center justify-center shadow-md active:translate-y-0.5 cursor-pointer"
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

        <button
          type="button"
          aria-label={isBoat ? t.btnBoatDown : t.btnDown}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-amber-600 active:bg-amber-500 border-2 border-amber-400 text-white flex flex-col items-center justify-center shadow-md active:translate-y-0.5 cursor-pointer"
          {...bindHold(
            () => {
              inputRef.current.down = true;
            },
            () => {
              inputRef.current.down = false;
            }
          )}
        >
          <ArrowDown className="w-5 h-5" />
          <span className="text-[9px] font-bold leading-none mt-0.5">
            {isBoat ? t.btnBoatDown : t.btnDown}
          </span>
        </button>

        <button
          type="button"
          aria-label={isBoat ? t.btnUp : t.btnJump}
          className="px-3.5 sm:px-5 h-12 sm:h-14 rounded-xl bg-rose-600 active:bg-rose-500 border-2 border-rose-400 text-white font-bold text-xs sm:text-sm flex items-center gap-1 shadow-md active:translate-y-0.5 cursor-pointer whitespace-nowrap"
          {...bindHold(
            () => {
              if (isBoat) {
                inputRef.current.up = true;
              } else {
                if (!inputRef.current.jumpHeld) {
                  inputRef.current.jumpJustPressed = true;
                }
                inputRef.current.jumpHeld = true;
              }
            },
            () => {
              inputRef.current.up = false;
              inputRef.current.jumpHeld = false;
            }
          )}
        >
          <ArrowUp className="w-5 h-5" />
          <span>{isBoat ? t.btnUp : t.btnJump}</span>
        </button>
      </div>

      {/* Desktop Keyboard Hint */}
      <div className="hidden xl:block text-xs text-slate-400 text-center max-w-md leading-snug">
        {isBoat ? (
          <span className="text-sky-300 font-semibold">{t.boatHint}</span>
        ) : (
          <span>
            WASD / {t.btnLeft}-{t.btnRight} · Space = {t.btnJump} · S = {t.btnDown} · X ={' '}
            {hasSword ? t.btnSword : t.btnPunch}
          </span>
        )}
      </div>

      {/* RIGHT SIDE: Attack / Sword, Shield, Boomerang / Special */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        {hasShield && (
          <button
            type="button"
            aria-label={t.btnShield}
            className="px-3 sm:px-4 h-12 sm:h-14 rounded-xl bg-cyan-600 active:bg-cyan-500 border-2 border-cyan-300 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md active:translate-y-0.5 cursor-pointer whitespace-nowrap"
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
            <span className="hidden sm:inline">{t.btnShield}</span>
          </button>
        )}

        {(hasBoomerang || isBoat) && (
          <button
            type="button"
            aria-label={isBoat ? t.btnShot : t.btnBoomerang}
            className="px-3 sm:px-4 h-12 sm:h-14 rounded-xl bg-yellow-600 active:bg-yellow-500 border-2 border-yellow-300 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md active:translate-y-0.5 cursor-pointer whitespace-nowrap"
            {...bindHold(
              () => {
                inputRef.current.toolJustPressed = true;
              },
              () => {}
            )}
          >
            <Sparkles className="w-5 h-5" />
            <span className="hidden sm:inline">
              {isBoat ? t.btnShot : t.btnBoomerang}
            </span>
          </button>
        )}

        <button
          type="button"
          aria-label={isBoat ? t.btnShot : hasSword ? t.btnSword : t.btnPunch}
          className="px-3.5 sm:px-5 h-12 sm:h-14 rounded-xl bg-purple-600 active:bg-purple-500 border-2 border-purple-400 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md active:translate-y-0.5 cursor-pointer whitespace-nowrap"
          {...bindHold(
            () => {
              inputRef.current.attackJustPressed = true;
            },
            () => {}
          )}
        >
          {hasSword ? <Sword className="w-5 h-5" /> : <Hand className="w-5 h-5" />}
          <span>{isBoat ? t.btnShot : hasSword ? t.btnSword : t.btnPunch}</span>
        </button>
      </div>
    </div>
  );
};
