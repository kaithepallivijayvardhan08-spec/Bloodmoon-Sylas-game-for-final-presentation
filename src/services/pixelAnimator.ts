import { PlayableHero } from '../types/heroes';
import { RoninActionState, SlashEnemy, RoninPlayer, AdventureLandmark } from '../types/ronin';
import { CrosshairStyle, FloorStyle } from '../types/builder';
import { PixelDemonRenderer } from './pixelDemonRenderer';

export interface EnemyTelegraph {
  x: number;
  y: number;
  radius: number;
  progress: number;
  color: string;
  type: 'cone' | 'circle' | 'line';
  direction: 'left' | 'right';
}

const TRANSPARENT_SPRITE_CACHE = new Map<string, HTMLCanvasElement>();
const INTERNAL_IMG_CACHE = new Map<string, HTMLImageElement>();

export function getInternalImg(src: string): HTMLImageElement {
  let img = INTERNAL_IMG_CACHE.get(src);
  if (!img) {
    img = new Image();
    img.src = src;
    INTERNAL_IMG_CACHE.set(src, img);
  }
  return img;
}

export function getTransparentPixelSprite(img: HTMLImageElement, threshold = 34): HTMLCanvasElement | null {
  if (!img || !img.complete || img.naturalWidth === 0) return null;
  const key = `${img.src}_${threshold}_pixelated`;
  const cached = TRANSPARENT_SPRITE_CACHE.get(key);
  if (cached) return cached;

  const offscreen = document.createElement('canvas');
  // Downsample to a consistent pixel grid without distorting character proportions.
  const pixelW = 128;
  const pixelH = 128;
  offscreen.width = pixelW;
  offscreen.height = pixelH;
  const octx = offscreen.getContext('2d');
  if (!octx) return null;

  octx.imageSmoothingEnabled = false;
  const imageScale = Math.min(pixelW / img.naturalWidth, pixelH / img.naturalHeight);
  const imageWidth = img.naturalWidth * imageScale;
  const imageHeight = img.naturalHeight * imageScale;
  octx.drawImage(img, (pixelW - imageWidth) / 2, (pixelH - imageHeight) / 2, imageWidth, imageHeight);

  try {
    const imgData = octx.getImageData(0, 0, pixelW, pixelH);
    const d = imgData.data;

    // Flood-fill only the background connected to the image edge. This removes
    // the pale paper-colored box around demon art without erasing ivory teeth,
    // eyes, or dark outlines inside the character.
    const seed = 0;
    const bgR = d[seed];
    const bgG = d[seed + 1];
    const bgB = d[seed + 2];
    const brightBackground = (bgR + bgG + bgB) / 3 > 150;
    const colorTolerance = brightBackground ? 46 : Math.max(26, threshold);
    const visited = new Uint8Array(pixelW * pixelH);
    const queue = new Int32Array(pixelW * pixelH);
    let head = 0;
    let tail = 0;
    const enqueue = (index: number) => {
      if (index < 0 || index >= visited.length || visited[index]) return;
      const offset = index * 4;
      const closeToBackground =
        Math.abs(d[offset] - bgR) <= colorTolerance &&
        Math.abs(d[offset + 1] - bgG) <= colorTolerance &&
        Math.abs(d[offset + 2] - bgB) <= colorTolerance;
      if (!closeToBackground) return;
      visited[index] = 1;
      queue[tail++] = index;
    };
    for (let x = 0; x < pixelW; x += 1) {
      enqueue(x);
      enqueue((pixelH - 1) * pixelW + x);
    }
    for (let y = 0; y < pixelH; y += 1) {
      enqueue(y * pixelW);
      enqueue(y * pixelW + pixelW - 1);
    }
    while (head < tail) {
      const index = queue[head++];
      d[index * 4 + 3] = 0;
      const x = index % pixelW;
      if (x > 0) enqueue(index - 1);
      if (x + 1 < pixelW) enqueue(index + 1);
      if (index >= pixelW) enqueue(index - pixelW);
      if (index + pixelW < visited.length) enqueue(index + pixelW);
    }

    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] === 0) continue;
      let r = d[i];
      let g = d[i + 1];
      let b = d[i + 2];

      // Authentic 16-bit arcade color quantization (5-bit color depth)
      // Boost contrast and snap colors into sharp retro arcade tones
      r = Math.min(255, Math.floor(r / 32) * 36 + 6);
      g = Math.min(255, Math.floor(g / 32) * 36 + 6);
      b = Math.min(255, Math.floor(b / 32) * 36 + 6);

      // Enhance saturation and vibrancy for pixel demons
      const maxC = Math.max(r, g, b);
      if (maxC > 70) {
        if (r === maxC) r = Math.min(255, Math.round(r * 1.15));
        if (g === maxC) g = Math.min(255, Math.round(g * 1.15));
        if (b === maxC) b = Math.min(255, Math.round(b * 1.15));
      }

      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
      d[i + 3] = 255;
    }

    octx.putImageData(imgData, 0, 0);

    // Upscale to crisp nearest-neighbor canvas for rendering
    const sharpCanvas = document.createElement('canvas');
    sharpCanvas.width = pixelW * 4;
    sharpCanvas.height = pixelH * 4;
    const sctx = sharpCanvas.getContext('2d');
    if (sctx) {
      sctx.imageSmoothingEnabled = false;
      sctx.drawImage(offscreen, 0, 0, sharpCanvas.width, sharpCanvas.height);
      TRANSPARENT_SPRITE_CACHE.set(key, sharpCanvas);
      return sharpCanvas;
    }

    TRANSPARENT_SPRITE_CACHE.set(key, offscreen);
    return offscreen;
  } catch {
    return null;
  }
}

export const PixelAnimator = {
  /**
   * Third-Person Behind-The-Back Hero Renderer (Professional 32-Bit Pixel Art)
   * Dynamically turns, tilts, and faces in the direction of movement (Left, Right, Forward, Backward)
   */
  drawHeroBackView(
    ctx: CanvasRenderingContext2D,
    screenX: number,
    screenY: number,
    baseScale: number,
    action: RoninActionState,
    frameTime: number,
    hero: PlayableHero,
    invulnerable: boolean,
    specialActive: boolean,
    isSunMode: boolean,
    heroImage?: HTMLImageElement | null,
    facing: 'left' | 'right' = 'right',
    facingAngle: number = 0,
    headingAngle: number = 0
  ) {
    ctx.save();
    ctx.translate(screenX, screenY);

    // Dynamic body turning & bank tilt based on 360° mouse heading and lateral movement
    let turnAngle = facingAngle * 0.35 + Math.sin(headingAngle) * 0.25;
    if (facing === 'left' && Math.abs(turnAngle) < 0.05) turnAngle = -0.15;
    if (facing === 'right' && Math.abs(turnAngle) < 0.05) turnAngle = 0.15;

    ctx.rotate(turnAngle);
    ctx.scale(baseScale, baseScale);

    if (invulnerable && Math.floor(frameTime * 28) % 2 === 0) {
      ctx.globalAlpha = 0.45;
    }

    // Dynamic movement bobbing, leg strides, and cape physics
    let bobY = 0;
    let bobX = 0;
    let capeSwing = 0;
    let armSwing = 0;
    let rollRotation = 0;
    let crouchDown = 0;

    if (action === 'run') {
      bobY = Math.abs(Math.sin(frameTime * 16)) * -9;
      bobX = Math.sin(frameTime * 8) * (facing === 'left' ? -6 : 6);
      capeSwing = Math.sin(frameTime * 16) * 18;
      armSwing = Math.sin(frameTime * 16) * 20;
    } else if (action === 'walk') {
      bobY = Math.abs(Math.sin(frameTime * 9)) * -5;
      bobX = Math.sin(frameTime * 4.5) * (facing === 'left' ? -3 : 3);
      capeSwing = Math.sin(frameTime * 9) * 10;
      armSwing = Math.sin(frameTime * 9) * 12;
    } else if (action === 'jump') {
      bobY = -24;
      capeSwing = 18;
    } else if (action === 'crouch') {
      crouchDown = 22;
      bobY = 12;
    } else if (action === 'roll') {
      rollRotation = (frameTime * 16) % (Math.PI * 2);
      bobY = 18;
    }

    // 1. Perspective Ground Contact Shadow (Moves naturally beneath character)
    ctx.save();
    ctx.fillStyle = isSunMode ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.ellipse(bobX * 0.5, 70, 44, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // If rolling, rotate entire body around center
    if (action === 'roll') {
      ctx.translate(0, 20);
      ctx.rotate(rollRotation);
      ctx.translate(0, -20);
    }

    // 2. CHECK & RENDER AUTHENTIC 32-BIT PIXEL ART HERO SPRITE
    // If strafing strongly left/right, flip or choose front/side profile
    const backSpriteSrc = hero.backSpriteSrc || hero.spriteSrc;
    const heroImgEl = heroImage || (backSpriteSrc ? getInternalImg(backSpriteSrc) : null);
    const cleanHeroCanvas = heroImgEl ? getTransparentPixelSprite(heroImgEl, 38) : null;

    if (cleanHeroCanvas) {
      const spriteW = 115;
      const spriteH = 130;
      ctx.save();
      ctx.imageSmoothingEnabled = false;

      // Flip sprite horizontally when moving left so the hero faces left!
      if (facing === 'left') {
        ctx.scale(-1, 1);
      }

      // High brightness & contrast boost so hero stands out crisply against the background
      ctx.filter = 'brightness(1.22) contrast(1.2) saturate(1.25)';
      ctx.drawImage(
        cleanHeroCanvas,
        -spriteW / 2 + bobX,
        -spriteH / 2 + bobY + crouchDown + 14,
        spriteW,
        spriteH
      );

      // Hero Outline Glow for maximum visibility in dark or daylight
      ctx.strokeStyle = hero.themeColor || '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = hero.themeColor || '#38bdf8';
      ctx.shadowBlur = 12;

      // Weapon / Slash trail overlay during combat actions
      if (action === 'climts_slash' || action === 'katana_combo') {
        ctx.strokeStyle = hero.themeColor || '#38bdf8';
        ctx.lineWidth = action === 'katana_combo' ? 5 : 3;
        ctx.shadowColor = hero.themeColor;
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.arc(18 + bobX, bobY + 14, 52, -0.4 * Math.PI, 0.4 * Math.PI);
        ctx.stroke();
      }

      ctx.restore();
      ctx.restore();
      return;
    } else if (heroImgEl && heroImgEl.complete && heroImgEl.naturalWidth > 0) {
      const spriteW = 115;
      const spriteH = 130;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      if (facing === 'left') {
        ctx.scale(-1, 1);
      }
      ctx.filter = 'brightness(1.22) contrast(1.2) saturate(1.25)';
      ctx.drawImage(
        heroImgEl,
        -spriteW / 2 + bobX,
        -spriteH / 2 + bobY + crouchDown + 14,
        spriteW,
        spriteH
      );
      ctx.restore();
      ctx.restore();
      return;
    }

    // 2. LEGS & BOOTS (Viewed from back, standing firmly on cobblestone)
    ctx.save();
    const legOffset = action === 'run' ? Math.sin(frameTime * 14) * 14 : (action === 'walk' ? Math.sin(frameTime * 8) * 8 : 0);
    ctx.fillStyle = '#1e293b'; // dark armored leather
    // Left leg
    ctx.fillRect(-18 + bobX, 36 + bobY + crouchDown + legOffset, 12, 36 - crouchDown * 0.4);
    // Right leg
    ctx.fillRect(6 + bobX, 36 + bobY + crouchDown - legOffset, 12, 36 - crouchDown * 0.4);
    // Armored greaves / boots
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-20 + bobX, 60 + bobY + crouchDown + legOffset, 16, 14);
    ctx.fillRect(4 + bobX, 60 + bobY + crouchDown - legOffset, 16, 14);
    ctx.restore();

    // 3. TORSO / BACK ARMOR / CUIRASS
    ctx.save();
    ctx.fillStyle = '#334155'; // steel cuirass base
    ctx.fillRect(-20 + bobX, -8 + bobY + crouchDown, 40, 48);

    // Shoulder pauldrons
    ctx.fillStyle = '#475569';
    ctx.fillRect(-28 + bobX, -14 + bobY + crouchDown, 14, 16); // left pauldron
    ctx.fillRect(14 + bobX, -14 + bobY + crouchDown, 14, 16);  // right pauldron

    // Golden or steel trim
    ctx.fillStyle = hero.themeColor;
    ctx.fillRect(-20 + bobX, 24 + bobY + crouchDown, 40, 5); // belt
    ctx.fillRect(-4 + bobX, 22 + bobY + crouchDown, 8, 9);   // belt buckle
    ctx.restore();

    // 4. FLOWING CAPE / CLOAK (Prominently featured in user's reference image!)
    ctx.save();
    const capeColor = hero.role === 'Female Red-Haired Warrior'
      ? '#991b1b' // crimson warrior cape
      : hero.role === 'Male Elven Archer'
        ? '#166534' // ranger forest cloak
        : hero.role === 'Female Armored Paladin'
          ? '#1e3a8a' // royal sapphire paladin cloak (like in screenshot!)
          : '#18181b'; // dark rogue shadow cloak

    ctx.fillStyle = capeColor;
    ctx.beginPath();
    ctx.moveTo(-18 + bobX, -8 + bobY + crouchDown);
    ctx.lineTo(18 + bobX, -8 + bobY + crouchDown);
    // Cape cascades down the back, billowing with wind/movement
    ctx.lineTo(26 + bobX + capeSwing, 64 + bobY + crouchDown);
    ctx.lineTo(0 + bobX + capeSwing * 0.5, 68 + bobY + crouchDown);
    ctx.lineTo(-26 + bobX - capeSwing, 64 + bobY + crouchDown);
    ctx.closePath();
    ctx.fill();

    // Cape golden filigree embroidery / folds
    ctx.strokeStyle = hero.themeColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-10 + bobX, -4 + bobY + crouchDown);
    ctx.lineTo(0 + bobX + capeSwing * 0.3, 35 + bobY + crouchDown);
    ctx.lineTo(10 + bobX, -4 + bobY + crouchDown);
    ctx.stroke();
    ctx.restore();

    // 5. HEAD & HAIR (Back of head with hair bun / braid / hood matching screenshot)
    ctx.save();
    if (hero.role === 'Male Hooded Rogue') {
      // Dark cowl / hood
      ctx.fillStyle = '#09090b';
      ctx.beginPath();
      ctx.arc(0 + bobX, -22 + bobY + crouchDown, 15, 0, Math.PI * 2);
      ctx.fill();
    } else if (hero.role === 'Female Red-Haired Warrior') {
      // Crimson hair tied in high bun/ponytail
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0 + bobX, -22 + bobY + crouchDown, 13, 0, Math.PI * 2);
      ctx.fill();
      // Bun at top
      ctx.beginPath();
      ctx.arc(0 + bobX, -34 + bobY + crouchDown, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (hero.role === 'Female Armored Paladin') {
      // Braided hair bun matching user's uploaded reference image!
      ctx.fillStyle = '#78350f'; // auburn / brunette hair
      ctx.beginPath();
      ctx.arc(0 + bobX, -22 + bobY + crouchDown, 14, 0, Math.PI * 2);
      ctx.fill();
      // Elegant braided bun at crown
      ctx.beginPath();
      ctx.arc(0 + bobX, -33 + bobY + crouchDown, 7.5, 0, Math.PI * 2);
      ctx.fill();
      // Hair pin
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-6 + bobX, -34 + bobY + crouchDown, 12, 2.5);
    } else {
      // Elven Archer Blonde Ponytail
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0 + bobX, -22 + bobY + crouchDown, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-3 + bobX, -16 + bobY + crouchDown, 6, 22);
    }
    ctx.restore();

    // 6. WEAPON IN HAND (Held at side pointing forward into the courtyard)
    ctx.save();
    const isSlashing = action === 'climts_slash' || action === 'katana_combo';
    const isHeavy = action === 'katana_combo';

    // Right arm & weapon
    ctx.translate(22 + bobX, 10 + bobY + crouchDown);

    if (action === 'block' || action === 'parry') {
      // Guard stance: holding shield / sword across chest
      ctx.rotate(-0.8);
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-6, -20, 12, 42); // raised blade / shield

      // Divine energy buckler arc
      ctx.strokeStyle = action === 'parry' ? '#38bdf8' : '#fbbf24';
      ctx.lineWidth = action === 'parry' ? 4 : 3;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(0, 0, 32, -0.6 * Math.PI, 0.6 * Math.PI);
      ctx.stroke();
    } else if (isSlashing) {
      // Forward Slash Arc Swing
      const slashAngle = isHeavy ? (Math.sin(frameTime * 22) * 1.6) : (Math.sin(frameTime * 26) * 1.2);
      ctx.rotate(slashAngle);

      // Glowing blade
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = hero.themeColor;
      ctx.shadowBlur = isHeavy ? 32 : 18;
      ctx.fillRect(-3, -65, 6, 75); // long blade pointing forward/up
      // Crossguard
      ctx.fillStyle = hero.themeColor;
      ctx.fillRect(-10, 8, 20, 5);
    } else if (action === 'cast_magic') {
      // Raised hands channeling magic rune sigil
      ctx.rotate(-1.2);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-2, -40, 4, 45);

      // Magic sigil in front of player
      ctx.strokeStyle = '#c084fc';
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 24;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, -42, 28 + Math.sin(frameTime * 14) * 4, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // Normal stance: sword held casually at 45 degree angle pointing down/forward
      // Exactly matching the character in the screenshot!
      ctx.rotate(0.65 + armSwing * 0.02);

      // Silver Steel Longsword
      ctx.fillStyle = '#e2e8f0';
      ctx.shadowColor = isSunMode ? 'rgba(255, 255, 255, 0.5)' : hero.themeColor;
      ctx.shadowBlur = specialActive ? 22 : 6;
      ctx.fillRect(-2, 0, 4, 58); // blade

      // Crossguard and pommel
      ctx.fillStyle = '#64748b';
      ctx.fillRect(-8, 0, 16, 4);
      ctx.fillStyle = '#334155';
      ctx.fillRect(-2, -8, 4, 8); // hilt
      ctx.fillStyle = hero.themeColor;
      ctx.fillRect(-3, -11, 6, 3); // pommel
    }
    ctx.restore();

    ctx.restore();
  },

  /**
   * 3D Projected Demon Renderer (100% Guaranteed Crisp Visibility & 16-Bit Pixel Sprites)
   * Renders bright, authentic 16-bit arcade demons with vivid telegraphs and visible attacks!
   */
  drawDemon3D(
    ctx: CanvasRenderingContext2D,
    enemy: SlashEnemy,
    playerX: number,
    playerZ: number,
    centerX: number,
    horizonY: number,
    frameTime: number,
    spriteImg?: HTMLImageElement | null,
    isPrimaryFocus: boolean = true
  ) {
    // 3D Depth relative to player
    const relZ = enemy.z - playerZ;
    // Allow enemies slightly beside/behind or in front up to huge playground range
    if (relZ < -80 || relZ > 2500) return;

    // Perspective projection formula
    const fov = 440;
    const clampedZ = Math.max(25, relZ + 180);
    const projScale = fov / clampedZ;
    const screenX = centerX + (enemy.x - playerX) * projScale;
    const screenY = horizonY + (enemy.y) * projScale;

    // Dynamic sizing based on distance
    const drawW = Math.max(28, enemy.width * projScale * 2.3);
    const drawH = Math.max(38, enemy.height * projScale * 2.3);

    ctx.save();
    ctx.translate(screenX, screenY);

    // 1. Solid High-Contrast Ground Contact Shadow
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    const shadowRx = Math.max(1, Math.abs(drawW * 0.5));
    const shadowRy = Math.max(1, Math.abs(drawW * 0.2));
    ctx.ellipse(0, drawH * 0.48, shadowRx, shadowRy, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. VIVID DANGER ATTACK TELEGRAPH ON GROUND (Bright Blinking Red/Orange Pulsing Ring)
    if (enemy.attackWindup > 0) {
      const chargeProgress = Math.max(0.01, Math.min(1, 1 - (enemy.attackWindup / (enemy.isBoss ? 0.7 : 0.55))));
      ctx.save();
      // Outer Warning Ring
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = Math.max(2.5, 4 * projScale);
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      const teleRx = Math.max(2, Math.abs(drawW * 1.1));
      const teleRy = Math.max(1, Math.abs(drawW * 0.42));
      ctx.ellipse(0, drawH * 0.48, teleRx, teleRy, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Expanding Danger Fill
      ctx.fillStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.beginPath();
      const fillRx = Math.max(1, teleRx * chargeProgress);
      const fillRy = Math.max(1, teleRy * chargeProgress);
      ctx.ellipse(0, drawH * 0.48, fillRx, fillRy, 0, 0, Math.PI * 2);
      ctx.fill();

      // Floating Warning Exclamation Mark (!)
      ctx.font = 'bold 16px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = Math.floor(frameTime * 20) % 2 === 0 ? '#fde047' : '#ef4444';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 14;
      ctx.fillText('!', 0, -drawH * 0.55);
      ctx.restore();
    }

    // 3. RENDER THE AUTHENTIC DEMON PIXEL ARTWORK SPRITE
    // First try the actual character image asset with chroma-keying
    const demonImg = spriteImg || (enemy.spriteSrc ? getInternalImg(enemy.spriteSrc) : null);
    const cleanDemonCanvas = demonImg ? getTransparentPixelSprite(demonImg, 30) : null;

    if (cleanDemonCanvas) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;

      // Authentic retro hit flash or vivid saturated demon contrast
      if (enemy.hitStunTimer > 0) {
        ctx.filter = 'brightness(5) contrast(3) saturate(0)';
      } else {
        ctx.filter = 'brightness(1.2) contrast(1.25) saturate(1.35)';
      }

      // Draw the authentic pixel art demon
      ctx.drawImage(cleanDemonCanvas, -drawW / 2, -drawH / 2, drawW, drawH);

      // Glowing aura around boss demons
      if (enemy.isBoss) {
        ctx.strokeStyle = '#f43f5e';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#f43f5e';
        ctx.shadowBlur = 18;
      }
      ctx.restore();
    } else if (demonImg && demonImg.complete && demonImg.naturalWidth > 0) {
      // Draw loaded image directly if offscreen canvas chroma-keying is processing
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      if (enemy.hitStunTimer > 0) {
        ctx.filter = 'brightness(5) contrast(3) saturate(0)';
      } else {
        ctx.filter = 'brightness(1.2) contrast(1.25) saturate(1.35)';
      }
      ctx.drawImage(demonImg, -drawW / 2, -drawH / 2, drawW, drawH);
      ctx.restore();
    } else {
      // High-detail 16-bit arcade fallback only if image is not yet loaded
      PixelDemonRenderer.drawProceduralDemon(
        ctx,
        enemy.type,
        drawW,
        drawH,
        frameTime,
        enemy.attackWindup > 0 || enemy.isAttacking,
        enemy.hitStunTimer > 0,
        !!enemy.isBoss
      );
    }

    // 3b. VIVID ATTACK SWING VISUALS (Visible Demon Claws / Red Slash Trails when attacking)
    if (enemy.attackWindup > 0 && enemy.attackWindup < 0.22) {
      ctx.save();
      ctx.strokeStyle = enemy.isBoss ? '#f43f5e' : '#f97316';
      ctx.lineWidth = Math.max(3, 5 * projScale);
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      // Large sweeping red blade arc across screen
      ctx.arc(0, 0, drawW * 0.75, -0.7 * Math.PI, 0.2 * Math.PI);
      ctx.stroke();
      ctx.restore();
    }

    // 4. Stepped 16-Bit Floating Health Bar & Distance Label
    const barW = Math.max(42, (enemy.isBoss ? 140 : 64) * projScale);
    const barH = Math.max(5, 7 * projScale);
    const hpPct = Math.max(0, enemy.hp / enemy.maxHp);

    // Pixel outer frame
    ctx.fillStyle = '#020617';
    ctx.fillRect(-barW / 2 - 2, -drawH / 2 - 18 * projScale - 2, barW + 4, barH + 4);
    // Dark base
    ctx.fillStyle = '#1e1b4b';
    ctx.fillRect(-barW / 2, -drawH / 2 - 18 * projScale, barW, barH);
    // Glowing Bright Bar (Crimson for regular demons, Gold/Red for boss)
    ctx.fillStyle = enemy.isBoss ? '#f43f5e' : '#10b981';
    ctx.fillRect(-barW / 2, -drawH / 2 - 18 * projScale, barW * hpPct, barH);
    // Highlight reflection
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.fillRect(-barW / 2, -drawH / 2 - 18 * projScale, barW * hpPct, Math.max(1, barH * 0.35));

    // Threat Name Tag in Crisp Retro Font
    if (projScale > 0.28) {
      const fontSize = Math.max(7, Math.floor(9 * projScale));
      ctx.font = `${fontSize}px "Press Start 2P", monospace`;
      ctx.textAlign = 'center';
      const distM = Math.max(1, Math.round(relZ / 18));
      const label = enemy.attackWindup > 0 ? `! CHARGING [${distM}m]` : `${enemy.name.split(' ')[0]} [${distM}m]`;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2.5;
      ctx.strokeText(label, 0, -drawH / 2 - 24 * projScale);
      ctx.fillStyle = enemy.attackWindup > 0 ? '#f43f5e' : (enemy.isBoss ? '#fde047' : '#ffffff');
      ctx.fillText(label, 0, -drawH / 2 - 24 * projScale);
    }

    ctx.restore();
  },

  /**
   * Draw 3D Adventure Landmarks (Ancient Shrines, Treasure Chests, Torii Gates)
   * Populates the wide open playground with interactive exploration targets!
   */
  drawAdventureLandmarks3D(
    ctx: CanvasRenderingContext2D,
    landmarks: AdventureLandmark[],
    playerX: number,
    playerZ: number,
    centerX: number,
    horizonY: number,
    frameTime: number
  ) {
    landmarks.forEach((mark) => {
      const relZ = mark.z - playerZ;
      if (relZ < 20 || relZ > 3200) return;

      const fov = 440;
      const projScale = fov / (relZ + 180);
      const screenX = centerX + (mark.x - playerX) * projScale;
      const screenY = horizonY + (30) * projScale;

      ctx.save();
      ctx.translate(screenX, screenY);

      if (mark.type === 'shrine') {
        const sw = 50 * projScale;
        const sh = 70 * projScale;

        // Ground stone pedestal
        ctx.fillStyle = '#334155';
        ctx.fillRect(-sw * 0.6, -sh * 0.1, sw * 1.2, sh * 0.2);

        // Shrine Torii Roof
        ctx.fillStyle = mark.activated ? '#64748b' : '#dc2626';
        ctx.fillRect(-sw * 0.7, -sh * 0.8, sw * 1.4, sh * 0.15);
        ctx.fillRect(-sw * 0.8, -sh * 0.95, sw * 1.6, sh * 0.12);

        // Pillars
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(-sw * 0.45, -sh * 0.65, sw * 0.18, sh * 0.6);
        ctx.fillRect(sw * 0.27, -sh * 0.65, sw * 0.18, sh * 0.6);

        // Floating Sacred Orb (Pulsing Light)
        if (!mark.activated) {
          const orbGlow = Math.sin(frameTime * 6) * 4;
          ctx.fillStyle = '#38bdf8';
          ctx.shadowColor = '#0284c7';
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(0, -sh * 0.35 + orbGlow, 8 * projScale, 0, Math.PI * 2);
          ctx.fill();
        }

        // Shrine Label
        if (projScale > 0.25) {
          ctx.font = `${Math.max(7, Math.floor(8 * projScale))}px "Press Start 2P", monospace`;
          ctx.textAlign = 'center';
          ctx.fillStyle = mark.activated ? '#94a3b8' : '#38bdf8';
          ctx.shadowColor = '#000000';
          ctx.shadowBlur = 8;
          ctx.fillText(mark.activated ? '[PURIFIED]' : 'SACRED SHRINE', 0, -sh * 1.05);
        }
      } else if (mark.type === 'chest') {
        const cw = 44 * projScale;
        const ch = 34 * projScale;

        // Chest Body
        ctx.fillStyle = mark.activated ? '#3f3f46' : '#b45309';
        ctx.fillRect(-cw * 0.5, -ch * 0.7, cw, ch * 0.7);

        // Gold Trim & Lock
        ctx.fillStyle = mark.activated ? '#71717a' : '#f59e0b';
        ctx.fillRect(-cw * 0.5, -ch * 0.7, cw, ch * 0.18);
        ctx.fillRect(-cw * 0.1, -ch * 0.45, cw * 0.2, ch * 0.2);

        if (!mark.activated) {
          ctx.font = `${Math.max(6, Math.floor(7 * projScale))}px "Press Start 2P", monospace`;
          ctx.textAlign = 'center';
          ctx.fillStyle = '#fde047';
          ctx.fillText('SOUL CHEST', 0, -ch * 0.9);
        }
      }

      ctx.restore();
    });
  },

  /**
   * Ornate Circular Radar Minimap (Top-Right of screen, matching user's image)
   * Displays the player's forward orientation cone and approaching enemy threat markers!
   */
  drawOrnateRadar(
    ctx: CanvasRenderingContext2D,
    radarX: number,
    radarY: number,
    radius: number,
    playerX: number,
    playerZ: number,
    enemies: SlashEnemy[],
    frameTime: number,
    isSunMode: boolean,
    landmarks?: AdventureLandmark[],
    playerRotation: number = 0
  ) {
    ctx.save();
    ctx.translate(radarX, radarY);

    // 1. Ornate Metallic Outer Frame & Bezel
    const bezelGrad = ctx.createLinearGradient(-radius, -radius, radius, radius);
    bezelGrad.addColorStop(0, '#78716c');
    bezelGrad.addColorStop(0.3, '#d6d3d1');
    bezelGrad.addColorStop(0.7, '#44403c');
    bezelGrad.addColorStop(1, '#1c1917');

    ctx.fillStyle = bezelGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius + 6, 0, Math.PI * 2);
    ctx.fill();

    // 2. Radar Glass Dome
    const glassGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    if (isSunMode) {
      glassGrad.addColorStop(0, 'rgba(240, 249, 255, 0.95)');
      glassGrad.addColorStop(0.85, 'rgba(219, 234, 254, 0.92)');
      glassGrad.addColorStop(1, 'rgba(147, 197, 253, 0.9)');
    } else {
      glassGrad.addColorStop(0, 'rgba(15, 23, 42, 0.95)');
      glassGrad.addColorStop(0.85, 'rgba(10, 15, 30, 0.94)');
      glassGrad.addColorStop(1, 'rgba(2, 6, 23, 0.96)');
    }

    ctx.fillStyle = glassGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = isSunMode ? '#0284c7' : '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 3. Fortress Courtyard Map Architecture (Etched cobblestone layout matching screenshot)
    ctx.save();
    ctx.strokeStyle = isSunMode ? 'rgba(2, 132, 199, 0.22)' : 'rgba(56, 189, 248, 0.22)';
    ctx.lineWidth = 1;

    // Concentric range rings
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
    ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
    // Courtyard street & building blocks
    ctx.strokeRect(-radius * 0.6, -radius * 0.7, radius * 0.35, radius * 0.4);
    ctx.strokeRect(radius * 0.25, -radius * 0.7, radius * 0.35, radius * 0.4);
    ctx.strokeRect(-radius * 0.7, radius * 0.2, radius * 0.35, radius * 0.4);
    ctx.strokeRect(radius * 0.3, radius * 0.2, radius * 0.4, radius * 0.4);
    // Central fountain circle
    ctx.arc(0, -radius * 0.1, radius * 0.15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 4. Radar Sweep Scanner Beam
    const sweepAngle = (frameTime * 2.4) % (Math.PI * 2);
    const sweepGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    sweepGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
    sweepGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius - 2, sweepAngle - 0.45, sweepAngle);
    ctx.closePath();
    ctx.fillStyle = sweepGrad;
    ctx.fill();
    ctx.restore();

    // 5. Player Position & Dynamic Heading Vision Cone (Rotates with 360 player movement)
    ctx.save();
    ctx.rotate(playerRotation);

    // Vision cone
    ctx.fillStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius * 0.65, -0.65 * Math.PI, -0.35 * Math.PI);
    ctx.closePath();
    ctx.fill();

    // Cyan Player Icon (Arrow pointing in player's forward heading direction)
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(6, 6);
    ctx.lineTo(0, 2);
    ctx.lineTo(-6, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 6. Approaching Demon Threat Blips
    const maxWorldRange = 900; // max distance shown on radar
    enemies.forEach((enemy) => {
      if (enemy.hp <= 0) return;
      const dx = enemy.x - playerX;
      const dz = enemy.z - playerZ; // forward distance (dz > 0 is in front of player, so -Y on radar)

      const normX = dx / maxWorldRange;
      const normY = -dz / maxWorldRange; // negative Y is forward on 2D map

      const distFromCenter = Math.sqrt(normX * normX + normY * normY);
      if (distFromCenter > 0.95) return; // out of radar boundary

      const blipX = normX * radius * 0.9;
      const blipY = normY * radius * 0.9;

      // Warning pulse if charging attack
      if (enemy.attackWindup > 0) {
        ctx.save();
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        const pulseR = 5 + Math.sin(frameTime * 18) * 3;
        ctx.beginPath();
        ctx.arc(blipX, blipY, pulseR, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // Blip Icon
      ctx.save();
      ctx.fillStyle = enemy.isBoss ? '#f43f5e' : (enemy.attackWindup > 0 ? '#f97316' : '#ef4444');
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = enemy.isBoss ? 12 : 6;

      ctx.beginPath();
      if (enemy.isBoss) {
        // Boss Skull / Diamond
        ctx.moveTo(blipX, blipY - 5);
        ctx.lineTo(blipX + 5, blipY);
        ctx.lineTo(blipX, blipY + 5);
        ctx.lineTo(blipX - 5, blipY);
        ctx.closePath();
      } else {
        ctx.arc(blipX, blipY, 3.5, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.restore();
    });

    // 6b. Adventure Landmarks (Shrines & Chests on Radar)
    if (landmarks) {
      landmarks.forEach((mark) => {
        const dx = mark.x - playerX;
        const dz = mark.z - playerZ;
        const normX = dx / maxWorldRange;
        const normY = -dz / maxWorldRange;
        const dist = Math.sqrt(normX * normX + normY * normY);
        if (dist > 0.95) return;

        const bx = normX * radius * 0.9;
        const by = normY * radius * 0.9;

        ctx.save();
        if (mark.type === 'shrine') {
          ctx.fillStyle = mark.activated ? '#64748b' : '#38bdf8';
          ctx.shadowColor = '#0284c7';
          ctx.shadowBlur = 8;
          ctx.fillRect(bx - 3, by - 3, 6, 6);
        } else if (mark.type === 'chest') {
          ctx.fillStyle = mark.activated ? '#52525b' : '#f59e0b';
          ctx.fillRect(bx - 2.5, by - 2.5, 5, 5);
        }
        ctx.restore();
      });
    }

    // 7. Compass Headings (N at top, E, S, W)
    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = isSunMode ? '#0369a1' : '#7dd3fc';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('N', 0, -radius + 10);
    ctx.fillText('S', 0, radius - 10);
    ctx.fillText('E', radius - 10, 0);
    ctx.fillText('W', -radius + 10, 0);

    ctx.restore();
  },

  /**
   * 3D Perspective Courtyard Floor with custom Material/FloorStyle
   * Renders stone pavers receding toward the vanishing point, creating depth!
   */
  draw3DCourtyardGround(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    horizonY: number,
    playerX: number,
    playerZ: number,
    isSunMode: boolean,
    floorStyle: FloorStyle = 'imperial_flagstone'
  ) {
    ctx.save();

    // 1. Draw True 32-Bit Pixel Art Cobblestone Texture with Perspective Mapping
    const cobbleImg = getInternalImg('/assets/images/pixel_cobble_floor_1790259313506.jpg');
    if (cobbleImg && cobbleImg.complete && cobbleImg.naturalWidth > 0) {
      const groundDepth = height - horizonY;
      const numBands = 22;
      for (let i = 0; i < numBands; i++) {
        const f1 = Math.pow(i / numBands, 2.2);
        const f2 = Math.pow((i + 1) / numBands, 2.2);
        const y1 = horizonY + f1 * groundDepth;
        const y2 = horizonY + f2 * groundDepth;
        const bandH = Math.max(1, y2 - y1);
        const srcY = Math.floor((playerZ * 0.4 + i * 24) % Math.max(20, cobbleImg.naturalHeight - 20));
        // Horizontal offset based on playerX for lateral ground traction
        const texShiftX = (playerX * 0.35) % (width * 0.5);

        ctx.save();
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          cobbleImg,
          0,
          Math.max(0, srcY),
          cobbleImg.naturalWidth,
          18,
          -texShiftX - 20,
          y1,
          width + Math.abs(texShiftX) * 2 + 40,
          bandH + 1.5
        );
        ctx.restore();
      }

      // Atmospheric color wash & distance fog
      const depthGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      if (floorStyle === 'cracked_bloodstone') {
        depthGrad.addColorStop(0, 'rgba(76, 5, 25, 0.7)');
        depthGrad.addColorStop(0.4, 'rgba(30, 2, 9, 0.4)');
        depthGrad.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
      } else if (floorStyle === 'golden_marble') {
        depthGrad.addColorStop(0, 'rgba(180, 83, 9, 0.65)');
        depthGrad.addColorStop(0.4, 'rgba(69, 26, 3, 0.35)');
        depthGrad.addColorStop(1, 'rgba(0, 0, 0, 0.1)');
      } else if (floorStyle === 'obsidian_ruins') {
        depthGrad.addColorStop(0, 'rgba(10, 10, 15, 0.85)');
        depthGrad.addColorStop(0.4, 'rgba(24, 24, 27, 0.4)');
        depthGrad.addColorStop(1, 'rgba(0, 0, 0, 0.15)');
      } else if (isSunMode) {
        depthGrad.addColorStop(0, 'rgba(71, 85, 105, 0.65)');
        depthGrad.addColorStop(0.35, 'rgba(51, 65, 85, 0.3)');
        depthGrad.addColorStop(1, 'rgba(15, 23, 42, 0.1)');
      } else {
        depthGrad.addColorStop(0, 'rgba(15, 23, 42, 0.85)');
        depthGrad.addColorStop(0.4, 'rgba(30, 41, 59, 0.45)');
        depthGrad.addColorStop(1, 'rgba(0, 0, 0, 0.2)');
      }
      ctx.fillStyle = depthGrad;
      ctx.fillRect(0, horizonY, width, height - horizonY);
    } else {
      // Procedural Base ground gradient based on floor material
      const groundGrad = ctx.createLinearGradient(0, horizonY, 0, height);
      if (floorStyle === 'cracked_bloodstone') {
        groundGrad.addColorStop(0, '#2d060e');
        groundGrad.addColorStop(0.4, '#4c0519');
        groundGrad.addColorStop(1, '#1e0209');
      } else if (floorStyle === 'obsidian_ruins') {
        groundGrad.addColorStop(0, '#0a0a0f');
        groundGrad.addColorStop(0.4, '#18181b');
        groundGrad.addColorStop(1, '#09090b');
      } else if (floorStyle === 'golden_marble') {
        groundGrad.addColorStop(0, '#78350f');
        groundGrad.addColorStop(0.4, '#b45309');
        groundGrad.addColorStop(1, '#451a03');
      } else if (isSunMode) {
        groundGrad.addColorStop(0, '#64748b'); // distant stone mist
        groundGrad.addColorStop(0.3, '#475569');
        groundGrad.addColorStop(1, '#334155'); // foreground warm cobblestone
      } else {
        groundGrad.addColorStop(0, '#0f172a');
        groundGrad.addColorStop(0.4, '#1e293b');
        groundGrad.addColorStop(1, '#090d16');
      }
      ctx.fillStyle = groundGrad;
      ctx.fillRect(0, horizonY, width, height - horizonY);
    }

    // Vanishing Point Grid Lines (Cobblestones stretching forward)
    const centerX = width / 2;
    // Vanish X tracks player strafe smoothly to create real camera parallax
    const vanishX = centerX - (playerX * 0.15);
    const vanishY = horizonY;

    let strokeColor = isSunMode ? 'rgba(255, 255, 255, 0.18)' : 'rgba(56, 189, 248, 0.14)';
    if (floorStyle === 'cracked_bloodstone') strokeColor = 'rgba(244, 63, 94, 0.28)';
    if (floorStyle === 'golden_marble') strokeColor = 'rgba(251, 191, 36, 0.28)';
    if (floorStyle === 'obsidian_ruins') strokeColor = 'rgba(168, 85, 247, 0.22)';

    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 1.2;

    // Longitudinal perspective rays that shift with playerX so you feel sideways strafe movement
    const strafeShift = (playerX * 0.7) % 100;
    for (let x = -width * 0.8; x <= width * 1.8; x += 90) {
      const targetX = x - strafeShift;
      const startX = vanishX + (targetX - vanishX) * 0.04;
      ctx.beginPath();
      ctx.moveTo(startX, vanishY);
      ctx.lineTo(targetX, height);
      ctx.stroke();
    }

    // Transverse cobblestone lines scrolling forward seamlessly with playerZ
    const groundDepth = height - horizonY;
    const scrollStep = 90;
    const zOffset = ((playerZ % scrollStep) + scrollStep) % scrollStep;

    const numTransverse = 18;
    for (let i = 1; i <= numTransverse; i++) {
      // Perspective compression formula: lines spread out as they approach the camera
      const baseDist = i * scrollStep - zOffset;
      if (baseDist <= 10) continue;
      const proj = 440 / (baseDist + 140);
      const lineY = horizonY + groundDepth * Math.min(1.0, Math.pow(proj * 0.95, 0.95));

      if (lineY >= horizonY && lineY <= height) {
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = Math.max(1, 2.5 * proj);
        ctx.beginPath();
        ctx.moveTo(0, lineY);
        ctx.lineTo(width, lineY);
        ctx.stroke();

        // High-speed cobblestone pavers pattern
        for (let bx = -width * 0.2; bx < width * 1.2; bx += 140) {
          const paverX = bx - strafeShift + (i % 2 === 0 ? 45 : 0);
          const paverW = Math.max(8, 28 * proj);
          ctx.fillStyle = isSunMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(56, 189, 248, 0.06)';
          ctx.fillRect(paverX, lineY - 2, paverW, Math.max(2, 4 * proj));
        }
      }
    }

    ctx.restore();
  },

  /**
   * Professional Game Builder 3D Spatial Grid Overlay
   * Visualizes world units and coordinate tiles for map builders
   */
  draw3DGridOverlay(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    horizonY: number,
    playerX: number,
    playerZ: number
  ) {
    ctx.save();
    const centerX = width * 0.5;
    const vanishX = centerX - (playerX * 0.12);
    const groundDepth = height - horizonY;

    // Cyan / Amber wireframe grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.28)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 4]);

    for (let x = -width; x <= width * 2; x += 75) {
      const startX = vanishX + (x - vanishX) * 0.05;
      ctx.beginPath();
      ctx.moveTo(startX, horizonY);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let i = 1; i <= 20; i++) {
      const factor = Math.pow(i / 20, 2.1);
      const lineY = horizonY + factor * groundDepth;
      ctx.beginPath();
      ctx.moveTo(0, lineY);
      ctx.lineTo(width, lineY);
      ctx.stroke();
    }

    ctx.setLineDash([]);
    ctx.restore();
  },

  /**
   * Professional Game Builder Hitbox & Hurtbox 3D Wireframe Visualizer
   * Red = Active Strike Hitbox | Green = Hurtbox | Yellow = Telegraph Danger Volume | Blue = AI Vector
   */
  draw3DHitboxWireframes(
    ctx: CanvasRenderingContext2D,
    player: RoninPlayer,
    enemies: SlashEnemy[],
    width: number,
    height: number,
    horizonY: number,
    centerX: number,
    showAiRays: boolean
  ) {
    ctx.save();

    // 1. Player Hurtbox Cylinder (Emerald Green Wireframe)
    const heroScreenX = centerX - 60;
    const heroScreenY = height * 0.72;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([3, 2]);

    // Bounding cylinder for hero
    ctx.beginPath();
    ctx.ellipse(heroScreenX, heroScreenY + 68, 36, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(heroScreenX, heroScreenY - 30, 36, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(heroScreenX - 36, heroScreenY - 30);
    ctx.lineTo(heroScreenX - 36, heroScreenY + 68);
    ctx.moveTo(heroScreenX + 36, heroScreenY - 30);
    ctx.lineTo(heroScreenX + 36, heroScreenY + 68);
    ctx.stroke();

    // Hero Weapon Strike Hitbox (Active Red Volume when attacking)
    if (player.isAttacking || player.attackHitboxTimer > 0) {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.22)';
      ctx.strokeStyle = '#ef4444';
      ctx.setLineDash([]);
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.ellipse(heroScreenX + 15, heroScreenY + 20, 75, 40, 0, -Math.PI * 0.75, Math.PI * 0.75);
      ctx.stroke();
      ctx.fill();

      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = '#ef4444';
      ctx.fillText('STRIKE HITBOX [ACTIVE]', heroScreenX - 25, heroScreenY - 45);
    }

    // 2. Enemy 3D Hurtboxes & Telegraph Hazard Cones
    enemies.forEach((enemy) => {
      if (enemy.hp <= 0) return;
      const relZ = enemy.z - player.z;
      if (relZ <= -50) return;

      const projScale = 400 / (relZ + 180);
      const drawW = Math.max(25, enemy.width * projScale * 1.5);
      const drawH = Math.max(35, enemy.height * projScale * 1.5);
      const screenX = centerX + (enemy.x - player.x) * projScale;
      const screenY = horizonY + enemy.y * projScale;

      // Enemy Hurtbox Box
      ctx.strokeStyle = enemy.isBoss ? '#f43f5e' : '#eab308';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 2]);
      ctx.strokeRect(screenX - drawW / 2, screenY - drawH / 2, drawW, drawH);

      // Label with coordinates
      ctx.font = '9px monospace';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`ID:${enemy.id.slice(-4)} | Z:${Math.round(relZ)}`, screenX - drawW / 2, screenY - drawH / 2 - 4);

      // AI Aggro Ray & Distance Marker
      if (showAiRays) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.setLineDash([2, 4]);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(heroScreenX, heroScreenY);
        ctx.lineTo(screenX, screenY);
        ctx.stroke();
      }

      // Attack Danger Volume (when winding up)
      if (enemy.attackWindup > 0) {
        ctx.strokeStyle = '#dc2626';
        ctx.fillStyle = 'rgba(220, 38, 38, 0.3)';
        ctx.setLineDash([]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(screenX, screenY + drawH * 0.45, drawW * 1.2, drawW * 0.4, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fill();
      }
    });

    ctx.setLineDash([]);
    ctx.restore();
  },

  /**
   * 3D Perspective Gothic Stone Pillars with Animated Flickering Pixel Torches
   * Line the left and right sides of the courtyard, creating a breathtaking dark fantasy atmosphere!
   */
  drawCourtyardTorches(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    horizonY: number,
    playerX: number,
    playerZ: number,
    frameTime: number,
    isSunMode: boolean
  ) {
    const centerX = width / 2;
    // World fixed pillar positions spaced every 240 units along the courtyard depth
    // Spans from Z = -200 to Z = 3200 in world coordinates!
    const pillarSpacing = 280;
    const startPillarIndex = Math.floor((playerZ - 100) / pillarSpacing);
    const endPillarIndex = startPillarIndex + 8;
    const sideOffset = 420; // distance from center path

    for (let i = startPillarIndex; i <= endPillarIndex; i++) {
      const worldZ = i * pillarSpacing;
      const relZ = worldZ - playerZ;
      if (relZ <= 25 || relZ > 1800) continue;
      const projScale = 420 / (relZ + 180);

      [-1, 1].forEach((side) => {
        const pillarWorldX = side * sideOffset - playerX;
        const screenX = centerX + pillarWorldX * projScale;
        const groundY = horizonY + (height - horizonY) * Math.pow(projScale * 0.9, 0.9);
        const pillarW = Math.max(12, 42 * projScale);
        const pillarH = Math.max(30, 160 * projScale);
        const screenY = groundY - pillarH;

        ctx.save();
        ctx.imageSmoothingEnabled = false;

        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.beginPath();
        ctx.ellipse(screenX, groundY, pillarW * 0.8, pillarW * 0.25, 0, 0, Math.PI * 2);
        ctx.fill();

        // Stone Pillar (layered pixel stone blocks)
        ctx.fillStyle = isSunMode ? '#475569' : '#1e293b';
        ctx.fillRect(screenX - pillarW / 2, screenY, pillarW, pillarH);

        // Stone highlight & shadow
        ctx.fillStyle = isSunMode ? '#64748b' : '#334155';
        ctx.fillRect(screenX - pillarW / 2, screenY, pillarW * 0.25, pillarH);
        ctx.fillStyle = isSunMode ? '#334155' : '#0f172a';
        ctx.fillRect(screenX + pillarW * 0.25, screenY, pillarW * 0.25, pillarH);

        // Capital / Brazer bowl on top
        const bowlW = pillarW * 1.35;
        const bowlH = pillarW * 0.45;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(screenX - bowlW / 2, screenY - bowlH, bowlW, bowlH);

        // Iron sconce rim
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(screenX - bowlW / 2, screenY - bowlH, bowlW, Math.max(1, 2 * projScale));

        // Animated 8-bit flickering pixel flame
        const flameSeed = frameTime * 18 + i * 3 + side;
        const flameHeight = Math.max(8, 28 * projScale * (0.85 + Math.sin(flameSeed) * 0.25));
        const flameW = Math.max(5, 16 * projScale);
        const flameTopY = screenY - bowlH - flameHeight;

        // Warm radial torch glow on ground and pillar
        const glowR = Math.max(15, 65 * projScale);
        const torchGlow = ctx.createRadialGradient(screenX, screenY - bowlH, 0, screenX, screenY - bowlH, glowR);
        torchGlow.addColorStop(0, isSunMode ? 'rgba(251, 191, 36, 0.4)' : 'rgba(239, 68, 68, 0.55)');
        torchGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = torchGlow;
        ctx.beginPath();
        ctx.arc(screenX, screenY - bowlH, glowR, 0, Math.PI * 2);
        ctx.fill();

        // 8-bit pixel flame layers (Crimson base -> Orange body -> Yellow core -> White tip)
        const fx = screenX;
        const fy = screenY - bowlH;
        // Red base
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(fx - flameW * 0.5, fy - flameHeight * 0.5, flameW, flameHeight * 0.5);
        // Orange middle
        ctx.fillStyle = '#f97316';
        ctx.fillRect(fx - flameW * 0.35, fy - flameHeight * 0.8, flameW * 0.7, flameHeight * 0.6);
        // Yellow core
        ctx.fillStyle = '#fde047';
        ctx.fillRect(fx - flameW * 0.2, fy - flameHeight, flameW * 0.4, flameHeight * 0.7);
        // White flickering tip
        ctx.fillStyle = '#ffffff';
        const tipW = Math.max(1, 3 * projScale);
        ctx.fillRect(fx - tipW / 2 + Math.sin(flameSeed * 1.5) * (2 * projScale), flameTopY, tipW, Math.max(2, 4 * projScale));

        ctx.restore();
      });
    }
  },

  /**
   * Square 16-Bit Pixel Hit Sparks and Blood/Ember Bursts
   */
  drawPixelHitSparks(
    ctx: CanvasRenderingContext2D,
    sparks: { x: number; y: number; vx: number; vy: number; color: string; size: number; life: number; maxLife: number }[]
  ) {
    ctx.save();
    sparks.forEach((spark) => {
      const alpha = Math.max(0, 1 - spark.life / spark.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = spark.color;
      // Authentic square pixel particle
      ctx.fillRect(Math.floor(spark.x), Math.floor(spark.y), Math.max(2, spark.size), Math.max(2, spark.size));
    });
    ctx.restore();
  },

  /**
   * Professional Gamer Builder Custom Reticle / Crosshair Renderer
   */
  drawCustomCrosshair(
    ctx: CanvasRenderingContext2D,
    centerX: number,
    centerY: number,
    style: CrosshairStyle = 'reticle',
    isTargetLocked: boolean = false
  ) {
    ctx.save();
    ctx.translate(centerX, centerY);

    const primaryColor = isTargetLocked ? '#ef4444' : '#ffffff';
    ctx.strokeStyle = primaryColor;
    ctx.fillStyle = primaryColor;
    ctx.shadowColor = primaryColor;
    ctx.shadowBlur = 8;

    if (style === 'dot') {
      ctx.beginPath();
      ctx.arc(0, 0, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (style === 'cross') {
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-10, 0); ctx.lineTo(-3, 0);
      ctx.moveTo(3, 0); ctx.lineTo(10, 0);
      ctx.moveTo(0, -10); ctx.lineTo(0, -3);
      ctx.moveTo(0, 3); ctx.lineTo(0, 10);
      ctx.stroke();
    } else if (style === 'souls') {
      // Souls-like lock-on ring
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (style === 'minimal') {
      ctx.beginPath();
      ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Default 'reticle' (Matching reference image)
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(0, -8); ctx.lineTo(0, -3);
      ctx.moveTo(0, 3); ctx.lineTo(0, 8);
      ctx.moveTo(-8, 0); ctx.lineTo(-3, 0);
      ctx.moveTo(3, 0); ctx.lineTo(8, 0);
      ctx.stroke();
    }

    ctx.restore();
  },

  /**
   * Gothic Sacrificial Shrine Ring with Glowing Red Arcane Aura on the Courtyard Floor
   * Centered in the middle of the fortress courtyard, creating that iconic blood-circle aesthetic!
   */
  drawSacrificialShrineRing(
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    horizonY: number,
    playerX: number,
    playerZ: number,
    frameTime: number
  ) {
    const centerX = width * 0.5;
    // World coordinates of the central sacrificial ring
    const shrineWorldX = 0;
    const shrineWorldZ = 340;
    const relZ = shrineWorldZ - playerZ;
    if (relZ < -60 || relZ > 2400) return;

    const projScale = 440 / (relZ + 180);
    const screenX = centerX + (shrineWorldX - playerX) * projScale;
    const groundY = horizonY + (height - horizonY) * Math.min(1.0, Math.pow(projScale * 0.95, 0.95));

    const baseRadiusX = 250 * projScale;
    const baseRadiusY = 78 * projScale; // Ground perspective ellipse flattening

    ctx.save();
    // 1. Pulsing Red Demonic Magical Floor Wash
    const pulse = Math.sin(frameTime * 4) * 0.08;
    const auraGrad = ctx.createRadialGradient(screenX, groundY, 0, screenX, groundY, baseRadiusX);
    auraGrad.addColorStop(0, `rgba(239, 68, 68, ${0.16 + pulse})`);
    auraGrad.addColorStop(0.7, `rgba(220, 38, 38, ${0.10 + pulse})`);
    auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = auraGrad;
    ctx.beginPath();
    ctx.ellipse(screenX, groundY, baseRadiusX * 1.15, baseRadiusY * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. Outermost Glowing Red Magical Border Aura
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = Math.max(2, 3.5 * projScale);
    ctx.shadowColor = '#dc2626';
    ctx.shadowBlur = 24;
    ctx.beginPath();
    ctx.ellipse(screenX, groundY, baseRadiusX, baseRadiusY, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Concentric Arcane Rings
    ctx.strokeStyle = 'rgba(248, 113, 113, 0.85)';
    ctx.lineWidth = Math.max(1.5, 2.5 * projScale);
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.ellipse(screenX, groundY, baseRadiusX * 0.82, baseRadiusY * 0.82, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Inner ring with fiery orange glow
    ctx.strokeStyle = '#f97316';
    ctx.lineWidth = Math.max(1.2, 2 * projScale);
    ctx.shadowColor = '#ea580c';
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.ellipse(screenX, groundY, baseRadiusX * 0.55, baseRadiusY * 0.55, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 4. Rotating Radial Rune Spokes between outer & middle ring
    const numSpokes = 16;
    const rotAngle = frameTime * 0.15;
    ctx.strokeStyle = 'rgba(252, 165, 165, 0.7)';
    ctx.lineWidth = Math.max(1, 1.8 * projScale);
    ctx.shadowBlur = 8;
    for (let i = 0; i < numSpokes; i++) {
      const angle = rotAngle + (i * Math.PI * 2) / numSpokes;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const p1x = screenX + cosA * (baseRadiusX * 0.82);
      const p1y = groundY + sinA * (baseRadiusY * 0.82);
      const p2x = screenX + cosA * baseRadiusX;
      const p2y = groundY + sinA * baseRadiusY;
      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.stroke();
    }

    // 5. Arcane Rune Glyphs / Triangles inside inner ring
    ctx.strokeStyle = 'rgba(254, 215, 170, 0.6)';
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = -rotAngle * 1.5 + (i * Math.PI * 2) / 3;
      const tx = screenX + Math.cos(a) * (baseRadiusX * 0.55);
      const ty = groundY + Math.sin(a) * (baseRadiusY * 0.55);
      if (i === 0) ctx.moveTo(tx, ty);
      else ctx.lineTo(tx, ty);
    }
    ctx.closePath();
    ctx.stroke();

    // 6. Floating Sacrificial Embers drifting up from the ring
    for (let i = 0; i < 6; i++) {
      const seed = frameTime * 30 + i * 50;
      const emberAngle = (i * Math.PI * 2) / 6 + Math.sin(seed * 0.05);
      const ex = screenX + Math.cos(emberAngle) * (baseRadiusX * 0.7);
      const ey = groundY + Math.sin(emberAngle) * (baseRadiusY * 0.7) - ((seed * 1.2) % 60) * projScale;
      ctx.fillStyle = i % 2 === 0 ? '#f43f5e' : '#fb923c';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 10;
      const sz = Math.max(2, 4 * projScale);
      ctx.fillRect(ex, ey, sz, sz);
    }

    ctx.restore();
  },

  /**
   * Massive Glowing Red Blood Moon in a Dark Night Gothic Skybox
   */
  drawBloodMoonSky(
    ctx: CanvasRenderingContext2D,
    width: number,
    horizonY: number,
    playerX: number,
    cameraPitch: number,
    frameTime: number
  ) {
    ctx.save();
    // 1. Deep Celestial Gothic Night Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, '#02020a'); // Abyssal night sky
    skyGrad.addColorStop(0.5, '#15051a'); // Dark cosmic purple-black
    skyGrad.addColorStop(0.85, '#2e040c'); // Deep bloodred mist
    skyGrad.addColorStop(1, '#4c0519'); // Crimson horizon glow
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, horizonY);

    // 2. Distant twinkling red & white stars
    const numStars = 45;
    for (let i = 0; i < numStars; i++) {
      const starX = ((i * 137.5 + playerX * 0.05) % width + width) % width;
      const starY = (i * 47) % (horizonY * 0.85);
      const twinkle = Math.sin(frameTime * 3 + i) * 0.4 + 0.6;
      ctx.fillStyle = i % 4 === 0 ? `rgba(244, 63, 94, ${twinkle * 0.7})` : `rgba(255, 255, 255, ${twinkle * 0.8})`;
      ctx.fillRect(starX, starY, i % 6 === 0 ? 2 : 1, i % 6 === 0 ? 2 : 1);
    }

    // 3. Massive Glowing Red Blood Moon
    // Positioned in sky with subtle parallax
    const moonX = width * 0.46 - (playerX * 0.06);
    const moonY = horizonY * 0.42 + (cameraPitch * 80);
    const moonR = Math.max(38, Math.min(65, width * 0.06));

    // A. Outer Vast Crimson Moonlight Corona
    const outerHalo = ctx.createRadialGradient(moonX, moonY, moonR * 0.8, moonX, moonY, moonR * 3.8);
    outerHalo.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
    outerHalo.addColorStop(0.4, 'rgba(220, 38, 38, 0.22)');
    outerHalo.addColorStop(0.75, 'rgba(153, 27, 27, 0.08)');
    outerHalo.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = outerHalo;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 3.8, 0, Math.PI * 2);
    ctx.fill();

    // B. Intense Inner Blood Halo
    const innerHalo = ctx.createRadialGradient(moonX, moonY, moonR * 0.5, moonX, moonY, moonR * 1.6);
    innerHalo.addColorStop(0, 'rgba(248, 113, 113, 0.7)');
    innerHalo.addColorStop(0.6, 'rgba(239, 68, 68, 0.4)');
    innerHalo.addColorStop(1, 'rgba(185, 28, 28, 0)');
    ctx.fillStyle = innerHalo;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR * 1.6, 0, Math.PI * 2);
    ctx.fill();

    // C. Blood Moon Celestial Body
    const moonDisc = ctx.createRadialGradient(moonX - moonR * 0.3, moonY - moonR * 0.3, 0, moonX, moonY, moonR);
    moonDisc.addColorStop(0, '#fca5a5'); // Glowing crimson light core
    moonDisc.addColorStop(0.35, '#ef4444'); // Vivid blood red
    moonDisc.addColorStop(0.75, '#b91c1c'); // Deep scarlet
    moonDisc.addColorStop(1, '#450a0a'); // Dark eclipsed shadow rim
    ctx.fillStyle = moonDisc;
    ctx.shadowColor = '#dc2626';
    ctx.shadowBlur = 35;
    ctx.beginPath();
    ctx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // D. Pixel-art Lunar Maria (Craters / Dark Blood Patches)
    ctx.fillStyle = 'rgba(69, 10, 10, 0.45)';
    ctx.beginPath();
    ctx.arc(moonX - moonR * 0.2, moonY - moonR * 0.15, moonR * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(moonX + moonR * 0.25, moonY + moonR * 0.2, moonR * 0.26, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(moonX - moonR * 0.1, moonY + moonR * 0.35, moonR * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 4. Gothic Castle Citadel Spires Silhouettes along Horizon
    const citadelY = horizonY;
    const panShift = -(playerX * 0.18);
    ctx.fillStyle = '#09030b';
    ctx.beginPath();
    ctx.moveTo(0, citadelY);
    const towerStep = 70;
    const startT = Math.floor((-panShift - 100) / towerStep);
    const endT = startT + Math.ceil(width / towerStep) + 3;
    for (let t = startT; t <= endT; t++) {
      const tx = t * towerStep + panShift;
      const th = 25 + Math.sin(t * 12.3) * 18 + ((t % 3 === 0) ? 35 : 0);
      ctx.lineTo(tx, citadelY - th);
      // Spire peak
      ctx.lineTo(tx + 8, citadelY - th - 18);
      ctx.lineTo(tx + 16, citadelY - th);
      ctx.lineTo(tx + towerStep, citadelY);
    }
    ctx.lineTo(width, citadelY);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  },
};

