export interface PlayableHero {
  id: string;
  name: string;
  title: string;
  role: 'Male Hooded Rogue' | 'Female Red-Haired Warrior' | 'Male Elven Archer' | 'Female Armored Paladin';
  spriteSrc: string;
  backSpriteSrc: string;
  weaponType: 'dual_blades' | 'flame_katana' | 'elven_bow' | 'war_mace';
  attackType: 'melee' | 'projectile';
  description: string;
  maxHp: number;
  speed: number;
  damageMultiplier: number;
  staminaEfficiency: number;
  specialSkillName: string;
  specialDescription: string;
  themeColor: string;
  unlockCostSouls: number;
  stats: {
    attack: number;
    defense: number;
    speed: number;
    range: number;
  };
}

export const PLAYABLE_HEROES: PlayableHero[] = [
  {
    id: 'hooded_rogue',
    name: 'Kaelen Shadowveil',
    title: 'Shadow Assassin',
    role: 'Male Hooded Rogue',
    spriteSrc: '/assets/images/ronin_character_1790178583853.jpg',
    backSpriteSrc: '/assets/images/pixel_rogue_back_1790259353822.jpg',
    weaponType: 'dual_blades',
    attackType: 'melee',
    description: 'Master of stealth and swift steel. Chains lethal 3-hit shadow katana strikes with rapid dash evasion.',
    maxHp: 150,
    speed: 290,
    damageMultiplier: 1.0,
    staminaEfficiency: 1.0,
    specialSkillName: 'Bloodmoon Fury',
    specialDescription: 'Unleashes a cataclysmic radial shadow shockwave annihilating surrounding demons.',
    themeColor: '#38bdf8',
    unlockCostSouls: 0,
    stats: {
      attack: 85,
      defense: 70,
      speed: 95,
      range: 65,
    },
  },
  {
    id: 'red_warrior',
    name: 'Morrigan Emberblade',
    title: 'Crimson Vanguard',
    role: 'Female Red-Haired Warrior',
    spriteSrc: '/assets/images/char_red_warrior_1790181588797.jpg',
    backSpriteSrc: '/assets/images/pixel_warrior_back_1790259338018.jpg',
    weaponType: 'flame_katana',
    attackType: 'melee',
    description: 'Ferocious high-damage swordmaster whose katana bursts into searing flame on critical combos.',
    maxHp: 165,
    speed: 280,
    damageMultiplier: 1.25,
    staminaEfficiency: 0.9,
    specialSkillName: 'Blazing Phoenix Slash',
    specialDescription: 'Summons a roaring wall of fire that erupts across the stage, incinerating demon hordes.',
    themeColor: '#f97316',
    unlockCostSouls: 150,
    stats: {
      attack: 95,
      defense: 75,
      speed: 85,
      range: 70,
    },
  },
  {
    id: 'elven_archer',
    name: 'Sylas Swiftbough',
    title: 'Whispering Sentinel',
    role: 'Male Elven Archer',
    spriteSrc: '/assets/images/char_elven_archer_1790181605950.jpg',
    backSpriteSrc: '/assets/images/pixel_archer_back_1790259298756.jpg',
    weaponType: 'elven_bow',
    attackType: 'projectile',
    description: 'Deadly marksman firing piercing luminous spirit arrows that strike enemies across great distance.',
    maxHp: 135,
    speed: 310,
    damageMultiplier: 1.1,
    staminaEfficiency: 1.15,
    specialSkillName: 'Hail of Starlight Arrows',
    specialDescription: 'Fires an ethereal volley skyward that rains piercing light spears across the entire field.',
    themeColor: '#22c55e',
    unlockCostSouls: 300,
    stats: {
      attack: 90,
      defense: 60,
      speed: 100,
      range: 100,
    },
  },
  {
    id: 'armored_paladin',
    name: 'Lady Valerie Dawnshield',
    title: 'Sanctified Knight',
    role: 'Female Armored Paladin',
    spriteSrc: '/assets/images/char_armored_paladin_1790181620559.jpg',
    backSpriteSrc: '/assets/images/pixel_paladin_back_1790259284985.jpg',
    weaponType: 'war_mace',
    attackType: 'melee',
    description: 'Heavily armored defender wielding an ornate war mace and holy shield with superior damage reduction.',
    maxHp: 210,
    speed: 250,
    damageMultiplier: 1.15,
    staminaEfficiency: 0.85,
    specialSkillName: 'Aegis of the Sun',
    specialDescription: 'Smashes the ground with divine judgment while raising an impenetrable holy invulnerability barrier.',
    themeColor: '#eab308',
    unlockCostSouls: 450,
    stats: {
      attack: 85,
      defense: 100,
      speed: 70,
      range: 65,
    },
  },
];
