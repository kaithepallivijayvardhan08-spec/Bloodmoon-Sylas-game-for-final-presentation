export type RoninActionState = 
  | 'stand' 
  | 'walk' 
  | 'run' 
  | 'jump' 
  | 'crouch' 
  | 'roll' 
  | 'climts_slash' // Action 7: Climts slash (light)
  | 'katana_combo' // Action 9: Katana combo (heavy)
  | 'block'        // Action 10: Block
  | 'parry'        // Action 11: Parry
  | 'cast_magic';  // Action 12: Cast magic

export interface CombatLogMessage {
  id: string;
  text: string;
  type: 'system' | 'combat' | 'loot' | 'warn';
  timestamp: number;
}

export interface AdventureLandmark {
  id: string;
  type: 'shrine' | 'chest' | 'ancient_torii' | 'lantern_pillar';
  x: number;
  z: number;
  activated?: boolean;
  buffType?: 'attack' | 'speed' | 'heal' | 'souls';
  name: string;
}

export interface Projectile3D {
  id: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  size: number;
  damage: number;
  fromPlayer: boolean;
  life: number;
  maxLife: number;
  type: 'arrow' | 'magic' | 'slash_wave' | 'fireball' | 'demon_skull' | 'demon_cleave' | 'shadow_shuriken' | 'boss_hazard';
  nextDamageAt?: number;
}

export interface RoninPlayer {
  x: number;
  y: number;
  z: number; // 3D depth position
  vx: number;
  vy: number;
  vz: number;
  width: number;
  height: number;
  facing: 'left' | 'right';
  facingAngle: number;
  rotationAngle: number; // 0 to 2*PI free roaming heading angle
  cameraAngle: number;   // Smoothly interpolated 360 camera viewing angle
  cameraPitch?: number;   // -0.3 to 0.3 vertical look tilt
  slowTimer?: number;
  isGrounded: boolean;
  isJumping: boolean;
  isDashing: boolean;
  isCrouching: boolean;
  isBlocking: boolean;
  isCasting: boolean;
  castTimer: number;
  currentAction: RoninActionState;
  dashCooldown: number;
  dashTimer: number;
  
  // Health & Stamina & Potions
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  soulEnergy: number; // for ultimate / specials
  maxSoulEnergy: number;
  potions: number;
  potionCooldown: number;

  // Combat Attack States
  isAttacking: boolean;
  comboStep: number; // 1, 2, 3 hit combo
  attackCooldown: number;
  attackHitboxTimer: number;
  isParrying: boolean;
  parryTimer: number;
  isSpecialActive: boolean;
  specialTimer: number;
  invulnerableTimer: number;

  // Progression
  kills: number;
  score: number;
  souls: number;
  level: number;
}

export type SlashEnemyType = 
  | 'shadow_ninja' 
  | 'lesser_demon' 
  | 'flying_stinger' 
  | 'corrupted_samurai' 
  | 'shadow_creeper' 
  | 'infernal_brute' 
  | 'succubus_queen' 
  | 'oni_boss' 
  | 'cataclysm_boss' 
  | 'malakath_boss'
  | 'cataclysm_magma'
  | 'void_space'
  | 'flesh_blight'
  | 'shadow_ice'
  | 'crystallized_light'
  | 'malakath_ascended';

export interface SlashEnemy {
  id: string;
  type: SlashEnemyType;
  x: number;
  y: number;
  z: number; // 3D world depth
  vx: number;
  vy: number;
  vz: number;
  width: number;
  height: number;
  facing: 'left' | 'right';
  distanceToPlayer?: number;
  hp: number;
  maxHp: number;
  damage: number;
  speed: number;
  attackRange: number;
  attackCooldown: number;
  attackWindup: number;
  isAttacking: boolean;
  isBoss?: boolean;
  bossPhase?: 'base' | 'cataclysm' | 'void' | 'corruption';
  hitStunTimer: number;
  spriteSrc: string;
  name: string;
  aiState?: 'idle' | 'detect' | 'chase' | 'attack' | 'hit' | 'dead';
  yaw?: number;
  bossPowerId?: number;
  bossPowerCooldown?: number;
  bossPowerWindup?: number;
  bossSpecialMove?: string;
}

export interface SlashEffect {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  type: 'slash' | 'spark' | 'blood' | 'shockwave' | 'soul_pickup';
  facing: 'left' | 'right';
  life: number;
  maxLife: number;
  comboIndex?: number;
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  vy: number;
}

export interface StagePlatform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'ground' | 'platform' | 'pillar';
}

export interface RoninWeapon {
  id: string;
  name: string;
  description: string;
  damageMultiplier: number;
  staminaCost: number;
  specialName: string;
  color: string;
}
