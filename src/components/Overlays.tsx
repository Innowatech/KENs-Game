import React from 'react';
import {
  ArrowRight,
  Compass,
  Crown,
  Lock,
  Play,
  RotateCcw,
  Shield,
  Sparkles,
  Sword,
  Trophy,
  Zap,
} from 'lucide-react';
import { WORLD_ROADMAP } from '../game/levels';
import { GameScreenState } from '../game/types';

interface OverlaysProps {
  screen: GameScreenState;
  score: number;
  coins: number;
  levelIndex: number;
  onStartAdventure: (levelIndex?: number) => void;
  onOpenWorldMap: () => void;
  onBackToTitle: () => void;
  onResume: () => void;
  onRestartLevel: () => void;
  onNextLevel: () => void;
}

export const Overlays: React.FC<OverlaysProps> = ({
  screen,
  score,
  coins,
  levelIndex,
  onStartAdventure,
  onOpenWorldMap,
  onBackToTitle,
  onResume,
  onRestartLevel,
  onNextLevel,
}) => {
  if (screen === 'PLAYING') return null;

  return (
    <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
      {screen === 'TITLE_MENU' && (
        <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            {/* Hero Visual & Title */}
            <div className="md:col-span-7 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-red-600 border-2 border-amber-400 flex items-center justify-center font-display font-bold text-2xl text-amber-300 shadow-lg">
                  K
                </div>
                <div>
                  <p className="text-sm font-semibold text-emerald-400">
                    Das große Jump & Run Abenteuer
                  </p>
                  <h1 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight">
                    Super-Kenneth
                  </h1>
                </div>
              </div>

              <p className="text-slate-300 text-base leading-relaxed">
                Hilf Super-Kenneth auf seiner Reise durch fantastische Welten!
                Renne, hüpfe doppelt durch die Luft, bücke dich unter Gefahren
                hindurch, schlage Feinde aus dem Weg und finde starke Werkzeuge
                gegen mächtige Endgegner.
              </p>

              <div className="grid grid-cols-2 gap-3 pt-1 text-sm text-slate-200">
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
                  <div className="font-bold text-amber-300">10 Leben + Energie</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    100 Ausdauer-Punkte pro Leben & Rettungs-Blase bei Stürzen
                  </div>
                </div>
                <div className="bg-slate-800/80 border border-slate-700/80 rounded-xl p-3">
                  <div className="font-bold text-cyan-300">4 Starke Werkzeuge</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Kraft-Handschuhe, Bumerang, Turbo-Stiefel & Sonnen-Klinge
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onStartAdventure(0)}
                  className="px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-lg flex items-center gap-2 shadow-lg transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Abenteuer starten</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenWorldMap}
                  className="px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-base flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Compass className="w-5 h-5 text-amber-400" />
                  <span>Weltkarte</span>
                </button>
              </div>
            </div>

            {/* Right: Controls & Abilities Card */}
            <div className="md:col-span-5 bg-slate-950/70 border border-slate-800 rounded-xl p-5 space-y-4">
              <h2 className="font-display font-bold text-lg text-amber-300">
                Deine Fähigkeiten
              </h2>
              <ul className="space-y-2.5 text-sm text-slate-300">
                <li className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
                  <span>Rennen (Links / Rechts)</span>
                  <span className="font-mono-num text-xs font-bold text-slate-200">
                    Pfeile / A D
                  </span>
                </li>
                <li className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
                  <span>Hüpfen & Doppelsprung</span>
                  <span className="font-mono-num text-xs font-bold text-slate-200">
                    Leertaste / W
                  </span>
                </li>
                <li className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
                  <span>Bücken (Geheimgänge)</span>
                  <span className="font-mono-num text-xs font-bold text-slate-200">
                    Unten / S
                  </span>
                </li>
                <li className="flex items-start justify-between gap-2 border-b border-slate-800 pb-2">
                  <span>Schlagen / Schwert</span>
                  <span className="font-mono-num text-xs font-bold text-slate-200">
                    X / Enter
                  </span>
                </li>
                <li className="flex items-start justify-between gap-2">
                  <span>Sternen-Bumerang</span>
                  <span className="font-mono-num text-xs font-bold text-slate-200">
                    E / F
                  </span>
                </li>
              </ul>

              <div className="pt-2 flex items-center gap-3 text-xs text-slate-400">
                <Shield className="w-4 h-4 text-orange-400 shrink-0" />
                <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
                <Zap className="w-4 h-4 text-cyan-400 shrink-0" />
                <Sword className="w-4 h-4 text-amber-300 shrink-0" />
                <span>Öffne goldene Truhen für neue Kräfte!</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {screen === 'WORLD_MAP' && (
        <div className="w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl sm:text-3xl font-bold text-white">
                Weltkarte von Super-Kenneth
              </h2>
              <p className="text-sm text-slate-400 mt-1">
                Wähle eine Landschaft – weitere Welten folgen in zukünftigen Abenteuern.
              </p>
            </div>
            <button
              type="button"
              onClick={onBackToTitle}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-sm font-bold text-slate-200 cursor-pointer whitespace-nowrap"
            >
              Zurück
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {WORLD_ROADMAP.map((world) => (
              <div
                key={world.id}
                className={`rounded-xl border p-5 flex flex-col justify-between gap-4 ${
                  world.unlocked
                    ? 'bg-slate-800/80 border-slate-600'
                    : 'bg-slate-950/60 border-slate-800 opacity-75'
                }`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span style={{ color: world.accent }}>{world.worldCode}</span>
                    {world.comingSoon ? (
                      <span className="flex items-center gap-1 text-slate-400">
                        <Lock className="w-3.5 h-3.5" />
                        <span>Bald verfügbar</span>
                      </span>
                    ) : (
                      <span className="text-emerald-400">Spielbar</span>
                    )}
                  </div>
                  <h3 className="font-display text-xl font-bold text-white">
                    {world.title}
                  </h3>
                  <p className="text-sm text-slate-300">{world.landscape}</p>
                  <p className="text-xs text-slate-400">
                    Endgegner: <span className="text-amber-300 font-semibold">{world.bossName}</span>
                  </p>
                </div>

                {world.unlocked && (
                  <button
                    type="button"
                    onClick={() => onStartAdventure(world.id)}
                    className="w-full py-2.5 px-4 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{world.worldCode} spielen</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {screen === 'PAUSED' && (
        <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 text-center space-y-5 shadow-2xl">
          <h2 className="font-display text-3xl font-bold text-white">
            Kurze Pause
          </h2>
          <p className="text-sm text-slate-300">
            Super-Kenneth wartet auf dich!
          </p>
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onResume}
              className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-display font-bold text-base cursor-pointer"
            >
              Weiterspielen
            </button>
            <button
              type="button"
              onClick={onRestartLevel}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Level neu starten</span>
            </button>
            <button
              type="button"
              onClick={onOpenWorldMap}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-sm cursor-pointer"
            >
              Zur Weltkarte
            </button>
          </div>
        </div>
      )}

      {screen === 'LEVEL_CLEAR' && (
        <div className="w-full max-w-lg bg-slate-900 border border-emerald-500/60 rounded-2xl p-7 text-center space-y-5 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center">
            <Crown className="w-8 h-8 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-emerald-400">
              Welt {levelIndex + 1} abgeschlossen
            </p>
            <h2 className="font-display text-3xl font-bold text-white mt-1">
              Starke Leistung, Super-Kenneth!
            </h2>
          </div>
          <p className="text-slate-300 text-sm">
            Du hast den Endgegner besiegt! Deine gesammelten Werkzeuge und Leben
            nimmst du mit in die nächste Welt.
          </p>
          <div className="flex items-center justify-center gap-6 py-2 text-base">
            <div>
              <span className="text-slate-400 text-xs block">Punkte</span>
              <span className="font-mono-num font-bold text-xl text-white">
                {score}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div>
              <span className="text-slate-400 text-xs block">Münzen</span>
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
            <span>Weiter zu Welt 2: Kristall-Grotte</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {screen === 'GAME_OVER' && (
        <div className="w-full max-w-md bg-slate-900 border border-rose-500/60 rounded-2xl p-7 text-center space-y-5 shadow-2xl">
          <h2 className="font-display text-3xl font-bold text-rose-400">
            Alle 10 Leben aufgebraucht!
          </h2>
          <p className="text-slate-300 text-sm">
            Nicht aufgeben, Super-Kenneth! Mit jedem Versuch kennst du die
            Gegner und Geheimnisse besser.
          </p>
          <div className="flex items-center justify-center gap-6 py-2">
            <div>
              <span className="text-slate-400 text-xs block">Punkte</span>
              <span className="font-mono-num font-bold text-xl text-white">
                {score}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div>
              <span className="text-slate-400 text-xs block">Münzen</span>
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
              Nochmal versuchen (10 Leben)
            </button>
            <button
              type="button"
              onClick={onOpenWorldMap}
              className="w-full py-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-sm cursor-pointer"
            >
              Zur Weltkarte
            </button>
          </div>
        </div>
      )}

      {screen === 'VICTORY' && (
        <div className="w-full max-w-lg bg-slate-900 border border-amber-400/70 rounded-2xl p-7 text-center space-y-5 shadow-2xl">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center">
            <Trophy className="w-9 h-9 text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-300">
              Alle aktuellen Welten gemeistert
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mt-1">
              Champion Super-Kenneth!
            </h2>
          </div>
          <p className="text-slate-300 text-sm leading-relaxed">
            Fantastisch! Du hast sowohl König Stachelpanzer als auch den
            Flammen-Drachen Ignis besiegt und alle Werkzeuge gemeistert.
          </p>
          <div className="flex items-center justify-center gap-6 py-2">
            <div>
              <span className="text-slate-400 text-xs block">Gesamtpunkte</span>
              <span className="font-mono-num font-bold text-2xl text-white">
                {score}
              </span>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div>
              <span className="text-slate-400 text-xs block">Münzen</span>
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
              Neues Abenteuer
            </button>
            <button
              type="button"
              onClick={onOpenWorldMap}
              className="flex-1 py-3.5 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white font-bold text-base cursor-pointer whitespace-nowrap"
            >
              Weltkarte
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
