import React from 'react';
import { sound } from '../services/audio';
import { Play, RotateCcw, Volume2, VolumeX, Home } from 'lucide-react';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onMainMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onMainMenu,
}) => {
  const isMuted = !sound.enabled;

  const handleToggleSound = () => {
    sound.toggleMute();
    sound.playClick();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
      <div className="max-w-sm w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center">
        <h2 className="text-2xl font-black font-mono tracking-tight text-white mb-1">
          COMBAT PAUSED
        </h2>
        <p className="text-xs text-slate-400 font-mono mb-6">
          Simulation frozen. Tactical parameters on hold.
        </p>

        <div className="flex flex-col gap-2.5 w-full">
          <button
            onClick={() => {
              sound.playClick();
              onResume();
            }}
            className="w-full py-3 rounded-xl bg-sky-500 hover:bg-sky-400 text-white font-mono font-bold text-xs tracking-wider shadow-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Play className="w-4 h-4 fill-white" /> RESUME MISSION (ESC)
          </button>

          <button
            onClick={() => {
              sound.playAchievement();
              onRestart();
            }}
            className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 font-mono text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> RESTART RUN
          </button>

          <button
            onClick={handleToggleSound}
            className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 font-mono text-xs flex items-center justify-center gap-2 transition-colors"
          >
            {isMuted ? (
              <>
                <VolumeX className="w-4 h-4 text-rose-400" /> UNMUTE SOUND FX
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" /> MUTE SOUND FX
              </>
            )}
          </button>

          <button
            onClick={() => {
              sound.playClick();
              onMainMenu();
            }}
            className="w-full py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 font-mono text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <Home className="w-4 h-4" /> ABORT TO MAIN MENU
          </button>
        </div>
      </div>
    </div>
  );
};
