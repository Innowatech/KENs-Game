import { useCallback, useEffect, useRef, useState } from 'react';
import { Skull, Sparkles } from 'lucide-react';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { OfflineIndicator } from './components/OfflineIndicator';
import { Overlays } from './components/Overlays';
import { SettingsModal } from './components/SettingsModal';
import { TouchControls } from './components/TouchControls';
import { soundEngine } from './game/audio';
import { SuperKennethEngine } from './game/engine';
import { Lang, TEXTS } from './game/i18n';
import { GameScreenState, HudSnapshot, InputState } from './game/types';

const INITIAL_HUD: HudSnapshot = {
  mode: 'platformer',
  lives: 10,
  maxLives: 10,
  healthStamina: 100,
  maxHealthStamina: 100,
  toolEnergy: 100,
  maxToolEnergy: 100,
  coins: 0,
  score: 0,
  starsCollected: 0,
  totalStars: 3,
  levelIndex: 0,
  levelName: 'Smaragd-Tal & Moos-Ruinen',
  worldCode: 'Welt 1',
  tools: [],
  isShielding: false,
  bossActive: false,
  bossName: '',
  bossHp: 0,
  bossMaxHp: 1,
  recentToolUnlock: null,
};

export default function App() {
  const [lang, setLang] = useState<Lang>(() => {
    try {
      const saved = localStorage.getItem('super_kenneth_lang');
      return saved === 'en' ? 'en' : 'de';
    } catch {
      return 'de';
    }
  });
  const [screen, setScreen] = useState<GameScreenState>('TITLE_MENU');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [changelogOrigin, setChangelogOrigin] = useState<'TITLE_MENU' | 'PAUSED'>(
    'TITLE_MENU'
  );
  const [hud, setHud] = useState<HudSnapshot>(INITIAL_HUD);
  const [musicMuted, setMusicMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('super_kenneth_music_muted') === '1';
    } catch {
      return false;
    }
  });
  const [sfxMuted, setSfxMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('super_kenneth_sfx_muted') === '1';
    } catch {
      return false;
    }
  });
  const [showTouchControls, setShowTouchControls] = useState(true);
  const [endStats, setEndStats] = useState({ score: 0, coins: 0, levelIndex: 0 });
  const [clearedWorlds, setClearedWorlds] = useState<number[]>(() => {
    try {
      const raw = localStorage.getItem('super_kenneth_progress');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed?.clearedWorlds)) return parsed.clearedWorlds;
      }
    } catch {
      // Ignore storage error
    }
    return [];
  });

  const markWorldCleared = useCallback((idx: number) => {
    setClearedWorlds((prev) => {
      if (prev.includes(idx)) return prev;
      const next = [...prev, idx];
      try {
        localStorage.setItem(
          'super_kenneth_progress',
          JSON.stringify({ clearedWorlds: next })
        );
      } catch {
        // Ignore storage error
      }
      return next;
    });
  }, []);

  const engineRef = useRef<SuperKennethEngine | null>(null);
  const inputRef = useRef<InputState>({
    left: false,
    right: false,
    up: false,
    down: false,
    jumpHeld: false,
    jumpJustPressed: false,
    attackJustPressed: false,
    toolJustPressed: false,
    shieldHeld: false,
  });

  if (!engineRef.current) {
    engineRef.current = new SuperKennethEngine(
      {
        onHudUpdate: (snapshot) => setHud(snapshot),
        onLevelClear: (levelIndex, score, coins) => {
          markWorldCleared(levelIndex);
          setEndStats({ levelIndex, score, coins });
          setScreen('LEVEL_CLEAR');
        },
        onGameOver: (score, coins) => {
          setEndStats((prev) => ({ ...prev, score, coins }));
          setScreen('GAME_OVER');
        },
        onVictory: (score, coins) => {
          markWorldCleared(9);
          setEndStats((prev) => ({ ...prev, score, coins }));
          setScreen('VICTORY');
        },
      },
      lang
    );
  }

  useEffect(() => {
    soundEngine.setMusicMuted(musicMuted);
  }, [musicMuted]);

  useEffect(() => {
    soundEngine.setSfxMuted(sfxMuted);
  }, [sfxMuted]);

  const actuallyPlaying = screen === 'PLAYING' && !settingsOpen;

  useEffect(() => {
    const engine = engineRef.current;
    if (engine) {
      engine.isRunning = actuallyPlaying;
    }
    if (actuallyPlaying && engine) {
      soundEngine.startMusic(engine.getMusicTrack());
    } else {
      soundEngine.stopMusic();
    }
  }, [actuallyPlaying]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') {
        soundEngine.stopMusic();
      } else if (actuallyPlaying && engineRef.current) {
        soundEngine.startMusic(engineRef.current.getMusicTrack());
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [actuallyPlaying]);

  const handleToggleLang = useCallback(() => {
    setLang((prev) => {
      const next: Lang = prev === 'de' ? 'en' : 'de';
      try {
        localStorage.setItem('super_kenneth_lang', next);
      } catch {
        // Ignore storage error
      }
      engineRef.current?.setLang(next);
      return next;
    });
  }, []);

  const clearInput = useCallback(() => {
    inputRef.current = {
      left: false,
      right: false,
      up: false,
      down: false,
      jumpHeld: false,
      jumpJustPressed: false,
      attackJustPressed: false,
      toolJustPressed: false,
      shieldHeld: false,
    };
  }, []);

  const handleStartAdventure = useCallback(
    (levelIdx = 0) => {
      soundEngine.unlock();
      clearInput();
      setSettingsOpen(false);
      engineRef.current?.startNewGame(levelIdx);
      setScreen('PLAYING');
      if (engineRef.current) {
        soundEngine.startMusic(engineRef.current.getMusicTrack());
      }
    },
    [clearInput]
  );

  const handleRestartLevel = useCallback(() => {
    soundEngine.unlock();
    clearInput();
    setSettingsOpen(false);
    if (engineRef.current) {
      engineRef.current.loadLevel(engineRef.current.levelIndex, false);
      soundEngine.startMusic(engineRef.current.getMusicTrack());
    }
    setScreen('PLAYING');
  }, [clearInput]);

  const handleNextLevel = useCallback(() => {
    soundEngine.unlock();
    clearInput();
    setSettingsOpen(false);
    if (engineRef.current) {
      engineRef.current.loadLevel(engineRef.current.levelIndex + 1, false);
      soundEngine.startMusic(engineRef.current.getMusicTrack());
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

  const handleToggleMusic = useCallback(() => {
    soundEngine.unlock();
    setMusicMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('super_kenneth_music_muted', next ? '1' : '0');
      } catch {
        // Ignore storage error
      }
      soundEngine.setMusicMuted(next);
      return next;
    });
  }, []);

  const handleToggleSfx = useCallback(() => {
    soundEngine.unlock();
    setSfxMuted((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('super_kenneth_sfx_muted', next ? '1' : '0');
      } catch {
        // Ignore storage error
      }
      soundEngine.setSfxMuted(next);
      return next;
    });
  }, []);

  const t = TEXTS[lang];
  const inGameOrPaused = screen === 'PLAYING' || screen === 'PAUSED';

  return (
    <div className="relative w-screen h-[100dvh] bg-slate-950 overflow-hidden select-none">
      {/* 100% Edge-to-Edge Full-Screen Game Canvas */}
      <GameCanvas
        engineRef={engineRef}
        inputRef={inputRef}
        isActive={actuallyPlaying}
        onTogglePause={handleTogglePause}
      />

      {/* Compact Floating In-Game HUD + Top-Right Gear Button */}
      {inGameOrPaused && (
        <HUD
          hud={hud}
          lang={lang}
          onOpenSettings={() => {
            clearInput();
            setSettingsOpen(true);
          }}
        />
      )}

      {/* Boss Health Bar Overlay */}
      {actuallyPlaying && hud.bossActive && (
        <div className="absolute top-12 sm:top-3 left-1/2 -translate-x-1/2 z-20 w-[min(86%,420px)] bg-slate-950/75 backdrop-blur-sm border border-rose-500/70 rounded-xl px-3.5 py-1.5 shadow-xl pointer-events-none">
          <div className="flex items-center justify-between text-xs font-bold mb-1">
            <div className="flex items-center gap-1.5 text-rose-300">
              <Skull className="w-3.5 h-3.5 text-rose-400" />
              <span className="font-display text-xs sm:text-sm text-white">
                {hud.bossName}
              </span>
            </div>
            <span className="font-mono-num text-rose-300 text-xs">
              {hud.bossHp}/{hud.bossMaxHp}
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-rose-600 to-amber-500 transition-all duration-150"
              style={{
                width: `${Math.max(0, (hud.bossHp / hud.bossMaxHp) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Unlocked Tool Toast Overlay */}
      {actuallyPlaying && hud.recentToolUnlock && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-20 bg-slate-900/92 backdrop-blur-sm border border-amber-400 rounded-xl px-4 py-2.5 shadow-2xl pointer-events-none text-center max-w-sm">
          <div className="flex items-center justify-center gap-2 text-amber-300 font-display font-bold text-sm sm:text-base">
            <Sparkles className="w-4 h-4" />
            <span>
              {t.newToolPrefix}:{' '}
              {lang === 'de'
                ? hud.recentToolUnlock.nameDe
                : hud.recentToolUnlock.nameEn}
              !
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-200 mt-0.5">
            {lang === 'de'
              ? hud.recentToolUnlock.descDe
              : hud.recentToolUnlock.descEn}{' '}
            ({hud.recentToolUnlock.keyHint})
          </p>
        </div>
      )}

      {/* Circular Thumbstick + Ultra-Transparent Ghost Buttons */}
      {actuallyPlaying && showTouchControls && (
        <TouchControls
          inputRef={inputRef}
          mode={hud.mode}
          lang={lang}
          tools={hud.tools}
        />
      )}

      {/* Menus & End Screens */}
      <Overlays
        screen={screen}
        lang={lang}
        score={endStats.score}
        coins={endStats.coins}
        levelIndex={endStats.levelIndex}
        clearedWorlds={clearedWorlds}
        changelogFromStart={changelogOrigin === 'TITLE_MENU'}
        onToggleLang={handleToggleLang}
        onOpenSettings={() => {
          clearInput();
          setSettingsOpen(true);
        }}
        onStartAdventure={handleStartAdventure}
        onOpenWorldMap={() => {
          clearInput();
          setSettingsOpen(false);
          setScreen('WORLD_MAP');
        }}
        onBackToTitle={() => {
          clearInput();
          setSettingsOpen(false);
          setScreen('TITLE_MENU');
        }}
        onCloseChangelog={() => {
          setScreen(changelogOrigin);
          setSettingsOpen(true);
        }}
        onResume={() => {
          soundEngine.unlock();
          setSettingsOpen(false);
          setScreen('PLAYING');
        }}
        onRestartLevel={handleRestartLevel}
        onNextLevel={handleNextLevel}
      />

      {/* Shared Settings Modal (accessible from Title Screen & In-Game Gear!) */}
      <SettingsModal
        open={settingsOpen}
        lang={lang}
        inGame={inGameOrPaused}
        musicMuted={musicMuted}
        sfxMuted={sfxMuted}
        showTouchControls={showTouchControls}
        onClose={(resumeIfInGame) => {
          setSettingsOpen(false);
          if (resumeIfInGame && inGameOrPaused) {
            soundEngine.unlock();
            setScreen('PLAYING');
          }
        }}
        onToggleMusic={handleToggleMusic}
        onToggleSfx={handleToggleSfx}
        onToggleLang={handleToggleLang}
        onToggleTouch={() => setShowTouchControls((v) => !v)}
        onOpenChangelog={() => {
          setChangelogOrigin(inGameOrPaused ? 'PAUSED' : 'TITLE_MENU');
          setSettingsOpen(false);
          setScreen('CHANGELOG');
        }}
        onPause={() => {
          setSettingsOpen(false);
          setScreen('PAUSED');
        }}
        onRestartLevel={handleRestartLevel}
        onOpenWorldMap={() => {
          clearInput();
          setSettingsOpen(false);
          setScreen('WORLD_MAP');
        }}
        onBackToTitle={() => {
          clearInput();
          setSettingsOpen(false);
          setScreen('TITLE_MENU');
        }}
      />

      <OfflineIndicator lang={lang} />
    </div>
  );
}
