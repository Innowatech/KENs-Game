import React from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Hand, Sparkles } from 'lucide-react';
import { InputState } from '../game/types';

interface TouchControlsProps {
  inputRef: React.MutableRefObject<InputState>;
  hasBoomerang: boolean;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  inputRef,
  hasBoomerang,
}) => {
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
    <div className="w-full bg-slate-900/95 border-t border-slate-700/80 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 select-none z-20">
      {/* Left Direction Pad */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          aria-label="Nach links rennen"
          className="w-14 h-12 sm:w-16 sm:h-14 rounded-xl bg-sky-600 active:bg-sky-500 border border-sky-400 text-white flex items-center justify-center shadow-md active:translate-y-0.5 cursor-pointer"
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
          aria-label="Nach rechts rennen"
          className="w-14 h-12 sm:w-16 sm:h-14 rounded-xl bg-sky-600 active:bg-sky-500 border border-sky-400 text-white flex items-center justify-center shadow-md active:translate-y-0.5 cursor-pointer"
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
      </div>

      {/* Keyboard Hint on Desktop */}
      <div className="hidden md:block text-xs text-slate-400 text-center leading-relaxed">
        <span className="text-slate-200 font-semibold">Steuerung:</span> Pfeiltasten / WASD = Rennen · Unten / S = Bücken · Leertaste / W = Doppelsprung · X = Schlagen · E = Bumerang
      </div>

      {/* Right Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Bücken"
          className="px-3.5 h-12 sm:h-14 rounded-xl bg-amber-600 active:bg-amber-500 border border-amber-400 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md active:translate-y-0.5 cursor-pointer whitespace-nowrap"
          {...bindHold(
            () => {
              inputRef.current.down = true;
            },
            () => {
              inputRef.current.down = false;
            }
          )}
        >
          <ArrowDown className="w-4 h-4" />
          <span>Bücken</span>
        </button>

        <button
          type="button"
          aria-label="Schlagen"
          className="px-4 h-12 sm:h-14 rounded-xl bg-purple-600 active:bg-purple-500 border border-purple-400 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md active:translate-y-0.5 cursor-pointer whitespace-nowrap"
          {...bindHold(
            () => {
              inputRef.current.attackJustPressed = true;
            },
            () => {}
          )}
        >
          <Hand className="w-4 h-4" />
          <span>Schlagen</span>
        </button>

        {hasBoomerang && (
          <button
            type="button"
            aria-label="Sternen-Bumerang werfen"
            className="px-3.5 h-12 sm:h-14 rounded-xl bg-yellow-600 active:bg-yellow-500 border border-yellow-400 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md active:translate-y-0.5 cursor-pointer whitespace-nowrap"
            {...bindHold(
              () => {
                inputRef.current.toolJustPressed = true;
              },
              () => {}
            )}
          >
            <Sparkles className="w-4 h-4" />
            <span>Bumerang</span>
          </button>
        )}

        <button
          type="button"
          aria-label="Springen und Doppelsprung"
          className="px-5 h-12 sm:h-14 rounded-xl bg-rose-600 active:bg-rose-500 border border-rose-400 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md active:translate-y-0.5 cursor-pointer whitespace-nowrap"
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
          <ArrowUp className="w-4 h-4" />
          <span>Springen</span>
        </button>
      </div>
    </div>
  );
};
