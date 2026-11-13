import * as THREE from 'three';
import { SlashEnemy, RoninPlayer, Projectile3D, AdventureLandmark } from '../types/ronin';
import { getTransparentPixelSprite } from './pixelAnimator';

const WORLD_SCALE = 0.01;
const COURTYARD_X = 19;
const COURTYARD_MIN_Z = -12;
const COURTYARD_MAX_Z = 32;

function stoneTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#292731';
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 32) {
    const offset = (Math.floor(y / 32) % 2) * 28;
    for (let x = -32; x < 288; x += 56) {
      const shade = 32 + Math.floor(Math.random() * 20);
      ctx.fillStyle = `rgb(${shade},${shade - 1},${shade + 9})`;
      ctx.fillRect(x + offset + 1, y + 1, 54, 30);
      ctx.fillStyle = 'rgba(210,190,190,0.08)';
      ctx.fillRect(x + offset + 3, y + 3, 50, 1);
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(9, 11);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export class ThreeWorld {
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(62, 1, 0.1, 180);
  private readonly renderer: THREE.WebGLRenderer;
  private readonly textureLoader = new THREE.TextureLoader();
  private readonly spriteTextures = new Map<string, THREE.Texture>();
  private readonly pendingSprites = new Set<string>();
  private readonly entities = new Map<string, THREE.Group>();
  private readonly projectiles = new Map<string, THREE.Mesh>();
  private readonly landmarkObjects = new Map<string, THREE.Group>();
  private readonly torches: Array<{ flame: THREE.Mesh; light: THREE.PointLight; phase: number }> = [];
  private readonly lockRing: THREE.Mesh;
  private readonly player: THREE.Group;
  private readonly playerShadow: THREE.Mesh;
  private readonly playerSprite: THREE.Mesh;
  private targetId: string | null = null;
  private frame = 0;

  constructor(private readonly host: HTMLElement, heroSprite: string, vista: string) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    this.renderer.setSize(host.clientWidth, host.clientHeight, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;
    this.renderer.domElement.className = 'absolute inset-0 h-full w-full block';
    this.renderer.domElement.style.pointerEvents = 'none';
    host.prepend(this.renderer.domElement);

    this.scene.fog = new THREE.FogExp2('#110b18', 0.012);
    this.loadVista(vista);
    this.addLights();
    this.addFortress();
    this.addFloor();
    this.addShrine();
    this.addTorches();
    this.addBloodMoon();

    this.player = new THREE.Group();
    this.playerSprite = this.createSprite(heroSprite, 1.45, 2.1);
    this.playerSprite.position.y = 1.05;
    this.player.add(this.playerSprite);
    this.scene.add(this.player);

    const shadowMaterial = new THREE.MeshBasicMaterial({ color: '#05040a', transparent: true, opacity: 0.6, depthWrite: false });
    this.playerShadow = new THREE.Mesh(new THREE.CircleGeometry(0.58, 32), shadowMaterial);
    this.playerShadow.rotation.x = -Math.PI / 2;
    this.playerShadow.position.y = 0.025;
    this.scene.add(this.playerShadow);

    this.lockRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.75, 0.045, 6, 40),
      new THREE.MeshBasicMaterial({ color: '#ffd24a', transparent: true, opacity: 0.95 })
    );
    this.lockRing.rotation.x = Math.PI / 2;
    this.lockRing.position.y = 0.08;
    this.lockRing.visible = false;
    this.scene.add(this.lockRing);
    this.resize();
  }

  private loadVista(path: string) {
    this.textureLoader.load(path, (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.background = texture;
    });
  }

  private addLights() {
    this.scene.add(new THREE.HemisphereLight('#8292bd', '#21131c', 2.0));
    const moonLight = new THREE.DirectionalLight('#b9b9ff', 2.2);
    moonLight.position.set(-8, 14, -4);
    this.scene.add(moonLight);
    const shrineLight = new THREE.PointLight('#ff153c', 26, 15, 1.8);
    shrineLight.position.set(0, 2, 8);
    this.scene.add(shrineLight);
  }

  private addFloor() {
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(COURTYARD_X * 2, COURTYARD_MAX_Z - COURTYARD_MIN_Z),
      new THREE.MeshStandardMaterial({ map: stoneTexture(), roughness: 0.93, metalness: 0.08 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.set(0, -0.04, (COURTYARD_MIN_Z + COURTYARD_MAX_Z) / 2);
    this.scene.add(ground);

    const boundaryMaterial = new THREE.MeshStandardMaterial({ color: '#171520', roughness: 0.86 });
    const northWall = new THREE.Mesh(new THREE.BoxGeometry(COURTYARD_X * 2, 5.5, 1), boundaryMaterial);
    northWall.position.set(0, 2.7, COURTYARD_MAX_Z);
    const southWall = northWall.clone();
    southWall.position.z = COURTYARD_MIN_Z;
    const sideWall = new THREE.Mesh(new THREE.BoxGeometry(1, 5.5, COURTYARD_MAX_Z - COURTYARD_MIN_Z), boundaryMaterial);
    sideWall.position.set(-COURTYARD_X, 2.7, (COURTYARD_MIN_Z + COURTYARD_MAX_Z) / 2);
    const otherSideWall = sideWall.clone();
    otherSideWall.position.x = COURTYARD_X;
    [northWall, southWall, sideWall, otherSideWall].forEach((wall) => this.scene.add(wall));
  }

  private addFortress() {
    const stone = new THREE.MeshStandardMaterial({ color: '#272432', roughness: 0.82, metalness: 0.12 });
    const trim = new THREE.MeshStandardMaterial({ color: '#4b3948', roughness: 0.74, metalness: 0.22 });
    for (const x of [-17, 17]) {
      for (const z of [-10, 29]) {
        const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.35, 10, 8), stone);
        tower.position.set(x, 5, z);
        this.scene.add(tower);
        const cap = new THREE.Mesh(new THREE.ConeGeometry(2.3, 3.2, 8), trim);
        cap.position.set(x, 11.4, z);
        this.scene.add(cap);
      }
    }
    for (const x of [-12, -6, 6, 12]) {
      for (const z of [-5, 24]) {
        const column = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.58, 7.5, 8), trim);
        column.position.set(x, 3.75, z);
        this.scene.add(column);
        const capital = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.42, 1.15), stone);
        capital.position.set(x, 7.55, z);
        this.scene.add(capital);
      }
    }
  }

  private addShrine() {
    const shrine = new THREE.Group();
    shrine.position.set(0, 0, 8);
    const blackStone = new THREE.MeshStandardMaterial({ color: '#25212b', roughness: 0.55, metalness: 0.38 });
    const altar = new THREE.Mesh(new THREE.CylinderGeometry(2.35, 2.7, 0.38, 12), blackStone);
    altar.position.y = 0.15;
    shrine.add(altar);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(1.85, 2.15, 0.1, 12), new THREE.MeshStandardMaterial({ color: '#4e182b', emissive: '#520016', emissiveIntensity: 0.7 }));
    top.position.y = 0.39;
    shrine.add(top);
    for (const [radius, tube] of [[2.95, 0.07], [2.42, 0.035], [1.55, 0.025]]) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(radius, tube, 8, 64),
        new THREE.MeshBasicMaterial({ color: '#ff1744', transparent: true, opacity: radius === 2.95 ? 0.92 : 0.63 })
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.055 + tube;
      shrine.add(ring);
    }
    const obelisk = new THREE.Mesh(new THREE.ConeGeometry(0.5, 2.6, 6), new THREE.MeshStandardMaterial({ color: '#3b2738', emissive: '#641024', emissiveIntensity: 0.7 }));
    obelisk.position.y = 1.65;
    shrine.add(obelisk);
    this.scene.add(shrine);
  }

  private addTorches() {
    const positions: Array<[number, number]> = [];
    for (const z of [-8, -2, 4, 10, 16, 22, 28]) positions.push([-14, z], [14, z]);
    positions.forEach(([x, z], index) => {
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.48, 2.9, 8),
        new THREE.MeshStandardMaterial({ color: '#20202d', roughness: 0.72, metalness: 0.25 })
      );
      pillar.position.set(x, 1.45, z);
      this.scene.add(pillar);
      const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.48, 0.3, 0.25, 8), new THREE.MeshStandardMaterial({ color: '#46303a', metalness: 0.55, roughness: 0.4 }));
      bowl.position.set(x, 3, z);
      this.scene.add(bowl);
      const flame = new THREE.Mesh(
        new THREE.SphereGeometry(0.26, 7, 6),
        new THREE.MeshBasicMaterial({ color: index % 3 === 0 ? '#ff284f' : '#ffad40' })
      );
      flame.scale.set(0.68, 1.6, 0.68);
      flame.position.set(x, 3.42, z);
      this.scene.add(flame);
      const light = new THREE.PointLight(index % 3 === 0 ? '#ff1744' : '#ff8b3d', 10, 7, 2);
      light.position.set(x, 3.55, z);
      this.scene.add(light);
      this.torches.push({ flame, light, phase: index * 1.7 });
    });
  }

  private addBloodMoon() {
    const moon = new THREE.Mesh(
      new THREE.SphereGeometry(4.1, 32, 24),
      new THREE.MeshBasicMaterial({ color: '#ad172e', fog: false })
    );
    moon.position.set(0, 15, 35);
    this.scene.add(moon);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(5.1, 24, 20),
      new THREE.MeshBasicMaterial({ color: '#bd102d', transparent: true, opacity: 0.16, side: THREE.BackSide, fog: false })
    );
    glow.position.copy(moon.position);
    this.scene.add(glow);
  }

  private getSpriteTexture(src: string): THREE.Texture | undefined {
    const cached = this.spriteTextures.get(src);
    if (cached) return cached;
    if (this.pendingSprites.has(src)) return undefined;
    this.pendingSprites.add(src);
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      this.pendingSprites.delete(src);
      const cutout = getTransparentPixelSprite(image, 50);
      if (!cutout) return;
      const texture = new THREE.CanvasTexture(cutout);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.magFilter = THREE.NearestFilter;
      texture.minFilter = THREE.NearestFilter;
      texture.generateMipmaps = false;
      texture.needsUpdate = true;
      this.spriteTextures.set(src, texture);
    };
    image.onerror = () => this.pendingSprites.delete(src);
    image.src = src;
    return undefined;
  }

  private createSprite(src: string, width: number, height: number): THREE.Mesh {
    const texture = this.getSpriteTexture(src);
    const material = new THREE.MeshBasicMaterial({
      ...(texture ? { map: texture } : {}),
      color: '#ffffff',
      transparent: true,
      alphaTest: 0.02,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
    mesh.userData.spriteSrc = src;
    return mesh;
  }

  private makeEnemy(enemy: SlashEnemy): THREE.Group {
    const group = new THREE.Group();
    const width = enemy.isBoss ? 2.5 : Math.max(1.25, enemy.width / 42);
    const height = enemy.isBoss ? 3.2 : Math.max(1.65, enemy.height / 40);
    const sprite = this.createSprite(enemy.spriteSrc, width, height);
    sprite.position.y = height / 2;
    group.add(sprite);

    const shadow = new THREE.Mesh(
      new THREE.CircleGeometry(width * 0.34, 20),
      new THREE.MeshBasicMaterial({ color: '#030207', transparent: true, opacity: 0.62, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.025;
    group.add(shadow);

    const telegraph = new THREE.Mesh(
      new THREE.RingGeometry(0.8, 1, 32),
      new THREE.MeshBasicMaterial({ color: '#ff243c', transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false })
    );
    telegraph.rotation.x = -Math.PI / 2;
    telegraph.position.y = 0.065;
    telegraph.visible = false;
    group.add(telegraph);
    const bossAura = enemy.isBoss
      ? new THREE.Mesh(
          new THREE.TorusGeometry(enemy.type === 'malakath_ascended' ? 1.65 : 1.25, 0.055, 7, 48),
          new THREE.MeshBasicMaterial({ color: '#ff542f', transparent: true, opacity: 0.78, depthWrite: false })
        )
      : null;
    if (bossAura) {
      bossAura.rotation.x = Math.PI / 2;
      bossAura.position.y = 0.1;
      group.add(bossAura);
    }
    const hpBack = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.085), new THREE.MeshBasicMaterial({ color: '#17080c', transparent: true, opacity: 0.92, side: THREE.DoubleSide, depthWrite: false }));
    hpBack.position.set(0, height + 0.12, 0);
    group.add(hpBack);
    const hpFill = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.045), new THREE.MeshBasicMaterial({ color: '#f43f5e', side: THREE.DoubleSide, depthWrite: false }));
    hpFill.position.set(0, height + 0.12, 0.01);
    group.add(hpFill);
    group.userData = { sprite, shadow, telegraph, hpBack, hpFill, bossAura, src: enemy.spriteSrc };
    return group;
  }

  resize() {
    const width = Math.max(1, this.host.clientWidth);
    const height = Math.max(1, this.host.clientHeight);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  setTarget(id: string | null) {
    this.targetId = id;
  }

  render(
    player: RoninPlayer,
    enemies: SlashEnemy[],
    projectiles: Projectile3D[],
    landmarks: AdventureLandmark[],
    cameraYaw: number,
    cameraPitch: number,
    elapsed: number,
    dt: number,
    heroSprite: string,
    bodyYaw = player.rotationAngle
  ) {
    this.frame += 1;
    const px = player.x * WORLD_SCALE;
    const py = player.y * WORLD_SCALE;
    const pz = player.z * WORLD_SCALE;
    this.player.position.set(px, py, pz);
    this.player.rotation.y = bodyYaw;
    this.playerSprite.position.y = Math.max(0.02, player.height * WORLD_SCALE * 0.52);
    this.playerSprite.scale.set(1, player.isAttacking ? 1.02 : 1, 1);
    const playerMap = this.playerSprite.material as THREE.MeshBasicMaterial;
    if (playerMap.map?.userData.spriteSrc !== heroSprite) {
      const tex = this.getSpriteTexture(heroSprite);
      if (tex) {
        playerMap.map = tex;
        playerMap.needsUpdate = true;
        if (playerMap.map) playerMap.map.userData.spriteSrc = heroSprite;
      }
    }

    this.playerShadow.position.set(px, 0.025, pz);
    const jump = Math.min(1, Math.max(0, py / 2.8));
    this.playerShadow.scale.setScalar(1 - jump * 0.5);
    (this.playerShadow.material as THREE.MeshBasicMaterial).opacity = 0.62 - jump * 0.38;

    const forwardX = Math.sin(cameraYaw);
    const forwardZ = Math.cos(cameraYaw);
    const pitch = Math.max(-0.55, Math.min(0.7, cameraPitch));
    const cosPitch = Math.cos(pitch);
    const desiredCamera = new THREE.Vector3(
      px - forwardX * cosPitch * 6.6,
      py + 3.2 - Math.sin(pitch) * 6.6,
      pz - forwardZ * cosPitch * 6.6
    );
    const lookTarget = new THREE.Vector3(
      px + forwardX * 3.8,
      py + 1.15 + Math.sin(pitch) * 3.8,
      pz + forwardZ * 3.8
    );
    this.camera.position.lerp(desiredCamera, 1 - Math.exp(-8 * Math.min(dt, 0.05)));
    this.camera.lookAt(lookTarget);

    const seen = new Set<string>();
    for (const enemy of enemies) {
      seen.add(enemy.id);
      let group = this.entities.get(enemy.id);
      if (!group) {
        group = this.makeEnemy(enemy);
        this.entities.set(enemy.id, group);
        this.scene.add(group);
      }
      const ex = enemy.x * WORLD_SCALE;
      const ez = enemy.z * WORLD_SCALE;
      const isFlying = enemy.type === 'flying_stinger' || enemy.type === 'succubus_queen';
      const hover = isFlying ? 1.35 + Math.sin(elapsed * 3 + enemy.x) * 0.18 : 0;
      group.position.set(ex, hover, ez);
      group.rotation.y = enemy.yaw ?? Math.atan2(player.x - enemy.x, player.z - enemy.z);
      const data = group.userData as { sprite: THREE.Mesh; shadow: THREE.Mesh; telegraph: THREE.Mesh; hpBack: THREE.Mesh; hpFill: THREE.Mesh; bossAura: THREE.Mesh | null; src: string };
      data.sprite.position.y = (enemy.isBoss ? 1.6 : Math.max(0.85, enemy.height / 80)) + (enemy.hitStunTimer > 0 ? 0.08 : 0);
      data.sprite.rotation.z = enemy.hitStunTimer > 0 ? Math.sin(elapsed * 45) * 0.05 : 0;
      const spriteMaterial = data.sprite.material as THREE.MeshBasicMaterial;
      const texture = this.spriteTextures.get(enemy.spriteSrc);
      if (texture && spriteMaterial.map !== texture) {
        spriteMaterial.map = texture;
        spriteMaterial.needsUpdate = true;
      }
      data.src = enemy.spriteSrc;
      const bossTint: Record<string, string> = {
        cataclysm_magma: '#ffe0c2',
        void_space: '#e2d9ff',
        flesh_blight: '#d8f5cf',
        shadow_ice: '#d4f0ff',
        crystallized_light: '#fff4c9',
        malakath_ascended: '#ffd4e0',
      };
      spriteMaterial.color.set(enemy.hitStunTimer > 0 ? '#ffb4b4' : enemy.isBoss ? bossTint[enemy.type] ?? '#ffffff' : '#ffffff');
      if (data.bossAura) {
        const bossColors: Record<string, string> = {
          cataclysm_magma: '#ff542f',
          void_space: '#bd67ff',
          flesh_blight: '#6edb6c',
          shadow_ice: '#58cfff',
          crystallized_light: '#ffe174',
          malakath_ascended: '#ff245c',
        };
        (data.bossAura.material as THREE.MeshBasicMaterial).color.set(bossColors[enemy.type] ?? '#ff542f');
        (data.bossAura.material as THREE.MeshBasicMaterial).opacity = 0.56 + Math.sin(elapsed * 4.5) * 0.16;
        data.bossAura.scale.setScalar(1 + Math.sin(elapsed * 3 + (enemy.bossPowerId ?? 0)) * 0.045);
      }
      const healthRatio = Math.max(0, Math.min(1, enemy.hp / Math.max(1, enemy.maxHp)));
      data.hpFill.scale.x = healthRatio;
      data.hpFill.position.x = -0.42 * (1 - healthRatio);
      data.hpFill.visible = healthRatio < 1 || enemy.isBoss === true;
      data.hpBack.visible = data.hpFill.visible;
      data.telegraph.visible = enemy.attackWindup > 0;
      if (data.telegraph.visible) {
        const charge = 1 - Math.max(0, enemy.attackWindup) / 0.55;
        data.telegraph.scale.setScalar(0.75 + charge * 0.65);
      }
      data.shadow.position.y = 0.025;
      if (enemy.isBoss) data.shadow.scale.setScalar(1.5);
    }
    for (const [id, group] of this.entities) {
      if (!seen.has(id)) {
        this.scene.remove(group);
        this.entities.delete(id);
      }
    }

    const liveProjectiles = new Set<string>();
    for (const projectile of projectiles) {
      liveProjectiles.add(projectile.id);
      let mesh = this.projectiles.get(projectile.id);
      if (!mesh) {
        const material = new THREE.MeshStandardMaterial({
          color: projectile.color,
          emissive: projectile.color,
          emissiveIntensity: 2.4,
          roughness: 0.3,
          metalness: 0.2,
        });
        const radius = Math.max(0.14, projectile.size * WORLD_SCALE * 1.25);
        const geometry = projectile.type === 'boss_hazard'
          ? new THREE.RingGeometry(radius * 0.82, radius, 36)
          : projectile.type === 'slash_wave'
          ? new THREE.TorusGeometry(radius, Math.max(0.045, radius * 0.15), 7, 18)
          : new THREE.SphereGeometry(radius, 10, 8);
        if (projectile.type === 'boss_hazard') {
          material.transparent = true;
          material.opacity = 0.48;
          material.depthWrite = false;
        }
        mesh = new THREE.Mesh(geometry, material);
        mesh.userData.projectileType = projectile.type;
        this.projectiles.set(projectile.id, mesh);
        this.scene.add(mesh);
      }
      mesh.position.set(projectile.x * WORLD_SCALE, projectile.type === 'boss_hazard' ? 0.075 : projectile.y * WORLD_SCALE + 0.75, projectile.z * WORLD_SCALE);
      if (projectile.type === 'boss_hazard') mesh.rotation.x = -Math.PI / 2;
      else mesh.rotation.y = Math.atan2(projectile.vx, projectile.vz);
    }
    for (const [id, mesh] of this.projectiles) {
      if (!liveProjectiles.has(id)) {
        this.scene.remove(mesh);
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
        this.projectiles.delete(id);
      }
    }

    for (const landmark of landmarks) {
      if (this.landmarkObjects.has(landmark.id)) continue;
      const prop = new THREE.Group();
      prop.position.set(landmark.x * WORLD_SCALE, 0, landmark.z * WORLD_SCALE);
      if (landmark.type === 'chest') {
        const chest = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.62, 0.62), new THREE.MeshStandardMaterial({ color: '#493129', metalness: 0.55, roughness: 0.4 }));
        chest.position.y = 0.32;
        prop.add(chest);
        const band = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.65, 0.67), new THREE.MeshStandardMaterial({ color: '#c39142', metalness: 0.8, roughness: 0.25, emissive: '#392308', emissiveIntensity: 0.3 }));
        band.position.y = 0.32;
        prop.add(band);
      } else if (landmark.type === 'shrine' && landmark.id !== 'shrine_1') {
        const stone = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.1, 0.42, 8), new THREE.MeshStandardMaterial({ color: '#30232f', metalness: 0.35, roughness: 0.68 }));
        stone.position.y = 0.22;
        prop.add(stone);
        const rune = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.035, 6, 32), new THREE.MeshBasicMaterial({ color: '#ce2d59' }));
        rune.rotation.x = Math.PI / 2;
        rune.position.y = 0.06;
        prop.add(rune);
      } else {
        const marker = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.4, 0.5), new THREE.MeshStandardMaterial({ color: '#483a4c', metalness: 0.5, roughness: 0.45 }));
        marker.position.y = 0.7;
        prop.add(marker);
      }
      this.scene.add(prop);
      this.landmarkObjects.set(landmark.id, prop);
    }

    const target = enemies.find((enemy) => enemy.id === this.targetId && enemy.hp > 0);
    this.lockRing.visible = Boolean(target);
    if (target) this.lockRing.position.set(target.x * WORLD_SCALE, 0.09, target.z * WORLD_SCALE);

    for (const torch of this.torches) {
      const flicker = 0.82 + Math.sin(elapsed * 17 + torch.phase) * 0.12 + Math.sin(elapsed * 31 + torch.phase) * 0.06;
      torch.flame.scale.y = 1.3 + flicker * 0.35;
      torch.light.intensity = 7.5 + flicker * 4;
    }

    // Landmark props use their stored, unchanging X/Z world positions.
    this.renderer.render(this.scene, this.camera);
  }

  dispose() {
    this.renderer.dispose();
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      }
    });
    this.spriteTextures.forEach((texture) => texture.dispose());
    this.spriteTextures.clear();
    this.host.removeChild(this.renderer.domElement);
  }
}
