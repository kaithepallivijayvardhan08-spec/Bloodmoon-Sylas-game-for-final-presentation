import React from 'react';
import { PLAYABLE_HEROES, PlayableHero } from '../types/heroes';
import { sound } from '../services/audio';
import { Shield, Zap, Crosshair, Flame, Check, Lock, ChevronRight, Sparkles } from 'lucide-react';

interface HeroSelectModalProps {
  currentHero: PlayableHero;
  unlockedHeroIds: string[];
  userSouls: number;
  onSelectHero: (hero: PlayableHero) => void;
  onUnlockHero: (hero: PlayableHero) => void;
  onClose: () => void;
}

export const HeroSelectModal: React.FC<HeroSelectModalProps> = ({
  currentHero,
  unlockedHeroIds,
  userSouls,
  onSelectHero,
  onUnlockHero,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none font-pixel">
      <div className="relative w-full max-w-5xl bg-slate-950 pixel-border-gold p-6 sm:p-8 shadow-2xl flex flex-col gap-6 text-white max-h-[92vh] overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 pixel-border-dark bg-sky-950/80 flex items-center justify-center text-sky-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-pixel tracking-wider text-amber-300">
                ROSTER OF CHAMPIONS
              </h2>
              <p className="text-[9px] text-slate-400 font-pixel mt-1">
                SELECT YOUR REBELLION HERO · WEAPONS, ROLES & BLOODMOON ULTIMATES
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 pixel-border-dark">
              <span className="text-amber-400 text-[8px] font-pixel">SOULS:</span>
              <span className="text-[10px] font-pixel text-amber-300">{userSouls.toLocaleString()}</span>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="px-2.5 py-1.5 pixel-btn pixel-border-dark bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white text-[10px] font-pixel cursor-pointer"
            >
              [X]
            </button>
          </div>
        </div>

        {/* 4 Playable Character Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLAYABLE_HEROES.map((hero) => {
            const isUnlocked = unlockedHeroIds.includes(hero.id);
            const isSelected = currentHero.id === hero.id;
            const canAfford = userSouls >= hero.unlockCostSouls;

            return (
              <div
                key={hero.id}
                className={`relative flex flex-col justify-between p-4 transition-all duration-200 ${
                  isSelected
                    ? 'bg-slate-900 pixel-border-gold shadow-[0_0_20px_rgba(245,158,11,0.3)] scale-[1.02]'
                    : isUnlocked
                      ? 'bg-slate-950 pixel-border-dark hover:border-slate-500 hover:bg-slate-900'
                      : 'bg-slate-950/80 pixel-border-dark opacity-75'
                }`}
              >
                {/* Character Portrait & Role Badge */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className="text-[8px] font-pixel uppercase px-1.5 py-0.5 border"
                      style={{
                        backgroundColor: `${hero.themeColor}20`,
                        color: hero.themeColor,
                        borderColor: `${hero.themeColor}50`,
                      }}
                    >
                      {hero.role.split(' ')[0]}
                    </span>
                    {isSelected && (
                      <span className="text-[7px] font-pixel bg-amber-400 text-slate-950 px-1 py-0.5">
                        ACTIVE
                      </span>
                    )}
                  </div>

                  {/* High Quality Sprite Showcase Box */}
                  <div className="w-full h-44 pixel-border-dark bg-slate-950 flex items-center justify-center p-2 mb-3 overflow-hidden relative group">
                    <img
                      src={hero.spriteSrc}
                      alt={hero.name}
                      className="max-h-full object-contain pixel-art filter contrast-125 brightness-110 drop-shadow-[0_0_12px_rgba(255,255,255,0.2)] transition-transform duration-300 group-hover:scale-110"
                    />
                    {/* Weapon Type Tag */}
                    <div className="absolute bottom-1.5 left-1.5 bg-slate-900/90 border border-slate-700 px-1.5 py-0.5 text-[7px] font-pixel text-slate-300 flex items-center gap-1">
                      {hero.attackType === 'projectile' ? <Crosshair className="w-2.5 h-2.5 text-emerald-400" /> : <Flame className="w-2.5 h-2.5 text-orange-400" />}
                      <span className="uppercase">{hero.weaponType.replace('_', ' ')}</span>
                    </div>
                  </div>

                  {/* Character Name & Title */}
                  <h3 className="text-xs font-pixel text-amber-200 mb-1">{hero.name}</h3>
                  <p className="text-[8px] font-pixel text-slate-400 mb-2">{hero.title}</p>
                  <p className="text-[8px] font-pixel text-slate-300 leading-relaxed mb-3 line-clamp-3">
                    {hero.description}
                  </p>

                  {/* Combat Stats Bars in Pixel Art */}
                  <div className="space-y-1.5 mb-4 text-[7px] font-pixel text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="text-rose-400">ATK</span>
                      <div className="w-24 h-2 bg-slate-900 pixel-border-dark overflow-hidden">
                        <div className="h-full bg-rose-500" style={{ width: `${hero.stats.attack}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sky-400">DEF</span>
                      <div className="w-24 h-2 bg-slate-900 pixel-border-dark overflow-hidden">
                        <div className="h-full bg-sky-500" style={{ width: `${hero.stats.defense}%` }} />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-amber-400">SPD</span>
                      <div className="w-24 h-2 bg-slate-900 pixel-border-dark overflow-hidden">
                        <div className="h-full bg-amber-500" style={{ width: `${hero.stats.speed}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Signature Special Skill Box */}
                  <div className="p-2 pixel-border-dark bg-slate-950 text-[8px] font-pixel mb-4">
                    <div className="flex items-center gap-1 text-amber-300 mb-0.5">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>{hero.specialSkillName}</span>
                    </div>
                    <p className="text-slate-400 text-[7px] leading-tight">
                      {hero.specialDescription}
                    </p>
                  </div>
                </div>

                {/* Bottom Action Button */}
                <div>
                  {isUnlocked ? (
                    <button
                      onClick={() => {
                        sound.playAchievement();
                        onSelectHero(hero);
                        onClose();
                      }}
                      className={`w-full py-2.5 pixel-btn font-pixel text-[8px] tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-black'
                          : 'bg-slate-900 hover:bg-slate-800 text-white pixel-border-dark'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      {isSelected ? 'ACTIVE' : 'SELECT HERO'}
                    </button>
                  ) : (
                    <button
                      disabled={!canAfford}
                      onClick={() => {
                        sound.playLevelUp();
                        onUnlockHero(hero);
                      }}
                      className={`w-full py-2.5 pixel-btn font-pixel text-[7px] tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                        canAfford
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 cursor-pointer'
                          : 'bg-slate-900/60 text-slate-500 border border-slate-800 cursor-not-allowed'
                      }`}
                    >
                      <Lock className="w-3 h-3" />
                      UNLOCK ({hero.unlockCostSouls} SOULS)
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
