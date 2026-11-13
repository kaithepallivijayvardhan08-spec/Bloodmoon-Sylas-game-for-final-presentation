export type GameState = 
  | 'COVER' 
  | 'AUTH' 
  | 'DASHBOARD' 
  | 'HERO_SELECT' 
  | 'PLAYING' 
  | 'LEVEL_UP' 
  | 'PAUSED' 
  | 'GAME_OVER' 
  | 'VICTORY';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  callsign: string;
  createdAt: number;
  lastLogin: number;
  isGuest?: boolean;
  stats: {
    totalMatches: number;
    totalKills: number;
    highestWave: number;
    highestScore: number;
    totalPlayTime: number;
    victories: number;
  };
  unlockedCharacters: string[];
  credits: number;
}

export type WeaponId = 
  | 'plasma_blaster' 
  | 'orbiting_blades' 
  | 'chain_lightning' 
  | 'singularity_vortex' 
  | 'drone_escort' 
  | 'cryo_wave';

export type PassiveId = 
  | 'nano_shield' 
  | 'reactor_overclock' 
  | 'titanium_plating' 
  | 'quantum_dash' 
  | 'magnetron_core' 
  | 'critical_matrix';

export interface CharacterClass {
  id: string;
  name: string;
  codename: string;
  role: string;
  description: string;
  avatar: string;
  image: string;
  spriteImage: string;
  baseHp: number;
  baseSpeed: number;
  baseDamage: number;
  startingWeapon: WeaponId;
  perkTitle: string;
  perkDescription: string;
}

export interface UpgradeOption {
  id: string;
  name: string;
  type: 'weapon' | 'passive';
  weaponId?: WeaponId;
  passiveId?: PassiveId;
  level: number;
  maxLevel: number;
  description: string;
  nextTierPreview: string;
  icon: string;
}

export interface PlayerStats {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  hp: number;
  maxHp: number;
  shield: number;
  maxShield: number;
  speed: number;
  damageMult: number;
  fireRateMult: number;
  pickupRadius: number;
  critChance: number;
  critDamage: number;
  dashCooldown: number;
  dashTimer: number;
  isDashing: boolean;
  dashDuration: number;
  level: number;
  xp: number;
  xpToNext: number;
  score: number;
  kills: number;
  wave: number;
  timeSurvived: number; // in seconds
  weapons: Record<WeaponId, number>; // level 1-5
  passives: Record<PassiveId, number>; // level 1-5
  invulnerableTimer: number;
}

export interface Enemy {
  id: string;
  type: 'swarmer' | 'spitter' | 'kamikaze' | 'sentinel' | 'boss_goliath' | 'boss_omega';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  color: string;
  glowColor: string;
  isBoss: boolean;
  shootCooldown: number;
  shootTimer: number;
  phase?: number;
  frozenTimer?: number;
  specialTimer?: number;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
  color: string;
  glowColor: string;
  isEnemy: boolean;
  pierce: number;
  distanceTraveled: number;
  maxDistance: number;
  isCrit?: boolean;
}

export interface OrbitingBlade {
  angle: number;
  distance: number;
  damage: number;
  radius: number;
}

export interface Vortex {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  duration: number;
  timer: number;
  damage: number;
}

export interface XPGem {
  id: string;
  x: number;
  y: number;
  value: number;
  color: string;
  radius: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  alpha: number;
}

export interface DamageNumber {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
  isCrit: boolean;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  title: string;
  score: number;
  kills: number;
  wave: number;
  character: string;
  avatar: string;
}
