import React from 'react';
import {
  Anchor,
  ArrowRight,
  Compass,
  Crown,
  History,
  Languages,
  Play,
  RotateCcw,
  Shield,
  ShieldCheck,
  Sparkles,
  Sword,
  Trophy,
  Zap,
} from 'lucide-react';
import {
  APP_VERSION,
  CHANGELOG_ENTRIES,
  Lang,
  TEXTS,
} from '../game/i18n';
import { WORLD_ROADMAP } from '../game/levels';
import { GameScreenState } from '../game/types';
import { PWAInstallButton } from './PWAInstallButton';

interface OverlaysProps {
  screen: GameScreenState;
  lang: Lang;
  score: number;
  coins: number;
  levelIndex: number;
  onToggleLang: () => void;
  onStartAdventure: (levelIndex?: number) => void;
  onOpenWorldMap: () => void;
  onOpenChangelog: () => void;
  onBackToTitle: () => void;
  onResume: () => void;
  onRestartLevel: () => void;
  onNextLevel: () => void;
}

export const Overlays: React.FC<OverlaysProps> = ({
  screen,
  lang,
  score,
  coins,
  levelIndex,
  onToggleLang,
  onStartAdventure,
  onOpenWorldMap,
  onOpenChangelog,
  onBackToTitle,
  onResume,
  onRestartLevel,
  onNextLevel,
}) => {
  if (screen === 'PLAYING') return null;
  const t = TEXTS[lang];

  return (
    <div className="absolute inset-0 z-30 bg-slate-950/82 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {screen === 'TITLE_MENU' && (
        <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-8 shadow-2xl my-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
            <div className="md:col-span-7 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-red-600 border-2 border-amber-400 flex items-center justify-center font-display font-bold text-2xl text-amber-300 shadow-lg shrink-0">
                    K
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-emerald-400">
                      {t.subtitle} · v{APP_VERSION}
                    </p>
                    <h1 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight">
                      Super-Kenneth
                    </h1>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onToggleLang}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-bold text-slate-100 flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Languages className="w-4 h-4 text-sky-400" />
                  <span>{lang === 'de' ? 'DE / EN' : 'EN / DE'}</span>
                </button>
              </div>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                {t.titleDesc}
              </p>

              <div className="grid grid-cols-2 gap-3 text-sm text-slate-200">
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
                  <div className="font-bold text-amber-300">{t.tenLivesTitle}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{t.tenLivesDesc}</div>
                </div>
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
                  <div className="font-bold text-cyan-300">{t.fiveToolsTitle}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{t.fiveToolsDesc}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => onStartAdventure(0)}
                  className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-base sm:text-lg flex items-center gap-2 shadow-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>{t.startAdventure}</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenWorldMap}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-sm sm:text-base flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span>{t.worldMap}</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenChangelog}
                  className="px-3.5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-sm flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <History className="w-4 h-4 text-sky-400" />
                  <span>{t.changelog}</span>
                </button>
                <PWAInstallButton lang={lang} />
              </div>
            </div>

            <div className="md:col-span-5 bg-slate-950/70 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-3">
              <h2 className="font-display font-bold text-base sm:text-lg text-amber-300">
                {t.abilitiesTitle}
              </h2>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                <li className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
                  <span>{t.keyMove}</span>
                  <span className="font-mono-num text-xs font-bold text-slate-200">
                    WASD / Pfeile
                  </span>
                </li>
                <li className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
                  <span>{t.keyJump}</span>
                  <span className="font-mono-num text-xs font-bold text-slate-200">
                    Space / W
                  </span>
                </li>
                <li className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
                  <span>{t.keyCrouch}</span>
                  <span className="font-mono-num text-xs font-bold text-slate-200">
                    S / Down
                  </span>
                </li>
                <li className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
                  <span>{t.keyAttack}</span>
                  <span className="font-mono-num text-xs font-bold text-slate-200">
                    X / Enter
                  </span>
                </li>
                <li className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
                  <span>{t.keyTool}</span>
                  <span className="font-mono-num text-xs font-bold text-slate-200">
                    E / F
                  </span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span>{t.keyShield}</span>
                  <span className="font-mono-num text-xs font-bold text-slate-200">
                    C / Q
                  </span>
                </li>
              </ul>

              <div className="pt-1 flex items-center gap-3 text-xs text-slate-400">
                <Shield className="w-4 h-4 text-orange-400 shrink-0" />
                <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
                <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />
                <Sword className="w-4 h-4 text-amber-300 shrink-0" />
              </div>
            </div>
          </div>
        </div>
      )}

      {screen === 'WORLD_MAP' && (
        <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-8 shadow-2xl space-y-5 my-auto">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                {t.worldMapTitle}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                {t.worldMapDesc}
              </p>
            </div>
            <button
              type="button"
              onClick={onBackToTitle}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-sm font-bold text-slate-200 cursor-pointer whitespace-nowrap"
            >
              {t.back}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {WORLD_ROADMAP.map((world) => {
              const code = lang === 'de' ? world.worldCodeDe : world.worldCodeEn;
              const title = lang === 'de' ? world.titleDe : world.titleEn;
              const landscape = lang === 'de' ? world.landscapeDe : world.landscapeEn;
              const bossName = lang === 'de' ? world.bossNameDe : world.bossNameEn;
              return (
                <div
                  key={world.id}
                  className="rounded-xl border border-slate-600 bg-slate-800/80 p-4 sm:p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span
                        className="flex items-center gap-1.5"
                        style={{ color: world.accent }}
                      >
                        {world.mode === 'topdown_boat' && (
                          <Anchor className="w-3.5 h-3.5" />
                        )}
                        <span>{code}</span>
                      </span>
                      <span className="text-emerald-400">{t.playable}</span>
                    </div>
                    <h3 className="font-display text-lg sm:text-xl font-bold text-white">
                      {title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300">{landscape}</p>
                    <p className="text-xs text-slate-400">
                      {t.bossPrefix}:{' '}
                      <span className="text-amber-300 font-semibold">{bossName}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onStartAdventure(world.id)}
                    className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{t.playWorld}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {screen === 'CHANGELOG' && (
        <div className="w-full max-w-3xl bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-8 shadow-2xl space-y-5 my-auto">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
              {t.changelogTitle}
            </h2>
            <button
              type="button"
              onClick={onBackToTitle}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-sm font-bold text-slate-200 cursor-pointer whitespace-nowrap"
            >
              {t.back}
            </button>
          </div>

          <div className="space-y-4 max-h-[62vh] overflow-y-auto pr-1">
            {CHANGELOG_ENTRIES.map((entry) => {
              const title = lang === 'de' ? entry.titleDe : entry.titleEn;
              const items = lang === 'de' ? entry.itemsDe : entry.itemsEn;
              return (
                <div
                  key={entry.version}
                  className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-mono-num font-bold text-emerald-400 text-sm">
                      v{entry.version}
                    </span>
                    <span>{entry.date}</span>
                  </div>
                  <h3 className="font-display font-bold text-base text-white">
                    {title}
                  </h3>
                  <ul className="space-y-1 text-xs sm:text-sm text-slate-300 list-disc pl-5">
                    {items.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {screen === 'PAUSED' && (
        <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 text-center space-y-4 shadow-2xl my-auto">
          <h2 className="font-display text-3xl font-bold text-white">
            {t.pausedTitle}
          </h2>
          <p className="text-sm text-slate-300">{t.pausedDesc}</p>
          <div className="flex flex-col gap-2.5">
            <button
              type="button"
              onClick={onResume}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-base cursor-pointer"
            >
              {t.resume}
            </button>
            <button
              type="button"
              onClick={onRestartLevel}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{t.restartLevel}</span>
            </button>
            <button
              type="button"
              onClick={onOpenWorldMap}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-sm cursor-pointer"
            >
              {t.backToMap}
            </button>
          </div>
        </div>
      )}

      {screen === 'LEVEL_CLEAR' && (
        <div className="w-full max-w-lg bg-slate-900 border border-emerald-500/60 rounded-2xl p-6 sm:p-7 text-center space-y-5 shadow-2xl my-auto">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
            <Crown className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-400">
              {t.levelClearBadge} ({levelIndex + 1}/4)
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-white mt-1">
              {t.levelClearTitle}
            </h2>
          </div>
          <p className="text-slate-300 text-sm">{t.levelClearDesc}</p>
          <div className="flex items-center justify-center gap-6 py-1">
            <div>
              <span className="text-slate-400 text-xs block">{t.points}</span>
              <span className="font-mono-num font-bold text-xl text-white">
                {score}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div>
              <span className="text-slate-400 text-xs block">{t.coins}</span>
              <span className="font-mono-num font-bold text-xl text-amber-300">
                {coins}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onNextLevel}
            className="w-full py-3.5 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{t.nextWorld}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {screen === 'GAME_OVER' && (
        <div className="w-full max-w-md bg-slate-900 border border-rose-500/60 rounded-2xl p-6 sm:p-7 text-center space-y-5 shadow-2xl my-auto">
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-rose-400">
            {t.gameOverTitle}
          </h2>
          <p className="text-slate-300 text-sm">{t.gameOverDesc}</p>
          <div className="flex items-center justify-center gap-6 py-1">
            <div>
              <span className="text-slate-400 text-xs block">{t.points}</span>
              <span className="font-mono-num font-bold text-xl text-white">
                {score}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div>
              <span className="text-slate-400 text-xs block">{t.coins}</span>
              <span className="font-mono-num font-bold text-xl text-amber-300">
                {coins}
              </span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => onStartAdventure(levelIndex)}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-base cursor-pointer"
            >
              {t.tryAgain}
            </button>
            <button
              type="button"
              onClick={onOpenWorldMap}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-sm cursor-pointer"
            >
              {t.backToMap}
            </button>
          </div>
        </div>
      )}

      {screen === 'VICTORY' && (
        <div className="w-full max-w-lg bg-slate-900 border border-amber-400/70 rounded-2xl p-6 sm:p-7 text-center space-y-5 shadow-2xl my-auto">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center">
            <Trophy className="w-9 h-9 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-300">{t.victoryBadge}</p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mt-1">
              {t.victoryTitle}
            </h2>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            {t.victoryDesc}
          </p>
          <div className="flex items-center justify-center gap-6 py-1">
            <div>
              <span className="text-slate-400 text-xs block">{t.points}</span>
              <span className="font-mono-num font-bold text-2xl text-white">
                {score}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div>
              <span className="text-slate-400 text-xs block">{t.coins}</span>
              <span className="font-mono-num font-bold text-2xl text-amber-300">
                {coins}
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onStartAdventure(0)}
              className="flex-1 py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-base cursor-pointer whitespace-nowrap"
            >
              {t.newAdventure}
            </button>
            <button
              type="button"
              onClick={onOpenWorldMap}
              className="flex-1 py-3.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-base cursor-pointer whitespace-nowrap"
            >
              {t.worldMap}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
