import { useCallback, useEffect, useRef, useState } from 'react';
import { Skull, Sparkles } from 'lucide-react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { Overlays } from './components/Overlays';
import { TouchControls } from './components/TouchControls';
import { soundEngine } from './game/audio';
import { SuperKennethEngine } from './game/engine';
import { GameScreenState, HudSnapshot, InputState } from './game/types';

const INITIAL_HUD: HudSnapshot = {
  lives: 10,
  maxLives: 10,
  healthStamina: 100,
  maxHealthStamina: 100,
  toolEnergy: 100,
  maxToolEnergy: 100,
  coins: 0,
  score: 0,
  levelIndex: 0,
  levelName: 'Smaragd-Tal & Moos-Ruinen',
  worldCode: 'Welt 1',
  tools: [],
  bossActive: false,
  bossName: '',
  bossHp: 0,
  bossMaxHp: 1,
  recentToolUnlock: null,
};

export default function App() {
  const [screen, setScreen] = useState<GameScreenState>('TITLE_MENU');
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [muted, setMuted] = useState(false);
  const [showTouchControls, setShowTouchControls] = useState(true);
  const [endStats, setEndStats] = useState({ score: 0, coins: 0, levelIndex: 0 });

  const engineRef = useRef<SuperKennethEngine | null>(null);
  const inputRef = useRef<InputState>({
    left: false,
    right: false,
    down: false,
    jumpHeld: false,
    jumpJustPressed: false,
    attackJustPressed: false,
    toolJustPressed: false,
  });

  if (!engineRef.current) {
    engineRef.current = new SuperKennethEngine({
      onHudUpdate: (snapshot) => setHud(snapshot),
      onLevelClear: (levelIndex, score, coins) => {
        setEndStats({ levelIndex, score, coins });
        setScreen('LEVEL_CLEAR');
      },
      onGameOver: (score, coins) => {
        setEndStats((prev) => ({ ...prev, score, coins }));
        setScreen('GAME_OVER');
      },
      onVictory: (score, coins) => {
        setEndStats((prev) => ({ ...prev, score, coins }));
        setScreen('VICTORY');
      },
    });
  }

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.isRunning = screen === 'PLAYING';
    }
  }, [screen]);

  const clearInput = useCallback(() => {
    inputRef.current = {
      left: false,
      right: false,
      down: false,
      jumpHeld: false,
      jumpJustPressed: false,
      attackJustPressed: false,
      toolJustPressed: false,
    };
  }, []);

  const handleStartAdventure = useCallback(
    (levelIdx = 0) => {
      clearInput();
      engineRef.current?.startNewGame(levelIdx);
      setScreen('PLAYING');
    },
    [clearInput]
  );

  const handleRestartLevel = useCallback(() => {
    clearInput();
    if (engineRef.current) {
      engineRef.current.loadLevel(engineRef.current.levelIndex, false);
    }
    setScreen('PLAYING');
  }, [clearInput]);

  const handleNextLevel = useCallback(() => {
    clearInput();
    if (engineRef.current) {
      engineRef.current.loadLevel(engineRef.current.levelIndex + 1, false);
    }
    setScreen('PLAYING');
  }, [clearInput]);

  const handleTogglePause = useCallback(() => {
    setScreen((prev) => {
      if (prev === 'PLAYING') {
        clearInput();
        return 'PAUSED';
      }
      if (prev === 'PAUSED') return 'PLAYING';
      return prev;
    });
  }, [clearInput]);

  const handleToggleMute = useCallback(() => {
    setMuted((prev) => {
      const next = !prev;
      soundEngine.setMuted(next);
      return next;
    });
  }, []);

  return (
    <div className="w-screen h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* Top Game HUD */}
      <HUD
        hud={hud}
        muted={muted}
        showTouchControls={showTouchControls}
        onToggleMute={handleToggleMute}
        onToggleTouch={() => setShowTouchControls((v) => !v)}
        onPause={() => {
          if (screen === 'PLAYING') {
            clearInput();
            setScreen('PAUSED');
          } else if (screen === 'PAUSED') {
            setScreen('PLAYING');
          }
        }}
      />

      {/* Main HD Game Stage */}
      <main className="relative flex-1 min-h-0 w-full flex items-center justify-center bg-slate-950 overflow-hidden">
        <GameCanvas
          engineRef={engineRef}
          inputRef={inputRef}
          isActive={screen === 'PLAYING'}
          onTogglePause={handleTogglePause}
        />

        {/* Boss Health Bar docked cleanly at top center of stage */}
        {screen === 'PLAYING' && hud.bossActive && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 w-[min(90%,480px)] bg-slate-900/90 border border-rose-500/70 rounded-xl px-4 py-2.5 shadow-xl pointer-events-none">
            <div className="flex items-center justify-between text-xs font-bold mb-1.5">
              <div className="flex items-center gap-2 text-rose-300">
                <Skull className="w-4 h-4 text-rose-400" />
                <span className="font-display text-sm text-white">
                  {hud.bossName}
                </span>
              </div>
              <span className="font-mono-num text-rose-300">
                {hud.bossHp}/{hud.bossMaxHp}
              </span>
            </div>
            <div className="w-full h-3 bg-slate-800 rounded-md overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-rose-600 to-amber-500 transition-transform duration-150 origin-left"
                style={{
                  width: `${Math.max(0, (hud.bossHp / hud.bossMaxHp) * 100)}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Tool Unlock Notification Banner (Non-blocking) */}
        {screen === 'PLAYING' && hud.recentToolUnlock && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20 bg-slate-900/95 border border-amber-400 rounded-xl px-5 py-3 shadow-2xl pointer-events-none text-center max-w-md">
            <div className="flex items-center justify-center gap-2 text-amber-300 font-display font-bold text-base">
              <Sparkles className="w-4 h-4" />
              <span>Neues Werkzeug: {hud.recentToolUnlock.name}!</span>
            </div>
            <p className="text-xs text-slate-200 mt-1">
              {hud.recentToolUnlock.description} ({hud.recentToolUnlock.keyHint})
            </p>
          </div>
        )}

        {/* Overlays (Title, World Map, Pause, Clear, Game Over, Victory) */}
        <Overlays
          screen={screen}
          score={endStats.score}
          coins={endStats.coins}
          levelIndex={endStats.levelIndex}
          onStartAdventure={handleStartAdventure}
          onOpenWorldMap={() => {
            clearInput();
            setScreen('WORLD_MAP');
          }}
          onBackToTitle={() => {
            clearInput();
            setScreen('TITLE_MENU');
          }}
          onResume={() => setScreen('PLAYING')}
          onRestartLevel={handleRestartLevel}
          onNextLevel={handleNextLevel}
        />
      </main>

      {/* Bottom Touch / Kid-friendly Controls */}
      {showTouchControls && (
        <TouchControls
          inputRef={inputRef}
          hasBoomerang={hud.tools.includes('star_boomerang')}
        />
      )}
    </div>
  );
}
