export type BuilderWorkspaceMode = 'PLAY' | 'BUILDER' | 'HYBRID';

export type CrosshairStyle = 'reticle' | 'dot' | 'cross' | 'souls' | 'minimal';

export type FloorStyle = 'imperial_flagstone' | 'cracked_bloodstone' | 'obsidian_ruins' | 'golden_marble';

export type WeatherParticleType = 'crimson_embers' | 'golden_ash' | 'spirit_wisps' | 'tempest_rain' | 'soul_sparks';

export type StyleRankTier = 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';

export interface CombatBalanceConfig {
  // Hero Combat Physics & Frames
  lightSlashDamage: number;
  lightSlashCooldown: number;
  heavyDamageMultiplier: number;
  heavyStaminaCost: number;
  rollInvulnerabilityMs: number; // i-frames
  rollSpeed: number;
  parryWindowMs: number; // e.g. 120ms frame-perfect vs 250ms normal vs 400ms lenient
  staminaRegenRate: number; // per sec
  godMode: boolean;
  infiniteFury: boolean;
  infiniteStamina: boolean;

  // Enemy Combat & AI Tuning
  enemyHealthMultiplier: number;
  enemyDamageMultiplier: number;
  enemySpeedMultiplier: number;
  enemyAggroRadius: number;
  enemyTelegraphDelaySec: number; // Windup before attack lands
  spawnIntervalSec: number;
  mobDensityCap: number;
}

export interface EnvironmentConfig {
  biomeId: 'bloodmoon_bastion' | 'golden_citadel' | 'abyssal_crypt' | 'pagoda_shrine' | 'dragon_crucible';
  biomeName: string;
  floorStyle: FloorStyle;
  weatherParticle: WeatherParticleType;
  particleDensity: number;
  lightingMode: 'sun' | 'bloodmoon' | 'twilight' | 'abyssal';
  fogDensity: number; // 0 to 1
  bloomIntensity: number; // 0 to 1
  cameraFov: number; // 45 to 85
  showHitboxes: boolean;
  showGrid: boolean;
  showAiRays: boolean;
  crosshair: CrosshairStyle;
}

export interface WaveSequenceStep {
  waveIndex: number;
  waveName: string;
  mobTypes: Array<'lesser_demon' | 'flying_stinger' | 'shadow_ninja' | 'oni_boss' | 'malakath_boss'>;
  mobCount: number;
  spawnDelaySec: number;
  hasBoss: boolean;
  bossType?: 'oni_boss' | 'malakath_boss';
  completed?: boolean;
}

export interface CustomLevelPreset {
  id: string;
  name: string;
  tagline: string;
  description: string;
  author: string;
  combat: CombatBalanceConfig;
  environment: EnvironmentConfig;
  waves: WaveSequenceStep[];
  requiredKills: number;
}

export interface LiveCombatTelemetry {
  currentDps: number;
  peakDps: number;
  apm: number;
  totalDamageDealt: number;
  totalDamageTaken: number;
  hitsLanded: number;
  critsLanded: number;
  parriesExecuted: number;
  parryAccuracyPct: number;
  dodgeRolls: number;
  stylePoints: number;
  styleRank: StyleRankTier;
  fps: number;
  frameTimeMs: number;
  activeEntityCount: number;
}

export const DEFAULT_COMBAT_BALANCE: CombatBalanceConfig = {
  lightSlashDamage: 45,
  lightSlashCooldown: 0.32,
  heavyDamageMultiplier: 2.6,
  heavyStaminaCost: 28,
  rollInvulnerabilityMs: 350,
  rollSpeed: 420,
  parryWindowMs: 220,
  staminaRegenRate: 35,
  godMode: false,
  infiniteFury: false,
  infiniteStamina: false,

  enemyHealthMultiplier: 1.0,
  enemyDamageMultiplier: 1.0,
  enemySpeedMultiplier: 1.0,
  enemyAggroRadius: 400,
  enemyTelegraphDelaySec: 0.75,
  spawnIntervalSec: 2.8,
  mobDensityCap: 12,
};

export const DEFAULT_ENVIRONMENT_CONFIG: EnvironmentConfig = {
  biomeId: 'golden_citadel',
  biomeName: 'Imperial Sun Citadel Courtyard',
  floorStyle: 'imperial_flagstone',
  weatherParticle: 'golden_ash',
  particleDensity: 45,
  lightingMode: 'sun',
  fogDensity: 0.25,
  bloomIntensity: 0.35,
  cameraFov: 65,
  showHitboxes: false,
  showGrid: false,
  showAiRays: false,
  crosshair: 'reticle',
};

export const PRO_LEVEL_PRESETS: CustomLevelPreset[] = [
  {
    id: 'preset_veteran_crucible',
    name: 'Souls Veteran Crucible',
    tagline: 'High Stagger & Strict 120ms Parry Windows',
    description: 'Designed for precision action players. Punishing telegraphs, high damage intake, but devastating parry counter-attacks.',
    author: 'Pro Arena Architect',
    combat: {
      ...DEFAULT_COMBAT_BALANCE,
      lightSlashDamage: 55,
      heavyDamageMultiplier: 3.2,
      parryWindowMs: 120, // Tight parry
      enemyDamageMultiplier: 1.7,
      enemySpeedMultiplier: 1.25,
      enemyTelegraphDelaySec: 0.55,
    },
    environment: {
      ...DEFAULT_ENVIRONMENT_CONFIG,
      biomeId: 'bloodmoon_bastion',
      biomeName: 'Bloodmoon Fortress Courtyard',
      floorStyle: 'cracked_bloodstone',
      weatherParticle: 'crimson_embers',
      lightingMode: 'bloodmoon',
      particleDensity: 65,
    },
    waves: [
      { waveIndex: 1, waveName: 'Vanguard Stalkers', mobTypes: ['shadow_ninja'], mobCount: 6, spawnDelaySec: 1.5, hasBoss: false },
      { waveIndex: 2, waveName: 'Fiend Phalanx', mobTypes: ['lesser_demon', 'flying_stinger'], mobCount: 8, spawnDelaySec: 2.0, hasBoss: false },
      { waveIndex: 3, waveName: 'Warlord Duel', mobTypes: ['lesser_demon', 'oni_boss'], mobCount: 4, spawnDelaySec: 3.0, hasBoss: true, bossType: 'oni_boss' },
    ],
    requiredKills: 18,
  },
  {
    id: 'preset_swarm_survival',
    name: 'Bloodmoon Demon Swarm',
    tagline: 'Fast Density Horde with Air & Ground Rush',
    description: 'High mob density testing area. Swarms of fast-moving lesser demons and dive-bombing stingers.',
    author: 'Mob Balancer',
    combat: {
      ...DEFAULT_COMBAT_BALANCE,
      lightSlashDamage: 40,
      rollSpeed: 480,
      staminaRegenRate: 50,
      enemyHealthMultiplier: 0.75,
      enemySpeedMultiplier: 1.35,
      spawnIntervalSec: 1.4,
      mobDensityCap: 16,
    },
    environment: {
      ...DEFAULT_ENVIRONMENT_CONFIG,
      biomeId: 'bloodmoon_bastion',
      biomeName: 'Bloodmoon Bastion Gates',
      floorStyle: 'obsidian_ruins',
      weatherParticle: 'crimson_embers',
      lightingMode: 'bloodmoon',
      particleDensity: 80,
    },
    waves: [
      { waveIndex: 1, waveName: 'The Crimson Swarm', mobTypes: ['lesser_demon', 'flying_stinger'], mobCount: 14, spawnDelaySec: 1.0, hasBoss: false },
      { waveIndex: 2, waveName: 'Abyssal Brood', mobTypes: ['flying_stinger', 'shadow_ninja'], mobCount: 12, spawnDelaySec: 1.2, hasBoss: false },
    ],
    requiredKills: 26,
  },
  {
    id: 'preset_archfiend_duel',
    name: 'Cathedral Arch-Fiend Duel',
    tagline: 'Ultimate Boss Phase Showdown with Malakath',
    description: 'Direct boss arena combat. Test high-tier attack sequences, telegraph dodges, and special fury burst combos.',
    author: 'Boss Encounter Lead',
    combat: {
      ...DEFAULT_COMBAT_BALANCE,
      lightSlashDamage: 60,
      heavyDamageMultiplier: 3.5,
      parryWindowMs: 180,
      enemyHealthMultiplier: 2.2,
      enemyDamageMultiplier: 1.5,
      enemyTelegraphDelaySec: 0.8,
    },
    environment: {
      ...DEFAULT_ENVIRONMENT_CONFIG,
      biomeId: 'abyssal_crypt',
      biomeName: 'Cathedral of Whispering Bones',
      floorStyle: 'obsidian_ruins',
      weatherParticle: 'soul_sparks',
      lightingMode: 'abyssal',
      fogDensity: 0.45,
    },
    waves: [
      { waveIndex: 1, waveName: 'Cathedral Guard', mobTypes: ['shadow_ninja'], mobCount: 4, spawnDelaySec: 1.5, hasBoss: false },
      { waveIndex: 2, waveName: 'Malakath Awakening', mobTypes: ['malakath_boss', 'flying_stinger'], mobCount: 3, spawnDelaySec: 2.0, hasBoss: true, bossType: 'malakath_boss' },
    ],
    requiredKills: 7,
  },
  {
    id: 'preset_parry_dojo',
    name: 'Parry Master Training Dojo',
    tagline: 'Zero Death Threat Sandbox with High Telegraphs',
    description: 'Perfect for learning attack timings, frame windows, and combo linkages with zero punishment.',
    author: 'Combat Systems Tech',
    combat: {
      ...DEFAULT_COMBAT_BALANCE,
      lightSlashDamage: 70,
      parryWindowMs: 320,
      enemyDamageMultiplier: 0.2,
      enemyTelegraphDelaySec: 1.2,
      infiniteStamina: true,
      infiniteFury: true,
    },
    environment: {
      ...DEFAULT_ENVIRONMENT_CONFIG,
      biomeId: 'pagoda_shrine',
      biomeName: 'Torii Sanctuary Courtyard',
      floorStyle: 'golden_marble',
      weatherParticle: 'golden_ash',
      lightingMode: 'sun',
      particleDensity: 30,
      showHitboxes: true,
      showGrid: true,
    },
    waves: [
      { waveIndex: 1, waveName: 'Sparring Dummy Ninjas', mobTypes: ['shadow_ninja'], mobCount: 5, spawnDelaySec: 2.5, hasBoss: false },
    ],
    requiredKills: 10,
  },
];
