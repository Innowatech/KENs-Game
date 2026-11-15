import React from 'react';
import {
  Coins,
  Gamepad2,
  Heart,
  Pause,
  Shield,
  Sparkles,
  Sword,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { HudSnapshot, TOOLS_CATALOG, ToolId } from '../game/types';

interface HUDProps {
  hud: HudSnapshot;
  muted: boolean;
  showTouchControls: boolean;
  onToggleMute: () => void;
  onToggleTouch: () => void;
  onPause: () => void;
}

function ToolSlotIcon({ id }: { id: ToolId }) {
  if (id === 'power_gloves') return <Shield className="w-4 h-4 text-orange-400" />;
  if (id === 'star_boomerang') return <Sparkles className="w-4 h-4 text-yellow-400" />;
  if (id === 'turbo_boots') return <Zap className="w-4 h-4 text-cyan-400" />;
  return <Sword className="w-4 h-4 text-amber-300" />;
}

export const HUD: React.FC<HUDProps> = ({
  hud,
  muted,
  showTouchControls,
  onToggleMute,
  onToggleTouch,
  onPause,
}) => {
  const hpPct = Math.max(
    0,
    Math.min(100, (hud.healthStamina / hud.maxHealthStamina) * 100)
  );
  const hpColor =
    hpPct > 55 ? 'bg-emerald-500' : hpPct > 28 ? 'bg-amber-400' : 'bg-rose-500';

  const allTools: ToolId[] = [
    'power_gloves',
    'star_boomerang',
    'turbo_boots',
    'sun_sword',
  ];

  return (
    <header className="w-full bg-slate-900/95 border-b border-slate-700/80 px-4 py-2.5 flex items-center justify-between gap-4 shrink-0 z-20">
      {/* Left: Hero Lives + Health-Stamina */}
      <div className="flex items-center gap-5 min-w-0">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-red-600 border border-amber-400 flex items-center justify-center font-display font-bold text-amber-300 text-sm shadow-sm">
            K
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xs text-slate-400 font-semibold">Leben</span>
            <div className="flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
              <span className="font-mono-num font-bold text-base text-white">
                {hud.lives}/{hud.maxLives}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1 min-w-[140px] sm:min-w-[180px]">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-semibold">Energie (Ausdauer)</span>
            <span className="font-mono-num font-bold text-white">
              {hud.healthStamina}/{hud.maxHealthStamina}
            </span>
          </div>
          <div className="w-full h-3 bg-slate-800 rounded-md overflow-hidden border border-slate-700">
            <div
              className={`h-full ${hpColor} transition-transform duration-150 origin-left`}
              style={{ width: `${hpPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Center: World & Tools */}
      <div className="hidden lg:flex items-center gap-6">
        <div className="text-sm text-slate-200 whitespace-nowrap">
          <span className="font-display font-bold text-amber-300">
            {hud.worldCode}
          </span>
          <span className="mx-2 text-slate-500">·</span>
          <span className="font-semibold">{hud.levelName}</span>
        </div>

        <div className="flex items-center gap-2" aria-label="Werkzeuge">
          {allTools.map((toolId) => {
            const unlocked = hud.tools.includes(toolId);
            const info = TOOLS_CATALOG[toolId];
            return (
              <div
                key={toolId}
                title={unlocked ? `${info.name}: ${info.description}` : 'Noch nicht gefunden'}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-semibold transition-colors ${
                  unlocked
                    ? 'bg-slate-800 border-amber-400/60 text-slate-100'
                    : 'bg-slate-900/60 border-slate-800 text-slate-600'
                }`}
              >
                <ToolSlotIcon id={toolId} />
                <span className="whitespace-nowrap">{info.shortName}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Coins, Score & Actions */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="font-mono-num font-bold text-amber-300">
              {String(hud.coins).padStart(2, '0')}
            </span>
          </div>
          <span className="text-slate-600">·</span>
          <div className="hidden sm:flex items-center gap-1.5">
            <span className="text-slate-400 text-xs font-semibold">Punkte</span>
            <span className="font-mono-num font-bold text-white">
              {String(hud.score).padStart(5, '0')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleTouch}
            title="Touch-Tasten ein-/ausblenden"
            aria-label="Touch-Tasten ein- oder ausblenden"
            className={`p-2 rounded-lg border text-sm transition-colors cursor-pointer ${
              showTouchControls
                ? 'bg-indigo-600 border-indigo-400 text-white'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onToggleMute}
            title={muted ? 'Ton einschalten' : 'Ton ausschalten'}
            aria-label={muted ? 'Ton einschalten' : 'Ton ausschalten'}
            className="p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onPause}
            title="Pause"
            aria-label="Spiel pausieren"
            className="px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 hover:bg-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Pause className="w-3.5 h-3.5" />
            <span>Pause</span>
          </button>
        </div>
      </div>
    </header>
  );
};
