import { MALAKATH_BESTIARY_50 } from '../data/bestiary';

export type BossArchetype = 
  | 'cataclysm_magma' 
  | 'void_space' 
  | 'flesh_blight' 
  | 'shadow_ice' 
  | 'crystallized_light' 
  | 'malakath_ascended';

export interface BestiaryBossData {
  bossName: string;
  bossTitle: string;
  bossArchetype: BossArchetype;
  bossHp: number;
  bossAttackPower: number;
  description: string;
  specialMove: string;
}

export interface GameLevelConfig {
  levelNumber: number;
  title: string;
  subtitle: string;
  theme: 'magma_shrine' | 'void_rift' | 'corrupted_forest' | 'blood_citadel' | 'shadow_ice';
  themeTitle: string;
  bgSrc: string;
  requiredGems: number;
  requiredKills: number;
  bossAtKills?: number;
  bossType?: 'mini_boss' | 'oni_boss' | 'cataclysm_boss' | 'malakath_final';
  bossName: string;
  bossTitle: string;
  bossArchetype: BossArchetype;
  bossPowerId: number;
  bossSpriteSrc: string;
  bossHp: number;
  bossAttackPower: number;
  bossDescription: string;
  bossSpecialMove: string;
  enemyTypes: Array<
    | 'lesser_demon'
    | 'flying_stinger'
    | 'shadow_ninja'
    | 'corrupted_samurai'
    | 'shadow_creeper'
    | 'infernal_brute'
    | 'succubus_queen'
  >;
  environmentName: string;
  themeColor: string;
  rewardSouls: number;
  rewardCredits: number;
  unlockedPerk?: string;
}

export const THEME_BACKGROUNDS = {
  magma_shrine: '/assets/images/bg_magma_shrine_1790181654528.jpg',
  void_rift: '/assets/images/bg_void_rift_1790181672173.jpg',
  corrupted_forest: '/assets/images/bg_corrupted_forest_1790181639828.jpg',
  blood_citadel: '/assets/images/bg_blood_citadel_1790181687814.jpg',
  shadow_ice: '/assets/images/ancient_pagoda_bright_1790179924397.jpg',
};

const BOSS_SPRITES: Record<BossArchetype, string[]> = {
  cataclysm_magma: ['/assets/images/oni_demon_boss_1790178627626.jpg', '/assets/images/lesser_demon_grunt_1790179970885.jpg'],
  void_space: ['/assets/images/flying_stinger_demon_1790179956858.jpg', '/assets/images/oni_demon_boss_1790178627626.jpg'],
  flesh_blight: ['/assets/images/lesser_demon_grunt_1790179970885.jpg', '/assets/images/flying_stinger_demon_1790179956858.jpg'],
  shadow_ice: ['/assets/images/flying_stinger_demon_1790179956858.jpg', '/assets/images/oni_demon_boss_1790178627626.jpg'],
  crystallized_light: ['/assets/images/lesser_demon_grunt_1790179970885.jpg', '/assets/images/oni_demon_boss_1790178627626.jpg'],
  malakath_ascended: ['/assets/images/malakath_boss_phase_1790179940429.jpg'],
};

export const GAME_LEVELS: GameLevelConfig[] = MALAKATH_BESTIARY_50.map((boss, index) => {
  const levelNum = index + 1;

  let theme: 'magma_shrine' | 'void_rift' | 'corrupted_forest' | 'blood_citadel' | 'shadow_ice';
  let themeTitle = '';
  let themeColor = '#ef4444';

  if (boss.bossArchetype === 'cataclysm_magma') {
    theme = 'magma_shrine';
    themeTitle = 'CHAPTER I: THE CATACLYSMIC CALDERA';
    themeColor = '#f97316';
  } else if (boss.bossArchetype === 'void_space') {
    theme = 'void_rift';
    themeTitle = 'CHAPTER II: THE ASTRAL VOID SINGULARITY';
    themeColor = '#a855f7';
  } else if (boss.bossArchetype === 'flesh_blight') {
    theme = 'corrupted_forest';
    themeTitle = 'CHAPTER III: THE BLIGHTED FLESH VAULT';
    themeColor = '#10b981';
  } else if (boss.bossArchetype === 'shadow_ice') {
    theme = 'shadow_ice';
    themeTitle = 'CHAPTER IV: THE COALESCED FROST CITADEL';
    themeColor = '#38bdf8';
  } else if (boss.bossArchetype === 'crystallized_light') {
    theme = 'void_rift';
    themeTitle = 'CHAPTER V: THE RADIANT SOLAR RIFT';
    themeColor = '#fbbf24';
  } else {
    theme = 'blood_citadel';
    themeTitle = 'CHAPTER VI: THE THRONE OF MALAKATH';
    themeColor = '#ef4444';
  }

  // Level Demonic Arena Titles
  const arenaLocations = [
    'Crater of Molten Slag',
    'Chasm of the Cinder Maw',
    'Basalt Monolith Ring',
    'Abyssal Fissure Pit',
    'Caldera Core Chamber',
    'Void Horizon Rift',
    'Flesh-Root Spore Hollow',
    'Astral Edge Singularity',
    'Sunken Prism Shrine',
    'Grand Cataclysm Altar',
    'Dissonance Gate',
    'Phantom Mirage Cavern',
    'Rotting Tendril Grove',
    'Glacial Hellfire Crags',
    'Starlight Ruin',
    'Cosmic Shard Observatory',
    'Nether-Ice Scriptorium',
    'Photonic Crystal Spire',
    'Pustule Cathedral',
    'Abyssal Throne of Void',
    'Blighted Slime Basin',
    'Cryo-Mist Crypt',
    'Prismatic Refraction Maze',
    'Gorging Maw Trench',
    'Obsidian Fortress Gates',
    'Starlight Siphon Chamber',
    'Pulp Hive Warrens',
    'Frostbite Monolith Sanctum',
    'Needle Singularity Ridge',
    'Throne of Living Flesh',
    'Magma Ingestion Caldera',
    'Arachnid Void Vault',
    'Solar Flare Crucible',
    'Cryo-Aurora Glade',
    'Torment Colosseum',
    'Event Horizon Heart',
    'Broodmother Nesting Core',
    'Plague Nexus Spire',
    'Supernova Annihilation Field',
    'Glacial Cataclysm Summit',
    'Netherflame Furnace',
    'Reality-Rip Abyss',
    'Primordial Rot Vault',
    'Zero-Kelvin Spire',
    'Cerberus Magma Arena',
    'Dark Matter Observatory',
    'Flesh Cathedral Sanctuary',
    'Twilight Eclipse Sanctum',
    'Vanguard Hall of 50 Souls',
    'THE ASCENDED SANCTUARY OF MALAKATH'
  ];

  const arenaName = arenaLocations[index] || `Demon Realm Sector ${levelNum}`;
  const requiredGems = 4 + Math.min(5, Math.floor(levelNum / 8));
  const requiredKills = 8 + Math.min(20, Math.floor(levelNum * 0.5));

  const perks = [
    'Infernal Katana Flame +20%',
    'Demon Soul Magnetism +40%',
    'Soul Blast Radius +35%',
    'Sprint Cooldown -25%',
    'Critical Soul Strike +15%',
    'Blood Armor Aegis +50 HP',
    'Vampiric Soul Leech +5 HP',
    'Ascended Demon Slayer Aura',
  ];
  const unlockedPerk = levelNum % 3 === 0 ? perks[(Math.floor(levelNum / 3) - 1) % perks.length] : undefined;

  return {
    levelNumber: levelNum,
    title: `Level ${levelNum}: ${arenaName}`,
    subtitle: `FINAL BOSS: ${boss.bossName.toUpperCase()} · ${boss.bossTitle.toUpperCase()}`,
    theme,
    themeTitle,
    bgSrc: THEME_BACKGROUNDS[theme] || THEME_BACKGROUNDS.magma_shrine,
    requiredGems,
    requiredKills,
    bossAtKills: Math.floor(requiredKills * 0.6),
    bossType: levelNum === 50 ? 'malakath_final' : levelNum % 10 === 0 ? 'cataclysm_boss' : 'oni_boss',
    bossName: boss.bossName,
    bossTitle: boss.bossTitle,
    bossArchetype: boss.bossArchetype,
    bossPowerId: index + 1,
    bossSpriteSrc: BOSS_SPRITES[boss.bossArchetype][index % BOSS_SPRITES[boss.bossArchetype].length],
    bossHp: boss.bossHp,
    bossAttackPower: boss.bossAttackPower,
    bossDescription: boss.description,
    bossSpecialMove: boss.specialMove,
    enemyTypes: ['lesser_demon', 'flying_stinger', 'shadow_ninja'],
    environmentName: arenaName,
    themeColor,
    rewardSouls: 100 + levelNum * 40,
    rewardCredits: 150 + levelNum * 60,
    unlockedPerk,
  };
});

