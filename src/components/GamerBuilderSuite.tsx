import React, { useState } from 'react';
import {
  BuilderWorkspaceMode,
  CombatBalanceConfig,
  EnvironmentConfig,
  WaveSequenceStep,
  CustomLevelPreset,
  LiveCombatTelemetry,
  PRO_LEVEL_PRESETS,
  CrosshairStyle,
  FloorStyle,
  WeatherParticleType,
} from '../types/builder';
import { SlashEnemy, RoninPlayer } from '../types/ronin';
import { PlayableHero } from '../types/heroes';
import {
  Wrench,
  Play,
  Layers,
  Sparkles,
  Shield,
  Zap,
  Activity,
  Sliders,
  Maximize2,
  Minimize2,
  Copy,
  Download,
  Upload,
  RefreshCw,
  Plus,
  Trash2,
  Crosshair,
  Grid,
  Eye,
  Swords,
  Gauge,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { sound } from '../services/audio';

interface GamerBuilderSuiteProps {
  workspaceMode: BuilderWorkspaceMode;
  onSetWorkspaceMode: (mode: BuilderWorkspaceMode) => void;
  combatConfig: CombatBalanceConfig;
  onUpdateCombatConfig: (config: Partial<CombatBalanceConfig>) => void;
  envConfig: EnvironmentConfig;
  onUpdateEnvConfig: (config: Partial<EnvironmentConfig>) => void;
  waveSteps: WaveSequenceStep[];
  onUpdateWaveSteps: (steps: WaveSequenceStep[]) => void;
  onSpawnEnemy: (type: 'lesser_demon' | 'flying_stinger' | 'shadow_ninja' | 'oni_boss' | 'malakath_boss') => void;
  onSpawnCurrentWave: (stepIndex: number) => void;
  onClearAllEnemies: () => void;
  onResetArena: () => void;
  telemetry: LiveCombatTelemetry;
  selectedEntity: SlashEnemy | RoninPlayer | null;
  onSelectEntity: (entity: SlashEnemy | RoninPlayer | null) => void;
  activeEnemies: SlashEnemy[];
  currentHero: PlayableHero;
  isPaused: boolean;
  onTogglePause: () => void;
}

export const GamerBuilderSuite: React.FC<GamerBuilderSuiteProps> = ({
  workspaceMode,
  onSetWorkspaceMode,
  combatConfig,
  onUpdateCombatConfig,
  envConfig,
  onUpdateEnvConfig,
  waveSteps,
  onUpdateWaveSteps,
  onSpawnEnemy,
  onSpawnCurrentWave,
  onClearAllEnemies,
  onResetArena,
  telemetry,
  selectedEntity,
  onSelectEntity,
  activeEnemies,
  currentHero,
  isPaused,
  onTogglePause,
}) => {
  const [activeRightTab, setActiveRightTab] = useState<'inspector' | 'combat' | 'env' | 'telemetry'>('inspector');
  const [activeLeftTab, setActiveLeftTab] = useState<'hierarchy' | 'waves' | 'presets'>('hierarchy');
  const [showJsonModal, setShowJsonModal] = useState<boolean>(false);
  const [jsonText, setJsonText] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Style Rank Color & Label
  const getStyleRankColor = (rank: string) => {
    switch (rank) {
      case 'SSS': return 'text-amber-300 border-amber-400 bg-amber-950/80 shadow-[0_0_20px_rgba(251,191,36,0.6)]';
      case 'SS': return 'text-amber-400 border-amber-500 bg-amber-950/70 shadow-[0_0_15px_rgba(251,191,36,0.5)]';
      case 'S': return 'text-rose-400 border-rose-500 bg-rose-950/70 shadow-[0_0_12px_rgba(244,63,94,0.5)]';
      case 'A': return 'text-purple-400 border-purple-500 bg-purple-950/70';
      case 'B': return 'text-sky-400 border-sky-500 bg-sky-950/70';
      case 'C': return 'text-emerald-400 border-emerald-500 bg-emerald-950/70';
      default: return 'text-slate-400 border-slate-700 bg-slate-900/70';
    }
  };

  // Export Level Configuration as JSON
  const handleExportJson = () => {
    const exportData: CustomLevelPreset = {
      id: `custom_level_${Date.now()}`,
      name: 'Custom Pro Arena Build',
      tagline: 'Custom Level Design Blueprint',
      description: 'Exported from Ronin Gamer Builder Studio Workbench.',
      author: 'Veteran Game Architect',
      combat: combatConfig,
      environment: envConfig,
      waves: waveSteps,
      requiredKills: 20,
    };
    setJsonText(JSON.stringify(exportData, null, 2));
    setShowJsonModal(true);
  };

  // Import Level Configuration from JSON
  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonText) as CustomLevelPreset;
      if (parsed.combat) onUpdateCombatConfig(parsed.combat);
      if (parsed.environment) onUpdateEnvConfig(parsed.environment);
      if (parsed.waves) onUpdateWaveSteps(parsed.waves);
      sound.playLevelUp();
      setShowJsonModal(false);
    } catch {
      alert('Invalid JSON Blueprint Format. Please verify and try again.');
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleLoadPreset = (preset: CustomLevelPreset) => {
    onUpdateCombatConfig(preset.combat);
    onUpdateEnvConfig(preset.environment);
    onUpdateWaveSteps(preset.waves);
    sound.playLevelUp();
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-200 select-none overflow-hidden font-mono">
      {/* ========================================================================= */}
      {/* TOP STUDIO TOOLBAR                                                        */}
      {/* ========================================================================= */}
      <header className="h-12 bg-slate-900/95 border-b border-slate-800/90 px-4 flex items-center justify-between z-30 shrink-0 backdrop-blur-md">
        {/* Left: Engine Branding & Mode Selector */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 pr-3 border-r border-slate-800">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_#fbbf24]" />
            <span className="font-black text-sm tracking-wider text-slate-100 uppercase">
              RONIN FORGE <span className="text-[10px] text-amber-400 font-bold">PRO STUDIO</span>
            </span>
          </div>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center p-0.5 bg-slate-950/80 rounded-lg border border-slate-800">
            <button
              onClick={() => {
                sound.playClick();
                onSetWorkspaceMode('PLAY');
              }}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                workspaceMode === 'PLAY'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Full Immersive Combat Play Mode (F1)"
            >
              <Play className="w-3.5 h-3.5" />
              <span>PLAY VIEW</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                onSetWorkspaceMode('BUILDER');
              }}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                workspaceMode === 'BUILDER'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Full Studio Architect View"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>BUILDER STUDIO</span>
            </button>
            <button
              onClick={() => {
                sound.playClick();
                onSetWorkspaceMode('HYBRID');
              }}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                workspaceMode === 'HYBRID'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Live Hybrid Split: Play in Real Time + Live Tweaker Dock"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>LIVE HYBRID</span>
            </button>
          </div>
        </div>

        {/* Center: Quick Action Hotkeys */}
        <div className="hidden lg:flex items-center gap-2 text-xs">
          <button
            onClick={() => {
              sound.playClick();
              onResetArena();
            }}
            className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-all text-[11px]"
            title="Reset Arena [F5]"
          >
            <RefreshCw className="w-3 h-3 text-amber-400" />
            <span>Reset [F5]</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onSpawnEnemy('lesser_demon');
            }}
            className="px-2.5 py-1 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-all text-[11px]"
            title="Spawn Mob Wave [F4]"
          >
            <Plus className="w-3 h-3 text-emerald-400" />
            <span>Spawn Wave [F4]</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onUpdateEnvConfig({ showHitboxes: !envConfig.showHitboxes });
            }}
            className={`px-2.5 py-1 rounded border flex items-center gap-1.5 transition-all text-[11px] ${
              envConfig.showHitboxes
                ? 'bg-rose-950/80 border-rose-500 text-rose-300 font-bold'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle 3D Wireframe Hitboxes [F2]"
          >
            <Eye className="w-3 h-3 text-rose-400" />
            <span>Hitboxes [F2]: {envConfig.showHitboxes ? 'ON' : 'OFF'}</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onUpdateCombatConfig({ godMode: !combatConfig.godMode });
            }}
            className={`px-2.5 py-1 rounded border flex items-center gap-1.5 transition-all text-[11px] ${
              combatConfig.godMode
                ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold'
                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Invulnerability [F3]"
          >
            <Shield className="w-3 h-3 text-emerald-400" />
            <span>Godmode [F3]: {combatConfig.godMode ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Right: Telemetry Mini-Badges & Blueprint JSON */}
        <div className="flex items-center gap-2">
          {/* Style Rank Badge */}
          <div className={`px-2.5 py-0.5 rounded border text-xs font-black flex items-center gap-1.5 ${getStyleRankColor(telemetry.styleRank)}`}>
            <span>STYLE</span>
            <span className="text-sm font-black">{telemetry.styleRank}</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-400 px-2 py-0.5 rounded bg-slate-950/70 border border-slate-800">
            <span>DPS: <span className="font-bold text-amber-300">{Math.round(telemetry.currentDps)}</span></span>
            <span className="text-slate-600">·</span>
            <span>FPS: <span className="font-bold text-emerald-400">{telemetry.fps}</span></span>
          </div>

          <button
            onClick={handleExportJson}
            className="px-2.5 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/50 text-amber-300 hover:text-amber-200 text-xs font-bold flex items-center gap-1.5 transition-all"
            title="Import or Export Level Blueprint JSON"
          >
            <Copy className="w-3 h-3" />
            <span>Blueprint JSON</span>
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* BUILDER STUDIO BODY (Only visible when BUILDER or HYBRID mode is active)  */}
      {/* ========================================================================= */}
      {workspaceMode !== 'PLAY' && (
        <div className="flex-1 flex overflow-hidden">
          {/* ===================================================================== */}
          {/* LEFT DOCK: SCENE HIERARCHY, WAVE DIRECTOR, & LEVEL PRESETS             */}
          {/* ===================================================================== */}
          {workspaceMode === 'BUILDER' && (
            <aside className="w-72 bg-slate-900/90 border-r border-slate-800/80 flex flex-col shrink-0 overflow-hidden">
              {/* Left Tabs */}
              <div className="flex border-b border-slate-800/80 bg-slate-950/60 p-1 gap-1">
                <button
                  onClick={() => setActiveLeftTab('hierarchy')}
                  className={`flex-1 py-1 text-center text-xs font-bold rounded ${
                    activeLeftTab === 'hierarchy' ? 'bg-slate-800 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Hierarchy
                </button>
                <button
                  onClick={() => setActiveLeftTab('waves')}
                  className={`flex-1 py-1 text-center text-xs font-bold rounded ${
                    activeLeftTab === 'waves' ? 'bg-slate-800 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Waves ({waveSteps.length})
                </button>
                <button
                  onClick={() => setActiveLeftTab('presets')}
                  className={`flex-1 py-1 text-center text-xs font-bold rounded ${
                    activeLeftTab === 'presets' ? 'bg-slate-800 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Presets
                </button>
              </div>

              {/* Tab 1: Hierarchy Tree */}
              {activeLeftTab === 'hierarchy' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-3 text-xs">
                  {/* Hero Node */}
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Player Entity</div>
                    <div
                      onClick={() => onSelectEntity(null)}
                      className={`p-2 rounded-lg border cursor-pointer flex items-center gap-2 transition-all ${
                        selectedEntity === null
                          ? 'bg-amber-950/60 border-amber-500/80 text-amber-200'
                          : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <img src={currentHero.spriteSrc} alt="" className="w-6 h-6 rounded-full object-cover border border-amber-400/50" />
                      <div className="truncate flex-1">
                        <div className="font-bold truncate">{currentHero.name}</div>
                        <div className="text-[10px] text-amber-400/80">{currentHero.role}</div>
                      </div>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono">ACTIVE</span>
                    </div>
                  </div>

                  {/* Active Enemies Nodes */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">
                      <span>Spawned Enemies ({activeEnemies.length})</span>
                      {activeEnemies.length > 0 && (
                        <button
                          onClick={onClearAllEnemies}
                          className="text-rose-400 hover:text-rose-300 text-[10px] flex items-center gap-1 font-mono cursor-pointer"
                        >
                          <Trash2 className="w-2.5 h-2.5" /> Clear
                        </button>
                      )}
                    </div>
                    {activeEnemies.length === 0 ? (
                      <div className="p-3 text-center text-slate-500 text-[11px] rounded-lg border border-dashed border-slate-800">
                        No active enemies in arena. Click "Spawn Wave" or Spawner Palette below to deploy.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                        {activeEnemies.map((enemy) => (
                          <div
                            key={enemy.id}
                            onClick={() => onSelectEntity(enemy)}
                            className={`p-1.5 rounded border text-xs cursor-pointer flex items-center justify-between transition-all ${
                              selectedEntity && 'id' in selectedEntity && selectedEntity.id === enemy.id
                                ? 'bg-rose-950/70 border-rose-500 text-rose-200'
                                : 'bg-slate-950/60 border-slate-800/70 text-slate-300 hover:border-slate-700'
                            }`}
                          >
                            <div className="truncate">
                              <span className="font-bold">{enemy.name}</span>
                              <span className="text-[10px] text-slate-500 ml-1.5 font-mono">Z:{Math.round(enemy.z)}</span>
                            </div>
                            <span className="text-[10px] font-mono text-rose-400">{Math.round(enemy.hp)} HP</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Environment & Scene Rig Nodes */}
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-500 mb-1 tracking-wider">Environment Rig</div>
                    <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-1 text-[11px] text-slate-400">
                      <div className="flex justify-between">
                        <span>Courtyard Biome:</span>
                        <span className="text-amber-300 font-bold">{envConfig.biomeName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pavement Style:</span>
                        <span className="text-slate-300">{envConfig.floorStyle.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Weather Particles:</span>
                        <span className="text-slate-300">{envConfig.weatherParticle.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Wave Sequencer Director */}
              {activeLeftTab === 'waves' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Wave Timeline</span>
                    <button
                      onClick={() => {
                        const nextIndex = waveSteps.length + 1;
                        onUpdateWaveSteps([
                          ...waveSteps,
                          {
                            waveIndex: nextIndex,
                            waveName: `Wave ${nextIndex}`,
                            mobTypes: ['lesser_demon'],
                            mobCount: 6,
                            spawnDelaySec: 2.0,
                            hasBoss: false,
                          },
                        ]);
                      }}
                      className="text-[10px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-bold cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Add Wave
                    </button>
                  </div>

                  {waveSteps.map((step, idx) => (
                    <div
                      key={step.waveIndex}
                      className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-slate-700 space-y-2 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-300 flex items-center gap-1.5">
                          <span className="w-4 h-4 rounded-full bg-slate-800 text-[10px] flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          {step.waveName}
                        </span>
                        <button
                          onClick={() => {
                            sound.playBladeSlash();
                            onSpawnCurrentWave(idx);
                          }}
                          className="px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold cursor-pointer flex items-center gap-1"
                        >
                          <Play className="w-2.5 h-2.5" /> Trigger
                        </button>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>Demons: {step.mobCount}</span>
                        <span>Delay: {step.spawnDelaySec}s</span>
                        {step.hasBoss && <span className="text-rose-400 font-bold">⚠️ Boss Phase</span>}
                      </div>

                      <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-slate-800/80 text-[10px] text-slate-400">
                        {step.mobTypes.map((m) => (
                          <span key={m} className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800">
                            {m.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Handcrafted Pro Presets */}
              {activeLeftTab === 'presets' && (
                <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs">
                  <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                    Veteran Level Presets
                  </div>
                  {PRO_LEVEL_PRESETS.map((preset) => (
                    <div
                      key={preset.id}
                      className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-amber-500/60 transition-all space-y-1.5 group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-100 group-hover:text-amber-300 transition-colors">
                          {preset.name}
                        </span>
                        <button
                          onClick={() => handleLoadPreset(preset)}
                          className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold cursor-pointer"
                        >
                          Load
                        </button>
                      </div>
                      <div className="text-[11px] text-amber-400/90 font-medium">{preset.tagline}</div>
                      <div className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                        {preset.description}
                      </div>
                      <div className="text-[9px] text-slate-500 pt-1 border-t border-slate-800/80">
                        Author: {preset.author} · {preset.waves.length} Waves
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          )}

          {/* ===================================================================== */}
          {/* RIGHT DOCK: LIVE INSPECTOR & COMBAT BALANCE WORKBENCH                  */}
          {/* ===================================================================== */}
          <aside className="w-80 bg-slate-900/95 border-l border-slate-800/80 flex flex-col shrink-0 overflow-hidden backdrop-blur-sm z-20">
            {/* Right Tab Selector */}
            <div className="flex border-b border-slate-800/80 bg-slate-950/70 p-1 gap-1">
              <button
                onClick={() => setActiveRightTab('inspector')}
                className={`flex-1 py-1 text-center text-xs font-bold rounded flex items-center justify-center gap-1 ${
                  activeRightTab === 'inspector' ? 'bg-slate-800 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3 h-3" />
                <span>Inspector</span>
              </button>
              <button
                onClick={() => setActiveRightTab('combat')}
                className={`flex-1 py-1 text-center text-xs font-bold rounded flex items-center justify-center gap-1 ${
                  activeRightTab === 'combat' ? 'bg-slate-800 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Swords className="w-3 h-3" />
                <span>Combat</span>
              </button>
              <button
                onClick={() => setActiveRightTab('env')}
                className={`flex-1 py-1 text-center text-xs font-bold rounded flex items-center justify-center gap-1 ${
                  activeRightTab === 'env' ? 'bg-slate-800 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Atmosphere</span>
              </button>
              <button
                onClick={() => setActiveRightTab('telemetry')}
                className={`flex-1 py-1 text-center text-xs font-bold rounded flex items-center justify-center gap-1 ${
                  activeRightTab === 'telemetry' ? 'bg-slate-800 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3 h-3" />
                <span>Telemetry</span>
              </button>
            </div>

            {/* TAB 1: ENTITY INSPECTOR & QUICK SPAWNER */}
            {activeRightTab === 'inspector' && (
              <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
                {/* Quick Entity Spawner Palette */}
                <div>
                  <div className="text-[10px] uppercase font-bold text-amber-400 mb-2 tracking-wider flex items-center gap-1.5">
                    <Plus className="w-3 h-3" />
                    <span>Quick Spawner Palette (1-Click)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => onSpawnEnemy('lesser_demon')}
                      className="p-2 rounded bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-all hover:border-amber-400"
                    >
                      <div className="font-bold text-slate-200 text-xs">👹 Lesser Demon</div>
                      <div className="text-[9px] text-slate-500">Melee Swarmer</div>
                    </button>
                    <button
                      onClick={() => onSpawnEnemy('flying_stinger')}
                      className="p-2 rounded bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-all hover:border-amber-400"
                    >
                      <div className="font-bold text-slate-200 text-xs">🦇 Flying Stinger</div>
                      <div className="text-[9px] text-slate-500">Fast Dive Striker</div>
                    </button>
                    <button
                      onClick={() => onSpawnEnemy('shadow_ninja')}
                      className="p-2 rounded bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-all hover:border-amber-400"
                    >
                      <div className="font-bold text-slate-200 text-xs">🥷 Shadow Ninja</div>
                      <div className="text-[9px] text-slate-500">Katana Duelist</div>
                    </button>
                    <button
                      onClick={() => onSpawnEnemy('oni_boss')}
                      className="p-2 rounded bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 text-left transition-all hover:border-amber-400"
                    >
                      <div className="font-bold text-amber-300 text-xs">👺 Oni Executioner</div>
                      <div className="text-[9px] text-amber-400/70">Elite Heavy Boss</div>
                    </button>
                    <button
                      onClick={() => onSpawnEnemy('malakath_boss')}
                      className="col-span-2 p-2 rounded bg-rose-950/60 hover:bg-rose-900/60 border border-rose-600/80 text-left transition-all hover:border-rose-400"
                    >
                      <div className="font-black text-rose-300 text-xs flex items-center gap-1.5">
                        <span>🔥 Malakath Arch-Fiend (Cataclysm Final Boss)</span>
                      </div>
                      <div className="text-[9px] text-rose-400/80">Multi-Phase Super Boss Encounter</div>
                    </button>
                  </div>
                </div>

                {/* Selected Entity Property Inspector */}
                <div className="pt-2 border-t border-slate-800/80">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-2 tracking-wider">
                    {selectedEntity ? `Selected: ${'name' in selectedEntity ? selectedEntity.name : currentHero.name}` : 'Player Character (Lady Valerie)'}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3">
                    {/* Light Slash Damage Slider */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Light Slash Base Damage</span>
                        <span className="font-bold text-amber-300">{combatConfig.lightSlashDamage} DMG</span>
                      </div>
                      <input
                        type="range"
                        min="20"
                        max="150"
                        value={combatConfig.lightSlashDamage}
                        onChange={(e) => onUpdateCombatConfig({ lightSlashDamage: parseInt(e.target.value, 10) })}
                        className="w-full accent-amber-400"
                      />
                    </div>

                    {/* Heavy Combo Multiplier Slider */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Heavy Katana Multiplier</span>
                        <span className="font-bold text-amber-300">{combatConfig.heavyDamageMultiplier.toFixed(1)}x</span>
                      </div>
                      <input
                        type="range"
                        min="1.5"
                        max="5.0"
                        step="0.1"
                        value={combatConfig.heavyDamageMultiplier}
                        onChange={(e) => onUpdateCombatConfig({ heavyDamageMultiplier: parseFloat(e.target.value) })}
                        className="w-full accent-amber-400"
                      />
                    </div>

                    {/* Parry Window Precision Slider */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Parry Precision Window</span>
                        <span className="font-bold text-emerald-400">{combatConfig.parryWindowMs} ms</span>
                      </div>
                      <input
                        type="range"
                        min="80"
                        max="450"
                        step="10"
                        value={combatConfig.parryWindowMs}
                        onChange={(e) => onUpdateCombatConfig({ parryWindowMs: parseInt(e.target.value, 10) })}
                        className="w-full accent-emerald-400"
                      />
                      <div className="flex justify-between text-[9px] text-slate-500 pt-0.5">
                        <span>80ms (Pro Perfect)</span>
                        <span>220ms (Standard)</span>
                        <span>450ms (Lenient)</span>
                      </div>
                    </div>

                    {/* Dodge Roll i-Frames Slider */}
                    <div>
                      <div className="flex justify-between text-[11px] mb-1">
                        <span className="text-slate-400">Dodge Roll i-Frames (Invulnerability)</span>
                        <span className="font-bold text-indigo-300">{combatConfig.rollInvulnerabilityMs} ms</span>
                      </div>
                      <input
                        type="range"
                        min="150"
                        max="600"
                        step="25"
                        value={combatConfig.rollInvulnerabilityMs}
                        onChange={(e) => onUpdateCombatConfig({ rollInvulnerabilityMs: parseInt(e.target.value, 10) })}
                        className="w-full accent-indigo-400"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: LIVE COMBAT & MOB AI TUNING WORKBENCH */}
            {activeRightTab === 'combat' && (
              <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
                <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Enemy AI & Arena Balancing
                </div>

                <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-3.5">
                  {/* Enemy Health Multiplier */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Enemy Health Scale</span>
                      <span className="font-bold text-rose-400">{combatConfig.enemyHealthMultiplier.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.3"
                      max="3.0"
                      step="0.05"
                      value={combatConfig.enemyHealthMultiplier}
                      onChange={(e) => onUpdateCombatConfig({ enemyHealthMultiplier: parseFloat(e.target.value) })}
                      className="w-full accent-rose-400"
                    />
                  </div>

                  {/* Enemy Damage Multiplier */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Enemy Lethality (Damage)</span>
                      <span className="font-bold text-rose-400">{combatConfig.enemyDamageMultiplier.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.2"
                      max="3.0"
                      step="0.1"
                      value={combatConfig.enemyDamageMultiplier}
                      onChange={(e) => onUpdateCombatConfig({ enemyDamageMultiplier: parseFloat(e.target.value) })}
                      className="w-full accent-rose-400"
                    />
                  </div>

                  {/* Enemy Speed Multiplier */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Enemy Movement Speed</span>
                      <span className="font-bold text-sky-400">{combatConfig.enemySpeedMultiplier.toFixed(2)}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2.2"
                      step="0.05"
                      value={combatConfig.enemySpeedMultiplier}
                      onChange={(e) => onUpdateCombatConfig({ enemySpeedMultiplier: parseFloat(e.target.value) })}
                      className="w-full accent-sky-400"
                    />
                  </div>

                  {/* Enemy Telegraph Delay (Windup before strike) */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Attack Telegraph Delay (Windup)</span>
                      <span className="font-bold text-amber-300">{combatConfig.enemyTelegraphDelaySec.toFixed(2)} s</span>
                    </div>
                    <input
                      type="range"
                      min="0.3"
                      max="1.8"
                      step="0.05"
                      value={combatConfig.enemyTelegraphDelaySec}
                      onChange={(e) => onUpdateCombatConfig({ enemyTelegraphDelaySec: parseFloat(e.target.value) })}
                      className="w-full accent-amber-400"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 pt-0.5">
                      <span>0.3s (Hardcore Fast)</span>
                      <span>0.75s (Standard)</span>
                      <span>1.8s (Easy Practice)</span>
                    </div>
                  </div>

                  {/* Mob Density Cap */}
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Mob Density Cap</span>
                      <span className="font-bold text-purple-300">{combatConfig.mobDensityCap} mobs</span>
                    </div>
                    <input
                      type="range"
                      min="4"
                      max="24"
                      value={combatConfig.mobDensityCap}
                      onChange={(e) => onUpdateCombatConfig({ mobDensityCap: parseInt(e.target.value, 10) })}
                      className="w-full accent-purple-400"
                    />
                  </div>
                </div>

                {/* Developer Cheats & Overrides */}
                <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">
                    Architect Overrides
                  </div>
                  <label className="flex items-center justify-between text-[11px] cursor-pointer hover:text-white">
                    <span>Infinite Stamina (Continuous Dash)</span>
                    <input
                      type="checkbox"
                      checked={combatConfig.infiniteStamina}
                      onChange={(e) => onUpdateCombatConfig({ infiniteStamina: e.target.checked })}
                      className="accent-amber-400 w-4 h-4"
                    />
                  </label>
                  <label className="flex items-center justify-between text-[11px] cursor-pointer hover:text-white">
                    <span>Infinite Fury (Immediate Bloodmoon Special)</span>
                    <input
                      type="checkbox"
                      checked={combatConfig.infiniteFury}
                      onChange={(e) => onUpdateCombatConfig({ infiniteFury: e.target.checked })}
                      className="accent-rose-400 w-4 h-4"
                    />
                  </label>
                  <label className="flex items-center justify-between text-[11px] cursor-pointer hover:text-white">
                    <span>God Mode (Immunity to Damage)</span>
                    <input
                      type="checkbox"
                      checked={combatConfig.godMode}
                      onChange={(e) => onUpdateCombatConfig({ godMode: e.target.checked })}
                      className="accent-emerald-400 w-4 h-4"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* TAB 3: ENVIRONMENT & ATMOSPHERE SCULPTOR */}
            {activeRightTab === 'env' && (
              <div className="flex-1 overflow-y-auto p-3.5 space-y-4 text-xs">
                <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                  Courtyard Arena Atmosphere
                </div>

                {/* Floor Material Style */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400">Pavement Material / Floor Style</label>
                  <select
                    value={envConfig.floorStyle}
                    onChange={(e) => onUpdateEnvConfig({ floorStyle: e.target.value as FloorStyle })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-400 outline-none"
                  >
                    <option value="imperial_flagstone">Imperial Fortress Flagstone</option>
                    <option value="cracked_bloodstone">Cracked Bloodstone Ruins</option>
                    <option value="obsidian_ruins">Polished Obsidian Tile</option>
                    <option value="golden_marble">Gilded Golden Sanctuary Marble</option>
                  </select>
                </div>

                {/* Weather Particle System */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400">Weather Particle Rig</label>
                  <select
                    value={envConfig.weatherParticle}
                    onChange={(e) => onUpdateEnvConfig({ weatherParticle: e.target.value as WeatherParticleType })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-400 outline-none"
                  >
                    <option value="golden_ash">Golden Solar Ash & Sun Rays</option>
                    <option value="crimson_embers">Crimson Bloodmoon Embers</option>
                    <option value="spirit_wisps">Ghostly Bioluminescent Wisps</option>
                    <option value="tempest_rain">Tempest Storm Rain</option>
                    <option value="soul_sparks">Abyssal Soul Sparks</option>
                  </select>
                </div>

                {/* Crosshair Selector */}
                <div className="space-y-1.5">
                  <label className="text-[11px] text-slate-400">Pro Gamer Reticle / Crosshair</label>
                  <select
                    value={envConfig.crosshair}
                    onChange={(e) => onUpdateEnvConfig({ crosshair: e.target.value as CrosshairStyle })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-amber-400 outline-none"
                  >
                    <option value="reticle">Dynamic ARPG Crosshair (Image Match)</option>
                    <option value="dot">Precision Sniper Red Dot</option>
                    <option value="cross">Tactical Four-Bar Cross</option>
                    <option value="souls">Souls-Like Target Lock Ring</option>
                    <option value="minimal">Minimalist Pinpoint</option>
                  </select>
                </div>

                {/* Spatial Overlays */}
                <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">
                    Spatial Dev Overlays
                  </div>
                  <label className="flex items-center justify-between text-[11px] cursor-pointer hover:text-white">
                    <span className="flex items-center gap-1.5">
                      <Grid className="w-3.5 h-3.5 text-sky-400" />
                      <span>3D Coordinate Grid Overlay</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={envConfig.showGrid}
                      onChange={(e) => onUpdateEnvConfig({ showGrid: e.target.checked })}
                      className="accent-sky-400 w-4 h-4"
                    />
                  </label>
                  <label className="flex items-center justify-between text-[11px] cursor-pointer hover:text-white">
                    <span className="flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-rose-400" />
                      <span>Wireframe 3D Hitbox/Hurtbox</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={envConfig.showHitboxes}
                      onChange={(e) => onUpdateEnvConfig({ showHitboxes: e.target.checked })}
                      className="accent-rose-400 w-4 h-4"
                    />
                  </label>
                  <label className="flex items-center justify-between text-[11px] cursor-pointer hover:text-white">
                    <span className="flex items-center gap-1.5">
                      <Crosshair className="w-3.5 h-3.5 text-indigo-400" />
                      <span>AI Threat Vectors & Aggro Rays</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={envConfig.showAiRays}
                      onChange={(e) => onUpdateEnvConfig({ showAiRays: e.target.checked })}
                      className="accent-indigo-400 w-4 h-4"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* TAB 4: COMBAT TELEMETRY & APM METERS */}
            {activeRightTab === 'telemetry' && (
              <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 text-xs">
                {/* Style Meter Card */}
                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-slate-400">Active Style Rank</div>
                    <div className="text-2xl font-black text-amber-400 flex items-center gap-2">
                      <span>{telemetry.styleRank}</span>
                      <span className="text-xs font-mono text-slate-400 font-normal">
                        ({telemetry.stylePoints} pts)
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500">APM</div>
                    <div className="text-lg font-bold text-emerald-400 font-mono">{telemetry.apm}</div>
                  </div>
                </div>

                {/* DPS & Combat Stats */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                    <div className="text-[10px] text-slate-500">Current DPS</div>
                    <div className="text-base font-bold text-amber-300 font-mono">
                      {Math.round(telemetry.currentDps)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                    <div className="text-[10px] text-slate-500">Peak DPS</div>
                    <div className="text-base font-bold text-rose-400 font-mono">
                      {Math.round(telemetry.peakDps)}
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                    <div className="text-[10px] text-slate-500">Parry Accuracy</div>
                    <div className="text-base font-bold text-emerald-400 font-mono">
                      {Math.round(telemetry.parryAccuracyPct)}%
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                    <div className="text-[10px] text-slate-500">Hits Landed</div>
                    <div className="text-base font-bold text-sky-400 font-mono">
                      {telemetry.hitsLanded}
                    </div>
                  </div>
                </div>

                {/* Damage Summary */}
                <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Damage Dealt:</span>
                    <span className="font-bold text-amber-300 font-mono">{telemetry.totalDamageDealt.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Damage Taken:</span>
                    <span className="font-bold text-rose-400 font-mono">{telemetry.totalDamageTaken.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Dodge Rolls Executed:</span>
                    <span className="font-bold text-indigo-300 font-mono">{telemetry.dodgeRolls}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Active Entities in Arena:</span>
                    <span className="font-bold text-slate-200 font-mono">{telemetry.activeEntityCount}</span>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ========================================================================= */}
      {/* BLUEPRINT JSON IMPORT / EXPORT MODAL                                      */}
      {/* ========================================================================= */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl flex flex-col gap-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2 font-bold text-slate-100">
                <Copy className="w-4 h-4 text-amber-400" />
                <span>Level Blueprint JSON Data</span>
              </div>
              <button
                onClick={() => setShowJsonModal(false)}
                className="text-slate-400 hover:text-white text-sm px-2 py-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Copy this JSON blueprint to share your custom arena, wave configurations, and combat balance parameters, or paste a custom code to load!
            </p>

            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              className="w-full h-64 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-amber-200 focus:border-amber-400 outline-none resize-none"
            />

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={handleCopyJson}
                className="px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
              >
                {copySuccess ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copySuccess ? 'Copied to Clipboard!' : 'Copy JSON'}</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowJsonModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyJson}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-lg cursor-pointer flex items-center gap-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Apply Blueprint</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
