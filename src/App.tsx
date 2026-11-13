import React, { useState, useEffect } from 'react';
import { 
  GameState, 
  UserProfile, 
} from './types/game';
import { GameOverModal } from './components/GameOverModal';
import { PauseModal } from './components/PauseModal';
import { AuthModal } from './components/AuthModal';

// Ronin Campaign Components
import { GAME_LEVELS, GameLevelConfig } from './types/levels';
import { PLAYABLE_HEROES, PlayableHero } from './types/heroes';
import { GameSettings, DEFAULT_SETTINGS } from './types/settings';
import { CoverPage } from './components/CoverPage';
import { Dashboard } from './components/Dashboard';
import { RoninGameCanvas } from './components/RoninGameCanvas';
import { LevelSelectModal } from './components/LevelSelectModal';
import { HeroSelectModal } from './components/HeroSelectModal';
import { LevelVictoryModal } from './components/LevelVictoryModal';
import { SettingsModal } from './components/SettingsModal';
import { GamerBuilderSuite } from './components/GamerBuilderSuite';
import {
  BuilderWorkspaceMode,
  CombatBalanceConfig,
  EnvironmentConfig,
  WaveSequenceStep,
  LiveCombatTelemetry,
  DEFAULT_COMBAT_BALANCE,
  DEFAULT_ENVIRONMENT_CONFIG,
  PRO_LEVEL_PRESETS,
} from './types/builder';
import { SlashEnemy, RoninPlayer } from './types/ronin';
import { sound } from './services/audio';

export default function App() {
  // User Profile
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('shadow_ronin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [authModalMode, setAuthModalMode] = useState<'login' | 'register' | null>(null);

  // -------------------------------------------------------------
  // SHADOW RONIN 3D ACTION RPG STATE
  // -------------------------------------------------------------
  // Default to 'PLAYING' with full visible hero matching user reference image
  const [roninState, setRoninState] = useState<GameState>('COVER');
  const [showLevelMap, setShowLevelMap] = useState<boolean>(false);
  const [showHeroSelect, setShowHeroSelect] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [cameraMode3D, setCameraMode3D] = useState<boolean>(true);

  const [settings, setSettings] = useState<GameSettings>(() => {
    try {
      const saved = localStorage.getItem('shadow_ronin_settings');
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  const [unlockedHeroIds, setUnlockedHeroIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('shadow_ronin_unlocked_heroes');
      return saved ? JSON.parse(saved) : ['hooded_rogue', 'red_warrior', 'elven_archer', 'armored_paladin'];
    } catch {
      return ['hooded_rogue', 'red_warrior', 'elven_archer', 'armored_paladin'];
    }
  });

  const [currentHero, setCurrentHero] = useState<PlayableHero>(() => {
    try {
      const savedHeroId = localStorage.getItem('shadow_ronin_selected_hero');
      const found = PLAYABLE_HEROES.find((h) => h.id === savedHeroId);
      // Default to Sylas Swiftbough (Male Elven Archer), matching the user reference image
      return found || PLAYABLE_HEROES.find((h) => h.id === 'elven_archer') || PLAYABLE_HEROES[0];
    } catch {
      return PLAYABLE_HEROES.find((h) => h.id === 'elven_archer') || PLAYABLE_HEROES[0];
    }
  });

  const [userSouls, setUserSouls] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('shadow_ronin_user_souls');
      return saved ? parseInt(saved, 10) : 1800;
    } catch {
      return 1800;
    }
  });

  const [unlockedLevel, setUnlockedLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('shadow_ronin_unlocked_level');
      return saved ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
    }
  });

  const [currentLevelConfig, setCurrentLevelConfig] = useState<GameLevelConfig>(
    GAME_LEVELS[0]
  );

  const [levelClearStats, setLevelClearStats] = useState<{
    score: number;
    kills: number;
    soulsEarned: number;
    timeSurvived: number;
  } | null>(null);

  const [endStats, setEndStats] = useState<{ score: number; kills: number; wave: number; timeSurvived: number }>({
    score: 0,
    kills: 0,
    wave: 1,
    timeSurvived: 0,
  });

  // -------------------------------------------------------------
  // PRO GAMER BUILDER SUITE STATE (Defaults to PLAY for pure gameplay immersion)
  // -------------------------------------------------------------
  const [workspaceMode, setWorkspaceMode] = useState<BuilderWorkspaceMode>(() => {
    try {
      const saved = localStorage.getItem('builder_workspace_mode');
      return (saved as BuilderWorkspaceMode) || 'PLAY';
    } catch {
      return 'PLAY';
    }
  });

  const [combatConfig, setCombatConfig] = useState<CombatBalanceConfig>(() => {
    try {
      const saved = localStorage.getItem('builder_combat_config');
      return saved ? JSON.parse(saved) : DEFAULT_COMBAT_BALANCE;
    } catch {
      return DEFAULT_COMBAT_BALANCE;
    }
  });

  const [envConfig, setEnvConfig] = useState<EnvironmentConfig>(() => {
    try {
      const saved = localStorage.getItem('builder_env_config');
      return saved ? JSON.parse(saved) : DEFAULT_ENVIRONMENT_CONFIG;
    } catch {
      return DEFAULT_ENVIRONMENT_CONFIG;
    }
  });

  const [waveSteps, setWaveSteps] = useState<WaveSequenceStep[]>(() => PRO_LEVEL_PRESETS[0].waves);

  const [telemetry, setTelemetry] = useState<LiveCombatTelemetry>({
    currentDps: 0,
    peakDps: 0,
    apm: 0,
    totalDamageDealt: 0,
    totalDamageTaken: 0,
    hitsLanded: 0,
    critsLanded: 0,
    parriesExecuted: 0,
    parryAccuracyPct: 100,
    dodgeRolls: 0,
    stylePoints: 450,
    styleRank: 'D',
    fps: 60,
    frameTimeMs: 16,
    activeEntityCount: 1,
  });

  const [selectedEntity, setSelectedEntity] = useState<SlashEnemy | RoninPlayer | null>(null);
  const [activeEnemies, setActiveEnemies] = useState<SlashEnemy[]>([]);
  const [spawnEnemySignal, setSpawnEnemySignal] = useState<{ type: string; timestamp: number } | null>(null);
  const [clearEnemiesSignal, setClearEnemiesSignal] = useState<number>(0);
  const [resetArenaSignal, setResetArenaSignal] = useState<number>(0);
  const startLevel = (levelConfig: GameLevelConfig) => {
    setCurrentLevelConfig(levelConfig);
    setLevelClearStats(null);
    setEndStats({ score: 0, kills: 0, wave: levelConfig.levelNumber, timeSurvived: 0 });
    setResetArenaSignal((value) => value + 1);
    setRoninState('PLAYING');
  };


  const handleUpdateCombatConfig = (patch: Partial<CombatBalanceConfig>) => {
    setCombatConfig((prev) => {
      const updated = { ...prev, ...patch };
      try {
        localStorage.setItem('builder_combat_config', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleUpdateEnvConfig = (patch: Partial<EnvironmentConfig>) => {
    setEnvConfig((prev) => {
      const updated = { ...prev, ...patch };
      try {
        localStorage.setItem('builder_env_config', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleSetWorkspaceMode = (mode: BuilderWorkspaceMode) => {
    setWorkspaceMode(mode);
    try {
      localStorage.setItem('builder_workspace_mode', mode);
    } catch {}
    sound.playClick();
  };

  const handleToggleWorkspaceMode = () => {
    const nextMode = workspaceMode === 'PLAY' ? 'BUILDER' : workspaceMode === 'BUILDER' ? 'HYBRID' : 'PLAY';
    handleSetWorkspaceMode(nextMode);
  };

  const handleSpawnEnemy = (type: 'lesser_demon' | 'flying_stinger' | 'shadow_ninja' | 'oni_boss' | 'malakath_boss') => {
    setSpawnEnemySignal({ type, timestamp: Date.now() });
    sound.playBladeSlash();
  };

  const handleSpawnCurrentWave = (stepIndex: number) => {
    const step = waveSteps[stepIndex];
    if (!step) return;
    step.mobTypes.forEach((t) => {
      setSpawnEnemySignal({ type: t, timestamp: Date.now() + Math.random() * 100 });
    });
  };

  const handleClearAllEnemies = () => {
    setClearEnemiesSignal(Date.now());
  };

  const handleResetArena = () => {
    setResetArenaSignal(Date.now());
  };

  // User auth update
  const handleUserUpdated = (user: UserProfile | null) => {
    setCurrentUser(user);
    if (user) {
      localStorage.setItem('shadow_ronin_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('shadow_ronin_user');
    }
  };

  // Play as Guest
  const handlePlayAsGuest = async () => {
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success && data.user) {
        handleUserUpdated(data.user);
        setAuthModalMode(null);
        return;
      }
    } catch {}

    const guestNum = Math.floor(1000 + Math.random() * 9000);
    const fallbackGuest: UserProfile = {
      id: `guest_${Date.now()}_${guestNum}`,
      username: `Ronin_${guestNum}`,
      email: `guest_${guestNum}@ronin.local`,
      callsign: `RONIN-${guestNum}`,
      createdAt: Date.now(),
      lastLogin: Date.now(),
      isGuest: true,
      stats: {
        totalMatches: 0,
        totalKills: 0,
        highestWave: 1,
        highestScore: 0,
        totalPlayTime: 0,
        victories: 0,
      },
      unlockedCharacters: ['armored_paladin', 'hooded_rogue'],
      credits: 200,
    };
    handleUserUpdated(fallbackGuest);
    setAuthModalMode(null);
  };

  // Global Keyboard listener for pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setRoninState((prev) => (prev === 'PLAYING' ? 'PAUSED' : prev === 'PAUSED' ? 'PLAYING' : prev));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none font-sans bg-slate-950 text-white">
      {/* ============================================================== */}
      {/* SHADOW RONIN: 3D DEMON SLAYER RPG                              */}
      {/* ============================================================== */}

      {/* Cover Page */}
      {roninState === 'COVER' && (
        <CoverPage
          onEnter={() => {
            if (currentUser) {
              setRoninState('DASHBOARD');
            } else {
              setAuthModalMode('login');
            }
          }}
          onOpenAuth={(mode) => setAuthModalMode(mode)}
          onPlayAsGuest={handlePlayAsGuest}
          onOpenSettings={() => setShowSettings(true)}
          hasUser={!!currentUser}
          username={currentUser?.callsign || currentUser?.username}
          isGuest={currentUser?.isGuest}
          settings={settings}
        />
      )}

      {/* Dashboard */}
      {roninState === 'DASHBOARD' && currentUser && (
        <Dashboard
          user={currentUser}
          currentHero={currentHero}
          unlockedLevel={unlockedLevel}
          userSouls={userSouls}
          settings={settings}
          onDeploy={() => {
            startLevel(GAME_LEVELS[Math.max(0, unlockedLevel - 1)] || GAME_LEVELS[0]);
          }}
          onOpenHeroSelect={() => setShowHeroSelect(true)}
          onOpenLevelMap={() => setShowLevelMap(true)}
          onOpenSettings={() => setShowSettings(true)}
          onLogout={() => {
            handleUserUpdated(null);
            setRoninState('COVER');
          }}
          onUserUpdated={handleUserUpdated}
        />
      )}

      {/* Ronin Game Arena & Gamer Builder Workstation */}
      {(roninState === 'PLAYING' || roninState === 'PAUSED' || roninState === 'GAME_OVER') && (
        <div className="relative w-full h-full flex flex-col bg-slate-950 overflow-hidden font-mono select-none">
          {workspaceMode === 'PLAY' ? (
            // 1. FULL IMMERSIVE PRO PLAY VIEW
            <div className="relative w-full h-full">
              <RoninGameCanvas
                key={resetArenaSignal}
                currentHero={currentHero}
                currentLevelConfig={currentLevelConfig}
                settings={settings}
                cameraMode3D={cameraMode3D}
                onLevelComplete={(stats) => {
                  const nextLevelNum = currentLevelConfig.levelNumber + 1;
                  const newUnlocked = Math.max(unlockedLevel, Math.min(50, nextLevelNum));
                  setUnlockedLevel(newUnlocked);
                  const totalSoulsAwarded = stats.souls;
                  setUserSouls((prev) => prev + totalSoulsAwarded);
                  setLevelClearStats({
                    score: stats.score,
                    kills: stats.kills,
                    soulsEarned: totalSoulsAwarded,
                    timeSurvived: stats.timeSurvived,
                  });
                  setRoninState('VICTORY');
                }}
                onGameOver={(stats) => {
                  setEndStats({
                    score: stats.score,
                    kills: stats.kills,
                    wave: currentLevelConfig.levelNumber,
                    timeSurvived: stats.timeSurvived,
                  });
                  setRoninState('GAME_OVER');
                }}
                onOpenLevelMap={() => setShowLevelMap(true)}
                onOpenHeroSelect={() => setShowHeroSelect(true)}
                onOpenSettings={() => setShowSettings(true)}
                onReturnToCamp={() => setRoninState(currentUser ? 'DASHBOARD' : 'COVER')}
                isPaused={roninState !== 'PLAYING'}
                isGuest={currentUser?.isGuest}
                userCallsign={currentUser?.callsign || 'SYLAS'}
                builderEnv={envConfig}
                builderCombat={combatConfig}
                workspaceMode={workspaceMode}
                onToggleWorkspaceMode={handleToggleWorkspaceMode}
                onUpdateTelemetry={setTelemetry}
                onSelectEntity={setSelectedEntity}
                selectedEntityId={selectedEntity && 'id' in selectedEntity ? selectedEntity.id : null}
                spawnEnemySignal={spawnEnemySignal}
                clearEnemiesSignal={clearEnemiesSignal}
                resetArenaSignal={resetArenaSignal}
                onSyncEnemies={setActiveEnemies}
              />
            </div>
          ) : (
            // 2. PRO GAMER BUILDER SUITE & LIVE HYBRID WORKSTATION
            <div className="relative w-full h-full flex flex-col">
              <GamerBuilderSuite
                workspaceMode={workspaceMode}
                onSetWorkspaceMode={handleSetWorkspaceMode}
                combatConfig={combatConfig}
                onUpdateCombatConfig={handleUpdateCombatConfig}
                envConfig={envConfig}
                onUpdateEnvConfig={handleUpdateEnvConfig}
                waveSteps={waveSteps}
                onUpdateWaveSteps={setWaveSteps}
                onSpawnEnemy={handleSpawnEnemy}
                onSpawnCurrentWave={handleSpawnCurrentWave}
                onClearAllEnemies={handleClearAllEnemies}
                onResetArena={handleResetArena}
                telemetry={telemetry}
                selectedEntity={selectedEntity}
                onSelectEntity={setSelectedEntity}
                activeEnemies={activeEnemies}
                currentHero={currentHero}
                isPaused={roninState !== 'PLAYING'}
                onTogglePause={() => setRoninState(roninState === 'PLAYING' ? 'PAUSED' : 'PLAYING')}
              />

              {/* Integrated 3D Viewport inside the Studio */}
              <div
                className={`absolute top-12 bottom-0 overflow-hidden ${
                  workspaceMode === 'BUILDER'
                    ? 'left-72 right-80'
                    : 'left-0 right-80'
                }`}
              >
                <RoninGameCanvas
                  key={resetArenaSignal}
                  currentHero={currentHero}
                  currentLevelConfig={currentLevelConfig}
                  settings={settings}
                  onLevelComplete={(stats) => {
                    const nextLevelNum = currentLevelConfig.levelNumber + 1;
                    const newUnlocked = Math.max(unlockedLevel, Math.min(50, nextLevelNum));
                    setUnlockedLevel(newUnlocked);
                    const totalSoulsAwarded = stats.souls;
                    setUserSouls((prev) => prev + totalSoulsAwarded);
                    setLevelClearStats({
                      score: stats.score,
                      kills: stats.kills,
                      soulsEarned: totalSoulsAwarded,
                      timeSurvived: stats.timeSurvived,
                    });
                    setRoninState('VICTORY');
                  }}
                  onGameOver={(stats) => {
                    setEndStats({
                      score: stats.score,
                      kills: stats.kills,
                      wave: currentLevelConfig.levelNumber,
                      timeSurvived: stats.timeSurvived,
                    });
                    setRoninState('GAME_OVER');
                  }}
                  onOpenLevelMap={() => setShowLevelMap(true)}
                  onOpenHeroSelect={() => setShowHeroSelect(true)}
                  onOpenSettings={() => setShowSettings(true)}
                  onReturnToCamp={() => setRoninState(currentUser ? 'DASHBOARD' : 'COVER')}
                  isPaused={roninState !== 'PLAYING'}
                  isGuest={currentUser?.isGuest}
                  userCallsign={currentUser?.callsign || 'LADY_VALERIE'}
                  builderEnv={envConfig}
                  builderCombat={combatConfig}
                  workspaceMode={workspaceMode}
                  onToggleWorkspaceMode={handleToggleWorkspaceMode}
                  onUpdateTelemetry={setTelemetry}
                  onSelectEntity={setSelectedEntity}
                  selectedEntityId={selectedEntity && 'id' in selectedEntity ? selectedEntity.id : null}
                  spawnEnemySignal={spawnEnemySignal}
                  clearEnemiesSignal={clearEnemiesSignal}
                  resetArenaSignal={resetArenaSignal}
                  onSyncEnemies={setActiveEnemies}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Victory Modal */}
      {roninState === 'VICTORY' && levelClearStats && (
        <LevelVictoryModal
          levelConfig={currentLevelConfig}
          nextLevelConfig={
            currentLevelConfig.levelNumber < 50
              ? GAME_LEVELS[currentLevelConfig.levelNumber]
              : undefined
          }
          hero={currentHero}
          score={levelClearStats.score}
          kills={levelClearStats.kills}
          soulsEarned={levelClearStats.soulsEarned}
          timeSurvived={levelClearStats.timeSurvived}
          settings={settings}
          onProceedNextLevel={() => {
            const nextLevelNum = currentLevelConfig.levelNumber + 1;
            if (nextLevelNum <= 50) {
              startLevel(GAME_LEVELS[nextLevelNum - 1]);
            } else {
              setRoninState('DASHBOARD');
            }
          }}
          onReplayLevel={() => {
            startLevel(currentLevelConfig);
          }}
          onReturnCamp={() => setRoninState(currentUser ? 'DASHBOARD' : 'COVER')}
        />
      )}

      {/* Map Modal */}
      {showLevelMap && (
        <LevelSelectModal
          unlockedLevel={unlockedLevel}
          currentSelectedLevel={currentLevelConfig.levelNumber}
          onSelectLevel={(lvl) => {
            setShowLevelMap(false);
            startLevel(lvl);
          }}
          onClose={() => setShowLevelMap(false)}
        />
      )}

      {/* Hero Select Modal */}
      {showHeroSelect && (
        <HeroSelectModal
          currentHero={currentHero}
          unlockedHeroIds={unlockedHeroIds}
          userSouls={userSouls}
          onSelectHero={(hero) => setCurrentHero(hero)}
          onUnlockHero={(hero) => {
            if (userSouls < hero.unlockCostSouls) return;
            const remaining = userSouls - hero.unlockCostSouls;
            setUserSouls(remaining);
            setUnlockedHeroIds([...unlockedHeroIds, hero.id]);
            setCurrentHero(hero);
          }}
          onClose={() => setShowHeroSelect(false)}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={(newSettings) => setSettings(newSettings)}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Ronin Pause Modal */}
      {roninState === 'PAUSED' && (
        <PauseModal
          onResume={() => setRoninState('PLAYING')}
          onRestart={() => startLevel(currentLevelConfig)}
          onMainMenu={() => setRoninState(currentUser ? 'DASHBOARD' : 'COVER')}
        />
      )}

      {/* Ronin Game Over Modal */}
      {roninState === 'GAME_OVER' && (
        <GameOverModal
          isVictory={false}
          score={endStats.score}
          kills={endStats.kills}
          wave={currentLevelConfig.levelNumber}
          timeSurvived={endStats.timeSurvived}
          highScore={125000}
          characterName={`${currentHero.name} · Level ${currentLevelConfig.levelNumber}`}
          onPlayAgain={() => startLevel(currentLevelConfig)}
          onMainMenu={() => setRoninState(currentUser ? 'DASHBOARD' : 'COVER')}
        />
      )}

      {/* Global Auth Modal */}
      {authModalMode && (
        <AuthModal
          initialMode={authModalMode}
          onClose={() => setAuthModalMode(null)}
          onPlayAsGuest={handlePlayAsGuest}
          onSuccess={(user) => {
            handleUserUpdated(user);
            setAuthModalMode(null);
          }}
        />
      )}
    </div>
  );
}
