import React from 'react';
import { GameLevelConfig } from '../types/levels';
import { PlayableHero } from '../types/heroes';
import { GameSettings, TRANSLATIONS } from '../types/settings';
import { sound } from '../services/audio';
import { Trophy, Gift, ArrowRight, RotateCcw, Home, Sparkles, Star, ShieldCheck } from 'lucide-react';

interface LevelVictoryModalProps {
  levelConfig: GameLevelConfig;
  nextLevelConfig?: GameLevelConfig;
  hero: PlayableHero;
  score: number;
  kills: number;
  soulsEarned: number;
  timeSurvived: number;
  settings: GameSettings;
  onProceedNextLevel: () => void;
  onReplayLevel: () => void;
  onReturnCamp: () => void;
}

export const LevelVictoryModal: React.FC<LevelVictoryModalProps> = ({
  levelConfig,
  nextLevelConfig,
  hero,
  score,
  kills,
  soulsEarned,
  timeSurvived,
  settings,
  onProceedNextLevel,
  onReplayLevel,
  onReturnCamp,
}) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none font-pixel animate-fadeIn">
      <div className="relative w-full max-w-lg bg-slate-950 pixel-border-gold p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.3)] flex flex-col gap-5 text-white text-center">
        {/* Top Trophy Banner */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 pixel-border-gold bg-amber-950 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.5)]">
            <Trophy className="w-7 h-7 text-amber-400" />
          </div>
          <span className="text-[8px] font-pixel tracking-widest text-amber-400 uppercase">
            {levelConfig.themeTitle}
          </span>
          <h2 className="text-base sm:text-lg font-pixel text-white tracking-wide">
            {t.level_completed}
          </h2>
          <p className="text-[8px] font-pixel text-slate-300">
            {levelConfig.title} Cleared by <strong className="text-amber-300">{hero.name}</strong>
          </p>
        </div>

        {/* Level Stats Breakdown in Stepped Pixel Boxes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-900 pixel-border-dark p-3">
          <div className="flex flex-col items-center">
            <span className="text-[7px] font-pixel text-slate-400 uppercase">{t.score}</span>
            <span className="text-xs sm:text-sm font-pixel text-white mt-1">{score.toLocaleString()}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[7px] font-pixel text-slate-400 uppercase">{t.demons_slain}</span>
            <span className="text-xs sm:text-sm font-pixel text-rose-400 mt-1">{kills}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[7px] font-pixel text-slate-400 uppercase">{t.souls_collected}</span>
            <span className="text-xs sm:text-sm font-pixel text-amber-400 mt-1">+{soulsEarned}</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[7px] font-pixel text-slate-400 uppercase">{t.clear_time}</span>
            <span className="text-xs sm:text-sm font-pixel text-sky-400 mt-1">{formatTime(timeSurvived)}</span>
          </div>
        </div>

        {/* Stage Rewards & Unlocked Perks Showcase */}
        <div className="p-3 bg-amber-950/40 pixel-border-dark text-left flex flex-col gap-2">
          <div className="flex items-center gap-2 text-[8px] font-pixel text-amber-300 uppercase">
            <Gift className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.stage_rewards}</span>
          </div>
          <div className="flex items-center justify-between text-[8px] font-pixel text-slate-200">
            <span>SOULS BOUNTY:</span>
            <span className="text-amber-400 font-bold">+{levelConfig.rewardSouls} SOULS</span>
          </div>
          {levelConfig.unlockedPerk && (
            <div className="flex items-center gap-2 text-[7px] font-pixel text-emerald-300 bg-emerald-950/60 p-2 pixel-border-dark">
              <Star className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span><strong>PERK UNLOCKED:</strong> {levelConfig.unlockedPerk}</span>
            </div>
          )}
        </div>

        {/* Next Adventure Preview */}
        {nextLevelConfig && (
          <div className="text-[8px] font-pixel text-slate-400 flex items-center justify-center gap-2">
            <span>NEXT STAGE:</span>
            <span className="text-rose-400 uppercase">{nextLevelConfig.title}</span>
            <span>({nextLevelConfig.requiredKills} DEMONS)</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          {nextLevelConfig ? (
            <button
              onClick={() => {
                sound.playAchievement();
                onProceedNextLevel();
              }}
              className="w-full py-3.5 pixel-btn bg-amber-500 hover:bg-amber-400 text-slate-950 font-pixel text-[9px] font-black tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.5)] cursor-pointer"
            >
              <span>{t.next_level}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <div className="text-[10px] font-pixel text-amber-400">
              🎉 CAMPAIGN COMPLETED! YOU SAVED THE REALM!
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                sound.playClick();
                onReplayLevel();
              }}
              className="py-2.5 pixel-btn pixel-border-dark bg-slate-900 hover:bg-slate-800 text-slate-300 text-[8px] font-pixel flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              {t.replay_level}
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onReturnCamp();
              }}
              className="py-2.5 pixel-btn pixel-border-dark bg-slate-900 hover:bg-slate-800 text-slate-300 text-[8px] font-pixel flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Home className="w-3 h-3" />
              {t.return_camp}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
