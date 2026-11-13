import React from 'react';
import { sound } from '../services/audio';
import { GameSettings, TRANSLATIONS } from '../types/settings';
import { Play, UserCheck, Shield, Zap, ChevronRight, UserX, Flame, Skull, Settings, Map, Sparkles } from 'lucide-react';

interface CoverPageProps {
  onEnter: () => void;
  onOpenAuth: (mode: 'login' | 'register') => void;
  onPlayAsGuest: () => void;
  onOpenSettings: () => void;
  hasUser: boolean;
  username?: string;
  isGuest?: boolean;
  settings: GameSettings;
}

export const CoverPage: React.FC<CoverPageProps> = ({
  onEnter,
  onOpenAuth,
  onPlayAsGuest,
  onOpenSettings,
  hasUser,
  username,
  isGuest,
  settings,
}) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;
  const isSun = settings.colorMode === 'sun';

  return (
    <div className={`relative min-h-screen w-full flex flex-col justify-between p-6 md:p-12 select-none overflow-hidden font-sans ${
      isSun ? 'bg-slate-100 text-slate-900' : 'bg-slate-950 text-white'
    }`}>
      {/* Cinematic 16-Bit Dark Fantasy Cover Backdrop */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-45 scale-105 transition-transform duration-1000 ease-out"
        style={{
          backgroundImage: `url('/assets/images/shadow_ronin_cover_1790178660273.jpg')`,
        }}
      />
      {/* Atmospheric Gradients */}
      <div className={`absolute inset-0 pointer-events-none ${
        isSun 
          ? 'bg-gradient-to-t from-slate-100 via-slate-100/70 to-slate-100/40' 
          : 'bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/40'
      }`} />

      {/* Top Bar Branding */}
      <header className="relative z-10 w-full max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.5)] border border-rose-400/40">
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black font-mono tracking-wider">
              SHADOW RONIN <span className="text-rose-500">· BLOODMOON</span>
            </h1>
            <p className="text-[10px] font-mono tracking-widest text-slate-400">
              50-LEVEL CAMPAIGN · 4 PLAYABLE WARRIORS
            </p>
          </div>
        </div>

        {/* Auth status & Settings button */}
        <div className="flex items-center gap-2">
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

          {hasUser ? (
            <div className="flex items-center gap-2 bg-slate-900/80 border border-emerald-500/40 px-3 py-1.5 rounded-xl backdrop-blur-md">
              <span className={`w-2 h-2 rounded-full ${isGuest ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`} />
              <span className={`text-xs font-mono font-bold ${isGuest ? 'text-amber-300' : 'text-emerald-300'}`}>
                {isGuest ? `GUEST: ${username}` : `RONIN: ${username}`}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  sound.playClick();
                  onPlayAsGuest();
                }}
                className="px-3 py-1.5 text-xs font-mono font-bold text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 rounded-xl transition-all backdrop-blur-md flex items-center gap-1.5"
              >
                <UserX className="w-3.5 h-3.5" />
                GUEST
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenAuth('login');
                }}
                className="px-4 py-1.5 text-xs font-mono font-bold text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700 rounded-xl transition-all backdrop-blur-md"
              >
                LOGIN
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Hero Showcase Center Content */}
      <main className="relative z-10 max-w-4xl mx-auto my-auto text-center flex flex-col items-center py-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono font-semibold mb-6 tracking-wide backdrop-blur-md">
          <Skull className="w-3.5 h-3.5" />
          50-LEVEL DARK FANTASY EXPEDITION
        </div>

        <h2 className="text-4xl sm:text-6xl md:text-7xl font-black font-mono tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-100 to-rose-500 mb-6 drop-shadow-2xl">
          UNLEASH THE BLADE.<br />SLAY THE ONI.
        </h2>

        <p className="max-w-2xl text-slate-300 text-sm md:text-base leading-relaxed mb-8 drop-shadow font-mono">
          Pick your champion from 4 unique heroes. Battle across 50 themed levels, clear demonic hordes, collect souls, 
          and defeat Malakath the End-Bringer.
        </p>

        {/* Primary Call to Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center max-w-lg">
          <button
            onClick={() => {
              sound.playAchievement();
              onEnter();
            }}
            className="w-full sm:w-auto flex-1 py-4 px-8 rounded-2xl bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-mono font-black text-base tracking-wider shadow-[0_0_35px_rgba(239,68,68,0.5)] hover:shadow-[0_0_50px_rgba(239,68,68,0.7)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-3"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>{hasUser ? t.start_adventure : 'START EXPEDITION'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          {!hasUser && (
            <button
              onClick={() => {
                sound.playClick();
                onOpenAuth('register');
              }}
              className="w-full sm:w-auto py-4 px-6 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white font-mono font-bold text-sm border border-slate-700 transition-all backdrop-blur-md flex items-center justify-center gap-2"
            >
              <UserCheck className="w-4 h-4 text-rose-400" />
              CREATE CALLSIGN
            </button>
          )}
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-3 gap-4 md:gap-8 mt-12 w-full max-w-2xl text-center font-mono">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
            <div className="text-rose-400 font-bold text-sm md:text-base">4 UNIQUE CHAMPIONS</div>
            <div className="text-[11px] text-slate-400">Katana, Bow, Mace & Blades</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
            <div className="text-amber-400 font-bold text-sm md:text-base">50-LEVEL CAMPAIGN</div>
            <div className="text-[11px] text-slate-400">5 Distinct Adventure Themes</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-md">
            <div className="text-purple-400 font-bold text-sm md:text-base">COMBAT TELEGRAPHS</div>
            <div className="text-[11px] text-slate-400">Visible enemy attack windups</div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-6xl mx-auto flex items-center justify-between py-4 border-t border-slate-800/80 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-rose-400" />
          <span>SHADOW RONIN ENGINE v4.2 · PRODUCTION READY</span>
        </div>
        <div>REAL-TIME COMBAT READY</div>
      </footer>
    </div>
  );
};
