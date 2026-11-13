import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RoninPlayer, SlashEnemy, SlashEffect, FloatingText, StagePlatform, RoninActionState, Projectile3D, CombatLogMessage, AdventureLandmark } from '../types/ronin';
import { GameLevelConfig } from '../types/levels';
import { PlayableHero } from '../types/heroes';
import { GameSettings, TRANSLATIONS } from '../types/settings';
import { PixelAnimator } from '../services/pixelAnimator';
import { sound } from '../services/audio';
import { ThreeWorld } from '../services/threeWorld';
import {
  BuilderWorkspaceMode,
  CombatBalanceConfig,
  EnvironmentConfig,
  LiveCombatTelemetry,
  StyleRankTier,
  DEFAULT_COMBAT_BALANCE,
  DEFAULT_ENVIRONMENT_CONFIG,
} from '../types/builder';

interface RoninGameCanvasProps {
  currentHero: PlayableHero;
  currentLevelConfig: GameLevelConfig;
  settings: GameSettings;
  onLevelComplete: (stats: { score: number; kills: number; souls: number; timeSurvived: number }) => void;
  onGameOver: (stats: { score: number; kills: number; souls: number; timeSurvived: number }) => void;
  onOpenLevelMap: () => void;
  onOpenHeroSelect: () => void;
  onOpenSettings: () => void;
  onReturnToCamp?: () => void;
  isPaused: boolean;
  isGuest?: boolean;
  userCallsign: string;
  cameraMode3D?: boolean;

  // Gamer Builder Studio Integration
  builderEnv?: EnvironmentConfig;
  builderCombat?: CombatBalanceConfig;
  workspaceMode?: BuilderWorkspaceMode;
  onToggleWorkspaceMode?: () => void;
  onUpdateTelemetry?: (telemetry: LiveCombatTelemetry) => void;
  onSelectEntity?: (entity: SlashEnemy | RoninPlayer | null) => void;
  selectedEntityId?: string | null;
  spawnEnemySignal?: { type: string; timestamp: number } | null;
  clearEnemiesSignal?: number;
  resetArenaSignal?: number;
  onSyncEnemies?: (enemies: SlashEnemy[]) => void;
}

// Cached Images & High Vibrance Sprites
const SPRITE_CACHE: Record<string, HTMLImageElement> = {};
function getSprite(src: string): HTMLImageElement {
  if (!SPRITE_CACHE[src]) {
    const img = new Image();
    img.src = src;
    SPRITE_CACHE[src] = img;
  }
  return SPRITE_CACHE[src];
}

// 3D Courtyard Perspective Vista Backdrops matching user reference image
const SUN_COURTYARD_VISTA = '/assets/images/pixel_courtyard_citadel_1790259265824.jpg';
const BLOODMOON_COURTYARD_VISTA = '/assets/images/bloodmoon_citadel_vista_1790184266370.jpg';

// Demon Sprites
const MALAKATH_BOSS_SRC = '/assets/images/malakath_boss_phase_1790179940429.jpg';
const LESSER_DEMON_SRC = '/assets/images/lesser_demon_grunt_1790179970885.jpg';
const FLYING_STINGER_SRC = '/assets/images/flying_stinger_demon_1790179956858.jpg';
const NINJA_ENEMY_SRC = '/assets/images/shadow_ninja_enemy_1790178643374.jpg';
const ONI_BOSS_SRC = '/assets/images/oni_demon_boss_1790178627626.jpg';

// Preload all demon and hero image assets immediately so they are hot in memory
[
  MALAKATH_BOSS_SRC,
  LESSER_DEMON_SRC,
  FLYING_STINGER_SRC,
  NINJA_ENEMY_SRC,
  ONI_BOSS_SRC,
  SUN_COURTYARD_VISTA,
  BLOODMOON_COURTYARD_VISTA,
  '/assets/images/pixel_cobble_floor_1790259313506.jpg',
].forEach((src) => {
  getSprite(src);
});

export const RoninGameCanvas: React.FC<RoninGameCanvasProps> = ({
  currentHero,
  currentLevelConfig,
  settings,
  onLevelComplete,
  onGameOver,
  onOpenLevelMap,
  onOpenHeroSelect,
  onOpenSettings,
  onReturnToCamp,
  isPaused,
  userCallsign,
  builderEnv = DEFAULT_ENVIRONMENT_CONFIG,
  builderCombat = DEFAULT_COMBAT_BALANCE,
  workspaceMode = 'PLAY',
  onToggleWorkspaceMode,
  onUpdateTelemetry,
  onSelectEntity,
  selectedEntityId,
  spawnEnemySignal,
  clearEnemiesSignal,
  resetArenaSignal,
  onSyncEnemies,
  cameraMode3D = false,
}) => {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const threeWorldRef = useRef<ThreeWorld | null>(null);
  const radarCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const t = TRANSLATIONS[settings.language] || TRANSLATIONS.en;
  // Default to Bloodmoon mode (dark gothic night sky with blood moon)
  const [localSunModeOverride, setLocalSunModeOverride] = useState<boolean | null>(false);
  const isSunMode = localSunModeOverride !== null
    ? localSunModeOverride
    : false;
  const is3DBehindView = settings.cameraView === 'freefire_user';

  // Live Telemetry Refs
  const actionCountRef = useRef<number>(0);
  const damageDealtHistoryRef = useRef<Array<{ dmg: number; time: number }>>([]);
  const totalDmgDealtRef = useRef<number>(0);
  const totalDmgTakenRef = useRef<number>(0);
  const hitsLandedRef = useRef<number>(0);
  const critsLandedRef = useRef<number>(0);
  const parriesRef = useRef<number>(0);
  const parryAttemptsRef = useRef<number>(0);
  const dodgeRollsRef = useRef<number>(0);
  const peakDpsRef = useRef<number>(0);
  const stylePointsRef = useRef<number>(450);
  const startTimeRef = useRef<number>(performance.now());
  const lastTelemetrySyncRef = useRef<number>(0);

  const [questMinimized, setQuestMinimized] = useState(false);
  const [combatLogs, setCombatLogs] = useState<CombatLogMessage[]>([
    { id: '1', text: 'Bloodmoon: Sylas initialized', type: 'system', timestamp: Date.now() },
    { id: '2', text: 'Starlight Ruin courtyard ready. The demons are closing in.', type: 'warn', timestamp: Date.now() + 100 },
  ]);

  const addCombatLog = useCallback((text: string, type: 'system' | 'combat' | 'loot' | 'warn' = 'combat') => {
    setCombatLogs((prev) => [...prev.slice(-6), { id: Math.random().toString(), text, type, timestamp: Date.now() }]);
  }, []);

  // Keyboard input states
  const keysRef = useRef<{
    w: boolean;
    s: boolean;
    a: boolean;
    d: boolean;
    shift: boolean;
    jump: boolean;
    crouch: boolean;
    block: boolean;
    parry: boolean;
    cast: boolean;
    climtsSlash: boolean;
    heavyCombo: boolean;
    attack: boolean;
    dash: boolean;
    special: boolean;
  }>({
    w: false,
    s: false,
    a: false,
    d: false,
    shift: false,
    jump: false,
    crouch: false,
    block: false,
    parry: false,
    cast: false,
    climtsSlash: false,
    heavyCombo: false,
    attack: false,
    dash: false,
    special: false,
  });

  // Hotbar Action Keys & cooldown tracker
  const [hotbarState, setHotbarState] = useState({
    climtsCd: 0,
    heavyCd: 0,
    dashCd: 0,
    blockActive: false,
    magicCd: 0,
    specialCd: 0,
    potionCd: 0,
    potionsRemaining: 3,
  });

  // Action Macro Controller & Mouse-Look System
  const controlLayout = 'CONTROLLER';
  const [sprintLock, setSprintLock] = useState<boolean>(false);
  const [isPointerLocked, setIsPointerLocked] = useState<boolean>(false);

  const cameraTouchRef = useRef<{
    active: boolean;
    touchId: number | null;
    lastX: number;
    lastY: number;
  }>({
    active: false,
    touchId: null,
    lastX: 0,
    lastY: 0,
  });

  // 360° Mouse Look & Dynamic Heading Tracking
  const mouseAimRef = useRef<{
    screenX: number;
    screenY: number;
    angle: number; // 0 to 2*PI free 360° angle from hero
    isAimingWithMouse: boolean;
    targetId: string | null;
    isRightDragging: boolean;
    lastMouseX: number;
    lastMouseY: number;
  }>({
    screenX: 0,
    screenY: 0,
    angle: 0,
    isAimingWithMouse: false,
    targetId: null,
    isRightDragging: false,
    lastMouseX: 0,
    lastMouseY: 0,
  });

  // Game Arena State
  const gameStateRef = useRef<{
    player: RoninPlayer;
    enemies: SlashEnemy[];
    projectiles: Projectile3D[];
    effects: SlashEffect[];
    floatingTexts: FloatingText[];
    platforms: StagePlatform[];
    cameraX: number;
    spawnTimer: number;
    levelKills: number;
    bossSpawned: boolean;
    bossDefeated: boolean;
    levelCleared: boolean;
    shake: number;
    timeElapsed: number;
    particles: Array<{ x: number; y: number; z: number; vx: number; vy: number; vz: number; size: number }>;
    hitSparks: Array<{ x: number; y: number; vx: number; vy: number; color: string; size: number; life: number; maxLife: number }>;
    landmarks: AdventureLandmark[];
  }>({
    player: {
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      width: 52,
      height: 78,
      facing: 'right',
      facingAngle: 0,
      rotationAngle: 0,
      cameraAngle: 0,
      isGrounded: true,
      isJumping: false,
      isDashing: false,
      isCrouching: false,
      isBlocking: false,
      isCasting: false,
      castTimer: 0,
      currentAction: 'stand',
      dashCooldown: 0.9,
      dashTimer: 0,
      hp: currentHero.maxHp,
      maxHp: currentHero.maxHp,
      stamina: 100,
      maxStamina: 100,
      soulEnergy: 35,
      maxSoulEnergy: 100,
      potions: 3,
      potionCooldown: 0,
      isAttacking: false,
      comboStep: 0,
      attackCooldown: 0,
      attackHitboxTimer: 0,
      isParrying: false,
      parryTimer: 0,
      isSpecialActive: false,
      specialTimer: 0,
      invulnerableTimer: 0,
      kills: 0,
      score: 0,
      souls: 0,
      level: currentLevelConfig.levelNumber,
    },
    enemies: [
      {
        id: 'init_lesser_1',
        type: 'lesser_demon',
        x: -90,
        y: 35,
        z: 1180,
        vx: 0,
        vy: 0,
        vz: -140,
        width: 48,
        height: 68,
        facing: 'left',
        hp: 60,
        maxHp: 60,
        damage: 12,
        speed: 140,
        attackRange: 80,
        attackCooldown: 1.8,
        attackWindup: 0,
        isAttacking: false,
        hitStunTimer: 0,
        spriteSrc: LESSER_DEMON_SRC,
        name: 'Lesser Demon Grunt',
      },
      {
        id: 'init_ninja_2',
        type: 'shadow_ninja',
        x: 130,
        y: 20,
        z: 1500,
        vx: 0,
        vy: 0,
        vz: -160,
        width: 52,
        height: 72,
        facing: 'left',
        hp: 65,
        maxHp: 65,
        damage: 15,
        speed: 160,
        attackRange: 90,
        attackCooldown: 1.6,
        attackWindup: 0,
        isAttacking: false,
        hitStunTimer: 0,
        spriteSrc: NINJA_ENEMY_SRC,
        name: 'Shadow Ninja Stalker',
      },
      {
        id: 'init_stinger_3',
        type: 'flying_stinger',
        x: -40,
        y: -30,
        z: 1820,
        vx: 0,
        vy: 0,
        vz: -150,
        width: 56,
        height: 64,
        facing: 'left',
        hp: 50,
        maxHp: 50,
        damage: 14,
        speed: 150,
        attackRange: 100,
        attackCooldown: 1.7,
        attackWindup: 0,
        isAttacking: false,
        hitStunTimer: 0,
        spriteSrc: FLYING_STINGER_SRC,
        name: 'Flying Stinger Demon',
      },
    ],
    projectiles: [],
    effects: [],
    floatingTexts: [],
    platforms: [
      { x: -600, y: 560, width: 4200, height: 140, type: 'ground' },
      { x: 260, y: 430, width: 220, height: 22, type: 'platform' },
      { x: 580, y: 340, width: 250, height: 22, type: 'platform' },
    ],
    cameraX: 0,
    spawnTimer: 0,
    levelKills: 0,
    bossSpawned: false,
    bossDefeated: false,
    levelCleared: false,
    shake: 0,
    timeElapsed: 0,
    particles: Array.from({ length: 55 }, () => ({
      x: (Math.random() - 0.5) * 850,
      y: (Math.random() - 0.5) * 450,
      z: Math.random() * 1100 + 80,
      vx: (Math.random() - 0.5) * 20,
      vy: Math.random() * 25 + 10,
      vz: -(Math.random() * 40 + 20),
      size: Math.random() * 3 + 2,
    })),
    hitSparks: [] as { x: number; y: number; vx: number; vy: number; color: string; size: number; life: number; maxLife: number }[],
    landmarks: [
      { id: 'shrine_1', type: 'shrine', x: 0, z: 800, name: 'Shrine of Thunder', buffType: 'attack' },
      { id: 'shrine_2', type: 'shrine', x: 500, z: 1600, name: 'Shrine of Recovery', buffType: 'heal' },
      { id: 'shrine_3', type: 'shrine', x: -300, z: 2400, name: 'Shrine of Gale Speed', buffType: 'speed' },
      { id: 'chest_1', type: 'chest', x: 350, z: 750, name: 'Ancient Soul Urn', buffType: 'souls' },
      { id: 'chest_2', type: 'chest', x: -550, z: 1800, name: 'Imperial War Chest', buffType: 'souls' },
      { id: 'chest_3', type: 'chest', x: 200, z: 2700, name: 'Relic Coffer', buffType: 'souls' },
    ],
  });

  // Top/Bottom HUD state
  const [hudState, setHudState] = useState({
    hp: currentHero.maxHp,
    maxHp: currentHero.maxHp,
    stamina: 100,
    soul: 35,
    score: 0,
    levelKills: 0,
    requiredKills: currentLevelConfig.requiredKills,
    levelNum: currentLevelConfig.levelNumber,
    levelTitle: currentLevelConfig.title,
    heroName: currentHero.name,
    specialSkill: currentHero.specialSkillName,
    time: 0,
    action: 'stand' as RoninActionState,
    bossApproaching: false,
  });

  // Authentic 16-Bit Fighting Game Ghost Damage Bar
  const [ghostHp, setGhostHp] = useState(currentHero.maxHp);
  useEffect(() => {
    if (hudState.hp < ghostHp) {
      const timer = setTimeout(() => {
        setGhostHp((prev) => Math.max(hudState.hp, prev - 4));
      }, 40);
      return () => clearTimeout(timer);
    } else if (hudState.hp > ghostHp) {
      setGhostHp(hudState.hp);
    }
  }, [hudState.hp, ghostHp]);

  // Retro Arcade CRT Scanline Filter Toggle (Default ON as requested)
  const [crtFilter, setCrtFilter] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('shadow_ronin_crt');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const toggleCrtFilter = useCallback(() => {
    setCrtFilter((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('shadow_ronin_crt', String(next));
      } catch {}
      return next;
    });
  }, []);

  // Spawn authentic square 16-bit pixel sparks
  const spawnHitSparks = useCallback((x: number, y: number, color = '#fbbf24', count = 12) => {
    const sparks = gameStateRef.current.hitSparks;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 240 + 70;
      sparks.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 80,
        color,
        size: Math.random() > 0.4 ? 4 : 3,
        life: 0,
        maxLife: Math.random() * 0.22 + 0.14,
      });
    }
  }, []);

  // Builder Spawn Enemy Signal Listener
  useEffect(() => {
    if (!spawnEnemySignal) return;
    const s = gameStateRef.current;
    const p = s.player;
    const spawnZ = p.z + 650;
    const spawnX = p.x + (Math.random() - 0.5) * 320;
    const type = spawnEnemySignal.type;
    const hpMult = builderCombat ? builderCombat.enemyHealthMultiplier : 1.0;
    const dmgMult = builderCombat ? builderCombat.enemyDamageMultiplier : 1.0;
    const spdMult = builderCombat ? builderCombat.enemySpeedMultiplier : 1.0;

    let newEnemy: SlashEnemy;
    if (type === 'oni_boss') {
      newEnemy = {
        id: `spawned_${Date.now()}`,
        type: 'oni_boss',
        x: spawnX,
        y: 10,
        z: spawnZ,
        vx: 0,
        vy: 0,
        vz: -80 * spdMult,
        width: 105,
        height: 140,
        facing: 'left',
        hp: Math.round(550 * hpMult),
        maxHp: Math.round(550 * hpMult),
        damage: Math.round(24 * dmgMult),
        speed: 80 * spdMult,
        attackRange: 110,
        attackCooldown: 2.0,
        attackWindup: 0,
        isAttacking: false,
        isBoss: true,
        hitStunTimer: 0,
        spriteSrc: ONI_BOSS_SRC,
        name: 'Oni Warlord Boss',
      };
    } else if (type === 'malakath_boss') {
      newEnemy = {
        id: `spawned_${Date.now()}`,
        type: 'malakath_boss',
        x: spawnX,
        y: -10,
        z: spawnZ,
        vx: 0,
        vy: 0,
        vz: -70 * spdMult,
        width: 130,
        height: 165,
        facing: 'left',
        hp: Math.round(950 * hpMult),
        maxHp: Math.round(950 * hpMult),
        damage: Math.round(32 * dmgMult),
        speed: 70 * spdMult,
        attackRange: 130,
        attackCooldown: 2.2,
        attackWindup: 0,
        isAttacking: false,
        isBoss: true,
        hitStunTimer: 0,
        spriteSrc: MALAKATH_BOSS_SRC,
        name: 'Malakath Arch-Fiend',
      };
    } else if (type === 'flying_stinger') {
      newEnemy = {
        id: `spawned_${Date.now()}`,
        type: 'flying_stinger',
        x: spawnX,
        y: -35,
        z: spawnZ,
        vx: 0,
        vy: 0,
        vz: -160 * spdMult,
        width: 52,
        height: 64,
        facing: 'left',
        hp: Math.round(50 * hpMult),
        maxHp: Math.round(50 * hpMult),
        damage: Math.round(14 * dmgMult),
        speed: 160 * spdMult,
        attackRange: 90,
        attackCooldown: 1.6,
        attackWindup: 0,
        isAttacking: false,
        hitStunTimer: 0,
        spriteSrc: FLYING_STINGER_SRC,
        name: 'Flying Stinger Demon',
      };
    } else if (type === 'shadow_ninja') {
      newEnemy = {
        id: `spawned_${Date.now()}`,
        type: 'shadow_ninja',
        x: spawnX,
        y: 25,
        z: spawnZ,
        vx: 0,
        vy: 0,
        vz: -180 * spdMult,
        width: 48,
        height: 72,
        facing: 'left',
        hp: Math.round(75 * hpMult),
        maxHp: Math.round(75 * hpMult),
        damage: Math.round(18 * dmgMult),
        speed: 180 * spdMult,
        attackRange: 85,
        attackCooldown: 1.4,
        attackWindup: 0,
        isAttacking: false,
        hitStunTimer: 0,
        spriteSrc: NINJA_ENEMY_SRC,
        name: 'Shadow Ninja Stalker',
      };
    } else {
      newEnemy = {
        id: `spawned_${Date.now()}`,
        type: 'lesser_demon',
        x: spawnX,
        y: 35,
        z: spawnZ,
        vx: 0,
        vy: 0,
        vz: -140 * spdMult,
        width: 48,
        height: 68,
        facing: 'left',
        hp: Math.round(60 * hpMult),
        maxHp: Math.round(60 * hpMult),
        damage: Math.round(12 * dmgMult),
        speed: 140 * spdMult,
        attackRange: 75,
        attackCooldown: 1.8,
        attackWindup: 0,
        isAttacking: false,
        hitStunTimer: 0,
        spriteSrc: LESSER_DEMON_SRC,
        name: 'Lesser Demon Grunt',
      };
    }

    s.enemies.push(newEnemy);
    onSyncEnemies?.([...s.enemies]);
    addCombatLog(`Architect Spawner: Materialized ${newEnemy.name}`, 'system');
  }, [spawnEnemySignal, builderCombat, onSyncEnemies]);

  // Clear Enemies Signal Listener
  useEffect(() => {
    if (clearEnemiesSignal === undefined || clearEnemiesSignal === 0) return;
    gameStateRef.current.enemies = [];
    onSyncEnemies?.([]);
    addCombatLog('Architect: Cleared all enemy entities in courtyard', 'system');
  }, [clearEnemiesSignal, onSyncEnemies]);

  // Reset Arena Signal Listener
  useEffect(() => {
    if (resetArenaSignal === undefined || resetArenaSignal === 0) return;
    const s = gameStateRef.current;
    s.player.hp = currentHero.maxHp;
    s.player.stamina = 100;
    s.player.soulEnergy = 50;
    s.enemies = [];
    s.projectiles = [];
    s.levelKills = 0;
    s.bossSpawned = false;
    s.bossDefeated = false;
    s.levelCleared = false;
    s.timeElapsed = 0;
    onSyncEnemies?.([]);
    addCombatLog('Architect: Arena and champion state reset to pristine', 'system');
  }, [resetArenaSignal, currentHero, onSyncEnemies]);

  // Screen shake helper
  const addShake = (amount: number) => {
    if (!settings.screenShake) return;
    gameStateRef.current.shake = Math.min(22, gameStateRef.current.shake + amount);
  };

  // Add floating text
  const addFloatingText = (text: string, x: number, y: number, color = '#ffffff', size = 18) => {
    if (!settings.damageNumbers) return;
    gameStateRef.current.floatingTexts.push({
      id: Math.random().toString(),
      text,
      x,
      y,
      color,
      size,
      life: 0,
      maxLife: 0.85,
      vy: -60,
    });
  };

  // ==========================================
  // ACTION IMPLEMENTATIONS (The 12 User Actions)
  // ==========================================

  // Action 7: Climts Slash (Light Attack)
  const performClimtsSlash = useCallback(() => {
    const s = gameStateRef.current;
    const p = s.player;
    const cd = builderCombat ? builderCombat.lightSlashCooldown : 0.22;
    if (p.attackCooldown > 0 || p.stamina < 8 || p.isDashing) return;

    actionCountRef.current++;
    p.stamina = Math.max(0, p.stamina - (8 * currentHero.staminaEfficiency));
    p.isAttacking = true;
    p.currentAction = 'climts_slash';
    p.attackHitboxTimer = 0.2;
    p.attackCooldown = cd;
    sound.playBladeSlash();

    const baseDmg = builderCombat ? builderCombat.lightSlashDamage : 35;
    const slashColor = currentHero.themeColor || '#38bdf8';
    const damage = Math.round(baseDmg * currentHero.damageMultiplier);
    const heading = p.cameraAngle;
    const slashSpeed = 520;
    const pVx = Math.sin(heading) * slashSpeed;
    const pVz = Math.cos(heading) * slashSpeed;

    // Create 3D slash projectile / wave traveling along 360° mouse look vector
    s.projectiles.push({
      id: Math.random().toString(),
      x: p.x,
      y: p.y - 10,
      z: p.z + 40,
      vx: pVx,
      vy: 0,
      vz: pVz,
      color: slashColor,
      size: 45,
      damage,
      fromPlayer: true,
      life: 0,
      maxLife: 0.35,
      type: 'slash_wave',
    });

    // Check direct hits on nearby demons
    let hitCount = 0;
    s.enemies.forEach((enemy) => {
      const dx = enemy.x - p.x;
      const dz = enemy.z - p.z;
      const forward = dx * Math.sin(heading) + dz * Math.cos(heading);
      const lateral = Math.abs(dx * Math.cos(heading) - dz * Math.sin(heading));
      if (forward > 0 && forward < 190 && lateral < 120) {
        enemy.hp -= damage;
        enemy.hitStunTimer = 0.25;
        enemy.x += Math.sin(heading) * 60;
        enemy.z += Math.cos(heading) * 60;
        hitCount++;
        hitsLandedRef.current++;
        totalDmgDealtRef.current += damage;
        damageDealtHistoryRef.current.push({ dmg: damage, time: performance.now() });
        stylePointsRef.current += damage * 2;
        const sparkScreenX = window.innerWidth * 0.5 + (enemy.x - p.x);
        const sparkScreenY = window.innerHeight * 0.65;
        spawnHitSparks(sparkScreenX, sparkScreenY, slashColor, 10);
        addFloatingText(`${damage}`, sparkScreenX, sparkScreenY, slashColor, 18);
        p.soulEnergy = Math.min(p.maxSoulEnergy, p.soulEnergy + 10);
        p.score += damage * 3;
        sound.playHit();
      }
    });

    if (hitCount > 0) {
      addCombatLog(`Dealt ${damage} Climts Slash to approaching demon!`, 'combat');
    }
  }, [currentHero, builderCombat, addCombatLog, spawnHitSparks]);

  // Action 8 & 9: Heavy Katana Combo
  const performHeavyCombo = useCallback(() => {
    const s = gameStateRef.current;
    const p = s.player;
    const stamCost = builderCombat ? builderCombat.heavyStaminaCost : 16;
    if (p.attackCooldown > 0 || p.stamina < stamCost || p.isDashing) return;

    actionCountRef.current++;
    p.stamina = Math.max(0, p.stamina - (stamCost * currentHero.staminaEfficiency));
    p.isAttacking = true;
    p.currentAction = 'katana_combo';
    p.attackHitboxTimer = 0.32;
    p.attackCooldown = 0.38;
    sound.playBladeSlash();

    const mult = builderCombat ? builderCombat.heavyDamageMultiplier : 2.5;
    const damage = Math.round(35 * mult * currentHero.damageMultiplier);
    const heading = p.cameraAngle;
    const hSpeed = 650;
    const pVx = Math.sin(heading) * hSpeed;
    const pVz = Math.cos(heading) * hSpeed;

    // Shockwave forward through courtyard along 360° mouse look vector
    s.projectiles.push({
      id: Math.random().toString(),
      x: p.x,
      y: p.y,
      z: p.z + 50,
      vx: pVx,
      vy: 0,
      vz: pVz,
      color: '#fbbf24',
      size: 70,
      damage,
      fromPlayer: true,
      life: 0,
      maxLife: 0.45,
      type: 'slash_wave',
    });

    let hitCount = 0;
    s.enemies.forEach((enemy) => {
      const dx = enemy.x - p.x;
      const dz = enemy.z - p.z;
      const forward = dx * Math.sin(heading) + dz * Math.cos(heading);
      const lateral = Math.abs(dx * Math.cos(heading) - dz * Math.sin(heading));
      if (forward > 0 && forward < 260 && lateral < 160) {
        enemy.hp -= damage;
        enemy.hitStunTimer = 0.5;
        enemy.x += Math.sin(heading) * 120;
        enemy.z += Math.cos(heading) * 120;
        hitCount++;
        hitsLandedRef.current++;
        critsLandedRef.current++;
        totalDmgDealtRef.current += damage;
        damageDealtHistoryRef.current.push({ dmg: damage, time: performance.now() });
        stylePointsRef.current += damage * 3;
        const sparkScreenX = window.innerWidth * 0.5 + (enemy.x - p.x);
        const sparkScreenY = window.innerHeight * 0.6;
        spawnHitSparks(sparkScreenX, sparkScreenY, '#fbbf24', 18);
        addFloatingText(`${damage} CRIT!`, sparkScreenX, sparkScreenY, '#fbbf24', 22);
        p.soulEnergy = Math.min(p.maxSoulEnergy, p.soulEnergy + 20);
        p.score += damage * 4;
        sound.playHit();
      }
    });

    if (hitCount > 0) {
      addShake(10);
      addCombatLog(`Critical Strike: ${damage} Heavy Cleave dealt!`, 'combat');
    }
  }, [currentHero, builderCombat, addCombatLog, spawnHitSparks]);

  // Action 6: Roll / Shadow Dash
  const performDash = useCallback(() => {
    const s = gameStateRef.current;
    const p = s.player;
    if (p.dashTimer > 0 || p.stamina < 16) return;

    actionCountRef.current++;
    dodgeRollsRef.current++;
    p.stamina -= 16;
    p.isDashing = true;
    p.currentAction = 'roll';
    p.dashTimer = p.dashCooldown;
    p.invulnerableTimer = builderCombat ? (builderCombat.rollInvulnerabilityMs / 1000) : 0.45;
    // Dash forward along depth or sideways
    p.vz = builderCombat ? builderCombat.rollSpeed : 450;

    sound.playDash();
    addCombatLog('Executed evasive roll maneuver!', 'system');
  }, [builderCombat, addCombatLog]);

  // Action 10 & 11: Guard & Parry
  const toggleBlockParry = useCallback((enable: boolean) => {
    const s = gameStateRef.current;
    const p = s.player;
    p.isBlocking = enable;
    if (enable) {
      actionCountRef.current++;
      p.currentAction = 'block';
      p.isParrying = true;
      p.parryTimer = builderCombat ? (builderCombat.parryWindowMs / 1000) : 0.35; // Perfect parry window
      sound.playClick();
      addCombatLog('Defensive guard raised (Parry window active)', 'system');
    } else {
      p.isParrying = false;
      p.currentAction = 'stand';
    }
  }, [builderCombat, addCombatLog]);

  // Action 12: Cast Magic
  const performCastMagic = useCallback(() => {
    const s = gameStateRef.current;
    const p = s.player;
    if (p.stamina < 20 || p.castTimer > 0) return;

    actionCountRef.current++;
    p.stamina -= 20;
    p.isCasting = true;
    p.castTimer = 0.55;
    p.currentAction = 'cast_magic';
    sound.playLightningZap();

    const magicDamage = Math.round(65 * currentHero.damageMultiplier);
    const heading = p.cameraAngle;
    const projSpeed = 750;
    const pVx = Math.sin(heading) * projSpeed;
    const pVz = Math.cos(heading) * projSpeed;

    // Fires arcane rune sphere forward towards 360° mouse aim
    s.projectiles.push({
      id: Math.random().toString(),
      x: p.x,
      y: p.y - 30,
      z: p.z + 50,
      vx: pVx,
      vy: 0,
      vz: pVz,
      color: '#c084fc',
      size: 32,
      damage: magicDamage,
      fromPlayer: true,
      life: 0,
      maxLife: 1.2,
      type: 'magic',
    });

    addCombatLog('Cast Arcane Sigil Blast towards 360° aim!', 'combat');
  }, [currentHero, addCombatLog]);

  // Action: Drink Elixir / Health Potion
  const drinkPotion = useCallback(() => {
    const s = gameStateRef.current;
    const p = s.player;
    if (p.potions <= 0 || p.potionCooldown > 0 || p.hp >= p.maxHp) return;

    actionCountRef.current++;
    p.potions--;
    p.potionCooldown = 3.0;
    const healAmount = Math.round(p.maxHp * 0.45);
    p.hp = Math.min(p.maxHp, p.hp + healAmount);
    sound.playAchievement();
    addFloatingText(`+${healAmount} HP`, window.innerWidth * 0.42, window.innerHeight * 0.65, '#10b981', 22);
    addCombatLog(`Consumed Elixir of Life (+${healAmount} HP)`, 'loot');
  }, [addCombatLog]);

  // Ultimate Special Skill
  const performSpecial = useCallback(() => {
    const s = gameStateRef.current;
    const p = s.player;
    if (p.soulEnergy < 100) return;

    actionCountRef.current++;
    p.soulEnergy = 0;
    p.isSpecialActive = true;
    p.specialTimer = 1.0;
    p.invulnerableTimer = 1.2;
    addShake(18);
    sound.playExplosion();

    const ultDamage = Math.round(220 * currentHero.damageMultiplier);
    s.enemies.forEach((enemy) => {
      const distance = Math.hypot(enemy.x - p.x, enemy.z - p.z);
      if (distance < 700) {
        enemy.hp -= ultDamage;
        const away = Math.atan2(enemy.x - p.x, enemy.z - p.z);
        enemy.x += Math.sin(away) * 250;
        enemy.z += Math.cos(away) * 250;
        enemy.hitStunTimer = 0.8;
        hitsLandedRef.current++;
        totalDmgDealtRef.current += ultDamage;
        damageDealtHistoryRef.current.push({ dmg: ultDamage, time: performance.now() });
        stylePointsRef.current += ultDamage;
      }
    });

    addCombatLog(`ULTIMATE UNLEASHED: ${currentHero.specialSkillName} obliterated approaching threats!`, 'warn');
  }, [currentHero, addCombatLog]);

  // Action: Jump in 3D Space (governed by constant gravity loop)
  const performJump = useCallback(() => {
    const s = gameStateRef.current;
    const p = s.player;
    if (p.isGrounded && !p.isJumping) {
      actionCountRef.current++;
      p.isGrounded = false;
      p.isJumping = true;
      p.vy = 480;
      sound.playBladeSlash();
      addCombatLog('Leaped into aerial stance!', 'system');
    }
  }, [addCombatLog]);

  // Action: Lock-on Target (Retains primary shooter indicator, removes duplicate center text clash)
  const performTargetLock = useCallback(() => {
    const s = gameStateRef.current;
    const p = s.player;
    let closestEnemy: SlashEnemy | null = null;
    let minDist = Infinity;
    s.enemies.forEach((enemy) => {
      if (enemy.hp > 0) {
        const dist = Math.hypot(enemy.x - p.x, enemy.z - p.z);
        if (dist < minDist) {
          minDist = dist;
          closestEnemy = enemy;
        }
      }
    });

    if (closestEnemy) {
      mouseAimRef.current.targetId = (closestEnemy as SlashEnemy).id;
      const angle = Math.atan2((closestEnemy as SlashEnemy).x - p.x, (closestEnemy as SlashEnemy).z - p.z);
      mouseAimRef.current.angle = angle;
      mouseAimRef.current.isAimingWithMouse = true;
      p.cameraAngle = angle;
      p.rotationAngle = angle;
      threeWorldRef.current?.setTarget((closestEnemy as SlashEnemy).id);
      sound.playClick();
      addCombatLog(`Target locked onto ${(closestEnemy as SlashEnemy).name}!`, 'warn');
    } else {
      mouseAimRef.current.targetId = null;
      threeWorldRef.current?.setTarget(null);
      sound.playClick();
      addCombatLog('No demon target in range!', 'system');
    }
  }, [addCombatLog]);

  // Pointer Lock & 360° Mouse Look Listeners
  useEffect(() => {
    const handlePointerLockChange = () => {
      const locked = document.pointerLockElement === canvasRef.current;
      setIsPointerLocked(locked);
    };

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === canvasRef.current) {
        const p = gameStateRef.current.player;
        const sens = 0.0032;
        const pitchSens = 0.002;
        p.cameraAngle = (p.cameraAngle + (e.movementX || 0) * sens);
        p.cameraPitch = Math.max(-0.35, Math.min(0.35, (p.cameraPitch || 0) + (e.movementY || 0) * pitchSens));
        mouseAimRef.current.angle = p.cameraAngle;
        mouseAimRef.current.isAimingWithMouse = true;
      }
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      window.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, []);

  // Keyboard mapping & Pro Gamer Builder Hotkeys (F1 - F5)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Pro Gamer Builder Hotkeys
      if (e.key === 'F1') {
        e.preventDefault();
        onToggleWorkspaceMode?.();
        return;
      }
      if (e.key === 'F2') {
        e.preventDefault();
        if (builderEnv) {
          builderEnv.showHitboxes = !builderEnv.showHitboxes;
          addCombatLog(`3D Wireframe Hitboxes: ${builderEnv.showHitboxes ? 'ACTIVE' : 'OFF'}`, 'system');
        }
        return;
      }
      if (e.key === 'F3') {
        e.preventDefault();
        if (builderCombat) {
          builderCombat.godMode = !builderCombat.godMode;
          addCombatLog(`Architect God Mode: ${builderCombat.godMode ? 'ACTIVE' : 'OFF'}`, 'system');
        }
        return;
      }
      if (e.key === 'F4') {
        e.preventDefault();
        const s = gameStateRef.current;
        s.spawnTimer = 999;
        addCombatLog('Quick Spawner: Deployed demon horde wave (F4)', 'system');
        return;
      }
      if (e.key === 'F5') {
        e.preventDefault();
        const s = gameStateRef.current;
        s.player.hp = currentHero.maxHp;
        s.player.stamina = 100;
        s.player.soulEnergy = 50;
        s.enemies = [];
        onSyncEnemies?.([]);
        addCombatLog('Arena & Champion reset to pristine test state (F5)', 'system');
        return;
      }

      if (isPaused) return;
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select, [contenteditable="true"]')) return;
      const k = e.key.toLowerCase();
      const keys = keysRef.current;

      if (k === 'w' || k === 'arrowup') { keys.w = true; e.preventDefault(); }
      if (k === 's' || k === 'arrowdown') { keys.s = true; e.preventDefault(); }
      if (k === 'a' || k === 'arrowleft') { keys.a = true; e.preventDefault(); }
      if (k === 'd' || k === 'arrowright') { keys.d = true; e.preventDefault(); }
      if (e.key === 'Shift' || k === 'shift') { keys.shift = true; e.preventDefault(); }
      if (e.code === 'Space') {
        e.preventDefault();
        keys.jump = true;
        performJump();
      }

      // One memorable shortcut per action; all actions remain available as buttons.
      if (k === 'j') performClimtsSlash();
      if (k === 'k') performHeavyCombo();
      if (k === 'r') performDash();
      if (k === 'b') toggleBlockParry(true);
      if (k === 'e') performCastMagic();
      if (k === 'q') performSpecial();
      if (k === 'p') drinkPotion();
      if (k === 'f') performTargetLock();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const keys = keysRef.current;
      if (k === 'w' || k === 'arrowup') keys.w = false;
      if (k === 's' || k === 'arrowdown') keys.s = false;
      if (k === 'a' || k === 'arrowleft') keys.a = false;
      if (k === 'd' || k === 'arrowright') keys.d = false;
      if (e.key === 'Shift' || k === 'shift') keys.shift = false;
      if (e.code === 'Space') keys.jump = false;
      if (k === 'b') toggleBlockParry(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    isPaused,
    performClimtsSlash,
    performHeavyCombo,
    performDash,
    toggleBlockParry,
    performCastMagic,
    performSpecial,
    drinkPotion,
    performJump,
    performTargetLock,
    onToggleWorkspaceMode,
    builderEnv,
    builderCombat,
    currentHero,
    onSyncEnemies,
    addCombatLog,
  ]);

  // 60 FPS Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const canvas = canvasRef.current;
    if (!canvas) return;
    const world = new ThreeWorld(
      canvas,
      currentHero.backSpriteSrc || currentHero.spriteSrc,
      currentLevelConfig.bgSrc || BLOODMOON_COURTYARD_VISTA
    );
    threeWorldRef.current = world;

    const handleResize = () => {
      world.resize();
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    const gameLoop = (currentTime: number) => {
      animId = requestAnimationFrame(gameLoop);
      const dt = Math.min(0.05, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      if (isPaused) return;

      const s = gameStateRef.current;
      const p = s.player;
      const keys = keysRef.current;
      const viewWidth = canvas.clientWidth || window.innerWidth;
      const viewHeight = canvas.clientHeight || window.innerHeight;

      const lockedEnemy = mouseAimRef.current.targetId
        ? s.enemies.find((enemy) => enemy.id === mouseAimRef.current.targetId && enemy.hp > 0)
        : undefined;
      if (mouseAimRef.current.targetId && !lockedEnemy) {
        mouseAimRef.current.targetId = null;
        threeWorldRef.current?.setTarget(null);
      }
      if (lockedEnemy) {
        mouseAimRef.current.angle = Math.atan2(lockedEnemy.x - p.x, lockedEnemy.z - p.z);
        mouseAimRef.current.isAimingWithMouse = true;
      }

      s.timeElapsed += dt;

      // 1. Cooldowns & Timers
      if (p.attackCooldown > 0) p.attackCooldown -= dt;
      if (p.attackHitboxTimer > 0) p.attackHitboxTimer -= dt;
      if (p.dashTimer > 0) p.dashTimer -= dt;
      if (p.invulnerableTimer > 0) p.invulnerableTimer -= dt;
      if (p.specialTimer > 0) p.specialTimer -= dt;
      if (p.parryTimer > 0) p.parryTimer -= dt;
      if (p.potionCooldown > 0) p.potionCooldown -= dt;
      if ((p.slowTimer ?? 0) > 0) p.slowTimer = Math.max(0, (p.slowTimer ?? 0) - dt);
      if (p.castTimer > 0) {
        p.castTimer -= dt;
        if (p.castTimer <= 0) p.isCasting = false;
      }

      // Stamina Recharge
      if (p.stamina < p.maxStamina) {
        p.stamina = Math.min(p.maxStamina, p.stamina + 45 * dt);
      }

      // 2. 3D Movement Handling (360° Omnidirectional Movement Guided by Mouse Aim & WASD)
      const mouseAim = mouseAimRef.current;

      // Update camera / hero target 360° heading from mouse aim
      if (mouseAim.isAimingWithMouse) {
        // The mouse steers the camera only. Sylas turns his body only when moving.
        let diffAngle = mouseAim.angle - p.cameraAngle;
        while (diffAngle < -Math.PI) diffAngle += Math.PI * 2;
        while (diffAngle > Math.PI) diffAngle -= Math.PI * 2;
        p.cameraAngle += diffAngle * Math.min(1, 14 * dt);
      }

      if (!p.isDashing) {
        let inputForward = 0;
        let inputStrafe = 0;

        if (keys.w) inputForward += 1;
        if (keys.s) inputForward -= 1;
        if (keys.a) inputStrafe -= 1;
        if (keys.d) inputStrafe += 1;

        if (inputForward !== 0 || inputStrafe !== 0) {
          // Normalize input vector
          const inputLen = Math.hypot(inputForward, inputStrafe);
          const normFwd = inputForward / inputLen;
          const normStr = inputStrafe / inputLen;

          // Rotate normalized WASD input by the player's camera heading.
          const heading = p.cameraAngle;
          const cosH = Math.cos(heading);
          const sinH = Math.sin(heading);

          const isSprintActive = keys.shift || sprintLock;
          const speedMultiplier = isSprintActive ? 1.55 : 1.0;
          const worldSpeed = currentHero.speed * speedMultiplier * ((p.slowTimer ?? 0) > 0 ? 0.62 : 1);
          // Forward component (along mouse look heading) + Strafe component (perpendicular to mouse look)
          const moveX = (sinH * normFwd + cosH * normStr) * worldSpeed * dt;
          const moveZ = (cosH * normFwd - sinH * normStr) * worldSpeed * dt;

          p.x += moveX;
          p.z += moveZ;
          const moveHeading = Math.atan2(moveX, moveZ);
          let bodyTurn = moveHeading - p.rotationAngle;
          while (bodyTurn < -Math.PI) bodyTurn += Math.PI * 2;
          while (bodyTurn > Math.PI) bodyTurn -= Math.PI * 2;
          p.rotationAngle += bodyTurn * Math.min(1, 10 * dt);

          // Action state & body tilt
          p.currentAction = isSprintActive ? 'run' : 'walk';

          // Hero facing direction
          if (normStr < -0.1) {
            p.facing = 'left';
            p.facingAngle = Math.max(-0.4, p.facingAngle - 4 * dt);
          } else if (normStr > 0.1) {
            p.facing = 'right';
            p.facingAngle = Math.min(0.4, p.facingAngle + 4 * dt);
          } else {
            p.facingAngle *= 0.82;
          }
        } else {
          // Smoothly return body tilt when idle
          p.facingAngle *= 0.82;
          if (!p.isAttacking && !p.isBlocking && !p.isCasting && !p.isJumping) {
            p.currentAction = 'stand';
          }
        }
      } else {
        // Dash along current 360° facing vector
        const dashCos = Math.cos(p.cameraAngle);
        const dashSin = Math.sin(p.cameraAngle);
        p.x += dashSin * (p.vz * 1.2) * dt;
        p.z += dashCos * (p.vz * 1.2) * dt;
        p.vz *= 0.92;
        if (p.vz < 60) p.isDashing = false;
      }

      // Vertical 3D Physics & Aerial Jump Arc
      if (!p.isGrounded) {
        p.y += p.vy * dt;
        p.vy -= 980 * dt;
        if (p.y <= 0) {
          p.y = 0;
          p.vy = 0;
          p.isGrounded = true;
          p.isJumping = false;
        }
      }

      // Boundaries in vast open adventure playground (expanded from 360 to 1400)
      p.x = Math.max(-1800, Math.min(1800, p.x));
      p.z = Math.max(-1150, Math.min(3150, p.z));

      // Check interaction with Adventure Landmarks (Shrines & Chests)
      s.landmarks.forEach((mark) => {
        if (!mark.activated) {
          const distLandmark = Math.hypot(p.x - mark.x, p.z - mark.z);
          if (distLandmark < 90) {
            mark.activated = true;
            sound.playAchievement();
            if (mark.type === 'shrine') {
              if (mark.buffType === 'attack') {
                p.score += 500;
                p.soulEnergy = 100; // max out ultimate!
                addFloatingText('THUNDER POWER: MAX SOUL FURY!', viewWidth * 0.5, viewHeight * 0.45, '#38bdf8', 22);
                addCombatLog(`Purified ${mark.name}: Channeling Thunder Blade & Instant Max Soul Fury!`, 'loot');
              } else if (mark.buffType === 'heal') {
                p.hp = p.maxHp;
                p.potions = Math.min(5, p.potions + 2);
                addFloatingText('RESTORED: MAX HP + ELIXIRS', viewWidth * 0.5, viewHeight * 0.45, '#10b981', 22);
                addCombatLog(`Blessed by ${mark.name}: Restored all health and gained 2 Elixirs!`, 'loot');
              } else {
                p.stamina = p.maxStamina;
                p.invulnerableTimer = 3.0;
                addFloatingText('GALE SURGE: 3s INVINCIBILITY', viewWidth * 0.5, viewHeight * 0.45, '#f59e0b', 22);
                addCombatLog(`Speed of the Kami granted at ${mark.name}!`, 'loot');
              }
            } else if (mark.type === 'chest') {
              const soulGain = 80 + currentLevelConfig.levelNumber * 15;
              p.souls += soulGain;
              p.score += 800;
              addFloatingText(`+${soulGain} SOULS`, viewWidth * 0.5, viewHeight * 0.45, '#fde047', 24);
              addCombatLog(`Unlocked ${mark.name}: Collected +${soulGain} Souls & Imperial Treasure!`, 'loot');
            }
          }
        }
      });

      // 3. Enemy Spawning along 3D Depth
      s.spawnTimer += dt;
      const spawnInterval = Math.max(4.2, 7.5 - Math.min(10, currentLevelConfig.levelNumber) * 0.24);

      if (s.spawnTimer > spawnInterval && s.enemies.length < 6 && s.levelKills < currentLevelConfig.requiredKills) {
        s.spawnTimer = 0;
        // Spawn around Sylas so threats can approach from every direction.
        const spawnDistance = Math.random() * 450 + 1050;
        const spawnAngle = Math.random() * Math.PI * 2;
        const spawnX = p.x + Math.sin(spawnAngle) * spawnDistance;
        const spawnZ = p.z + Math.cos(spawnAngle) * spawnDistance;

        const types: Array<'flying_stinger' | 'shadow_ninja' | 'lesser_demon' | 'shadow_creeper' | 'infernal_brute' | 'succubus_queen'> = [
          'lesser_demon',
          'flying_stinger',
          'shadow_ninja',
          'shadow_creeper',
          'infernal_brute',
          'succubus_queen',
        ];
        const chosenType = types[Math.floor(Math.random() * types.length)];

        if (chosenType === 'shadow_ninja') {
          s.enemies.push({
            id: Math.random().toString(),
            type: 'shadow_ninja',
            x: spawnX,
            y: 20,
            z: spawnZ,
            vx: 0,
            vy: 0,
            vz: -160,
            width: 52,
            height: 72,
            facing: 'left',
            hp: 55 + currentLevelConfig.levelNumber * 5,
            maxHp: 55 + currentLevelConfig.levelNumber * 5,
            damage: 15 + Math.floor(currentLevelConfig.levelNumber * 0.4),
            speed: 160,
            attackRange: 85,
            attackCooldown: 1.6,
            attackWindup: 0,
            isAttacking: false,
            hitStunTimer: 0,
            spriteSrc: NINJA_ENEMY_SRC,
            name: 'Shadow Ninja',
          });
        } else if (chosenType === 'flying_stinger') {
          s.enemies.push({
            id: Math.random().toString(),
            type: 'flying_stinger',
            x: spawnX,
            y: -25,
            z: spawnZ,
            vx: 0,
            vy: 0,
            vz: -140,
            width: 56,
            height: 64,
            facing: 'left',
            hp: 50 + currentLevelConfig.levelNumber * 4,
            maxHp: 50 + currentLevelConfig.levelNumber * 4,
            damage: 14 + Math.floor(currentLevelConfig.levelNumber * 0.4),
            speed: 150,
            attackRange: 110,
            attackCooldown: 1.7,
            attackWindup: 0,
            isAttacking: false,
            hitStunTimer: 0,
            spriteSrc: FLYING_STINGER_SRC,
            name: 'Flying Stinger',
          });
        } else if (chosenType === 'shadow_creeper') {
          s.enemies.push({
            id: Math.random().toString(),
            type: 'shadow_creeper',
            x: spawnX,
            y: 40,
            z: spawnZ,
            vx: 0,
            vy: 0,
            vz: -190, // fast crawling stalker charging toward player
            width: 58,
            height: 48,
            facing: 'left',
            hp: 45 + currentLevelConfig.levelNumber * 4,
            maxHp: 45 + currentLevelConfig.levelNumber * 4,
            damage: 10 + Math.floor(currentLevelConfig.levelNumber * 0.35),
            speed: 190,
            attackRange: 80,
            attackCooldown: 1.5,
            attackWindup: 0,
            isAttacking: false,
            hitStunTimer: 0,
            spriteSrc: LESSER_DEMON_SRC,
            name: 'Shadow Creeper',
          });
        } else if (chosenType === 'infernal_brute') {
          s.enemies.push({
            id: Math.random().toString(),
            type: 'infernal_brute',
            x: spawnX,
            y: 20,
            z: spawnZ,
            vx: 0,
            vy: 0,
            vz: -90,
            width: 72,
            height: 84,
            facing: 'left',
            hp: 110 + currentLevelConfig.levelNumber * 7,
            maxHp: 110 + currentLevelConfig.levelNumber * 7,
            damage: 22 + Math.floor(currentLevelConfig.levelNumber * 0.6),
            speed: 90,
            attackRange: 90,
            attackCooldown: 2.2,
            attackWindup: 0,
            isAttacking: false,
            hitStunTimer: 0,
            spriteSrc: ONI_BOSS_SRC,
            name: 'Infernal Brute',
          });
        } else if (chosenType === 'succubus_queen') {
          s.enemies.push({
            id: Math.random().toString(),
            type: 'succubus_queen',
            x: spawnX,
            y: -30,
            z: spawnZ,
            vx: 0,
            vy: 0,
            vz: -130,
            width: 54,
            height: 68,
            facing: 'left',
            hp: 65 + currentLevelConfig.levelNumber * 5,
            maxHp: 65 + currentLevelConfig.levelNumber * 5,
            damage: 16 + Math.floor(currentLevelConfig.levelNumber * 0.45),
            speed: 130,
            attackRange: 100,
            attackCooldown: 1.9,
            attackWindup: 0,
            isAttacking: false,
            hitStunTimer: 0,
            spriteSrc: FLYING_STINGER_SRC,
            name: 'Succubus Queen',
          });
        } else {
          s.enemies.push({
            id: Math.random().toString(),
            type: 'lesser_demon',
            x: spawnX,
            y: 35,
            z: spawnZ,
            vx: 0,
            vy: 0,
            vz: -140,
            width: 48,
            height: 68,
            facing: 'left',
            hp: 60 + currentLevelConfig.levelNumber * 5,
            maxHp: 60 + currentLevelConfig.levelNumber * 5,
            damage: 12 + Math.floor(currentLevelConfig.levelNumber * 0.4),
            speed: 140,
            attackRange: 75,
            attackCooldown: 1.8,
            attackWindup: 0,
            isAttacking: false,
            hitStunTimer: 0,
            spriteSrc: LESSER_DEMON_SRC,
            name: 'Lesser Demon',
          });
        }
      }

      // Guaranteed Final Boss Spawning per Level from Malakath's Ascended Bestiary
      if (
        !s.bossSpawned &&
        s.levelKills >= (currentLevelConfig.bossAtKills || Math.max(3, Math.floor(currentLevelConfig.requiredKills * 0.5)))
      ) {
        s.bossSpawned = true;
        const bArchetype = currentLevelConfig.bossArchetype;
        sound.playBossRoar();

        s.enemies.push({
          id: `boss_lvl_${currentLevelConfig.levelNumber}`,
          type: bArchetype,
          y: 0,
          x: p.x + Math.sin(p.cameraAngle) * 920,
          z: p.z + Math.cos(p.cameraAngle) * 920,
          vx: 0,
          vy: 0,
          vz: -85,
          width: bArchetype === 'malakath_ascended' ? 160 : 132,
          height: bArchetype === 'malakath_ascended' ? 190 : 165,
          facing: 'left',
          hp: currentLevelConfig.bossHp,
          maxHp: currentLevelConfig.bossHp,
          damage: currentLevelConfig.bossAttackPower,
          speed: 85,
          attackRange: 130,
          attackCooldown: 2.0,
          attackWindup: 0,
          isAttacking: false,
          isBoss: true,
          bossPowerId: currentLevelConfig.bossPowerId,
          bossPowerCooldown: 4.5,
          bossPowerWindup: 0,
          bossSpecialMove: currentLevelConfig.bossSpecialMove,
          hitStunTimer: 0,
          spriteSrc: currentLevelConfig.bossSpriteSrc || MALAKATH_BOSS_SRC,
          name: `${currentLevelConfig.bossName} (${currentLevelConfig.bossTitle})`,
        });
        addCombatLog(`⚠️ ${currentLevelConfig.bossName.toUpperCase()} — ${currentLevelConfig.bossSpecialMove.toUpperCase()}!`, 'warn');
        addFloatingText(`⚠️ ${currentLevelConfig.bossName.toUpperCase()} · ${currentLevelConfig.bossSpecialMove.toUpperCase()}`, viewWidth * 0.5, viewHeight * 0.35, currentLevelConfig.themeColor, 24);
      }

      // 4. World-space demon AI: detect, chase, space out, and attack.
      const bossPowerColor = (enemy: SlashEnemy) => {
        if (enemy.type === 'cataclysm_magma') return '#ff6238';
        if (enemy.type === 'void_space') return '#bd65ff';
        if (enemy.type === 'flesh_blight') return '#83df62';
        if (enemy.type === 'shadow_ice') return '#5dd7ff';
        if (enemy.type === 'crystallized_light') return '#ffe26c';
        return '#ff356e';
      };
      const bossProjectileType = (enemy: SlashEnemy): Projectile3D['type'] => {
        if (enemy.type === 'cataclysm_magma' || enemy.type === 'malakath_ascended') return 'fireball';
        if (enemy.type === 'shadow_ice') return 'shadow_shuriken';
        if (enemy.type === 'flesh_blight' || enemy.type === 'crystallized_light') return 'magic';
        return 'demon_skull';
      };
      const strikePlayerWithBossPower = (enemy: SlashEnemy, multiplier = 0.7) => {
        if (p.invulnerableTimer > 0 || p.hp <= 0) return;
        const damage = Math.max(1, Math.round(enemy.damage * multiplier));
        p.hp = Math.max(0, p.hp - damage);
        p.invulnerableTimer = 0.8;
        addShake(11);
        sound.playPlayerHurt();
        addFloatingText(`-${damage}`, viewWidth * 0.5, viewHeight * 0.63, bossPowerColor(enemy), 24);
        addCombatLog(`${enemy.bossSpecialMove || 'Boss power'} hit for ${damage}!`, 'warn');
        if (p.hp <= 0) {
          sound.playGameOver();
          onGameOver({ score: p.score, kills: p.kills, souls: p.souls, timeSurvived: Math.floor(s.timeElapsed) });
        }
      };
      const spawnBossShot = (enemy: SlashEnemy, angle: number, speed: number, damage: number, size = 28) => {
        s.projectiles.push({
          id: Math.random().toString(),
          x: enemy.x,
          y: 36,
          z: enemy.z,
          vx: Math.sin(angle) * speed,
          vy: 0,
          vz: Math.cos(angle) * speed,
          color: bossPowerColor(enemy),
          size,
          damage,
          fromPlayer: false,
          life: 0,
          maxLife: 2.6,
          type: bossProjectileType(enemy),
        });
      };

      s.enemies.forEach((enemy) => {
        if (enemy.hitStunTimer > 0) {
          enemy.hitStunTimer -= dt;
          enemy.aiState = 'hit';
          return;
        }

        if (enemy.isBoss && (enemy.bossPowerCooldown ?? 0) > 0) enemy.bossPowerCooldown! -= dt;
        if (enemy.isBoss && (enemy.bossPowerWindup ?? 0) > 0) {
          enemy.bossPowerWindup! -= dt;
          enemy.aiState = 'attack';
          enemy.isAttacking = true;
          if (enemy.bossPowerWindup! > 0) return;

          const powerPattern = ((enemy.bossPowerId ?? currentLevelConfig.levelNumber) - 1) % 10;
          const powerColor = bossPowerColor(enemy);
          const shotType = bossProjectileType(enemy);
          const distanceToPlayer = Math.hypot(p.x - enemy.x, p.z - enemy.z);
          const angleToPlayer = Math.atan2(p.x - enemy.x, p.z - enemy.z);
          const powerDamage = enemy.damage;
          enemy.bossPowerWindup = 0;
          enemy.bossPowerCooldown = 5.8 + (powerPattern % 3) * 0.7;
          enemy.attackCooldown = 2.6;
          enemy.attackWindup = 0;
          enemy.isAttacking = false;

          switch (powerPattern) {
            case 0: { // Cataclysm: ground eruption around the boss.
              if (distanceToPlayer < 390) strikePlayerWithBossPower(enemy, 0.75);
              spawnHitSparks(viewWidth * 0.5, viewHeight * 0.64, powerColor, 20);
              break;
            }
            case 1: { // Devourer: heavy straight-line rush.
              enemy.x += Math.sin(angleToPlayer) * 320;
              enemy.z += Math.cos(angleToPlayer) * 320;
              enemy.yaw = angleToPlayer;
              if (Math.hypot(p.x - enemy.x, p.z - enemy.z) < 240) strikePlayerWithBossPower(enemy, 0.9);
              break;
            }
            case 2: { // Stalker: three aimed bolts.
              for (const offset of [-0.25, 0, 0.25]) spawnBossShot(enemy, angleToPlayer + offset, 390, Math.round(powerDamage * 0.42));
              break;
            }
            case 3: { // Rift-step: blink to Sylas's flank, then punish nearby players.
              const flank = angleToPlayer + Math.PI / 2;
              enemy.x = p.x + Math.sin(flank) * 310;
              enemy.z = p.z + Math.cos(flank) * 310;
              enemy.yaw = Math.atan2(p.x - enemy.x, p.z - enemy.z);
              if (distanceToPlayer < 520) strikePlayerWithBossPower(enemy, 0.55);
              break;
            }
            case 4: { // Blight/ice field: a damaging zone remains on the ground.
              s.projectiles.push({
                id: Math.random().toString(), x: p.x, y: 0, z: p.z, vx: 0, vy: 0, vz: 0,
                color: powerColor, size: 250, damage: Math.round(powerDamage * 0.38),
                fromPlayer: false, life: 0, maxLife: 3.2, nextDamageAt: 0.45, type: 'boss_hazard',
              });
              break;
            }
            case 5: { // Brood call: summon a lesser demon to pressure Sylas.
              const side = angleToPlayer + (Math.random() < 0.5 ? 1 : -1) * Math.PI / 2;
              s.enemies.push({
                id: `brood_${enemy.id}_${Math.random().toString(36).slice(2)}`, type: 'lesser_demon',
                x: enemy.x + Math.sin(side) * 180, y: 0, z: enemy.z + Math.cos(side) * 180,
                vx: 0, vy: 0, vz: 0, width: 48, height: 68, facing: 'left',
                hp: Math.max(35, Math.round(enemy.maxHp * 0.012)), maxHp: Math.max(35, Math.round(enemy.maxHp * 0.012)),
                damage: Math.round(enemy.damage * 0.35), speed: 150, attackRange: 85, attackCooldown: 1.8,
                attackWindup: 0, isAttacking: false, hitStunTimer: 0,
                spriteSrc: LESSER_DEMON_SRC, name: `${enemy.name.split(' ')[0]} Broodling`,
              });
              break;
            }
            case 6: { // Prism/beam sweep: a tight, fast fan of five bolts.
              for (const offset of [-0.12, -0.06, 0, 0.06, 0.12]) spawnBossShot(enemy, angleToPlayer + offset, 620, Math.round(powerDamage * 0.32), 24);
              break;
            }
            case 7: { // Regeneration: the form restores a portion of its core.
              enemy.hp = Math.min(enemy.maxHp, enemy.hp + Math.round(enemy.maxHp * 0.075));
              addFloatingText('ASCENDED REGENERATION', viewWidth * 0.5, viewHeight * 0.4, powerColor, 20);
              break;
            }
            case 8: { // Singularity: pull and briefly slow Sylas.
              if (distanceToPlayer < 1000) {
                const pull = Math.min(250, Math.max(0, distanceToPlayer - 160));
                p.x -= Math.sin(angleToPlayer) * pull;
                p.z -= Math.cos(angleToPlayer) * pull;
                p.slowTimer = Math.max(p.slowTimer ?? 0, 1.8);
                if (distanceToPlayer < 270) strikePlayerWithBossPower(enemy, 0.5);
              }
              break;
            }
            default: { // Ascended signature: radial burst of elemental orbs.
              for (let index = 0; index < 8; index++) {
                spawnBossShot(enemy, (Math.PI * 2 * index) / 8, 330, Math.round(powerDamage * 0.36), 30);
              }
              break;
            }
          }
          sound.playLightningZap();
          addCombatLog(`${enemy.name.split(' (')[0]} used ${enemy.bossSpecialMove || 'an ascended power'}!`, 'warn');
          return;
        }

        let relX = p.x - enemy.x;
        let relZ = p.z - enemy.z;
        let distance = Math.hypot(relX, relZ);
        enemy.distanceToPlayer = distance;
        const detectionRange = 1500;
        const ranged = enemy.type === 'flying_stinger' || enemy.type === 'succubus_queen';
        const attackRange = Math.max(enemy.attackRange, ranged ? 210 : 0);
        if (distance > detectionRange) {
          enemy.aiState = 'idle';
          enemy.isAttacking = false;
        } else {
          enemy.aiState = 'detect';
          if (distance > attackRange * 0.88 && enemy.attackWindup <= 0 && (enemy.bossPowerWindup ?? 0) <= 0) {
            enemy.aiState = 'chase';
            const invDistance = 1 / Math.max(1, distance);
            let separationX = 0;
            let separationZ = 0;
            for (const other of s.enemies) {
              if (other.id === enemy.id) continue;
              const sx = enemy.x - other.x;
              const sz = enemy.z - other.z;
              const separation = Math.hypot(sx, sz);
              if (separation > 1 && separation < 105) {
                const strength = (105 - separation) / 105;
                separationX += (sx / separation) * strength;
                separationZ += (sz / separation) * strength;
              }
            }
            const moveX = relX * invDistance + separationX * 0.7;
            const moveZ = relZ * invDistance + separationZ * 0.7;
            const moveLength = Math.hypot(moveX, moveZ) || 1;
            const speed = enemy.speed * (ranged ? 0.62 : 1);
            enemy.x += (moveX / moveLength) * speed * dt;
            enemy.z += (moveZ / moveLength) * speed * dt;
            enemy.x = Math.max(-1700, Math.min(1700, enemy.x));
            enemy.z = Math.max(-1080, Math.min(3080, enemy.z));
            enemy.yaw = Math.atan2(relX, relZ);
            enemy.facing = relX < 0 ? 'left' : 'right';
          } else if (distance <= attackRange && enemy.attackCooldown <= 0 && enemy.attackWindup <= 0 && (enemy.bossPowerWindup ?? 0) <= 0) {
            enemy.aiState = 'attack';
            if (enemy.isBoss && (enemy.bossPowerCooldown ?? 0) <= 0) {
              enemy.bossPowerWindup = 1.05;
            } else {
              enemy.attackWindup = enemy.isBoss ? 0.75 : 0.55;
            }
            enemy.isAttacking = true;
          }
        }
        relX = p.x - enemy.x;
        relZ = p.z - enemy.z;
        distance = Math.hypot(relX, relZ);
        enemy.distanceToPlayer = distance;

        // Handle Attack Telegraph Windup & VISIBLE ATTACK EXECUTION
        if (enemy.attackWindup > 0) {
          enemy.attackWindup -= dt;
          if (enemy.attackWindup <= 0) {
            enemy.isAttacking = false;
            enemy.attackCooldown = enemy.isBoss ? 2.3 : 1.9;

            // Ranged Demon Attacks: Spawn visible flying demon projectile toward player
            if (ranged || (enemy.isBoss && Math.random() < 0.45)) {
              sound.playLightningZap();
              const aimLength = Math.max(1, distance);
              const projectileSpeed = 420;
              s.projectiles.push({
                id: Math.random().toString(),
                x: enemy.x,
                y: enemy.y + 30,
                z: enemy.z,
                vx: (relX / aimLength) * projectileSpeed,
                vy: 0,
                vz: (relZ / aimLength) * projectileSpeed,
                color: enemy.isBoss ? '#f43f5e' : '#a855f7',
                size: enemy.isBoss ? 28 : 20,
                damage: enemy.damage,
                fromPlayer: false,
                life: 0,
                maxLife: 2.2,
                type: 'demon_skull',
              });
              addCombatLog(`${enemy.name} hurled a Void Cursed Projectile!`, 'warn');
            }

            // Melee Attack strikes player (with visible slash trail)
            if (!ranged && distance <= enemy.attackRange + 75 && p.invulnerableTimer <= 0) {
              // Add visible slash effect in front of camera
              spawnHitSparks(viewWidth * 0.5, viewHeight * 0.65, '#f43f5e', 14);

              if (p.isParrying) {
                // PERFECT PARRY
                sound.playAchievement();
                addFloatingText('PERFECT PARRY!', viewWidth * 0.45, viewHeight * 0.6, '#38bdf8', 24);
                enemy.hitStunTimer = 0.9;
                const retreatScale = 100 / Math.max(1, distance);
                enemy.x -= relX * retreatScale;
                enemy.z -= relZ * retreatScale;
                p.soulEnergy = Math.min(p.maxSoulEnergy, p.soulEnergy + 25);
                addCombatLog(`⚔️ PERFECT PARRY EXECUTED! ${enemy.name} staggered!`, 'combat');
              } else {
                const incomingDmg = p.isBlocking ? Math.round(enemy.damage * 0.35) : enemy.damage;
                p.hp -= incomingDmg;
                p.invulnerableTimer = 0.5;
                addShake(12);
                sound.playPlayerHurt();
                addFloatingText(`-${incomingDmg}`, viewWidth * 0.42, viewHeight * 0.65, '#ef4444', 24);
                addCombatLog(`Took ${incomingDmg} damage from ${enemy.name}!`, 'warn');

                if (p.hp <= 0) {
                  p.hp = 0;
                  sound.playGameOver();
                  onGameOver({
                    score: p.score,
                    kills: p.kills,
                    souls: p.souls,
                    timeSurvived: Math.floor(s.timeElapsed),
                  });
                }
              }
            }
          }
        }

        if (enemy.attackCooldown > 0) enemy.attackCooldown -= dt;
      });

      // 5. Update Projectiles in 3D
      s.projectiles.forEach((proj) => {
        proj.life += dt;
        proj.z += proj.vz * dt;
        proj.x += proj.vx * dt;
        proj.y += proj.vy * dt;

        // Collision: Player projectiles hit enemies, Demon projectiles hit player
        if (proj.fromPlayer) {
          s.enemies.forEach((enemy) => {
            const distance = Math.hypot(enemy.x - proj.x, enemy.z - proj.z);
            if (distance < 90 && proj.damage > 0) {
              enemy.hp -= proj.damage;
              enemy.hitStunTimer = 0.3;
              addFloatingText(`${proj.damage}`, viewWidth * 0.5 + (enemy.x - p.x) * 0.5, viewHeight * 0.55, proj.color, 20);
              proj.damage = 0; // consumed
              proj.life = proj.maxLife; // expire
              sound.playHit();
            }
          });
        } else {
          if (proj.type === 'boss_hazard') {
            const distance = Math.hypot(p.x - proj.x, p.z - proj.z);
            if (proj.life >= (proj.nextDamageAt ?? 0) && distance < proj.size && p.invulnerableTimer <= 0) {
              const dmg = p.isBlocking ? Math.round(proj.damage * 0.35) : proj.damage;
              p.hp -= dmg;
              p.invulnerableTimer = 0.55;
              proj.nextDamageAt = proj.life + 0.8;
              addShake(8);
              sound.playPlayerHurt();
              addFloatingText(`-${dmg}`, viewWidth * 0.5, viewHeight * 0.65, proj.color, 22);
              addCombatLog(`Caught in ${proj.color === '#f97316' ? 'the eruption' : 'the boss hazard'} (-${dmg} HP)!`, 'warn');
              if (p.hp <= 0) onGameOver({ score: p.score, kills: p.kills, souls: p.souls, timeSurvived: Math.floor(s.timeElapsed) });
            }
            return;
          }
          // Demon Projectile approaching player
          const distance = Math.hypot(p.x - proj.x, p.z - proj.z);
          if (distance < 82 && proj.damage > 0 && p.invulnerableTimer <= 0) {
            if (p.isParrying) {
              sound.playAchievement();
              addFloatingText('DEFLECTED!', viewWidth * 0.5, viewHeight * 0.6, '#38bdf8', 22);
              proj.vz = 500; // reflect back!
              proj.fromPlayer = true;
              p.soulEnergy = Math.min(p.maxSoulEnergy, p.soulEnergy + 20);
            } else {
              const dmg = p.isBlocking ? Math.round(proj.damage * 0.35) : proj.damage;
              p.hp -= dmg;
              p.invulnerableTimer = 0.5;
              addShake(10);
              sound.playPlayerHurt();
              addFloatingText(`-${dmg}`, viewWidth * 0.5, viewHeight * 0.65, '#f43f5e', 22);
              addCombatLog(`Struck by Demon projectile (-${dmg} HP)!`, 'warn');
              proj.damage = 0;
              proj.life = proj.maxLife;
            }
          }
        }
      });
      s.projectiles = s.projectiles.filter((proj) => proj.life < proj.maxLife);

      // 6. Dead Enemies Check
      s.enemies = s.enemies.filter((enemy) => {
        if (enemy.hp <= 0) {
          p.kills++;
          s.levelKills++;
          p.souls += enemy.isBoss ? 90 : 10;
          p.score += enemy.isBoss ? 4500 : 350;

          if (enemy.isBoss) {
            s.bossDefeated = true;
            sound.playExplosion();
            addFloatingText(`✨ SLAIN: ${currentLevelConfig.bossName.toUpperCase()}!`, viewWidth * 0.5, viewHeight * 0.4, '#fbbf24', 36);
          }
          addCombatLog(`Slain: ${enemy.name} (+${enemy.isBoss ? currentLevelConfig.rewardSouls : 10} Souls)`, 'loot');

          const bossClear = s.bossDefeated;

          if (bossClear && !s.levelCleared) {
            s.levelCleared = true;
            sound.playLevelUp();
            addFloatingText('FINAL BOSS SLAIN! EXPEDITION COMPLETED!', viewWidth * 0.5, viewHeight * 0.45, '#fbbf24', 32);
            setTimeout(() => {
              onLevelComplete({
                score: p.score + 5000,
                kills: p.kills,
                souls: p.souls + currentLevelConfig.rewardSouls,
                timeSurvived: Math.floor(s.timeElapsed),
              });
            }, 800);
          }
          return false;
        }
        return true;
      });

      // 7. Update Ambient 3D Particles
      s.particles.forEach((part) => {
        part.z += part.vz * dt;
        part.y += part.vy * dt;
        if (part.z < 20) {
          part.z = 1000;
          part.x = (Math.random() - 0.5) * 800;
        }
      });

      // Update Floating texts
      s.floatingTexts.forEach((ft) => {
        ft.life += dt;
        ft.y += ft.vy * dt;
      });
      s.floatingTexts = s.floatingTexts.filter((ft) => ft.life < ft.maxLife);
      s.hitSparks.forEach((spark) => {
        spark.life += dt;
        spark.x += spark.vx * dt;
        spark.y += spark.vy * dt;
        spark.vy += 500 * dt;
      });
      s.hitSparks = s.hitSparks.filter((spark) => spark.life < spark.maxLife);

      if (s.shake > 0) s.shake = Math.max(0, s.shake - 35 * dt);

      // Sync state to React HUD
      setHudState({
        hp: Math.max(0, p.hp),
        maxHp: p.maxHp,
        stamina: Math.max(0, p.stamina),
        soul: p.soulEnergy,
        score: p.score,
        levelKills: s.levelKills,
        requiredKills: currentLevelConfig.requiredKills,
        levelNum: currentLevelConfig.levelNumber,
        levelTitle: currentLevelConfig.title,
        heroName: currentHero.name,
        specialSkill: currentHero.specialSkillName,
        time: Math.floor(s.timeElapsed),
        action: p.currentAction,
        bossApproaching: s.bossSpawned && !s.bossDefeated,
      });

      setHotbarState({
        climtsCd: Math.max(0, p.attackCooldown),
        heavyCd: Math.max(0, p.attackCooldown),
        dashCd: Math.max(0, p.dashTimer),
        blockActive: p.isBlocking,
        magicCd: Math.max(0, p.castTimer),
        specialCd: p.soulEnergy < 100 ? 1 : 0,
        potionCd: Math.max(0, p.potionCooldown),
        potionsRemaining: p.potions,
      });

      // ============================================
      world.setTarget(mouseAimRef.current.targetId);
      world.render(
        p,
        s.enemies,
        s.projectiles,
        s.landmarks,
        p.cameraAngle,
        p.cameraPitch || 0,
        s.timeElapsed,
        dt,
        currentHero.backSpriteSrc || currentHero.spriteSrc,
        p.rotationAngle
      );
      const radar = radarCanvasRef.current;
      const radarContext = radar?.getContext('2d');
      if (radar && radarContext) {
        PixelAnimator.drawOrnateRadar(
          radarContext,
          radar.width / 2,
          radar.height / 2,
          radar.width / 2 - 3,
          p.x,
          p.z,
          s.enemies,
          s.timeElapsed,
          isSunMode,
          s.landmarks,
          p.rotationAngle
        );
      }
    };

    animId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
      world.dispose();
      if (threeWorldRef.current === world) threeWorldRef.current = null;
    };
  }, [
    isPaused,
    currentHero,
    currentLevelConfig,
    settings,
    isSunMode,
    is3DBehindView,
    onLevelComplete,
    onGameOver,
    addCombatLog,
  ]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden font-pixel bg-black text-white">
      {/* Optional Authentic CRT Arcade Scanline Filter Overlay */}
      {crtFilter && <div className="absolute inset-0 z-[15] crt-scanlines pointer-events-none" />}

      {/* Fixed 3D courtyard viewport. The WebGL renderer owns the actual scene. */}
      <div
        ref={canvasRef}
        className="absolute inset-0 z-0 cursor-crosshair touch-none"
        onClick={(event) => {
          if (document.pointerLockElement !== event.currentTarget) {
            void event.currentTarget.requestPointerLock();
          }
        }}
        onMouseMove={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          mouseAimRef.current.screenX = event.clientX - rect.left;
          mouseAimRef.current.screenY = event.clientY - rect.top;
        }}
        onTouchStart={(event) => {
          const touch = event.changedTouches[0];
          if (touch && touch.clientX > window.innerWidth * 0.3) {
            cameraTouchRef.current.active = true;
            cameraTouchRef.current.touchId = touch.identifier;
            cameraTouchRef.current.lastX = touch.clientX;
            cameraTouchRef.current.lastY = touch.clientY;
          }
        }}
        onTouchMove={(event) => {
          if (!cameraTouchRef.current.active) return;
          for (const touch of Array.from(event.changedTouches)) {
            if (touch.identifier !== cameraTouchRef.current.touchId) continue;
            const dx = touch.clientX - cameraTouchRef.current.lastX;
            const dy = touch.clientY - cameraTouchRef.current.lastY;
            cameraTouchRef.current.lastX = touch.clientX;
            cameraTouchRef.current.lastY = touch.clientY;
            const player = gameStateRef.current.player;
            player.cameraAngle += dx * 0.007;
            player.cameraPitch = Math.max(-0.35, Math.min(0.35, (player.cameraPitch || 0) + dy * 0.003));
            mouseAimRef.current.angle = player.cameraAngle;
            mouseAimRef.current.isAimingWithMouse = true;
            break;
          }
        }}
        onTouchEnd={(event) => {
          for (const touch of Array.from(event.changedTouches)) {
            if (touch.identifier === cameraTouchRef.current.touchId) {
              cameraTouchRef.current.active = false;
              cameraTouchRef.current.touchId = null;
            }
          }
        }}
        onMouseDown={(event) => {
          if (event.button === 0) performClimtsSlash();
          if (event.button === 2) {
            mouseAimRef.current.isRightDragging = true;
            toggleBlockParry(true);
          }
        }}
        onMouseUp={(event) => {
          if (event.button === 2) {
            mouseAimRef.current.isRightDragging = false;
            toggleBlockParry(false);
          }
        }}
        onContextMenu={(event) => event.preventDefault()}
      />
      <div className="absolute inset-0 z-[12] pointer-events-none overflow-hidden">
        {gameStateRef.current.floatingTexts.map((item) => (
          <div
            key={item.id}
            className="absolute font-pixel font-bold whitespace-nowrap"
            style={{
              left: item.x,
              top: item.y - item.life * 26,
              color: item.color,
              fontSize: Math.max(12, item.size * 0.72),
              opacity: Math.max(0, 1 - item.life / item.maxLife),
              textShadow: '2px 2px 0 #080711, -1px -1px 0 #080711, 0 0 8px currentColor',
              transform: 'translate(-50%, -50%)',
            }}
          >
            {item.text}
          </div>
        ))}
        {gameStateRef.current.hitSparks.map((spark, index) => (
          <i
            key={`${spark.x}-${spark.y}-${spark.life}-${index}`}
            className="absolute block"
            style={{
              left: spark.x,
              top: spark.y,
              width: spark.size,
              height: spark.size,
              background: spark.color,
              opacity: Math.max(0, 1 - spark.life / spark.maxLife),
              boxShadow: `0 0 5px ${spark.color}`,
              transform: 'translate(-50%, -50%)',
            }}
          />
        ))}
      </div>

      {/* ======================================================== */}
      {/* TOP-CENTER: RETRO 16-BIT BANNER & QUICK UTILITY TOGGLES  */}
      {/* ======================================================== */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 max-[760px]:left-auto max-[760px]:right-2 max-[760px]:translate-x-0 max-[760px]:scale-75 max-[760px]:origin-top-right z-20 pointer-events-auto flex items-center gap-2">
        <div className="px-3 py-1.5 bg-slate-950/95 pixel-border-dark flex items-center gap-3 text-[9px] shadow-2xl backdrop-blur-md">
          {/* Level Chapter Indicator */}
          <span className="text-amber-400 font-pixel flex items-center gap-1.5 max-[760px]:hidden">
            <span className="text-rose-500">⚔</span> CH.{hudState.levelNum}: {hudState.levelTitle.toUpperCase()}
          </span>

          <span className="text-slate-600">|</span>

          {/* CRT Scanline Toggle */}
          <button
            onClick={toggleCrtFilter}
            className={`px-2 py-0.5 pixel-btn text-[8px] font-pixel cursor-pointer transition-all ${
              crtFilter
                ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-500'
                : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-white'
            }`}
            title="Toggle Retro Arcade CRT Scanline Filter"
          >
            CRT: {crtFilter ? 'ON' : 'OFF'}
          </button>

          {/* Sun / Bloodmoon Lighting Toggle */}
          <button
            onClick={() => setLocalSunModeOverride((prev) => (prev !== null ? !prev : !isSunMode))}
            className="px-2 py-0.5 pixel-btn bg-purple-950/80 border border-purple-500/70 hover:border-purple-400 text-purple-200 text-[8px] font-pixel cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.3)] flex items-center gap-1"
            title="Toggle Sun Courtyard / Bloodmoon Atmosphere"
          >
            <span>🟣</span>
            <span>{isSunMode ? 'SUN' : 'BLOODMOON'}</span>
          </button>

          {/* Pro Builder Studio Switcher */}
          <button
            onClick={onToggleWorkspaceMode}
            className="px-2 py-0.5 pixel-btn bg-amber-950/70 border border-amber-500/60 hover:border-amber-400 text-amber-300 text-[8px] font-pixel cursor-pointer"
            title="Toggle Pro Gamer Builder Suite (F1)"
          >
            {workspaceMode === 'PLAY' ? '🛠️ BUILDER' : '🎮 PLAY FOCUS'}
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. TOP-LEFT: ORNATE 16-BIT RPG CHAMPION CARD & HEALTH    */}
      {/* ======================================================== */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-3 pointer-events-auto">
        {/* Square Retro Stepped Gold Frame (Click to select hero) */}
        <button
          onClick={onOpenHeroSelect}
          className="relative w-16 h-16 pixel-border-gold bg-slate-950 p-1 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-transform"
          title="Click to Choose Champion (Key C)"
        >
          <img
            src={currentHero.spriteSrc}
            alt={currentHero.name}
            className="w-full h-full object-cover pixel-art"
          />
          {/* Level Badge in Gold */}
          <div className="absolute -bottom-1 -right-1 px-1.5 py-0.5 bg-slate-950 border border-amber-400 text-[8px] font-pixel text-amber-300">
            LV.{hudState.levelNum}
          </div>
        </button>

        {/* Hero Name & Segmented Health / Mana Gauges */}
        <div className="flex flex-col gap-1 w-48 sm:w-60">
          <div className="flex items-center justify-between text-[9px] font-pixel tracking-wide text-white drop-shadow">
            <span className="text-amber-200 font-bold">{currentHero.name.split(' ')[0].toUpperCase()}</span>
            <span className="text-[7px] text-amber-400">{currentHero.role.split(' ')[0].toUpperCase()}</span>
          </div>

          {/* 16-Bit Crimson Red Segmented Health Bar with Animated Ghost Damage */}
          <div className="relative w-full h-4 bg-slate-950 pixel-border-dark overflow-hidden">
            {/* Ghost Damage Bar (Lags behind on hits) */}
            <div
              className="absolute inset-0 bg-amber-600/80 transition-all duration-300"
              style={{ width: `${(ghostHp / hudState.maxHp) * 100}%` }}
            />
            {/* Active Red HP Bar */}
            <div
              className="absolute inset-0 bg-gradient-to-r from-red-700 via-rose-600 to-red-500"
              style={{ width: `${(hudState.hp / hudState.maxHp) * 100}%` }}
            >
              {/* Stepped pixel highlight line on top */}
              <div className="w-full h-1 bg-white/40" />
            </div>
            {/* Health Text Overlay */}
            <span className="absolute inset-0 text-[8px] font-pixel text-white flex items-center justify-center drop-shadow crt-glow">
              HP {hudState.hp}/{hudState.maxHp}
            </span>
          </div>

          {/* 16-Bit Blue Mana / Stamina Bar */}
          <div className="relative w-full h-3 bg-slate-950 pixel-border-dark overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-700 to-sky-400"
              style={{ width: `${(hudState.stamina / 100) * 100}%` }}
            >
              <div className="w-full h-0.5 bg-white/40" />
            </div>
            <span className="absolute inset-0 text-[7px] font-pixel text-sky-100 flex items-center justify-center drop-shadow">
              ST {Math.round(hudState.stamina)}/100
            </span>
          </div>

          {/* Fury Indicator when 100% Ready */}
          {hudState.soul >= 100 ? (
            <div className="text-[7px] font-pixel text-rose-400 animate-pulse flex items-center gap-1">
              <span>🔥</span> [FURY READY - PRESS Q]
            </div>
          ) : (
            <div className="w-full h-1.5 bg-slate-950 border border-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-600 to-rose-500"
                style={{ width: `${(hudState.soul / 100) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. TOP-RIGHT: RADAR MINIMAP CIRCLE (Matching Image 2)    */}
      {/* ======================================================== */}
      <div className="absolute top-14 right-4 z-20 pointer-events-none flex flex-col items-center">
        <canvas
          ref={radarCanvasRef}
          width={96}
          height={96}
          className="w-22 h-22 drop-shadow-[0_0_15px_rgba(56,189,248,0.5)] border-2 border-cyan-500/70 rounded-full bg-slate-950/90"
        />
      </div>

      {/* ======================================================== */}
      {/* 3. RIGHT SIDE: 16-BIT QUEST TRACKER BOUNTY CARD          */}
      {/* ======================================================== */}
      <div className="absolute top-40 right-4 z-20 pointer-events-auto">
        <div className="w-60 sm:w-64 p-3 bg-slate-950/95 pixel-border-dark text-slate-200 shadow-2xl backdrop-blur-md flex flex-col gap-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-pixel text-[8px] text-amber-400 tracking-wider flex items-center gap-1.5">
              <span>📜</span> BOUNTY CONTRACT
            </span>
            <button
              onClick={() => setQuestMinimized(!questMinimized)}
              className="text-slate-400 hover:text-white text-[8px] font-pixel px-1 cursor-pointer"
            >
              {questMinimized ? '[+]' : '[-]'}
            </button>
          </div>

          {!questMinimized && (
            <div className="flex flex-col gap-1.5 text-[8px] font-pixel text-slate-300">
              <div className="text-sky-300 font-pixel truncate">
                CH.{hudState.levelNum}: {hudState.levelTitle}
              </div>

              {/* Stepped Kill Progress Bar */}
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-slate-400 text-[7px]">
                  <span>DEMONS SLAIN:</span>
                  <span className="text-rose-400">
                    {hudState.levelKills} / {hudState.requiredKills}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-900 border border-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-rose-600"
                    style={{ width: `${Math.min(100, (hudState.levelKills / hudState.requiredKills) * 100)}%` }}
                  />
                </div>
              </div>

              {hudState.bossApproaching ? (
                <div className="flex flex-col gap-1">
                  <div className="text-rose-400 font-pixel animate-pulse text-[7px]">
                    ⚠️ {currentLevelConfig.bossName.toUpperCase()} APPROACHING!
                  </div>
                  <div className="text-amber-300 font-pixel text-[7px] leading-relaxed">
                    SIGNATURE: {currentLevelConfig.bossSpecialMove.toUpperCase()}
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 text-[7px]">
                  OBJ: GUARD THE FORTRESS COURTYARD
                </div>
              )}

              <div className="text-[7px] text-amber-400 pt-1 border-t border-slate-800">
                💰 BOUNTY: 1,500 SOULS
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 4. BOTTOM-LEFT: RETRO PIXEL ADVENTURE & COMBAT LOG       */}
      {/* ======================================================== */}
      <div className="absolute bottom-20 left-4 z-20 pointer-events-none hidden sm:flex flex-col gap-1 w-72 max-h-36 overflow-hidden p-2.5 bg-slate-950/90 pixel-border-dark text-[8px] font-pixel shadow-2xl backdrop-blur-sm">
        {combatLogs.map((log) => (
          <div key={log.id} className="leading-tight truncate">
            {log.type === 'system' && <span className="text-sky-400">[SYS] </span>}
            {log.type === 'combat' && <span className="text-rose-400">[HIT] </span>}
            {log.type === 'loot' && <span className="text-emerald-400">[LOOT] </span>}
            {log.type === 'warn' && <span className="text-amber-400">[WARN] </span>}
            <span className="text-slate-300">{log.text}</span>
          </div>
        ))}
      </div>

      {/* ======================================================== */}
      {/* 5. DUAL CONTROLLER SYSTEM / ACTION HOTBAR                */}
      {/* ======================================================== */}
      {controlLayout === 'CONTROLLER' ? (
        <>
          {/* Sprint toggle, with the lower-left kept clear for keyboard movement. */}
          <div className="absolute bottom-6 left-6 z-20 pointer-events-auto select-none">
            <button
              onClick={() => setSprintLock((prev) => !prev)}
              className={`p-2.5 rounded-xl border flex flex-col items-center justify-center text-[8px] font-bold transition-all cursor-pointer backdrop-blur-md ${
                sprintLock
                  ? 'bg-amber-500 border-white text-slate-950 shadow-[0_0_15px_#f59e0b]'
                  : 'bg-slate-950/80 hover:bg-slate-900 border-amber-500/50 text-amber-300'
              }`}
              title="Toggle Sprint Lock"
            >
              <span className="text-sm">⚡</span>
              <span>{sprintLock ? 'RUNNING' : 'SPRINT'}</span>
            </button>
          </div>

          {/* 5B. BOTTOM-RIGHT: ACTION & COMBAT CONTROLLER CLUSTER */}
          <div className="absolute bottom-6 right-6 z-20 pointer-events-auto select-none">
            <div className="relative w-64 h-64 flex items-center justify-center">
              
              {/* 1. PRIMARY ATTACK BUTTON (Katana Slash Combo) */}
              <button
                onClick={() => {
                  sound.playClick();
                  performClimtsSlash();
                }}
                className="absolute right-3 bottom-3 w-20 h-20 rounded-full bg-gradient-to-br from-rose-700 to-amber-600 hover:from-rose-600 hover:to-amber-500 active:scale-95 border-3 border-amber-300 shadow-[0_0_30px_rgba(244,63,94,0.6)] flex flex-col items-center justify-center transition-all cursor-pointer group"
                title="Attack (Left Click or J)"
              >
                <span className="text-2xl group-active:rotate-12 transition-transform">🗡️</span>
                <span className="text-[9px] font-bold text-white tracking-wider">ATTACK</span>
              </button>

              {/* 2. JUMP BUTTON - Top-Right of Attack */}
              <button
                onClick={() => {
                  sound.playClick();
                  performJump();
                }}
                className="absolute right-3 top-10 w-14 h-14 rounded-full bg-gradient-to-br from-sky-700 to-cyan-600 hover:from-sky-600 hover:to-cyan-500 active:scale-95 border-2 border-cyan-300 shadow-[0_0_20px_rgba(56,189,248,0.5)] flex flex-col items-center justify-center transition-all cursor-pointer"
                title="Jump (Space)"
              >
                <span className="text-lg">⬆️</span>
                <span className="text-[8px] font-bold text-cyan-100">JUMP</span>
              </button>

              {/* 3. EVASIVE DASH / ROLL - Bottom-Left of Attack */}
              <button
                onClick={() => {
                  sound.playClick();
                  performDash();
                }}
                className="absolute right-26 bottom-2 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-700 to-purple-600 hover:from-indigo-600 hover:to-purple-500 active:scale-95 border-2 border-indigo-300 shadow-[0_0_20px_rgba(129,140,248,0.5)] flex flex-col items-center justify-center transition-all cursor-pointer"
                title="Roll (R)"
              >
                <span className="text-lg">💨</span>
                <span className="text-[8px] font-bold text-indigo-100">ROLL</span>
              </button>

              {/* 4. GUARD / PARRY - Top-Left of Attack */}
              <button
                onMouseDown={() => toggleBlockParry(true)}
                onMouseUp={() => toggleBlockParry(false)}
                onTouchStart={() => toggleBlockParry(true)}
                onTouchEnd={() => toggleBlockParry(false)}
                className={`absolute right-26 top-16 w-14 h-14 rounded-full flex flex-col items-center justify-center border-2 transition-all cursor-pointer active:scale-95 ${
                  hotbarState.blockActive
                    ? 'bg-emerald-500 border-white shadow-[0_0_25px_#10b981]'
                    : 'bg-gradient-to-br from-emerald-800 to-teal-700 border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                }`}
                title="Hold Guard (Right Click or B)"
              >
                <span className="text-lg">🛡️</span>
                <span className="text-[8px] font-bold text-emerald-100">GUARD</span>
              </button>

              {/* 5. CAST ARCANE MAGIC - Far-Left */}
              <button
                onClick={() => {
                  sound.playClick();
                  performCastMagic();
                }}
                className="absolute left-4 top-14 w-12 h-12 rounded-full bg-gradient-to-br from-purple-800 to-fuchsia-700 hover:from-purple-700 hover:to-fuchsia-600 active:scale-95 border-2 border-purple-300 shadow-[0_0_18px_rgba(192,132,252,0.5)] flex flex-col items-center justify-center transition-all cursor-pointer"
                title="Magic (E)"
              >
                <span className="text-base">✨</span>
                <span className="text-[7px] font-bold text-purple-100">MAGIC</span>
              </button>

              {/* 6. ULTIMATE FURY - Top Center */}
              <button
                onClick={() => {
                  sound.playClick();
                  performSpecial();
                }}
                disabled={hudState.soul < 100}
                className={`absolute right-18 -top-3 w-15 h-15 rounded-full border-2 flex flex-col items-center justify-center transition-all ${
                  hudState.soul >= 100
                    ? 'bg-gradient-to-br from-rose-600 via-orange-500 to-amber-500 border-white shadow-[0_0_35px_#f43f5e] animate-pulse cursor-pointer'
                    : 'bg-slate-900/90 border-slate-700 opacity-50 cursor-not-allowed'
                }`}
                title="Fury (Q, when charged)"
              >
                <span className="text-xl">🔥</span>
                <span className="text-[8px] font-bold text-amber-200">FURY</span>
              </button>

              {/* 7. QUICK HEALTH ELIXIR */}
              <button
                onClick={() => {
                  sound.playClick();
                  drinkPotion();
                }}
                disabled={hotbarState.potionsRemaining <= 0}
                className="absolute left-6 bottom-4 w-12 h-12 rounded-full bg-gradient-to-br from-teal-800 to-cyan-700 hover:from-teal-700 hover:to-cyan-600 active:scale-95 border-2 border-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.4)] flex flex-col items-center justify-center transition-all cursor-pointer"
                title="Health Potion (P)"
              >
                <span className="text-base">🧪</span>
                <span className="text-[7px] font-bold text-teal-100">x{hotbarState.potionsRemaining}</span>
              </button>

              {/* 8. LOCK-ON TARGET BUTTON */}
              <button
                onClick={() => performTargetLock()}
                className="absolute left-2 -top-1 w-11 h-11 rounded-full bg-gradient-to-br from-stone-800 to-stone-900 hover:from-stone-700 hover:to-stone-800 active:scale-95 border border-amber-500/70 shadow-lg flex flex-col items-center justify-center transition-all cursor-pointer"
                title="Lock On (F)"
              >
                <span className="text-base">🎯</span>
                <span className="text-[7px] font-bold text-amber-300">LOCK</span>
              </button>
            </div>
          </div>
        </>
      ) : (
        /* CLASSIC 16-BIT RETRO HOTBAR DOCK */
        <>
          {/* Bottom-Center: Authentic 16-Bit Action Hotbar Dock */}
          <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center pointer-events-auto px-2">
            <div className="flex items-center gap-1.5 sm:gap-2 p-2 bg-slate-950/95 pixel-border-dark shadow-2xl backdrop-blur-md">
              {/* Slot 1: Light Climts Slash */}
              <button
                onClick={() => {
                  sound.playClick();
                  performClimtsSlash();
                }}
                className="relative w-12 h-12 sm:w-14 sm:h-14 pixel-btn pixel-border-dark bg-sky-950/80 hover:bg-sky-900/80 active:translate-y-0.5 flex flex-col items-center justify-center transition-all cursor-pointer group"
                title="Light Attack (J or Left Click)"
              >
                <span className="text-base sm:text-lg">🗡️</span>
                <span className="text-[7px] font-pixel text-sky-300">LIGHT</span>
                <span className="absolute top-0.5 left-1 text-[7px] font-pixel text-amber-300">J</span>
              </button>

              {/* Slot 2: Katana Heavy Combo */}
              <button
                onClick={() => {
                  sound.playClick();
                  performHeavyCombo();
                }}
                className="relative w-12 h-12 sm:w-14 sm:h-14 pixel-btn pixel-border-dark bg-amber-950/80 hover:bg-amber-900/80 active:translate-y-0.5 flex flex-col items-center justify-center transition-all cursor-pointer group"
                title="Heavy Attack (K)"
              >
                <span className="text-base sm:text-lg">⚔️</span>
                <span className="text-[7px] font-pixel text-amber-300">HEAVY</span>
                <span className="absolute top-0.5 left-1 text-[7px] font-pixel text-amber-300">K</span>
              </button>

              {/* Slot 3: Roll / Dash */}
              <button
                onClick={() => {
                  sound.playClick();
                  performDash();
                }}
                className="relative w-12 h-12 sm:w-14 sm:h-14 pixel-btn pixel-border-dark bg-indigo-950/80 hover:bg-indigo-900/80 active:translate-y-0.5 flex flex-col items-center justify-center transition-all cursor-pointer group"
                title="Roll (R)"
              >
                <span className="text-base sm:text-lg">💨</span>
                <span className="text-[7px] font-pixel text-indigo-300">ROLL</span>
                <span className="absolute top-0.5 left-1 text-[7px] font-pixel text-amber-300">R</span>
              </button>

              {/* Slot 4: Guard & Parry */}
              <button
                onMouseDown={() => toggleBlockParry(true)}
                onMouseUp={() => toggleBlockParry(false)}
                onTouchStart={() => toggleBlockParry(true)}
                onTouchEnd={() => toggleBlockParry(false)}
                className={`relative w-12 h-12 sm:w-14 sm:h-14 pixel-btn pixel-border-dark flex flex-col items-center justify-center transition-all cursor-pointer ${
                  hotbarState.blockActive
                    ? 'bg-emerald-600/80 border-emerald-400 shadow-[0_0_12px_#34d399]'
                    : 'bg-emerald-950/80 hover:bg-emerald-900/80'
                }`}
                title="Hold Guard (Right Click or B)"
              >
                <span className="text-base sm:text-lg">🛡️</span>
                <span className="text-[7px] font-pixel text-emerald-300">GUARD</span>
                <span className="absolute top-0.5 left-1 text-[7px] font-pixel text-amber-300">B</span>
              </button>

              {/* Slot 5: Cast Magic */}
              <button
                onClick={() => {
                  sound.playClick();
                  performCastMagic();
                }}
                className="relative w-12 h-12 sm:w-14 sm:h-14 pixel-btn pixel-border-dark bg-purple-950/80 hover:bg-purple-900/80 active:translate-y-0.5 flex flex-col items-center justify-center transition-all cursor-pointer group"
                title="Magic (E)"
              >
                <span className="text-base sm:text-lg">✨</span>
                <span className="text-[7px] font-pixel text-purple-300">MAGIC</span>
                <span className="absolute top-0.5 left-1 text-[7px] font-pixel text-amber-300">E</span>
              </button>

              {/* Slot 6: Ultimate Special */}
              <button
                onClick={() => {
                  sound.playClick();
                  performSpecial();
                }}
                disabled={hudState.soul < 100}
                className={`relative w-12 h-12 sm:w-14 sm:h-14 pixel-btn pixel-border-dark flex flex-col items-center justify-center transition-all ${
                  hudState.soul >= 100
                    ? 'bg-rose-600/80 border-rose-400 shadow-[0_0_20px_#f43f5e] animate-pulse cursor-pointer'
                    : 'bg-rose-950/40 opacity-50 cursor-not-allowed'
                }`}
                title="Fury (Q, when charged)"
              >
                <span className="text-base sm:text-lg">🔥</span>
                <span className="text-[7px] font-pixel text-rose-300">FURY</span>
                <span className="absolute top-0.5 left-1 text-[7px] font-pixel text-amber-300">Q</span>
              </button>

              {/* Slot 7: Health Potion */}
              <button
                onClick={() => {
                  sound.playClick();
                  drinkPotion();
                }}
                disabled={hotbarState.potionsRemaining <= 0}
                className="relative w-12 h-12 sm:w-14 sm:h-14 pixel-btn pixel-border-dark bg-teal-950/80 hover:bg-teal-900/80 active:translate-y-0.5 flex flex-col items-center justify-center transition-all cursor-pointer group"
                title="Health Potion (P)"
              >
                <span className="text-base sm:text-lg">🧪</span>
                <span className="text-[7px] font-pixel text-teal-300">x{hotbarState.potionsRemaining}</span>
                <span className="absolute top-0.5 left-1 text-[7px] font-pixel text-amber-300">P</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* 6. BOTTOM-RIGHT: RETRO UTILITY SYSTEM BUTTONS            */}
      {/* ======================================================== */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
        {onReturnToCamp && (
          <button
            onClick={() => {
              sound.playClick();
              onReturnToCamp();
            }}
            className="px-2.5 py-2 pixel-btn pixel-border-dark bg-slate-900 text-rose-300 text-[8px] font-pixel flex items-center gap-1.5 shadow-lg cursor-pointer"
            title="Return to Camp"
          >
            <span>🏕️</span>
            <span className="hidden sm:inline">CAMP</span>
          </button>
        )}
        <button
          onClick={() => {
            sound.playClick();
            onOpenLevelMap();
          }}
          className="px-2.5 py-2 pixel-btn pixel-border-dark bg-slate-900 text-amber-300 text-[8px] font-pixel flex items-center gap-1.5 shadow-lg cursor-pointer"
          title="Campaign Map"
        >
          <span>🗺️</span>
          <span className="hidden sm:inline">MAP</span>
        </button>
        <button
          onClick={() => {
            sound.playClick();
            onOpenHeroSelect();
          }}
          className="px-2.5 py-2 pixel-btn pixel-border-dark bg-slate-900 text-sky-300 text-[8px] font-pixel flex items-center gap-1.5 shadow-lg cursor-pointer"
          title="Hero Roster & Skills"
        >
          <span>⚔️</span>
          <span className="hidden sm:inline">HERO</span>
        </button>
        <button
          onClick={() => {
            sound.playClick();
            onOpenSettings();
          }}
          className="px-2.5 py-2 pixel-btn pixel-border-dark bg-slate-900 text-emerald-300 text-[8px] font-pixel flex items-center gap-1.5 shadow-lg cursor-pointer"
          title="Settings & Display Mode (Esc)"
        >
          <span>⚙️</span>
          <span className="hidden sm:inline">CONFIG</span>
        </button>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-950/90 pixel-border-dark text-[8px] text-cyan-200 font-pixel pointer-events-none whitespace-nowrap">
        <span className="text-amber-300">W A S D</span><span>MOVE</span>
        <span className="text-slate-500">·</span>
        <span>{isPointerLocked ? 'MOUSE LOOK ON' : 'CLICK ARENA, THEN MOVE MOUSE TO LOOK'}</span>
        <span className="text-slate-500">·</span>
        <span>LEFT CLICK ATTACK</span>
        <span className="text-slate-500">·</span>
        <span>SPACE JUMP</span>
        <span className="text-slate-500">·</span>
        <span>SHIFT RUN</span>
      </div>
    </div>
  );
};
