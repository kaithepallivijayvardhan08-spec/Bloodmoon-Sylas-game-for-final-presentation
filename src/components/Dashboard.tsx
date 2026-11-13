import React, { useState } from 'react';
import { UserProfile } from '../types/game';
import { PlayableHero, PLAYABLE_HEROES } from '../types/heroes';
import { GameLevelConfig, GAME_LEVELS } from '../types/levels';
import { GameSettings, TRANSLATIONS } from '../types/settings';
import { sound } from '../services/audio';
import { 
  Trophy, 
  Skull, 
  Zap, 
  Clock, 
  Trash2, 
  LogOut, 
  Play, 
  Shield, 
  User, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Map,
  Settings,
  Flame,
  Crosshair,
  Gift
} from 'lucide-react';

interface DashboardProps {
  user: UserProfile;
  currentHero: PlayableHero;
  unlockedLevel: number;
  userSouls: number;
  settings: GameSettings;
  onDeploy: () => void;
  onOpenHeroSelect: () => void;
  onOpenLevelMap: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
  onUserUpdated: (user: UserProfile | null) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  currentHero,
  unlockedLevel,
  userSouls,
  settings,
  onDeploy,
  onOpenHeroSelect,
  onOpenLevelMap,
  onOpenSettings,
  onLogout,
  onUserUpdated,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<'stats' | 'account' | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusNotice, setStatusNotice] = useState('');
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;

  const currentLevelConfig = GAME_LEVELS[Math.min(unlockedLevel - 1, GAME_LEVELS.length - 1)];

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m ${secs % 60}s`;
  };

  const handleDeleteData = async (deleteAccount: boolean) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/auth/delete-data/${user.id}?deleteAccount=${deleteAccount}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        sound.playAchievement();
        if (deleteAccount) {
          onUserUpdated(null);
          onLogout();
        } else {
          const updatedUser: UserProfile = {
            ...user,
            stats: {
              totalMatches: 0,
              totalKills: 0,
              highestWave: 1,
              highestScore: 0,
              totalPlayTime: 0,
              victories: 0,
            },
            credits: 100,
          };
          onUserUpdated(updatedUser);
          setStatusNotice('Game progress reset successfully.');
          setShowDeleteConfirm(null);
        }
      }
    } catch {
      setStatusNotice('Failed to communicate with database server.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`relative min-h-screen w-full flex flex-col justify-between p-4 md:p-8 font-sans overflow-y-auto ${
      settings.colorMode === 'sun' ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-white'
    }`}>
      {/* Background Graphic Grid */}
      <div 
        className="absolute inset-0 opacity-15 pointer-events-none bg-cover bg-center"
        style={{ backgroundImage: `url('${currentLevelConfig.bgSrc}')` }}
      />
      <div className={`absolute inset-0 pointer-events-none ${
        settings.colorMode === 'sun'
          ? 'bg-gradient-to-t from-slate-100 via-slate-100/90 to-slate-100'
          : 'bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950'
      }`} />

      {/* Top Navigation Bar */}
      <header className={`relative z-10 w-full max-w-6xl mx-auto flex items-center justify-between py-2 border-b ${
        settings.colorMode === 'sun' ? 'border-slate-300' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/40 flex items-center justify-center text-rose-500">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-black font-mono tracking-wider">
              SHADOW RONIN <span className="text-rose-500">· ADVENTURE HUB</span>
            </h1>
            <p className="text-[10px] font-mono text-slate-400">
              50-LEVEL EXPEDITION CAMPAIGN
            </p>
          </div>
        </div>

        {/* User Account Capsule & Settings */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              sound.playClick();
              onOpenSettings();
            }}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-amber-400 border border-amber-500/30 transition-colors flex items-center gap-1.5 text-xs font-mono font-bold"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">{t.settings}</span>
          </button>

          <div className="hidden sm:flex flex-col text-right font-mono">
            <div className="flex items-center justify-end gap-1.5">
              {user.isGuest && (
                <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/40 px-1.5 py-0.5 rounded font-bold">
                  GUEST SESSION
                </span>
              )}
              <span className="text-xs font-bold">{user.callsign || user.username}</span>
            </div>
            <span className="text-[10px] text-amber-400 font-bold">{userSouls.toLocaleString()} SOULS</span>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onLogout();
            }}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-rose-400 transition-colors"
            title={user.isGuest ? 'Exit Guest Session' : 'Log Out'}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Campaign Hub */}
      <main className="relative z-10 max-w-6xl mx-auto my-auto w-full py-6 flex flex-col gap-6">
        {/* Status Notice */}
        {statusNotice && (
          <div className="p-3 rounded-xl bg-sky-950/60 border border-sky-500/40 text-sky-300 font-mono text-xs flex items-center justify-between">
            <span>{statusNotice}</span>
            <button onClick={() => setStatusNotice('')} className="text-sky-400 hover:underline">
              Dismiss
            </button>
          </div>
        )}

        {/* HERO SHOWCASE & DEPLOY ACTION */}
        <div className={`relative overflow-hidden rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-2xl border-2 ${
          settings.colorMode === 'sun'
            ? 'bg-white border-amber-400/50'
            : 'bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 border-rose-500/40'
        }`}>
          {/* Active Champion Profile */}
          <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
            <div className="w-28 h-36 rounded-2xl bg-slate-950/80 border-2 border-slate-700 flex items-center justify-center p-2 relative group overflow-hidden shrink-0 shadow-lg">
              <img
                src={currentHero.spriteSrc}
                alt={currentHero.name}
                className="max-h-full object-contain filter contrast-125 brightness-110 drop-shadow-[0_0_12px_rgba(255,255,255,0.3)] transition-transform duration-300 group-hover:scale-110"
              />
              <span
                className="absolute top-1.5 left-1.5 text-[8px] font-black uppercase px-1.5 py-0.5 rounded border"
                style={{
                  backgroundColor: `${currentHero.themeColor}20`,
                  color: currentHero.themeColor,
                  borderColor: `${currentHero.themeColor}60`,
                }}
              >
                ACTIVE
              </span>
            </div>

            <div className="flex flex-col gap-1.5 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-semibold w-max mx-auto sm:mx-0">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                <span>CHAMPION: {currentHero.name.toUpperCase()}</span>
              </div>
              <h2 className="text-xl md:text-3xl font-black font-mono tracking-tight">
                {currentHero.title}
              </h2>
              <p className="text-xs text-slate-400 font-mono max-w-md">
                Weapon: <strong className="text-slate-200 uppercase">{currentHero.weaponType.replace('_', ' ')}</strong> · Skill: <strong className="text-amber-400">{currentHero.specialSkillName}</strong>
              </p>
              
              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenHeroSelect();
                  }}
                  className="px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-400/40 text-xs font-mono font-bold transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {t.select_hero}
                </button>

                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenLevelMap();
                  }}
                  className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-400/40 text-xs font-mono font-bold transition-all flex items-center gap-1.5"
                >
                  <Map className="w-3.5 h-3.5" />
                  {t.level_map} (LVL {unlockedLevel}/50)
                </button>
              </div>
            </div>
          </div>

          {/* Primary Adventure Start CTA */}
          <div className="flex flex-col items-center sm:items-end gap-2 w-full lg:w-auto shrink-0">
            <button
              onClick={() => {
                sound.playAchievement();
                onDeploy();
              }}
              className="w-full sm:w-auto px-8 py-5 rounded-2xl bg-gradient-to-r from-amber-500 via-rose-600 to-red-600 hover:from-amber-400 hover:to-rose-500 text-white font-mono font-black text-base tracking-wider shadow-[0_0_35px_rgba(244,63,94,0.6)] hover:shadow-[0_0_50px_rgba(244,63,94,0.8)] active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              <Play className="w-6 h-6 fill-white" />
              <span>{t.start_adventure} (LVL {unlockedLevel})</span>
            </button>
            <span className="text-[11px] font-mono text-slate-400">
              Target: {currentLevelConfig.title} · {currentLevelConfig.themeTitle}
            </span>
          </div>
        </div>

        {/* Campaign Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
              <Trophy className="w-4 h-4" /> {t.score.toUpperCase()}
            </div>
            <div className="text-2xl font-black text-white">
              {user.stats.highestScore.toLocaleString()} PTS
            </div>
            <span className="text-[10px] text-slate-400">High Score Record</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-rose-400 text-xs font-bold">
              <Skull className="w-4 h-4" /> {t.demons_slain.toUpperCase()}
            </div>
            <div className="text-2xl font-black text-white">
              {user.stats.totalKills.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400">Demons Banished</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-sky-400 text-xs font-bold">
              <Zap className="w-4 h-4" /> CAMPAIGN PROGRESS
            </div>
            <div className="text-2xl font-black text-white">
              LEVEL {unlockedLevel} / 50
            </div>
            <span className="text-[10px] text-slate-400">Expedition Progression</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col gap-1">
            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold">
              <Clock className="w-4 h-4" /> COMBAT TIME
            </div>
            <div className="text-2xl font-black text-white">
              {formatTime(user.stats.totalPlayTime)}
            </div>
            <span className="text-[10px] text-slate-400">{user.stats.totalMatches} Expeditions</span>
          </div>
        </div>

        {/* Quick control guide */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col gap-3 font-mono text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-black text-sky-300">
              <Crosshair className="w-4 h-4 text-rose-500" />
              <span>QUICK CONTROLS</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
              THIRD-PERSON VIEW
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-300">
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-sky-400 font-bold">MOVE</div>
              <div className="text-[10px] text-slate-400">W A S D · relative to camera</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-sky-400 font-bold">LOOK</div>
              <div className="text-[10px] text-slate-400">Click game, then move mouse</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-rose-400 font-bold">ATTACK</div>
              <div className="text-[10px] text-slate-400">Left click or J</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-sky-400 font-bold">JUMP</div>
              <div className="text-[10px] text-slate-400">Space</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-amber-400 font-bold">RUN</div>
              <div className="text-[10px] text-slate-400">Hold Shift</div>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <div className="text-purple-400 font-bold">ABILITIES</div>
              <div className="text-[10px] text-slate-400">Click the labeled buttons</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto py-3 flex items-center justify-between text-[11px] font-mono text-slate-500 border-t border-slate-800">
        <div>SHADOW RONIN · BLOODMOON REBELLION</div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowDeleteConfirm('stats')}
            className="hover:text-rose-400 transition-colors"
          >
            Reset Progress
          </button>
        </div>
      </footer>

      {/* Reset Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="max-w-md w-full p-6 rounded-3xl bg-slate-900 border border-rose-500/40 font-mono text-white flex flex-col gap-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-black">RESET CAMPAIGN PROGRESS?</h3>
            </div>
            <p className="text-xs text-slate-300">
              This will reset your match statistics, unlocked levels, and high scores back to Level 1.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold"
              >
                CANCEL
              </button>
              <button
                disabled={isDeleting}
                onClick={() => handleDeleteData(false)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
              >
                {isDeleting ? 'RESETTING...' : 'CONFIRM RESET'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
