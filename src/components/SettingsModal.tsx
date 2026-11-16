import React from 'react';
import {
  Compass,
  Gamepad2,
  History,
  Home,
  Languages,
  Music,
  Pause,
  Play,
  RotateCcw,
  Settings,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { APP_VERSION, Lang, TEXTS } from '../game/i18n';
import { PWAInstallButton } from './PWAInstallButton';

interface SettingsModalProps {
  open: boolean;
  lang: Lang;
  inGame: boolean;
  musicMuted: boolean;
  sfxMuted: boolean;
  showTouchControls: boolean;
  onClose: (resumeIfInGame: boolean) => void;
  onToggleMusic: () => void;
  onToggleSfx: () => void;
  onToggleLang: () => void;
  onToggleTouch: () => void;
  onOpenChangelog: () => void;
  onPause: () => void;
  onRestartLevel: () => void;
  onOpenWorldMap: () => void;
  onBackToTitle: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  lang,
  inGame,
  musicMuted,
  sfxMuted,
  showTouchControls,
  onClose,
  onToggleMusic,
  onToggleSfx,
  onToggleLang,
  onToggleTouch,
  onOpenChangelog,
  onPause,
  onRestartLevel,
  onOpenWorldMap,
  onBackToTitle,
}) => {
  if (!open) return null;
  const t = TEXTS[lang];

  return (
    <div
      className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2.5 sm:p-5"
      onClick={() => onClose(true)}
    >
      <div
        className="w-full max-w-sm max-h-[92dvh] overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl p-4 shadow-2xl space-y-2.5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-amber-400" />
            <h2 className="font-display font-bold text-base text-white">
              {t.settings}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onClose(true)}
            aria-label={t.close}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Changelog right at the top — visible immediately without scrolling! */}
        <button
          type="button"
          onClick={onOpenChangelog}
          className="w-full px-3 py-2 rounded-xl bg-sky-600/20 hover:bg-sky-600/30 border border-sky-400/50 text-sky-100 text-xs font-bold flex items-center justify-between cursor-pointer transition-colors"
        >
          <span className="flex items-center gap-2">
            <History className="w-4 h-4 text-sky-400" />
            <span>{t.changelog}</span>
          </span>
          <span className="font-mono-num text-sky-300">v{APP_VERSION}</span>
        </button>

        {/* Audio, Language & Touch Toggles */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onToggleMusic}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
              !musicMuted
                ? 'bg-emerald-600/25 border-emerald-400/60 text-emerald-200'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Music className="w-4 h-4 shrink-0" />
            <span className="truncate">{musicMuted ? t.musicOff : t.musicOn}</span>
          </button>

          <button
            type="button"
            onClick={onToggleSfx}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
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
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-100 text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <Languages className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="truncate">{t.languageLabel}</span>
          </button>

          <button
            type="button"
            onClick={onToggleTouch}
            className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors ${
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

        {/* Game Actions (only when inside a level) */}
        {inGame && (
          <div className="flex flex-col gap-2 pt-0.5">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onClose(true)}
                className="py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{t.resume}</span>
              </button>

              <button
                type="button"
                onClick={onPause}
                className="py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>{t.pause}</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={onRestartLevel}
                className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t.restartLevel}</span>
              </button>

              <button
                type="button"
                onClick={onOpenWorldMap}
                className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{t.worldMap}</span>
              </button>

              <button
                type="button"
                onClick={onBackToTitle}
                className="py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-[11px] flex items-center justify-center gap-1 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate">{t.backToTitle}</span>
              </button>
            </div>
          </div>
        )}

        <div className="pt-0.5 flex justify-center">
          <PWAInstallButton lang={lang} />
        </div>
      </div>
    </div>
  );
};
