// High-Vibrance Procedural 16-Bit Demon Sprite Engine
// Renders pixel-perfect, crisp, highly visible animated 16-bit arcade demons
// No flat images, no missing assets, guaranteed bright visibility and distinct silhouette.

export type DemonArchetype = 
  | 'oni_boss' 
  | 'malakath_boss' 
  | 'shadow_ninja' 
  | 'lesser_demon' 
  | 'flying_stinger' 
  | 'corrupted_samurai' 
  | 'shadow_creeper' 
  | 'succubus_queen' 
  | 'infernal_brute'
  | 'cataclysm_magma'
  | 'void_space'
  | 'flesh_blight'
  | 'shadow_ice'
  | 'crystallized_light'
  | 'malakath_ascended';

export class PixelDemonRenderer {
  /**
   * Draw a 100% procedural 16-bit pixel-art demon with bright, high-contrast palette
   */
  static drawProceduralDemon(
    ctx: CanvasRenderingContext2D,
    type: DemonArchetype | string,
    w: number,
    h: number,
    frameTime: number,
    isAttacking: boolean,
    hitStun: boolean,
    isBoss: boolean
  ) {
    ctx.save();
    ctx.imageSmoothingEnabled = false;

    // Hit-stun flash: solid white arcade hit frame
    if (hitStun) {
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 12;
      ctx.fillRect(-w * 0.45, -h * 0.45, w * 0.9, h * 0.9);
      ctx.restore();
      return;
    }

    // Walking / breathing bob
    const walkCycle = Math.sin(frameTime * 12);
    const legSwing = Math.sin(frameTime * 10) * (w * 0.12);
    const breathe = Math.sin(frameTime * 5) * (h * 0.03);

    // Dynamic Attack Stance
    const attackReach = isAttacking ? Math.sin(frameTime * 20) * (w * 0.25) : 0;

    // Dispatch to authentic Malakath Bestiary Forms
    if (type === 'cataclysm_magma') {
      this.drawCataclysmMagmaDemon(ctx, w, h, walkCycle, legSwing, breathe, attackReach, frameTime);
    } else if (type === 'void_space') {
      this.drawVoidSpaceDemon(ctx, w, h, walkCycle, legSwing, breathe, attackReach, frameTime);
    } else if (type === 'flesh_blight') {
      this.drawFleshBlightDemon(ctx, w, h, walkCycle, legSwing, breathe, attackReach, frameTime);
    } else if (type === 'shadow_ice') {
      this.drawShadowIceDemon(ctx, w, h, walkCycle, legSwing, breathe, attackReach, frameTime);
    } else if (type === 'crystallized_light') {
      this.drawCrystallizedLightDemon(ctx, w, h, walkCycle, legSwing, breathe, attackReach, frameTime);
    } else if (type === 'malakath_ascended' || type === 'malakath_boss') {
      this.drawAscendedMalakathBoss(ctx, w, h, walkCycle, legSwing, breathe, attackReach, frameTime);
    } else if (type === 'oni_boss' || (isBoss && !type.includes('cataclysm'))) {
      this.drawOniBoss(ctx, w, h, walkCycle, legSwing, breathe, attackReach, frameTime);
    } else if (type === 'shadow_ninja' || type === 'corrupted_samurai') {
      this.drawShadowNinja(ctx, w, h, walkCycle, legSwing, breathe, attackReach, frameTime);
    } else if (type === 'flying_stinger' || type === 'succubus_queen') {
      this.drawFlyingStinger(ctx, w, h, frameTime, attackReach);
    } else if (type === 'shadow_creeper') {
      this.drawShadowCreeper(ctx, w, h, walkCycle, breathe);
    } else {
      // Default: Crimson Lesser Demon / Infernal Brute
      this.drawLesserDemon(ctx, w, h, walkCycle, legSwing, breathe, attackReach, frameTime);
    }

    ctx.restore();
  }

  // 1. ONI BOSS - Gigantic Crimson Ogre Demon with Golden Horns & Spiked Kanabo Club
  private static drawOniBoss(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    walk: number,
    leg: number,
    breathe: number,
    attack: number,
    time: number
  ) {
    const cx = 0;
    const cy = breathe;

    // Glowing Aura for Boss
    ctx.save();
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 24;

    // Huge Muscular Legs
    ctx.fillStyle = '#991b1b'; // Dark Crimson Flesh
    // Left Leg
    ctx.fillRect(cx - w * 0.35, cy + h * 0.15 + leg, w * 0.25, h * 0.35);
    // Right Leg
    ctx.fillRect(cx + w * 0.1, cy + h * 0.15 - leg, w * 0.25, h * 0.35);

    // Spiked Iron Greaves & Claws
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx - w * 0.37, cy + h * 0.4 + leg, w * 0.28, h * 0.12);
    ctx.fillRect(cx + w * 0.08, cy + h * 0.4 - leg, w * 0.28, h * 0.12);
    // Golden Claw tips
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(cx - w * 0.4, cy + h * 0.48 + leg, w * 0.1, h * 0.04);
    ctx.fillRect(cx + w * 0.3, cy + h * 0.48 - leg, w * 0.1, h * 0.04);

    // Massive Torso / Demon Chest Plate
    ctx.fillStyle = '#dc2626'; // Vivid Bright Red
    ctx.fillRect(cx - w * 0.42, cy - h * 0.22, w * 0.84, h * 0.44);
    // Chest Muscles / Abs definition (High contrast 16-bit shade)
    ctx.fillStyle = '#f87171'; // Light Crimson Highlight
    ctx.fillRect(cx - w * 0.35, cy - h * 0.16, w * 0.3, h * 0.14);
    ctx.fillRect(cx + w * 0.05, cy - h * 0.16, w * 0.3, h * 0.14);
    ctx.fillRect(cx - w * 0.25, cy + h * 0.02, w * 0.5, h * 0.08);

    // Spiked Obsidian Skull Belt
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - w * 0.44, cy + h * 0.14, w * 0.88, h * 0.08);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(cx - w * 0.1, cy + h * 0.12, w * 0.2, h * 0.12); // Belt buckle skull

    // Left Arm (Clawed Fist)
    ctx.fillStyle = '#b91c1c';
    ctx.fillRect(cx - w * 0.55, cy - h * 0.18 - leg * 0.5, w * 0.18, h * 0.4);

    // Right Arm (Swinging Heavy Spiked Kanabo Club)
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(cx + w * 0.38 + attack, cy - h * 0.25, w * 0.18, h * 0.35);

    // THE KANABO (Heavy Spiked Demon Club)
    ctx.fillStyle = '#1e293b'; // Iron body
    ctx.fillRect(cx + w * 0.46 + attack, cy - h * 0.52, w * 0.16, h * 0.65);
    // Spikes on Club (Bright gold and silver spikes)
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(cx + w * 0.38 + attack, cy - h * 0.48, w * 0.09, h * 0.06);
    ctx.fillRect(cx + w * 0.61 + attack, cy - h * 0.44, w * 0.09, h * 0.06);
    ctx.fillRect(cx + w * 0.38 + attack, cy - h * 0.36, w * 0.09, h * 0.06);
    ctx.fillRect(cx + w * 0.61 + attack, cy - h * 0.30, w * 0.09, h * 0.06);

    // Horned Oni Face Mask
    ctx.fillStyle = '#7f1d1d'; // Face base
    ctx.fillRect(cx - w * 0.26, cy - h * 0.45, w * 0.52, h * 0.26);

    // Fangs & Grin
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(cx - w * 0.18, cy - h * 0.25, w * 0.08, h * 0.08);
    ctx.fillRect(cx + w * 0.1, cy - h * 0.25, w * 0.08, h * 0.08);

    // Fierce Golden Demon Horns (Left & Right)
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(cx - w * 0.32, cy - h * 0.58, w * 0.12, h * 0.18);
    ctx.fillRect(cx - w * 0.38, cy - h * 0.68, w * 0.1, h * 0.14);
    ctx.fillRect(cx + w * 0.2, cy - h * 0.58, w * 0.12, h * 0.18);
    ctx.fillRect(cx + w * 0.28, cy - h * 0.68, w * 0.1, h * 0.14);

    // Blazing Yellow Demon Eyes (With dynamic pulsing glow)
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = '#eab308';
    ctx.shadowBlur = 16;
    ctx.fillRect(cx - w * 0.16, cy - h * 0.36, w * 0.1, h * 0.08);
    ctx.fillRect(cx + w * 0.06, cy - h * 0.36, w * 0.1, h * 0.08);

    ctx.restore();
  }

  // 2. MALAKATH, VOID CATACLYSM BOSS
  private static drawMalakathBoss(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    walk: number,
    leg: number,
    breathe: number,
    attack: number,
    time: number
  ) {
    const cx = 0;
    const cy = breathe;

    ctx.save();
    // Purple Cosmic Void Glow
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 28;

    // Void Wings flapping
    const wingFlap = Math.sin(time * 8) * (w * 0.15);
    ctx.fillStyle = '#581c87';
    // Left Wing
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.2, cy - h * 0.1);
    ctx.lineTo(cx - w * 0.8, cy - h * 0.55 + wingFlap);
    ctx.lineTo(cx - w * 0.65, cy + h * 0.05);
    ctx.closePath();
    ctx.fill();
    // Right Wing
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.2, cy - h * 0.1);
    ctx.lineTo(cx + w * 0.8, cy - h * 0.55 - wingFlap);
    ctx.lineTo(cx + w * 0.65, cy + h * 0.05);
    ctx.closePath();
    ctx.fill();

    // Floating Dark Matter Robes / Legs
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(cx - w * 0.35, cy + h * 0.1, w * 0.7, h * 0.42);
    // Void Rune Edge
    ctx.fillStyle = '#a855f7';
    ctx.fillRect(cx - w * 0.35, cy + h * 0.48, w * 0.7, h * 0.06);

    // Torso & Obsidian Armor
    ctx.fillStyle = '#312e81';
    ctx.fillRect(cx - w * 0.32, cy - h * 0.22, w * 0.64, h * 0.35);

    // Crown of Thorns & Floating Halos
    ctx.fillStyle = '#e879f9';
    ctx.fillRect(cx - w * 0.4, cy - h * 0.6, w * 0.8, h * 0.06);
    ctx.fillRect(cx - w * 0.3, cy - h * 0.66, w * 0.1, h * 0.12);
    ctx.fillRect(cx + w * 0.2, cy - h * 0.66, w * 0.1, h * 0.12);

    // Head / Void Mask
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - w * 0.2, cy - h * 0.45, w * 0.4, h * 0.25);

    // Triple Void Eyes (Pure Neon Magenta)
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 18;
    ctx.fillRect(cx - w * 0.12, cy - h * 0.36, w * 0.08, h * 0.08);
    ctx.fillRect(cx + w * 0.04, cy - h * 0.36, w * 0.08, h * 0.08);
    ctx.fillRect(cx - w * 0.04, cy - h * 0.44, w * 0.08, h * 0.08); // Third Eye

    // Void Greatsword in Right Hand
    ctx.fillStyle = '#ec4899';
    ctx.fillRect(cx + w * 0.35 + attack, cy - h * 0.65, w * 0.12, h * 0.85);

    ctx.restore();
  }

  // 3. SHADOW NINJA / CORRUPTED SAMURAI - Swift, Dual Katanas, Glowing Visor
  private static drawShadowNinja(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    walk: number,
    leg: number,
    breathe: number,
    attack: number,
    time: number
  ) {
    const cx = 0;
    const cy = breathe;

    ctx.save();
    // Shadow Shinobi Robes (Dark Navy & Bright Cyan Trim for Visibility)
    ctx.fillStyle = '#0f172a';
    // Legs
    ctx.fillRect(cx - w * 0.25, cy + h * 0.15 + leg, w * 0.18, h * 0.35);
    ctx.fillRect(cx + w * 0.07, cy + h * 0.15 - leg, w * 0.18, h * 0.35);

    // Shinobi Wrappings (Bright Turquoise for crisp visibility)
    ctx.fillStyle = '#06b6d4';
    ctx.fillRect(cx - w * 0.27, cy + h * 0.35 + leg, w * 0.22, h * 0.08);
    ctx.fillRect(cx + w * 0.05, cy + h * 0.35 - leg, w * 0.22, h * 0.08);

    // Torso & Armored Vest
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx - w * 0.3, cy - h * 0.2, w * 0.6, h * 0.38);

    // Bright Crimson Sash
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(cx - w * 0.32, cy + h * 0.1, w * 0.64, h * 0.07);

    // Scarf trailing behind (Animated wind flutter)
    const scarfFlutter = Math.sin(time * 16) * (w * 0.25);
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.1, cy - h * 0.22);
    ctx.lineTo(cx - w * 0.45 - scarfFlutter, cy - h * 0.15);
    ctx.lineTo(cx - w * 0.4 - scarfFlutter, cy - h * 0.05);
    ctx.closePath();
    ctx.fill();

    // Dual Katanas (Left and Right)
    ctx.fillStyle = '#38bdf8'; // Glowing Silver-Cyan Blades
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 10;
    // Left Blade
    ctx.fillRect(cx - w * 0.45, cy - h * 0.1 + leg * 0.4, w * 0.08, h * 0.45);
    // Right Blade (Striking)
    ctx.fillRect(cx + w * 0.35 + attack, cy - h * 0.3, w * 0.08, h * 0.55);

    // Shinobi Mask & Glowing Slit Visor
    ctx.fillStyle = '#020617';
    ctx.fillRect(cx - w * 0.2, cy - h * 0.42, w * 0.4, h * 0.24);

    // Glowing Neon Eyes
    ctx.fillStyle = '#22d3ee';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 14;
    ctx.fillRect(cx - w * 0.14, cy - h * 0.33, w * 0.28, h * 0.06);

    ctx.restore();
  }

  // 4. FLYING STINGER / SUCCUBUS - Airborne Winged Demon with Spiked Tail & Fire Magic
  private static drawFlyingStinger(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    time: number,
    attack: number
  ) {
    const cx = 0;
    // Hovering altitude wave
    const hoverY = Math.sin(time * 10) * (h * 0.12) - h * 0.15;

    ctx.save();
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 20;

    // Bat / Gargoyle Wings Flapping in 16-Bit Style
    const flap = Math.sin(time * 18);
    const wingSpan = w * 0.65;
    ctx.fillStyle = '#6b21a8'; // Purple Wing Membrane
    // Left Wing
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.15, hoverY - h * 0.1);
    ctx.lineTo(cx - wingSpan, hoverY - h * 0.45 + flap * (h * 0.2));
    ctx.lineTo(cx - wingSpan * 0.6, hoverY + h * 0.1);
    ctx.closePath();
    ctx.fill();
    // Right Wing
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.15, hoverY - h * 0.1);
    ctx.lineTo(cx + wingSpan, hoverY - h * 0.45 - flap * (h * 0.2));
    ctx.lineTo(cx + wingSpan * 0.6, hoverY + h * 0.1);
    ctx.closePath();
    ctx.fill();

    // Slender Demon Body
    ctx.fillStyle = '#7e22ce';
    ctx.fillRect(cx - w * 0.2, hoverY - h * 0.15, w * 0.4, h * 0.38);

    // Spiked Demon Tail Curling
    const tailSwing = Math.sin(time * 8) * (w * 0.2);
    ctx.fillStyle = '#581c87';
    ctx.fillRect(cx - w * 0.06 + tailSwing, hoverY + h * 0.22, w * 0.12, h * 0.28);
    // Stinger Barb (Neon Poison Green)
    ctx.fillStyle = '#4ade80';
    ctx.shadowColor = '#22c55e';
    ctx.shadowBlur = 12;
    ctx.fillRect(cx - w * 0.1 + tailSwing, hoverY + h * 0.48, w * 0.2, h * 0.1);

    // Horned Head
    ctx.fillStyle = '#3b0764';
    ctx.fillRect(cx - w * 0.18, hoverY - h * 0.38, w * 0.36, h * 0.24);

    // Curved Horns
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(cx - w * 0.24, hoverY - h * 0.5, w * 0.08, h * 0.16);
    ctx.fillRect(cx + w * 0.16, hoverY - h * 0.5, w * 0.08, h * 0.16);

    // Blazing Pink / Red Eyes
    ctx.fillStyle = '#fb7185';
    ctx.shadowColor = '#e11d48';
    ctx.shadowBlur = 14;
    ctx.fillRect(cx - w * 0.12, hoverY - h * 0.3, w * 0.08, h * 0.08);
    ctx.fillRect(cx + w * 0.04, hoverY - h * 0.3, w * 0.08, h * 0.08);

    ctx.restore();
  }

  // 5. SHADOW CREEPER - Slithering Spiked Arachnid-Fiend with Serrated Scythe Legs & Venom Fangs
  private static drawShadowCreeper(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    walk: number,
    breathe: number
  ) {
    const cx = 0;
    const cy = h * 0.12 + breathe;

    ctx.save();
    // 1. Spiked Scythe Crawler Legs (3 on left, 3 on right, walking rhythmically)
    ctx.strokeStyle = '#022c22';
    ctx.lineWidth = Math.max(3, w * 0.06);
    ctx.lineCap = 'round';
    for (let legIdx = 0; legIdx < 3; legIdx++) {
      const legPhase = (walk * 8 + legIdx * 1.8);
      const legOffset = Math.sin(legPhase) * (h * 0.14);
      const lx = cx - w * 0.22 - legIdx * (w * 0.1);
      const rx = cx + w * 0.22 + legIdx * (w * 0.1);
      const ly = cy + legIdx * (h * 0.08);

      // Left leg
      ctx.beginPath();
      ctx.moveTo(cx - w * 0.15, ly);
      ctx.lineTo(lx, ly - h * 0.18 + legOffset);
      ctx.lineTo(lx - w * 0.22, ly + h * 0.26 + legOffset);
      ctx.stroke();

      // Right leg
      ctx.beginPath();
      ctx.moveTo(cx + w * 0.15, ly);
      ctx.lineTo(rx, ly - h * 0.18 - legOffset);
      ctx.lineTo(rx + w * 0.22, ly + h * 0.26 - legOffset);
      ctx.stroke();

      // Sharp golden claw tips
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(lx - w * 0.26, ly + h * 0.24 + legOffset, w * 0.08, w * 0.06);
      ctx.fillRect(rx + w * 0.18, ly + h * 0.24 - legOffset, w * 0.08, w * 0.06);
    }

    // 2. Chitinous Armored Thorax & Abdomen
    ctx.fillStyle = '#064e3b'; // Abyssal emerald chitin
    ctx.beginPath();
    ctx.ellipse(cx, cy + h * 0.06, w * 0.44, h * 0.26, 0, 0, Math.PI * 2);
    ctx.fill();

    // Armored Segments
    ctx.fillStyle = '#0f766e';
    ctx.fillRect(cx - w * 0.32, cy - h * 0.04, w * 0.64, h * 0.07);
    ctx.fillRect(cx - w * 0.28, cy + h * 0.08, w * 0.56, h * 0.07);

    // 3. Spiked Spine Ridge (Sharp poisonous daggers)
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 10;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cx + i * (w * 0.14) - w * 0.03, cy - h * 0.05);
      ctx.lineTo(cx + i * (w * 0.14), cy - h * 0.26);
      ctx.lineTo(cx + i * (w * 0.14) + w * 0.03, cy - h * 0.05);
      ctx.closePath();
      ctx.fill();
    }

    // 4. Venomous Mandibles & Fangs
    ctx.fillStyle = '#14532d';
    ctx.fillRect(cx - w * 0.18, cy - h * 0.22, w * 0.36, h * 0.2);

    // Glowing Toxic Fangs
    ctx.fillStyle = '#facc15';
    ctx.shadowColor = '#84cc16';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.14, cy - h * 0.04);
    ctx.lineTo(cx - w * 0.18, cy + h * 0.16);
    ctx.lineTo(cx - w * 0.06, cy - h * 0.04);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + w * 0.06, cy - h * 0.04);
    ctx.lineTo(cx + w * 0.18, cy + h * 0.16);
    ctx.lineTo(cx + w * 0.14, cy - h * 0.04);
    ctx.closePath();
    ctx.fill();

    // 5. Cluster of 6 Blazing Insectoid Amber Eyes
    ctx.fillStyle = '#fde047';
    ctx.shadowColor = '#eab308';
    ctx.shadowBlur = 14;
    const eyes = [
      { x: -w * 0.18, y: -h * 0.16, s: w * 0.07 },
      { x: -w * 0.07, y: -h * 0.2, s: w * 0.09 },
      { x: w * 0.07, y: -h * 0.2, s: w * 0.09 },
      { x: w * 0.18, y: -h * 0.16, s: w * 0.07 },
      { x: -w * 0.11, y: -h * 0.1, s: w * 0.06 },
      { x: w * 0.11, y: -h * 0.1, s: w * 0.06 },
    ];
    eyes.forEach((eye) => {
      ctx.fillRect(cx + eye.x - eye.s / 2, cy + eye.y - eye.s / 2, eye.s, eye.s);
    });

    ctx.restore();
  }

  // 6. LESSER DEMON / INFERNAL BRUTE - Detailed 16-Bit Crimson Fiend with Spiked Armor & Bone Cleaver
  private static drawLesserDemon(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    walk: number,
    leg: number,
    breathe: number,
    attack: number,
    time: number
  ) {
    const cx = 0;
    const cy = breathe;

    ctx.save();
    // 1. Spiked Digigrade Muscular Demon Legs
    ctx.fillStyle = '#7f1d1d'; // Deep crimson base
    ctx.beginPath();
    // Left Leg
    ctx.moveTo(cx - w * 0.28, cy + h * 0.12);
    ctx.lineTo(cx - w * 0.12, cy + h * 0.12);
    ctx.lineTo(cx - w * 0.08, cy + h * 0.44 + leg);
    ctx.lineTo(cx - w * 0.32, cy + h * 0.44 + leg);
    ctx.closePath();
    ctx.fill();

    // Right Leg
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.12, cy + h * 0.12);
    ctx.lineTo(cx + w * 0.28, cy + h * 0.12);
    ctx.lineTo(cx + w * 0.32, cy + h * 0.44 - leg);
    ctx.lineTo(cx + w * 0.08, cy + h * 0.44 - leg);
    ctx.closePath();
    ctx.fill();

    // Claws on feet
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(cx - w * 0.34, cy + h * 0.44 + leg, w * 0.26, h * 0.06);
    ctx.fillRect(cx + w * 0.08, cy + h * 0.44 - leg, w * 0.26, h * 0.06);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(cx - w * 0.36, cy + h * 0.47 + leg, w * 0.08, h * 0.03);
    ctx.fillRect(cx + w * 0.28, cy + h * 0.47 - leg, w * 0.08, h * 0.03);

    // 2. Muscular V-Taper Torso with Ribcage & Dark Obsidian Pauldrons
    ctx.fillStyle = '#b91c1c'; // Vivid arterial red
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.32, cy - h * 0.22);
    ctx.lineTo(cx + w * 0.32, cy - h * 0.22);
    ctx.lineTo(cx + w * 0.22, cy + h * 0.15);
    ctx.lineTo(cx - w * 0.22, cy + h * 0.15);
    ctx.closePath();
    ctx.fill();

    // Chest Muscle Highlights
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(cx - w * 0.26, cy - h * 0.18, w * 0.22, h * 0.12);
    ctx.fillRect(cx + w * 0.04, cy - h * 0.18, w * 0.22, h * 0.12);
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(cx - w * 0.18, cy - h * 0.04, w * 0.36, h * 0.14);

    // Dark Spiked Shoulder Pauldrons
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.42, cy - h * 0.26);
    ctx.lineTo(cx - w * 0.22, cy - h * 0.24);
    ctx.lineTo(cx - w * 0.24, cy - h * 0.12);
    ctx.lineTo(cx - w * 0.46, cy - h * 0.16);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + w * 0.42, cy - h * 0.26);
    ctx.lineTo(cx + w * 0.22, cy - h * 0.24);
    ctx.lineTo(cx + w * 0.24, cy - h * 0.12);
    ctx.lineTo(cx + w * 0.46, cy - h * 0.16);
    ctx.closePath();
    ctx.fill();

    // Spikes on shoulders
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(cx - w * 0.46, cy - h * 0.28, w * 0.08, h * 0.08);
    ctx.fillRect(cx + w * 0.38, cy - h * 0.28, w * 0.08, h * 0.08);

    // Left Arm (Clawed Fist)
    ctx.fillStyle = '#991b1b';
    ctx.fillRect(cx - w * 0.42, cy - h * 0.14 - leg * 0.2, w * 0.14, h * 0.32);
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(cx - w * 0.44, cy + h * 0.14 - leg * 0.2, w * 0.16, h * 0.1);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(cx - w * 0.46, cy + h * 0.22 - leg * 0.2, w * 0.06, h * 0.05);

    // Right Arm (Swinging Heavy Serrated Bone Cleaver)
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(cx + w * 0.28 + attack, cy - h * 0.18, w * 0.14, h * 0.3);

    // Serrated Great Cleaver
    ctx.fillStyle = '#f1f5f9'; // Cold steel / bone blade
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.32 + attack, cy - h * 0.48);
    ctx.lineTo(cx + w * 0.48 + attack, cy - h * 0.44);
    ctx.lineTo(cx + w * 0.44 + attack, cy + h * 0.22);
    ctx.lineTo(cx + w * 0.32 + attack, cy + h * 0.18);
    ctx.closePath();
    ctx.fill();

    // Serrated Jagged Teeth on blade edge
    ctx.fillStyle = '#ef4444';
    for (let s = -0.38; s <= 0.12; s += 0.12) {
      ctx.fillRect(cx + w * 0.46 + attack, cy + h * s, w * 0.06, h * 0.05);
    }

    // 3. Horned Demon Skull & Face Mask
    ctx.fillStyle = '#7f1d1d';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.22, cy - h * 0.44);
    ctx.lineTo(cx + w * 0.22, cy - h * 0.44);
    ctx.lineTo(cx + w * 0.16, cy - h * 0.22);
    ctx.lineTo(cx - w * 0.16, cy - h * 0.22);
    ctx.closePath();
    ctx.fill();

    // Curved Wicked Horns (Left & Right)
    ctx.fillStyle = '#f59e0b'; // Amber Gold Horns
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.22, cy - h * 0.44);
    ctx.lineTo(cx - w * 0.34, cy - h * 0.62);
    ctx.lineTo(cx - w * 0.24, cy - h * 0.64);
    ctx.lineTo(cx - w * 0.14, cy - h * 0.44);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + w * 0.22, cy - h * 0.44);
    ctx.lineTo(cx + w * 0.34, cy - h * 0.62);
    ctx.lineTo(cx + w * 0.24, cy - h * 0.64);
    ctx.lineTo(cx + w * 0.14, cy - h * 0.44);
    ctx.closePath();
    ctx.fill();

    // Jagged Demon Fangs & Mouth
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(cx - w * 0.12, cy - h * 0.28, w * 0.24, h * 0.05);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(cx - w * 0.09, cy - h * 0.29, w * 0.04, h * 0.04);
    ctx.fillRect(cx + w * 0.05, cy - h * 0.29, w * 0.04, h * 0.04);

    // Blazing Crimson Demon Eyes (With dynamic pulsing glow)
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = '#eab308';
    ctx.shadowBlur = 16;
    ctx.fillRect(cx - w * 0.15, cy - h * 0.38, w * 0.09, h * 0.07);
    ctx.fillRect(cx + w * 0.06, cy - h * 0.38, w * 0.09, h * 0.07);

    ctx.restore();
  }

  // =========================================================================
  // 50 ASCENDED FORMS BESTIARY DEMON DRAWERS (Matching User Reference Image)
  // =========================================================================

  // 1. FORM OF CATACLYSM (Magma / Lava Hydra Titan)
  private static drawCataclysmMagmaDemon(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    walk: number,
    leg: number,
    breathe: number,
    attack: number,
    time: number
  ) {
    const cx = 0;
    const cy = breathe;

    ctx.save();
    ctx.shadowColor = '#ff4500';
    ctx.shadowBlur = 24;

    // Molten Lava Drip & Ground Fissure Glow
    ctx.fillStyle = '#f97316';
    ctx.fillRect(cx - w * 0.4, cy + h * 0.44, w * 0.8, h * 0.08);

    // Thick Obsidian-Crust Muscular Legs
    ctx.fillStyle = '#1c1917'; // Basalt crust
    ctx.fillRect(cx - w * 0.35, cy + h * 0.12 + leg, w * 0.26, h * 0.36);
    ctx.fillRect(cx + w * 0.09, cy + h * 0.12 - leg, w * 0.26, h * 0.36);

    // Glowing Lava Fissures across legs
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(cx - w * 0.3, cy + h * 0.2 + leg, w * 0.16, h * 0.04);
    ctx.fillRect(cx + w * 0.14, cy + h * 0.26 - leg, w * 0.16, h * 0.04);

    // Massive Molten Thorax & Flowing Chest Magma
    ctx.fillStyle = '#292524';
    ctx.fillRect(cx - w * 0.44, cy - h * 0.24, w * 0.88, h * 0.42);

    // Intersecting Rivers of Golden Magma on Torso (Matching Bestiary Art)
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(cx - w * 0.35, cy - h * 0.18, w * 0.7, h * 0.3);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(cx - w * 0.15, cy - h * 0.16, w * 0.3, h * 0.24);

    // 3 Hydra Dragon Heads (Multi-headed Form of Cataclysm)
    [-0.28, 0, 0.28].forEach((hx, idx) => {
      const headBob = Math.sin(time * 6 + idx * 2) * (h * 0.04);
      // Head base
      ctx.fillStyle = '#450a0a';
      ctx.fillRect(cx + hx * w - w * 0.14, cy - h * 0.52 + headBob, w * 0.28, h * 0.22);

      // Blazing Magma Fangs
      ctx.fillStyle = '#fde047';
      ctx.fillRect(cx + hx * w - w * 0.1, cy - h * 0.34 + headBob, w * 0.06, h * 0.06);
      ctx.fillRect(cx + hx * w + w * 0.04, cy - h * 0.34 + headBob, w * 0.06, h * 0.06);

      // Flaming Horns
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(cx + hx * w - w * 0.12, cy - h * 0.52 + headBob);
      ctx.lineTo(cx + hx * w - w * 0.18, cy - h * 0.68 + headBob);
      ctx.lineTo(cx + hx * w - w * 0.04, cy - h * 0.52 + headBob);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(cx + hx * w + w * 0.12, cy - h * 0.52 + headBob);
      ctx.lineTo(cx + hx * w + w * 0.18, cy - h * 0.68 + headBob);
      ctx.lineTo(cx + hx * w + w * 0.04, cy - h * 0.52 + headBob);
      ctx.closePath();
      ctx.fill();

      // Blazing Yellow Slit Eyes
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 14;
      ctx.fillRect(cx + hx * w - w * 0.08, cy - h * 0.44 + headBob, w * 0.05, h * 0.05);
      ctx.fillRect(cx + hx * w + w * 0.03, cy - h * 0.44 + headBob, w * 0.05, h * 0.05);
    });

    // Colossal Magma Claws & Molten Drips
    ctx.fillStyle = '#c2410c';
    ctx.fillRect(cx - w * 0.58, cy - h * 0.16, w * 0.2, h * 0.4);
    ctx.fillRect(cx + w * 0.38 + attack, cy - h * 0.22, w * 0.2, h * 0.44);

    ctx.restore();
  }

  // 2. FORM OF VOID (Shadow / Space & Cosmic Tendrils)
  private static drawVoidSpaceDemon(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    walk: number,
    leg: number,
    breathe: number,
    attack: number,
    time: number
  ) {
    const cx = 0;
    const cy = breathe;

    ctx.save();
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 30;

    // 8 Orbiting Void Matter Tendrils (Writhing in sinusoidal loops)
    for (let t = 0; t < 8; t++) {
      const angle = (t / 8) * Math.PI * 2 + time * 2;
      const tendrilLen = (w * 0.5) + Math.sin(time * 5 + t) * (w * 0.15);
      const tx = cx + Math.cos(angle) * tendrilLen;
      const ty = cy + Math.sin(angle) * tendrilLen * 0.8;

      ctx.strokeStyle = t % 2 === 0 ? '#9333ea' : '#3b82f6';
      ctx.lineWidth = Math.max(3, w * 0.05);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.quadraticCurveTo(cx + Math.cos(angle + 0.5) * tendrilLen * 0.5, cy + Math.sin(angle + 0.5) * tendrilLen * 0.5, tx, ty);
      ctx.stroke();

      // Glowing Astral Spark on tip
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(tx - 3, ty - 3, 6, 6);
    }

    // Celestial Torso Filled with Galaxy Starlight
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.34, h * 0.38, 0, 0, Math.PI * 2);
    ctx.fill();

    // Swirling Starfield Points inside body
    ctx.fillStyle = '#e879f9';
    for (let s = 0; s < 12; s++) {
      const sx = cx + Math.sin(s * 1.7 + time) * (w * 0.22);
      const sy = cy + Math.cos(s * 2.3 + time) * (h * 0.22);
      ctx.fillRect(sx, sy, 3, 3);
    }

    // Glowing Galactic Core Heart (Singularity)
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#60a5fa';
    ctx.shadowBlur = 25;
    ctx.beginPath();
    ctx.arc(cx, cy - h * 0.05, w * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Crown of Dimensional Spikes
    ctx.fillStyle = '#a855f7';
    for (let k = -2; k <= 2; k++) {
      ctx.beginPath();
      ctx.moveTo(cx + k * (w * 0.1) - w * 0.04, cy - h * 0.35);
      ctx.lineTo(cx + k * (w * 0.1), cy - h * 0.58);
      ctx.lineTo(cx + k * (w * 0.1) + w * 0.04, cy - h * 0.35);
      ctx.closePath();
      ctx.fill();
    }

    // Monolithic Cosmic Void Eye
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(cx, cy - h * 0.25, w * 0.15, h * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    ctx.arc(cx, cy - h * 0.25, w * 0.06, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 3. FORM OF CORRUPTION (Flesh / Blight Monstrosity)
  private static drawFleshBlightDemon(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    walk: number,
    leg: number,
    breathe: number,
    attack: number,
    time: number
  ) {
    const cx = 0;
    const cy = breathe;

    ctx.save();
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 22;

    // Writhing Flesh Tendrils & Sinew base
    ctx.strokeStyle = '#9d174d';
    ctx.lineWidth = Math.max(4, w * 0.07);
    for (let f = 0; f < 6; f++) {
      const fx = cx + (f - 2.5) * (w * 0.16);
      const fy = cy + h * 0.38 + Math.sin(time * 7 + f) * (h * 0.08);
      ctx.beginPath();
      ctx.moveTo(cx + (f - 2.5) * (w * 0.08), cy + h * 0.1);
      ctx.lineTo(fx, fy);
      ctx.stroke();
    }

    // Heaving Mutated Flesh Mass (Asymmetric and gruesome)
    ctx.fillStyle = '#831843'; // Deep necrotic flesh
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.42, h * 0.32, 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Necrotic Green Pustules (Blight pods)
    const pustules = [
      { x: -0.22, y: -0.15, r: 0.12 },
      { x: 0.18, y: -0.12, r: 0.1 },
      { x: -0.05, y: 0.12, r: 0.14 },
      { x: 0.25, y: 0.15, r: 0.09 },
      { x: -0.18, y: 0.2, r: 0.08 },
    ];
    pustules.forEach((p) => {
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.arc(cx + p.x * w, cy + p.y * h, w * p.r, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Spore Tip
      ctx.fillStyle = '#6ee7b7';
      ctx.fillRect(cx + p.x * w - 2, cy + p.y * h - 2, 4, 4);
    });

    // Giant Eldritch Mouth dripping venom ichor
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.ellipse(cx, cy - h * 0.05, w * 0.24, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Razor Serrated Fangs
    ctx.fillStyle = '#fef08a';
    for (let t = -4; t <= 4; t++) {
      ctx.fillRect(cx + t * (w * 0.04), cy - h * 0.1, 3, 8);
      ctx.fillRect(cx + t * (w * 0.04), cy + h * 0.02, 3, -8);
    }

    // Weeping Corrupted Eyes Cluster
    ctx.fillStyle = '#facc15';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(cx - w * 0.15, cy - h * 0.24, w * 0.06, 0, Math.PI * 2);
    ctx.arc(cx + w * 0.12, cy - h * 0.22, w * 0.05, 0, Math.PI * 2);
    ctx.arc(cx, cy - h * 0.3, w * 0.07, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 4. SHADOW-ICE (Absolute Zero Cryo-Fiend)
  private static drawShadowIceDemon(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    walk: number,
    leg: number,
    breathe: number,
    attack: number,
    time: number
  ) {
    const cx = 0;
    const cy = breathe;

    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 26;

    // Jagged Floating Glacier Shards
    ctx.fillStyle = '#0284c7';
    for (let g = 0; g < 6; g++) {
      const gAngle = (g / 6) * Math.PI * 2 + time * 1.5;
      const gx = cx + Math.cos(gAngle) * (w * 0.55);
      const gy = cy + Math.sin(gAngle) * (h * 0.35);

      ctx.beginPath();
      ctx.moveTo(gx, gy - 18);
      ctx.lineTo(gx + 12, gy);
      ctx.lineTo(gx, gy + 18);
      ctx.lineTo(gx - 12, gy);
      ctx.closePath();
      ctx.fill();
    }

    // Frozen Crystalline Body Monolith
    ctx.fillStyle = '#0369a1';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.35, cy + h * 0.4);
    ctx.lineTo(cx - w * 0.45, cy - h * 0.1);
    ctx.lineTo(cx, cy - h * 0.55);
    ctx.lineTo(cx + w * 0.45, cy - h * 0.1);
    ctx.lineTo(cx + w * 0.35, cy + h * 0.4);
    ctx.closePath();
    ctx.fill();

    // Prismatic Frost Highlights (Light Cyan Facets)
    ctx.fillStyle = '#e0f2fe';
    ctx.beginPath();
    ctx.moveTo(cx, cy - h * 0.55);
    ctx.lineTo(cx - w * 0.2, cy - h * 0.1);
    ctx.lineTo(cx, cy + h * 0.2);
    ctx.closePath();
    ctx.fill();

    // Central Abyssal Frost Eye
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.ellipse(cx, cy - h * 0.12, w * 0.18, h * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#bae6fd';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.arc(cx, cy - h * 0.12, w * 0.07, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // 5. CRYSTALLIZED LIGHT (Solar Diamond Core Archon)
  private static drawCrystallizedLightDemon(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    walk: number,
    leg: number,
    breathe: number,
    attack: number,
    time: number
  ) {
    const cx = 0;
    const cy = breathe;

    ctx.save();
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 32;

    // Radiating Searing Light Rays (Rotating Solar Geometry)
    const numRays = 12;
    for (let r = 0; r < numRays; r++) {
      const rayAngle = (r / numRays) * Math.PI * 2 + time * 3;
      const rayLen = (w * 0.6) + Math.sin(time * 8 + r) * 15;
      const rx = cx + Math.cos(rayAngle) * rayLen;
      const ry = cy + Math.sin(rayAngle) * rayLen;

      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(rx, ry);
      ctx.stroke();
    }

    // Sacred Geometric Diamond Core (Gold & Bright White)
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.moveTo(cx, cy - h * 0.45);
    ctx.lineTo(cx + w * 0.4, cy);
    ctx.lineTo(cx, cy + h * 0.45);
    ctx.lineTo(cx - w * 0.4, cy);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(cx, cy - h * 0.3);
    ctx.lineTo(cx + w * 0.25, cy);
    ctx.lineTo(cx, cy + h * 0.3);
    ctx.lineTo(cx - w * 0.25, cy);
    ctx.closePath();
    ctx.fill();

    // Floating Solar Rings
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(cx, cy, w * 0.5, h * 0.18, time * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
  }

  // 6. MALAKATH: ASCENDED GOD OF CHAOS (Ultimate Phase 50 Supreme Boss)
  private static drawAscendedMalakathBoss(
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
    walk: number,
    leg: number,
    breathe: number,
    attack: number,
    time: number
  ) {
    const cx = 0;
    const cy = breathe;

    ctx.save();
    // Blazing Multi-Color Cataclysm + Void + Corruption Aura
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 36;

    // Titanic Demonic Wings (Molten Lava on Left, Void Cosmic Wings on Right)
    const wingFlap = Math.sin(time * 8) * (w * 0.15);
    // Molten Dragon Wing
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.2, cy - h * 0.1);
    ctx.lineTo(cx - w * 0.95, cy - h * 0.65 + wingFlap);
    ctx.lineTo(cx - w * 0.7, cy + h * 0.15);
    ctx.closePath();
    ctx.fill();
    // Void Star Wing
    ctx.fillStyle = '#7e22ce';
    ctx.beginPath();
    ctx.moveTo(cx + w * 0.2, cy - h * 0.1);
    ctx.lineTo(cx + w * 0.95, cy - h * 0.65 - wingFlap);
    ctx.lineTo(cx + w * 0.7, cy + h * 0.15);
    ctx.closePath();
    ctx.fill();

    // Colossal Multi-Limb Form of Cataclysm & Corruption
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(cx - w * 0.4, cy - h * 0.25, w * 0.8, h * 0.55);

    // Glowing Lava Ribcage
    ctx.fillStyle = '#f97316';
    for (let rib = -3; rib <= 3; rib++) {
      ctx.fillRect(cx - w * 0.3, cy + rib * (h * 0.05), w * 0.6, 4);
    }

    // Great Horned Ascended Skull of Malakath
    ctx.fillStyle = '#7f1d1d';
    ctx.fillRect(cx - w * 0.25, cy - h * 0.55, w * 0.5, h * 0.3);

    // Grand Golden Demon Horns (Towering and sharp)
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(cx - w * 0.25, cy - h * 0.55);
    ctx.lineTo(cx - w * 0.45, cy - h * 0.82);
    ctx.lineTo(cx - w * 0.1, cy - h * 0.55);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + w * 0.25, cy - h * 0.55);
    ctx.lineTo(cx + w * 0.45, cy - h * 0.82);
    ctx.lineTo(cx + w * 0.1, cy - h * 0.55);
    ctx.closePath();
    ctx.fill();

    // Six Blazing Crimson/Gold Demonic Eyes of Godhood
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 18;
    for (let e = -2; e <= 2; e++) {
      ctx.fillRect(cx + e * (w * 0.08) - 3, cy - h * 0.44, 6, 6);
    }

    // Great Demon Cleaver in Right Hand
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(cx + w * 0.45 + attack, cy - h * 0.7, w * 0.16, h * 0.95);

    ctx.restore();
  }
}

