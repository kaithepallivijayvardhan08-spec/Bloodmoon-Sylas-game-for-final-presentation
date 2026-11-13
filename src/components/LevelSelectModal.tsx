import React, { useState } from 'react';
import { GAME_LEVELS, GameLevelConfig } from '../types/levels';
import { sound } from '../services/audio';
import { Lock, Play, Trophy, Sparkles, ChevronLeft, ChevronRight, Skull, Shield, Award, Gift, Flame, Zap } from 'lucide-react';

interface LevelSelectModalProps {
  unlockedLevel: number;
  currentSelectedLevel: number;
  onSelectLevel: (levelConfig: GameLevelConfig) => void;
  onClose: () => void;
}

export const LevelSelectModal: React.FC<LevelSelectModalProps> = ({
  unlockedLevel,
  currentSelectedLevel,
  onSelectLevel,
  onClose,
}) => {
  const [page, setPage] = useState(Math.floor((currentSelectedLevel - 1) / 10));
  const levelsPerPage = 10;
  const totalPages = Math.ceil(GAME_LEVELS.length / levelsPerPage);

  const displayedLevels = GAME_LEVELS.slice(page * levelsPerPage, (page + 1) * levelsPerPage);
  const currentChapterTitle = displayedLevels[0]?.themeTitle || 'MALAKATH BESTIARY EXPEDITION';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none font-sans">
      <div className="relative w-full max-w-5xl bg-stone-950 border-2 border-amber-950 p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.9)] flex flex-col gap-5 text-white max-h-[92vh] overflow-y-auto rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-950/80 border border-red-700/60 flex items-center justify-center text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.4)]">
              <Skull className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black tracking-wider text-amber-400 uppercase">
                  MALAKATH'S 50 ASCENDED FORMS BESTIARY
                </h2>
                <span className="text-xs px-2 py-0.5 bg-red-950 border border-red-800 text-red-300 font-bold rounded">
                  GUARANTEED FINAL BOSS PER LEVEL
                </span>
              </div>
              <p className="text-xs text-stone-400 font-medium mt-0.5">
                {currentChapterTitle}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-400 hover:text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Level Grid (10 levels per chapter page) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {displayedLevels.map((lvl) => {
            const isUnlocked = lvl.levelNumber <= unlockedLevel;
            const isSelected = lvl.levelNumber === currentSelectedLevel;

            let badgeColor = 'bg-orange-950/70 border-orange-800/80 text-orange-400';
            if (lvl.bossArchetype === 'void_space') badgeColor = 'bg-purple-950/70 border-purple-800/80 text-purple-300';
            if (lvl.bossArchetype === 'flesh_blight') badgeColor = 'bg-emerald-950/70 border-emerald-800/80 text-emerald-300';
            if (lvl.bossArchetype === 'shadow_ice') badgeColor = 'bg-sky-950/70 border-sky-800/80 text-sky-300';
            if (lvl.bossArchetype === 'malakath_ascended') badgeColor = 'bg-red-900 border-red-600 text-amber-200 animate-pulse';

            return (
              <button
                key={lvl.levelNumber}
                disabled={!isUnlocked}
                onClick={() => {
                  sound.playAchievement();
                  onSelectLevel(lvl);
                }}
                className={`relative p-3.5 flex flex-col items-start justify-between gap-2.5 transition-all duration-200 text-left rounded-xl border cursor-pointer ${
                  isUnlocked
                    ? isSelected
                      ? 'bg-red-950/50 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.4)] scale-102 ring-2 ring-red-500/50'
                      : 'bg-stone-900/90 border-stone-800 hover:bg-stone-850 hover:border-stone-600'
                    : 'bg-stone-950/50 border-stone-900 opacity-40 cursor-not-allowed'
                }`}
              >
                {/* Level Number & Boss Indicator */}
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-black text-amber-400 font-mono">STAGE {lvl.levelNumber}</span>
                  <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border uppercase ${badgeColor}`}>
                    BOSS
                  </span>
                </div>

                {/* Boss Name & Title */}
                <div className="w-full flex flex-col gap-0.5 my-0.5">
                  <div className="text-xs font-black text-white uppercase tracking-tight truncate flex items-center gap-1.5">
                    <Skull className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    {lvl.bossName}
                  </div>
                  <div className="text-[11px] font-medium text-red-400 truncate">
                    {lvl.bossTitle}
                  </div>
                  <div className="text-[10px] leading-snug text-stone-400 line-clamp-2 min-h-[2.25rem]">
                    {lvl.bossDescription}
                  </div>
                  <div className="text-[10px] leading-snug text-amber-300 font-bold line-clamp-2">
                    SIGNATURE: {lvl.bossSpecialMove}
                  </div>
                </div>

                {/* Level Environment & Boss Stats */}
                <div className="w-full text-[11px] text-stone-400 flex flex-col gap-1 border-t border-stone-800/70 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-stone-400 truncate">{lvl.environmentName}</span>
                    <span className="font-mono text-red-400 text-[10px]">{lvl.bossHp} HP</span>
                  </div>
                  <div className="flex items-center justify-between text-amber-400 text-[10px] font-bold">
                    <span className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> {lvl.requiredGems} Gems to Summon
                    </span>
                    <span>+{lvl.rewardSouls} Souls</span>
                  </div>
                </div>

                {/* Selected Indicator */}
                {isSelected && (
                  <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 bg-red-600 rounded-full text-[10px] font-black text-white uppercase tracking-wider shadow-lg">
                    ACTIVE NOW
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Chapter Switcher Tabs */}
        <div className="flex items-center justify-between border-t border-stone-800 pt-4">
          <button
            disabled={page === 0}
            onClick={() => {
              sound.playClick();
              setPage((p) => Math.max(0, p - 1));
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 disabled:opacity-30 hover:bg-stone-850 text-xs font-bold cursor-pointer text-stone-300"
          >
            <ChevronLeft className="w-4 h-4" /> PREV CHAPTER
          </button>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button
                key={idx}
                onClick={() => setPage(idx)}
                className={`w-8 h-8 rounded-lg text-xs font-black cursor-pointer transition-colors ${
                  page === idx ? 'bg-red-600 text-white shadow-[0_0_12px_rgba(239,68,68,0.5)]' : 'bg-stone-900 text-stone-400 border border-stone-800 hover:bg-stone-800'
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <button
            disabled={page >= totalPages - 1}
            onClick={() => {
              sound.playClick();
              setPage((p) => Math.min(totalPages - 1, p + 1));
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 border border-stone-800 disabled:opacity-30 hover:bg-stone-850 text-xs font-bold cursor-pointer text-stone-300"
          >
            NEXT CHAPTER <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
