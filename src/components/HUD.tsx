import React from 'react';
import {
  Coins,
  Gamepad2,
  Heart,
  Languages,
  Pause,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Sword,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { Lang, TEXTS } from '../game/i18n';
import { HudSnapshot, TOOLS_CATALOG, ToolId } from '../game/types';
import { PWAInstallButton } from './PWAInstallButton';

interface HUDProps {
  hud: HudSnapshot;
  lang: Lang;
  muted: boolean;
  showTouchControls: boolean;
  onToggleLang: () => void;
  onToggleMute: () => void;
  onToggleTouch: () => void;
  onPause: () => void;
}

function ToolSlotIcon({ id }: { id: ToolId }) {
  if (id === 'power_gloves') return <Zap className="w-3.5 h-3.5 text-orange-400" />;
  if (id === 'star_boomerang') return <Sparkles className="w-3.5 h-3.5 text-yellow-400" />;
  if (id === 'turbo_boots') return <Zap className="w-3.5 h-3.5 text-cyan-400" />;
  if (id === 'aegis_shield') return <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />;
  return <Sword className="w-3.5 h-3.5 text-amber-300" />;
}

export const HUD: React.FC<HUDProps> = ({
  hud,
  lang,
  muted,
  showTouchControls,
  onToggleLang,
  onToggleMute,
  onToggleTouch,
  onPause,
}) => {
  const t = TEXTS[lang];
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
    'aegis_shield',
    'sun_sword',
  ];

  return (
    <header className="w-full bg-slate-900/95 border-b border-slate-700/80 px-2.5 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-4 shrink-0 z-20">
      {/* Left: Hero Lives + Health-Stamina */}
      <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-600 border border-amber-400 flex items-center justify-center font-display font-bold text-amber-300 text-xs sm:text-sm shadow-sm">
            K
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-[10px] sm:text-xs text-slate-400 font-semibold">
              {t.lives}
            </span>
            <div className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span className="font-mono-num font-bold text-xs sm:text-sm text-white">
                {hud.lives}/{hud.maxLives}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-0.5 min-w-[96px] sm:min-w-[155px]">
          <div className="flex items-center justify-between text-[10px] sm:text-xs">
            <span className="text-slate-300 font-semibold">{t.energy}</span>
            <span className="font-mono-num font-bold text-white">
              {hud.healthStamina}/{hud.maxHealthStamina}
            </span>
          </div>
          <div className="w-full h-2.5 sm:h-3 bg-slate-800 rounded-md overflow-hidden border border-slate-700">
            <div
              className={`h-full ${hpColor} transition-transform duration-150 origin-left`}
              style={{ width: `${hpPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Center: World, Stars & Tools (Desktop) */}
      <div className="hidden xl:flex items-center gap-5">
        <div className="text-sm text-slate-200 whitespace-nowrap">
          <span className="font-display font-bold text-amber-300">
            {hud.worldCode}
          </span>
          <span className="mx-1.5 text-slate-500">·</span>
          <span className="font-semibold">{hud.levelName}</span>
        </div>

        <div className="flex items-center gap-1.5" aria-label="Tools">
          {allTools.map((toolId) => {
            const unlocked = hud.tools.includes(toolId);
            const info = TOOLS_CATALOG[toolId];
            const label = lang === 'de' ? info.shortDe : info.shortEn;
            const desc = lang === 'de' ? info.descDe : info.descEn;
            const name = lang === 'de' ? info.nameDe : info.nameEn;
            return (
              <div
                key={toolId}
                title={unlocked ? `${name}: ${desc}` : name}
                className={`flex items-center gap-1 px-2 py-1 rounded-md border text-xs font-semibold transition-colors ${
                  unlocked
                    ? 'bg-slate-800 border-amber-400/60 text-slate-100'
                    : 'bg-slate-900/60 border-slate-800 text-slate-600'
                }`}
              >
                <ToolSlotIcon id={toolId} />
                <span className="whitespace-nowrap">{label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Coins, Stars, Score & Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm">
          <div className="flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
            <span className="font-mono-num font-bold text-amber-300">
              {String(hud.coins).padStart(2, '0')}
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-yellow-300 fill-yellow-300" />
            <span className="font-mono-num font-bold text-yellow-200">
              {hud.starsCollected}/{hud.totalStars}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            <span className="text-slate-400 text-xs font-semibold">{t.points}</span>
            <span className="font-mono-num font-bold text-white">
              {String(hud.score).padStart(5, '0')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-1.5">
          <div className="hidden sm:block">
            <PWAInstallButton lang={lang} compact />
          </div>
          <button
            type="button"
            onClick={onToggleLang}
            title="Sprache wechseln / Switch Language"
            className="px-2 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Languages className="w-3.5 h-3.5 text-sky-400" />
            <span>{lang.toUpperCase()}</span>
          </button>
          <button
            type="button"
            onClick={onToggleTouch}
            aria-label="Touch-Tasten"
            className={`p-1.5 sm:p-2 rounded-lg border text-sm transition-colors cursor-pointer ${
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
            aria-label="Ton"
            className="p-1.5 sm:p-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onPause}
            aria-label={t.pause}
            className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 hover:bg-slate-700 text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Pause className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.pause}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
