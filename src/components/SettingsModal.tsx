import React from 'react';
import { GameSettings, SupportedLanguage, TRANSLATIONS } from '../types/settings';
import { sound } from '../services/audio';
import { Settings, Sun, Moon, Volume2, Globe, Vibrate, Eye, Check } from 'lucide-react';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;

  const languages: Array<{ code: SupportedLanguage; label: string; flag: string }> = [
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'ja', label: '日本語 (Japanese)', flag: '🇯🇵' },
    { code: 'es', label: 'Español (Spanish)', flag: '🇪🇸' },
    { code: 'zh', label: '中文 (Chinese)', flag: '🇨🇳' },
    { code: 'ko', label: '한국어 (Korean)', flag: '🇰🇷' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md select-none font-pixel">
      <div className="relative w-full max-w-xl bg-slate-950 pixel-border-gold p-6 sm:p-8 shadow-2xl flex flex-col gap-6 text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 pixel-border-dark bg-amber-950/80 flex items-center justify-center text-amber-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-pixel tracking-wider text-amber-300">
                {t.settings_title}
              </h2>
              <p className="text-[8px] text-slate-400 font-pixel mt-1">
                DISPLAY THEME · AUDIO CHANNELS · LOCALIZATION · ACCESSIBILITY
              </p>
            </div>
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

        {/* Camera View Mode: Free Fire Perspective vs Classic Side View */}
        <div className="flex flex-col gap-2">
          <label className="text-[9px] font-pixel text-slate-300 flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-rose-500" />
            {t.camera_view || 'Camera View Perspective'}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                sound.playClick();
                onUpdateSettings({ ...settings, cameraView: 'freefire_user' });
              }}
              className={`p-3 pixel-btn flex items-center justify-center gap-2 text-[8px] font-pixel transition-all cursor-pointer ${
                settings.cameraView === 'freefire_user'
                  ? 'bg-rose-950 pixel-border-crimson text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                  : 'bg-slate-900 pixel-border-dark text-slate-400 hover:border-slate-500'
              }`}
            >
              <span>🔥</span>
              <span>{t.freefire_view || '3rd-Person Behind (RPG)'}</span>
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onUpdateSettings({ ...settings, cameraView: 'tactical_side' });
              }}
              className={`p-3 pixel-btn flex items-center justify-center gap-2 text-[8px] font-pixel transition-all cursor-pointer ${
                settings.cameraView === 'tactical_side'
                  ? 'bg-sky-950 pixel-border-dark text-sky-300 shadow-[0_0_15px_rgba(56,189,248,0.4)] border-sky-400'
                  : 'bg-slate-900 pixel-border-dark text-slate-400 hover:border-slate-500'
              }`}
            >
              <span>⚔️</span>
              <span>{t.side_view || 'Classic Side View'}</span>
            </button>
          </div>
        </div>

        {/* Display Mode: Sun Mode vs Dark Moon Mode */}
        <div className="flex flex-col gap-2">
          <label className="text-[9px] font-pixel text-slate-300 flex items-center gap-2">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            {t.display_mode}
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                sound.playClick();
                onUpdateSettings({ ...settings, colorMode: 'dark' });
              }}
              className={`p-3 pixel-btn flex items-center justify-center gap-2 text-[8px] font-pixel transition-all cursor-pointer ${
                settings.colorMode === 'dark'
                  ? 'bg-slate-950 pixel-border-crimson text-rose-300 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                  : 'bg-slate-900 pixel-border-dark text-slate-400 hover:border-slate-500'
              }`}
            >
              <Moon className="w-3.5 h-3.5 text-rose-400" />
              {t.dark_mode}
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onUpdateSettings({ ...settings, colorMode: 'sun' });
              }}
              className={`p-3 pixel-btn flex items-center justify-center gap-2 text-[8px] font-pixel transition-all cursor-pointer ${
                settings.colorMode === 'sun'
                  ? 'bg-amber-950 pixel-border-gold text-amber-300 shadow-[0_0_15px_rgba(251,191,36,0.4)]'
                  : 'bg-slate-900 pixel-border-dark text-slate-400 hover:border-slate-500'
              }`}
            >
              <Sun className="w-3.5 h-3.5 text-amber-400" />
              {t.sun_mode}
            </button>
          </div>
        </div>

        {/* Multi-Language Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-[9px] font-pixel text-slate-300 flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            {t.language_label}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  sound.playClick();
                  onUpdateSettings({ ...settings, language: lang.code });
                }}
                className={`p-2 pixel-btn pixel-border-dark flex items-center justify-between text-[7px] font-pixel transition-all cursor-pointer ${
                  settings.language === lang.code
                    ? 'bg-sky-950 text-sky-200 border-sky-400 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:border-slate-500 hover:text-white'
                }`}
              >
                <span>{lang.flag} {lang.label}</span>
                {settings.language === lang.code && <Check className="w-3 h-3 text-sky-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Sound FX & BGM Volumes */}
        <div className="flex flex-col gap-3">
          <label className="text-[8px] font-pixel text-slate-300 flex items-center gap-2">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
            {t.sfx_vol}: {settings.sfxVolume}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.sfxVolume}
            onChange={(e) => onUpdateSettings({ ...settings, sfxVolume: parseInt(e.target.value, 10) })}
            className="w-full accent-emerald-500 cursor-pointer"
          />

          <label className="text-[8px] font-pixel text-slate-300 flex items-center gap-2 mt-1">
            <Volume2 className="w-3.5 h-3.5 text-purple-400" />
            {t.bgm_vol}: {settings.bgmVolume}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={settings.bgmVolume}
            onChange={(e) => onUpdateSettings({ ...settings, bgmVolume: parseInt(e.target.value, 10) })}
            className="w-full accent-purple-500 cursor-pointer"
          />
        </div>

        {/* Screen Shake, Telegraphs & Free Fire Radar Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 border-t border-slate-800 pt-3">
          <label className="flex items-center justify-between p-2.5 pixel-border-dark bg-slate-950 cursor-pointer text-[7px] font-pixel">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.tactical_radar || 'Tactical Radar'}</span>
            </span>
            <input
              type="checkbox"
              checked={settings.radarEnabled}
              onChange={(e) => onUpdateSettings({ ...settings, radarEnabled: e.target.checked })}
              className="accent-emerald-500 w-3.5 h-3.5 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 pixel-border-dark bg-slate-950 cursor-pointer text-[7px] font-pixel">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Vibrate className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.screen_shake}</span>
            </span>
            <input
              type="checkbox"
              checked={settings.screenShake}
              onChange={(e) => onUpdateSettings({ ...settings, screenShake: e.target.checked })}
              className="accent-amber-500 w-3.5 h-3.5 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 pixel-border-dark bg-slate-950 cursor-pointer text-[7px] font-pixel">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Eye className="w-3.5 h-3.5 text-sky-400" />
              <span>{t.attack_telegraph}</span>
            </span>
            <input
              type="checkbox"
              checked={settings.attackWarnings}
              onChange={(e) => onUpdateSettings({ ...settings, attackWarnings: e.target.checked })}
              className="accent-sky-500 w-3.5 h-3.5 cursor-pointer"
            />
          </label>
        </div>

        {/* Confirm Button */}
        <button
          onClick={() => {
            sound.playAchievement();
            onClose();
          }}
          className="w-full py-3 pixel-btn bg-amber-500 hover:bg-amber-400 text-slate-950 font-pixel text-[9px] tracking-wider shadow-lg transition-all cursor-pointer font-black"
        >
          {t.confirm}
        </button>
      </div>
    </div>
  );
};
