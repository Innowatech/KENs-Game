import React from 'react';
import {
  Coins,
  Flame,
  Hammer,
  Heart,
  Rocket,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Sword,
  Zap,
} from 'lucide-react';
import { Lang, TEXTS } from '../game/i18n';
import { HudSnapshot, TOOLS_CATALOG, ToolId } from '../game/types';

interface HUDProps {
  hud: HudSnapshot;
  lang: Lang;
  onOpenSettings: () => void;
}

function ToolSlotIcon({ id }: { id: ToolId }) {
  if (id === 'power_gloves') return <Zap className="w-3.5 h-3.5 text-orange-400" />;
  if (id === 'star_boomerang') return <Sparkles className="w-3.5 h-3.5 text-yellow-400" />;
  if (id === 'turbo_boots') return <Zap className="w-3.5 h-3.5 text-cyan-400" />;
  if (id === 'aegis_shield') return <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />;
  if (id === 'fire_blaster') return <Flame className="w-3.5 h-3.5 text-red-400" />;
  if (id === 'thunder_hammer') return <Hammer className="w-3.5 h-3.5 text-purple-400" />;
  if (id === 'rocket_pod') return <Rocket className="w-3.5 h-3.5 text-rose-400" />;
  return <Sword className="w-3.5 h-3.5 text-amber-300" />;
}

export const HUD: React.FC<HUDProps> = ({ hud, lang, onOpenSettings }) => {
  const t = TEXTS[lang];

  const hpPct = Math.max(
    0,
    Math.min(100, (hud.healthStamina / hud.maxHealthStamina) * 100)
  );
  const hpColor =
    hpPct > 55 ? 'bg-emerald-500' : hpPct > 28 ? 'bg-amber-400' : 'bg-rose-500';

  return (
    <div className="absolute inset-x-0 top-0 z-20 pointer-events-none flex items-start justify-between p-2 sm:p-3 gap-2">
      {/* Top-Left Compact Status Bar */}
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 bg-slate-950/60 backdrop-blur-sm border border-white/15 rounded-xl px-2.5 py-1.5 shadow-lg">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-red-600 border border-amber-400 flex items-center justify-center font-display font-bold text-amber-300 text-xs shadow-sm">
            K
          </div>
          <div className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span className="font-mono-num font-bold text-xs sm:text-sm text-white">
              {hud.lives}/{hud.maxLives}
            </span>
          </div>
        </div>

        <div className="h-4 w-px bg-white/15" />

        <div className="flex items-center gap-1.5">
          <div className="w-16 sm:w-24 h-2.5 bg-slate-900/90 rounded-full overflow-hidden border border-white/20">
            <div
              className={`h-full ${hpColor} transition-all duration-150`}
              style={{ width: `${hpPct}%` }}
            />
          </div>
          <span className="font-mono-num font-bold text-[11px] sm:text-xs text-slate-100">
            {hud.healthStamina}
          </span>
        </div>

        <div className="h-4 w-px bg-white/15" />

        <div className="flex items-center gap-2 text-xs sm:text-sm">
          <div className="flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-mono-num font-bold text-amber-300">
              {String(hud.coins).padStart(2, '0')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
            <span className="font-mono-num font-bold text-yellow-200">
              {hud.starsCollected}/{hud.totalStars}
            </span>
          </div>
        </div>

        {hud.tools.length > 0 && (
          <>
            <div className="hidden sm:block h-4 w-px bg-white/15" />
            <div className="hidden sm:flex items-center gap-1">
              {hud.tools.map((toolId) => {
                const info = TOOLS_CATALOG[toolId];
                const name = lang === 'de' ? info.nameDe : info.nameEn;
                return (
                  <div
                    key={toolId}
                    title={name}
                    className="w-6 h-6 rounded-md bg-slate-900/80 border border-amber-400/50 flex items-center justify-center"
                  >
                    <ToolSlotIcon id={toolId} />
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Top-Right Gear Button */}
      <div className="pointer-events-auto flex items-center gap-2">
        <div className="hidden md:block bg-slate-950/55 backdrop-blur-sm border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-semibold">
          <span className="text-amber-300 font-bold">{hud.worldCode}</span>
          <span className="mx-1.5 text-slate-500">·</span>
          <span>{hud.levelName}</span>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          aria-label={t.settings}
          title={t.settings}
          className="w-10 h-10 rounded-xl bg-slate-950/65 hover:bg-slate-900/85 active:scale-95 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center shadow-lg cursor-pointer transition-all"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
