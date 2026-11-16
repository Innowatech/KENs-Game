import React, { useState } from 'react';
import {
  Coins,
  Compass,
  Gamepad2,
  Heart,
  History,
  Home,
  Languages,
  Music,
  Pause,
  Play,
  RotateCcw,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Sword,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { Lang, TEXTS } from '../game/i18n';
import { HudSnapshot, TOOLS_CATALOG, ToolId } from '../game/types';
import { PWAInstallButton } from './PWAInstallButton';

interface HUDProps {
  hud: HudSnapshot;
  lang: Lang;
  musicMuted: boolean;
  sfxMuted: boolean;
  showTouchControls: boolean;
  isPlaying: boolean;
  onToggleLang: () => void;
  onToggleMusic: () => void;
  onToggleSfx: () => void;
  onToggleTouch: () => void;
  onPause: () => void;
  onResume: () => void;
  onRestartLevel: () => void;
  onOpenWorldMap: () => void;
  onOpenChangelog: () => void;
  onBackToTitle: () => void;
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
  musicMuted,
  sfxMuted,
  showTouchControls,
  isPlaying,
  onToggleLang,
  onToggleMusic,
  onToggleSfx,
  onToggleTouch,
  onPause,
  onResume,
  onRestartLevel,
  onOpenWorldMap,
  onOpenChangelog,
  onBackToTitle,
}) => {
  const [gearOpen, setGearOpen] = useState(false);
  const t = TEXTS[lang];

  const hpPct = Math.max(
    0,
    Math.min(100, (hud.healthStamina / hud.maxHealthStamina) * 100)
  );
  const hpColor =
    hpPct > 55 ? 'bg-emerald-500' : hpPct > 28 ? 'bg-amber-400' : 'bg-rose-500';

  const openGear = () => {
    if (isPlaying) onPause();
    setGearOpen(true);
  };

  const closeGear = (resumeGame = false) => {
    setGearOpen(false);
    if (resumeGame) onResume();
  };

  return (
    <>
      {/* Top Floating Compact In-Game HUD */}
      <div className="absolute inset-x-0 top-0 z-20 pointer-events-none flex items-start justify-between p-2 sm:p-3 gap-2">
        {/* Top-Left Compact Status Bar */}
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 bg-slate-950/60 backdrop-blur-sm border border-white/15 rounded-xl px-2.5 py-1.5 shadow-lg">
          {/* Hero Crest + Lives */}
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

          {/* Energy / Stamina Bar */}
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

          {/* Coins & Stars */}
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

          {/* Compact Unlocked Tool Icons */}
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
            onClick={openGear}
            aria-label={t.settings}
            title={t.settings}
            className="w-10 h-10 rounded-xl bg-slate-950/65 hover:bg-slate-900/85 active:scale-95 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center shadow-lg cursor-pointer transition-all"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Gear Settings Drawer / Modal */}
      {gearOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5"
          onClick={() => closeGear(true)}
        >
          <div
            className="w-full max-w-sm max-h-[90dvh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                <h2 className="font-display font-bold text-lg text-white">
                  {t.settings}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => closeGear(true)}
                aria-label={t.close}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Audio, Language & Touch Toggles */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onToggleMusic}
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
                  !musicMuted
                    ? 'bg-emerald-600/25 border-emerald-400/60 text-emerald-200'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <Music className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {musicMuted ? t.musicOff : t.musicOn}
                </span>
              </button>

              <button
                type="button"
                onClick={onToggleSfx}
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
                  !sfxMuted
                    ? 'bg-sky-600/25 border-sky-400/60 text-sky-200'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                {sfxMuted ? (
                  <VolumeX className="w-4 h-4 shrink-0" />
                ) : (
                  <Volume2 className="w-4 h-4 shrink-0" />
                )}
                <span className="truncate">{sfxMuted ? t.sfxOff : t.sfxOn}</span>
              </button>

              <button
                type="button"
                onClick={onToggleLang}
                className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <Languages className="w-4 h-4 text-sky-400 shrink-0" />
                <span className="truncate">{t.languageLabel}</span>
              </button>

              <button
                type="button"
                onClick={onToggleTouch}
                className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
                  showTouchControls
                    ? 'bg-indigo-600/30 border-indigo-400/60 text-indigo-200'
                    : 'bg-slate-800 border-slate-700 text-slate-400'
                }`}
              >
                <Gamepad2 className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {showTouchControls ? t.touchOn : t.touchOff}
                </span>
              </button>
            </div>

            {/* Game Flow Actions */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="button"
                onClick={() => closeGear(true)}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>{t.resume}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setGearOpen(false);
                  onPause();
                }}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Pause className="w-4 h-4" />
                <span>{t.pause}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setGearOpen(false);
                    onRestartLevel();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{t.restartLevel}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGearOpen(false);
                    onOpenWorldMap();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5 text-amber-400" />
                  <span>{t.backToMap}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setGearOpen(false);
                    onOpenChangelog();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-sky-400" />
                  <span>{t.changelog}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGearOpen(false);
                    onBackToTitle();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Home className="w-3.5 h-3.5 text-rose-400" />
                  <span>{t.backToTitle}</span>
                </button>
              </div>

              <div className="pt-1 flex justify-center">
                <PWAInstallButton lang={lang} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
