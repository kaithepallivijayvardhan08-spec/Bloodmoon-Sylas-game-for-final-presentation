import React, { useState } from 'react';
import { sound } from '../services/audio';
import { Trophy, Clock, Skull, Zap, RotateCcw, Home, Send, Check } from 'lucide-react';

interface GameOverModalProps {
  isVictory: boolean;
  score: number;
  kills: number;
  wave: number;
  timeSurvived: number;
  highScore: number;
  characterName: string;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  isVictory,
  score,
  kills,
  wave,
  timeSurvived,
  highScore,
  characterName,
  onPlayAgain,
  onMainMenu,
}) => {
  const [playerName, setPlayerName] = useState('ApexHunter');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const handleScoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim() || submitted) return;
    setIsSubmitting(true);

    try {
      await fetch(`/api/game/state/player-${Date.now()}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playerName.trim(),
          score,
          kills,
          wave,
          character: characterName,
          title: isVictory ? 'Apex Champion' : 'Arena Veteran',
          avatar: isVictory ? '👑' : '💀',
        }),
      });
      setSubmitted(true);
      sound.playAchievement();
    } catch {
      // Local fallback
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isNewRecord = score >= highScore && score > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-lg p-4 animate-in fade-in duration-200">
      <div className="max-w-md w-full bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col items-center text-center">
        {/* Victory or Defeat Icon */}
        <div
          className={`w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-4 border shadow-xl ${
            isVictory
              ? 'bg-amber-950/60 border-amber-500/50 shadow-amber-500/20'
              : 'bg-rose-950/60 border-rose-500/50 shadow-rose-500/20'
          }`}
        >
          {isVictory ? '👑' : '💀'}
        </div>

        {/* Title */}
        <h2
          className={`text-2xl md:text-3xl font-black font-mono tracking-tight mb-1 ${
            isVictory ? 'text-amber-400' : 'text-rose-500'
          }`}
        >
          {isVictory ? 'ARENA CONQUERED!' : 'SYSTEM DEFEAT'}
        </h2>
        <p className="text-xs text-slate-400 font-mono mb-6">
          {isVictory
            ? 'All 12 waves obliterated. You stand supreme as Apex Champion.'
            : 'Your vital signs flatlined in the arena sector.'}
        </p>

        {/* Score Highlight Box */}
        <div className="w-full bg-slate-950 p-4 rounded-2xl border border-slate-800 mb-6">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" /> FINAL BATTLE SCORE
          </div>
          <div className="text-3xl font-black text-white font-mono">
            {score.toLocaleString()} PTS
          </div>
          {isNewRecord && (
            <span className="inline-block mt-1 text-[11px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 animate-pulse">
              ★ NEW PERSONAL BEST RECORD!
            </span>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3 w-full mb-6 font-mono text-xs">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
              <Clock className="w-3.5 h-3.5" /> SURVIVED
            </div>
            <div className="font-bold text-white text-sm">{formatTime(timeSurvived)}</div>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-400" /> WAVE
            </div>
            <div className="font-bold text-amber-400 text-sm">{wave}</div>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
              <Skull className="w-3.5 h-3.5 text-rose-400" /> FOES SLAIN
            </div>
            <div className="font-bold text-rose-400 text-sm">{kills}</div>
          </div>
        </div>

        {/* Leaderboard Submission Form */}
        <form onSubmit={handleScoreSubmit} className="w-full flex items-center gap-2 mb-6">
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            disabled={submitted}
            placeholder="Callsign / Operative Name"
            maxLength={18}
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
          />
          <button
            type="submit"
            disabled={submitted || isSubmitting || !playerName.trim()}
            className={`px-4 py-2 rounded-xl font-mono text-xs font-bold flex items-center gap-1.5 transition-colors ${
              submitted
                ? 'bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 cursor-default'
                : 'bg-sky-500 hover:bg-sky-400 text-white'
            }`}
          >
            {submitted ? (
              <>
                <Check className="w-3.5 h-3.5" /> SAVED
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5" /> POST SCORE
              </>
            )}
          </button>
        </form>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 w-full">
          <button
            onClick={() => {
              sound.playAchievement();
              onPlayAgain();
            }}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-mono font-bold text-sm tracking-wider shadow-lg flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 active:translate-y-0"
          >
            <RotateCcw className="w-4 h-4" /> PLAY AGAIN
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onMainMenu();
            }}
            className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-mono text-xs transition-colors flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" /> MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
