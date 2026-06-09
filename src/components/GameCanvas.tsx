/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { 
  Shield, Heart, Zap, Crosshair, ArrowLeftRight, Landmark, Navigation2, 
  RotateCcw, Compass, Trophy, Play, CheckCircle
} from 'lucide-react';
import { 
  PlayerStats, Weapon, WeaponId, VehicleId, MissionId, PlanetId, GameSettings, Vehicle
} from '../types/game';
import { sound } from '../utils/sound';

interface GameCanvasProps {
  stats: PlayerStats;
  weapons: Weapon[];
  vehicles: Vehicle[];
  missionId: MissionId;
  settings: GameSettings;
  activeLanguage: 'ar' | 'en';
  onBackToMap: () => void;
  onMissionCompleted: (xp: number, credits: number, crystals: number, titanium: number) => void;
  onUpdateStats: (newStats: PlayerStats) => void;
}

export default function GameCanvas({
  stats,
  weapons,
  vehicles,
  missionId,
  settings,
  activeLanguage,
  onBackToMap,
  onMissionCompleted,
  onUpdateStats,
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const miniMapRef = useRef<HTMLCanvasElement>(null);

  const ar = activeLanguage === 'ar';

  // Game Core States mapped to UI overlay
  const [cinematicStep, setCinematicStep] = useState<
    'ORBITING' | 'ATMOSPHERE_ENTRY' | 'GEAR_DEPLOY' | 'TOUCHDOWN' | 'PILOT_EXIT' | 'NONE'
  >('ORBITING');
  const [cinematicText, setCinematicText] = useState('');

  const [playerHp, setPlayerHp] = useState(100);
  const [playerShield, setPlayerShield] = useState(100);
  const [playerEnergy, setPlayerEnergy] = useState(100);

  const [crystalsCollected, setCrystalsCollected] = useState(0);
  const [enemiesDefeated, setEnemiesDefeated] = useState(0);
  const [baseStatus, setBaseStatus] = useState<'OFFLINE' | 'ONLINE'>('OFFLINE');
  const [bossHp, setBossHp] = useState<number | null>(null);

  // Pilot vehicles tracker
  const [activePilotType, setActivePilotType] = useState<'character' | 'buggy' | 'spaceship'>('character');

  const [gameOver, setGameOver] = useState<'victory' | 'defeat' | null>(null);

  // References to keep data available inside the ThreeJS thread safely
  const stateRef = useRef({
    cinematicStep: 'ORBITING',
    activePilotType: 'character',
    playerHp: 100,
    playerShield: 100,
    playerEnergy: 100,
    crystalsCollected: 0,
    enemiesDefeated: 0,
    baseStatus: 'OFFLINE',
    bossHp: 0 as number | null,
    gameOver: null as 'victory' | 'defeat' | null,
    inputs: { w: false, a: false, s: false, d: false, space: false, shift: false, c: false },
    touchVector: { x: 0, y: 0 },
    mouseDrag: { active: false, x: 0, y: 0 },
    cameraYaw: 0,
    cameraPitch: 0.2,
    cameraZoom: 1,
    activeWeaponId: stats.currentWeapon,
    droneCombatTimer: 0,
  });

  // Track coordinates for mini-map telemetry
  const telemetryRef = useRef({
    playerPos: new THREE.Vector3(0, 0, 0),
    enemies: [] as { pos: THREE.Vector3; type: string; hp: number }[],
    crystals: [] as THREE.Vector3[],
    basePos: new THREE.Vector3(-15, 0, -25),
  });

  // Handle active weapon equip from main app
  useEffect(() => {
    stateRef.current.activeWeaponId = stats.currentWeapon;
  }, [stats.currentWeapon]);

  // Touch analog handler
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [analogOffset, setAnalogOffset] = useState({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const maxDist = 45;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    let rx = dx;
    let ry = dy;
    if (dist > maxDist) {
      rx = (dx / dist) * maxDist;
      ry = (dy / dist) * maxDist;
    }
    setAnalogOffset({ x: rx, y: ry });
    
    // update inputs
    const deadZone = 10;
    stateRef.current.inputs.w = ry < -deadZone;
    stateRef.current.inputs.s = ry > deadZone;
    stateRef.current.inputs.a = rx < -deadZone;
    stateRef.current.inputs.d = rx > deadZone;

    stateRef.current.touchVector.x = rx / maxDist;
    stateRef.current.touchVector.y = -ry / maxDist;
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
    setAnalogOffset({ x: 0, y: 0 });
    stateRef.current.inputs.w = false;
    stateRef.current.inputs.s = false;
    stateRef.current.inputs.a = false;
    stateRef.current.inputs.d = false;
    stateRef.current.touchVector = { x: 0, y: 0 };
  };

  // Switch pilot modes (on board/ride vehicles)
  const toggleVehicleF = () => {
    if (stateRef.current.cinematicStep !== 'NONE') return;
    sound.playClick();
    
    setAnalogOffset({ x: 0, y: 0 });
    
    const curr = stateRef.current.activePilotType;
    if (curr === 'character') {
      // Enter vehicle! Buggy is unlocked by default, ship if unlocked
      if (stats.currentVehicle === 'spaceship' && stats.unlockedVehicles.includes('spaceship')) {
        setActivePilotType('spaceship');
        stateRef.current.activePilotType = 'spaceship';
        sound.startAmbient();
      } else {
        setActivePilotType('buggy');
        stateRef.current.activePilotType = 'buggy';
        sound.startAmbient();
      }
    } else {
      setActivePilotType('character');
      stateRef.current.activePilotType = 'character';
      sound.stopAmbient();
    }
  };

  // Swap weapons trigger
  const triggerWeaponSwap = () => {
    sound.playClick();
    const list = stats.unlockedWeapons;
    const currIdx = list.indexOf(stateRef.current.activeWeaponId);
    const nextIdx = (currIdx + 1) % list.length;
    const nextW = list[nextIdx];
    stateRef.current.activeWeaponId = nextW;
    
    // update state in parent indirectly via stats update, but locally instantly:
    onUpdateStats({
      ...stats,
      currentWeapon: nextW
    });
  };

  // Shooting action
  const triggerShoot = () => {
    if (stateRef.current.cinematicStep !== 'NONE' || stateRef.current.gameOver) return;
    
    const activeW = weapons.find(w => w.id === stateRef.current.activeWeaponId) || weapons[0];
    const energyCost = activeW.id === 'plasma_cannon' ? 15 : activeW.id === 'accuracy_laser' ? 5 : 8;

    if (stateRef.current.playerEnergy < energyCost) {
      sound.playLaser('high'); // click click dry fire
      return;
    }

    // Spend energy
    const nextEnergy = Math.max(0, stateRef.current.playerEnergy - energyCost);
    stateRef.current.playerEnergy = nextEnergy;
    setPlayerEnergy(nextEnergy);

    // Audio SFX corresponding to weapon
    if (activeW.id === 'plasma_cannon') {
      sound.playLaser('plasma');
    } else if (activeW.id === 'rocket_launcher') {
      sound.playRocket();
    } else {
      sound.playLaser('laser');
    }

    // trigger shooting entity flag which ThreeJS loop hooks
    (window as any).__triggerLaserShot = true;
  };

  const triggerJump = () => {
    stateRef.current.inputs.space = true;
    setTimeout(() => {
      stateRef.current.inputs.space = false;
    }, 150);
  };

  // Main interactive Three.js container loop
  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    let width = containerRef.current.clientWidth;
    let height = containerRef.current.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#020205');
    scene.fog = new THREE.FogExp2('#04040a', 0.015);

    // Camera perspective
    const camera = new THREE.PerspectiveCamera(54, width / height, 0.1, 1000);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: settings.graphicsQuality !== 'low',
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, settings.graphicsQuality === 'high' ? 2 : 1.5));
    renderer.shadowMap.enabled = settings.graphicsQuality === 'high';

    // Group to hold all mission objects
    const worldGroup = new THREE.Group();
    scene.add(worldGroup);

    // Ambient Starfield
    const starCount = settings.graphicsQuality === 'low' ? 300 : 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount * 3; i += 3) {
      // scatter stars on a large shell dome
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const r = 250 + Math.random() * 150;
      starPos[i] = r * Math.sin(phi) * Math.cos(theta);
      starPos[i + 1] = r * Math.sin(phi) * Math.sin(theta);
      starPos[i + 2] = r * Math.cos(phi);
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    const starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.9,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.8,
    });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // Lighting config
    const hemiLight = new THREE.HemisphereLight(0x0e1c3e, 0x050510, 0.8);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xebaa78, 1.2); // Warm sun from solar proximity
    dirLight.position.set(40, 50, 20);
    dirLight.castShadow = settings.graphicsQuality === 'high';
    scene.add(dirLight);

    // Giant background rotating sphere for Planet Mercury-X / atmosphere outer rim visual
    const planetBody = new THREE.Mesh(
      new THREE.SphereGeometry(65, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0x442211,
        roughness: 0.95,
        metalness: 0.1,
      })
    );
    planetBody.position.set(0, -66, -30); // positioned right below plane terrain
    worldGroup.add(planetBody);

    // Ground Terrain generation heightmap
    const landscapeRes = 48;
    const terrainGeo = new THREE.PlaneGeometry(160, 160, landscapeRes, landscapeRes);
    
    // displace vertices procedurally to make canyons, ridges and craters
    const vertPos = terrainGeo.attributes.position;
    for (let i = 0; i < vertPos.count; i++) {
      const vx = vertPos.getX(i);
      const vy = vertPos.getY(i);
      
      // mathematical wave displacement
      let zVal = Math.sin(vx * 0.08) * Math.cos(vy * 0.08) * 3;
      zVal += Math.cos(vx * 0.03) * Math.sin(vy * 0.03) * 6; // canyons
      
      // crater punch simulation
      const distFromBase = Math.sqrt((vx + 15) ** 2 + (vy + 25) ** 2);
      if (distFromBase < 18) {
        // flatten abandoned base area craters nearby
        zVal *= (distFromBase / 18);
      }
      
      vertPos.setZ(i, zVal);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = new THREE.MeshStandardMaterial({
      color: 0x2c1f18, // charcoal red rock desert Mercurial soil
      flatShading: true,
      roughness: 0.9,
      metalness: 0.15,
    });
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.rotation.x = -Math.PI / 2;
    terrain.position.y = -1.5;
    terrain.receiveShadow = true;
    worldGroup.add(terrain);

    // Helper height getter for smooth physical character placement on terrain heightmaps
    const getTerrainHeight = (x: number, z: number) => {
      // simple linear approximation of noise height value:
      let hVal = Math.sin(x * 0.08) * Math.cos(z * 0.08) * 3;
      hVal += Math.cos(x * 0.03) * Math.sin(z * 0.03) * 6;
      const baseDist = Math.sqrt((x + 15) ** 2 + (z + 25) ** 2);
      if (baseDist < 18) hVal *= (baseDist / 18);
      return hVal - 1.5;
    };

    // Constructing entity structures!

    // 1. Base communications array
    const towerGroup = new THREE.Group();
    towerGroup.position.set(telemetryRef.current.basePos.x, getTerrainHeight(-15, -25), telemetryRef.current.basePos.z);
    
    // Base platform dish
    const baseDish = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 5, 1.5, 6),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 })
    );
    towerGroup.add(baseDish);

    // Antenna stem
    const spindle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.3, 0.3, 9, 5),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8 })
    );
    spindle.position.y = 4.5;
    towerGroup.add(spindle);

    // Radar scanner dome
    const radarNode = new THREE.Mesh(
      new THREE.SphereGeometry(1.5, 8, 8),
      new THREE.MeshStandardMaterial({ color: 0x64748b, emissive: 0x090915 })
    );
    radarNode.position.y = 9;
    towerGroup.add(radarNode);

    // Signal Beacon emitter
    const beaconLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 4, 4),
      new THREE.MeshBasicMaterial({ color: 0xff4433 })
    );
    beaconLight.position.set(0, 9.8, 0);
    towerGroup.add(beaconLight);

    worldGroup.add(towerGroup);

    // 2. Spaceship model structure - Dynamic Multi-layered Stealth Fighter (B-2 & F-35 Fusion)
    const shipGroup = new THREE.Group();
    // Initially positioned high up for cinematic orbiting
    shipGroup.position.set(20, 50, -40);

    // Main stealth fuselage - flatted polygonal core
    const shipFuselage = new THREE.Mesh(
      new THREE.ConeGeometry(1.6, 7.5, 4),
      new THREE.MeshStandardMaterial({ color: 0x0f121a, metalness: 0.95, roughness: 0.25 })
    );
    shipFuselage.rotation.x = Math.PI / 2;
    shipFuselage.scale.set(1.4, 1.0, 0.55); // Flat stealth profile
    shipGroup.add(shipFuselage);

    // Golden / Cyan futuristic pilot canopy glass
    const canopy = new THREE.Mesh(
      new THREE.SphereGeometry(0.6, 8, 8),
      new THREE.MeshStandardMaterial({ 
        color: 0x06b6d4, 
        emissive: 0x0891b2, 
        emissiveIntensity: 0.6, 
        metalness: 0.96, 
        opacity: 0.85, 
        transparent: true 
      })
    );
    canopy.position.set(0, 0.38, 1.2);
    canopy.scale.set(0.8, 0.55, 1.85); // elongated dynamic look
    shipGroup.add(canopy);

    // Left swept-back wing (F-35 facet angle)
    const wingL = new THREE.Mesh(
      new THREE.BoxGeometry(5.4, 0.12, 3.2),
      new THREE.MeshStandardMaterial({ color: 0x111622, metalness: 0.9, roughness: 0.3 })
    );
    wingL.position.set(-2.8, -0.1, -0.6);
    wingL.rotation.y = -Math.PI / 10; // swept back
    wingL.rotation.z = -Math.PI / 36; // negative anhedral angle
    shipGroup.add(wingL);

    // Right swept-back wing
    const wingR = new THREE.Mesh(
      new THREE.BoxGeometry(5.4, 0.12, 3.2),
      new THREE.MeshStandardMaterial({ color: 0x111622, metalness: 0.9, roughness: 0.3 })
    );
    wingR.position.set(2.8, -0.1, -0.6);
    wingR.rotation.y = Math.PI / 10;
    wingR.rotation.z = Math.PI / 36;
    shipGroup.add(wingR);

    // Secondary aerodynamic control trim flaps (extra layer)
    const trimL = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.08, 1.3),
      new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8 })
    );
    trimL.position.set(-4.5, -0.1, -1.8);
    shipGroup.add(trimL);

    const trimR = trimL.clone();
    trimR.position.x = 4.5;
    shipGroup.add(trimR);

    // Angled vertical twin stealth stabilizer fins (angled outward to deflect radar)
    const tailFinL = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 1.9, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x1a202c, metalness: 0.9, roughness: 0.22 })
    );
    tailFinL.position.set(-0.85, 1.1, -2.4);
    tailFinL.rotation.z = -Math.PI / 9; // outward sweep
    tailFinL.rotation.y = -Math.PI / 18;
    shipGroup.add(tailFinL);

    const tailFinR = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 1.9, 1.4),
      new THREE.MeshStandardMaterial({ color: 0x1a202c, metalness: 0.9, roughness: 0.22 })
    );
    tailFinR.position.set(0.85, 1.1, -2.4);
    tailFinR.rotation.z = Math.PI / 9;
    tailFinR.rotation.y = Math.PI / 18;
    shipGroup.add(tailFinR);

    // Twin High-Energy plasma engine exhausts
    const exhaustL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.45, 1.0, 6),
      new THREE.MeshBasicMaterial({ color: 0xef4444 }) // Hot ignition red
    );
    exhaustL.position.set(-0.48, -0.1, -3.5);
    exhaustL.rotation.x = Math.PI / 2;
    shipGroup.add(exhaustL);

    const exhaustR = exhaustL.clone();
    exhaustR.position.x = 0.48;
    shipGroup.add(exhaustR);

    // Underside tactical laser cannons
    const laserPod = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 1.6, 5),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.95 })
    );
    laserPod.position.set(0, -0.5, 1.4);
    laserPod.rotation.x = Math.PI / 2;
    shipGroup.add(laserPod);

    // Visual micro flare particles emitting from engines
    for (let i = 0; i < 4; i++) {
      const p = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 4, 4),
        new THREE.MeshBasicMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.7 })
      );
      p.position.set((Math.random() - 0.5) * 0.8, -0.1, -3.8 - i * 0.75);
      shipGroup.add(p);
    }

    // Landing gear struts
    const landingGearsGroup = new THREE.Group();
    const footPadL = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.6), new THREE.MeshStandardMaterial({ color: 0x334155 }));
    footPadL.position.set(-1.8, -1.8, 0.4);
    const footPadR = footPadL.clone();
    footPadR.position.x = 1.8;
    landingGearsGroup.add(footPadL, footPadR);
    landingGearsGroup.position.y = -0.5;
    shipGroup.add(landingGearsGroup);

    worldGroup.add(shipGroup);

    // 3. Ground Buggy buggy build
    const buggyGroup = new THREE.Group();
    buggyGroup.position.set(12, getTerrainHeight(12, -4), -4);

    const buggyChassis = new THREE.Mesh(
      new THREE.BoxGeometry(3.5, 1, 5),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.2 })
    );
    buggyGroup.add(buggyChassis);

    const buggyHood = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.8, 2.2),
      new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.8 }) // customized orange default
    );
    buggyChassis.add(buggyHood);
    buggyHood.position.set(0, 0.8, 1.2);

    // Suspension tires
    const tireGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.8, 8);
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x070707, roughness: 0.9 });
    const tires: THREE.Mesh[] = [];

    const offsets = [
      { x: -2.0, z: 1.8 },
      { x: 2.0, z: 1.8 },
      { x: -2.0, z: -1.8 },
      { x: 2.0, z: -1.8 },
    ];

    offsets.forEach((offset) => {
      const tire = new THREE.Mesh(tireGeo, tireMat);
      tire.rotation.z = Math.PI / 2;
      tire.position.set(offset.x, -0.4, offset.z);
      buggyGroup.add(tire);
      tires.push(tire);
    });

    worldGroup.add(buggyGroup);

    // customize vehicles Body color and sticker directly inside model based on stats!
    const customColor = stats.unlockedVehicles.includes('spaceship') 
      ? (vehiclesInfo()?.find(v => v.id === 'spaceship')?.color || '#0f172a')
      : '#0f172a';
    shipFuselage.material.color.set(customColor);

    const customBuggyColor = vehiclesInfo()?.find(v => v.id === 'buggy')?.color || '#f97316';
    buggyHood.material.color.set(customBuggyColor);

    // 4. Player character compound model
    const playerGroup = new THREE.Group();
    playerGroup.position.set(15, getTerrainHeight(15, -15), -15);

    // Glossy metallic Power armor torso
    const armorSuit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.5, 1.8, 6),
      new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.15 })
    );
    armorSuit.position.y = 0.9;
    playerGroup.add(armorSuit);

    // Glowing electronic helmet/visor
    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8, roughness: 0.2 })
    );
    helmet.position.y = 2.1;
    playerGroup.add(helmet);

    const visorGlow = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.2, 0.4),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4 }) // cyan glowing visor line
    );
    visorGlow.position.set(0, 2.1, 0.45);
    playerGroup.add(visorGlow);

    // Suit jetpack cylinder
    const jetpack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 1.2, 5),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 })
    );
    jetpack.position.set(0, 1.0, -0.55);
    playerGroup.add(jetpack);

    worldGroup.add(playerGroup);

    // 5. Crystals collection items
    const crystalGroup = new THREE.Group();
    worldGroup.add(crystalGroup);

    const crystalMeshes: THREE.Mesh[] = [];
    const crystalSpawnCoords = [
      new THREE.Vector3(-22, 0, 12),
      new THREE.Vector3(10, 0, -35),
      new THREE.Vector3(30, 0, 25),
      new THREE.Vector3(-35, 0, -10),
      new THREE.Vector3(5, 0, 28),
      new THREE.Vector3(-10, 0, -32),
    ];

    crystalSpawnCoords.forEach((coord, i) => {
      // snap coordinates to exact terrain height
      coord.y = getTerrainHeight(coord.x, coord.z) + 1.2;
      telemetryRef.current.crystals.push(coord);

      const cryst = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.7, 0),
        new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          emissive: 0x0c3e5a,
          roughness: 0.1,
          metalness: 0.9,
          transparent: true,
          opacity: 0.9,
        })
      );
      cryst.position.copy(coord);
      crystalGroup.add(cryst);
      crystalMeshes.push(cryst);
    });

    // 6. Alien Enemies system
    const enemyGroup = new THREE.Group();
    worldGroup.add(enemyGroup);

    const enemyMeshes: {
      mesh: THREE.Group;
      type: 'ghost' | 'stone' | 'drone' | 'boss';
      hp: number;
      speed: number;
      shootCooldown: number;
    }[] = [];

    const spawnEnemies = () => {
      // spawns dynamic entities depending on mission difficulty
      const specs: { x: number; z: number; type: 'ghost' | 'stone' | 'drone' | 'boss'; hp: number; speed: number }[] = [
        { x: -5, z: 8, type: 'ghost', hp: 30, speed: 0.05 },
        { x: 18, z: 5, type: 'ghost', hp: 30, speed: 0.05 },
        { x: -10, z: -18, type: 'stone', hp: 60, speed: 0.02 },
        { x: -28, z: -28, type: 'drone', hp: 25, speed: 0.04 },
      ];

      // Add extra if medium or hard
      if (missionId !== 'exploration') {
        specs.push(
          { x: -16, z: -32, type: 'drone', hp: 25, speed: 0.04 },
          { x: 3, z: -15, type: 'stone', hp: 60, speed: 0.02 },
          { x: -30, z: 2, type: 'ghost', hp: 30, speed: 0.05 },
          { x: -12, z: -2, type: 'stone', hp: 60, speed: 0.02 }
        );
      }

      // Add Boss Golem if HARD BOSS FIGHT
      if (missionId === 'boss_fight') {
        specs.push({
          x: -15, z: -42, type: 'boss', hp: 350, speed: 0.015
        });
        stateRef.current.bossHp = 350;
        setBossHp(350);
      }

      specs.forEach((sp) => {
        const wrap = new THREE.Group();
        wrap.position.set(sp.x, getTerrainHeight(sp.x, sp.z), sp.z);

        if (sp.type === 'ghost') {
          // pink/glow prisma Ghost
          const head = new THREE.Mesh(
            new THREE.ConeGeometry(0.6, 1.4, 4),
            new THREE.MeshStandardMaterial({ color: 0xec4899, emissive: 0x470e28, flatShading: true })
          );
          head.position.y = 0.8;
          wrap.add(head);
          
          const redEyes = new THREE.Mesh(
            new THREE.SphereGeometry(0.18, 4, 4),
            new THREE.MeshBasicMaterial({ color: 0xff0033 })
          );
          redEyes.position.set(0, 0.9, 0.45);
          wrap.add(redEyes);

        } else if (sp.type === 'stone') {
          // bulky gray rock structure
          const rock = new THREE.Mesh(
            new THREE.DodecahedronGeometry(0.9, 0),
            new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.95, flatShading: true })
          );
          rock.position.y = 0.8;
          wrap.add(rock);

        } else if (sp.type === 'drone') {
          // flying ring Drone
          const ring = new THREE.Mesh(
            new THREE.TorusGeometry(0.6, 0.15, 6, 12),
            new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8 })
          );
          ring.rotation.x = Math.PI / 2;
          ring.position.y = 2.0; // flies high!
          wrap.add(ring);

          const core = new THREE.Mesh(
            new THREE.SphereGeometry(0.3, 6, 6),
            new THREE.MeshBasicMaterial({ color: 0xffaa00 })
          );
          core.position.y = 2.0;
          wrap.add(core);

        } else {
          // GIANT Lava Golem BOSS
          const torso = new THREE.Mesh(
            new THREE.BoxGeometry(4, 4, 4),
            new THREE.MeshStandardMaterial({ color: 0xd97706, emissive: 0x471d07, roughness: 0.9 }) // warning molten stone color
          );
          torso.position.y = 2.5;
          wrap.add(torso);

          const redCore = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 0.6, 1.5),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
          );
          redCore.position.set(0, 3.5, 1.8);
          wrap.add(redCore);

          // massive scale
          wrap.scale.set(1.6, 1.6, 1.6);
        }

        enemyGroup.add(wrap);
        enemyMeshes.push({
          mesh: wrap,
          type: sp.type,
          hp: sp.hp,
          speed: sp.speed,
          shootCooldown: 0,
        });

        telemetryRef.current.enemies.push({
          pos: wrap.position,
          type: sp.type,
          hp: sp.hp,
        });
      });
    };

    spawnEnemies();

    // 7. Projectile particle matrices
    const playerBullets: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[] = [];
    const enemyBullets: { mesh: THREE.Mesh; vel: THREE.Vector3; life: number }[] = [];

    const bulletGeo = new THREE.SphereGeometry(0.16, 4, 4);
    const laserBeamGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.6, 4);

    // Floating atmospheric dust particle cloud to simulate Mercury winds
    const particleCount = 150;
    const dustGroup = new THREE.Group();
    scene.add(dustGroup);
    const dustMeshes: THREE.Mesh[] = [];
    for (let i = 0; i < particleCount; i++) {
      const dp = new THREE.Mesh(
        new THREE.SphereGeometry(0.1 + Math.random() * 0.1, 3, 3),
        new THREE.MeshBasicMaterial({ color: 0xebaa78, transparent: true, opacity: 0.4 })
      );
      dp.position.set(Math.random() * 160 - 80, Math.random() * 20, Math.random() * 160 - 80);
      dustGroup.add(dp);
      dustMeshes.push(dp);
    }

    // Interactive atmospheric Entry clouds for Landing Cinematic!
    const reEntryFlameCloud: THREE.Mesh[] = [];
    const entryCloudGroup = new THREE.Group();
    scene.add(entryCloudGroup);
    const createReEntryClouds = () => {
      for (let i = 0; i < 24; i++) {
        const c = new THREE.Mesh(
          new THREE.SphereGeometry(2.5 + Math.random() * 2, 4, 4),
          new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.4 })
        );
        c.position.set(Math.random() * 12 - 6, Math.random() * 8 + 40, Math.random() * 12 - 6);
        entryCloudGroup.add(c);
        reEntryFlameCloud.push(c);
      }
    };
    createReEntryClouds();

    // Game variables
    let clock = new THREE.Clock();
    let durationInIntro = 0;

    // Game loop inside requestAnimationFrame
    let reqId: number;

    const renderLoop = () => {
      reqId = requestAnimationFrame(renderLoop);

      const delta = Math.min(0.05, clock.getDelta());
      
      const inputs = stateRef.current.inputs;
      const step = stateRef.current.cinematicStep;

      // UPDATE Atmospheric Winds
      dustMeshes.forEach(d => {
        d.position.x -= delta * 3.5;
        d.position.y += Math.sin(d.position.x * 0.1) * delta;
        if (d.position.x < -80) d.position.x = 80;
      });

      // STORY STATE-MACHINE: CINEMATIC ENGINE
      if (step !== 'NONE') {
        durationInIntro += delta;

        if (step === 'ORBITING') {
          setCinematicText(ar ? 'سفينة تنكيل العسكرية تدور ببطء حول مدار عطارد-X...' : 'Military vessel orbiting planet Mercury-X...');
          
          // ship orbits circular orbit
          const orbitRadius = 38;
          const orbitAngle = durationInIntro * 0.35;
          shipGroup.position.set(
            Math.cos(orbitAngle) * orbitRadius,
            38 + Math.sin(orbitAngle * 2) * 5,
            Math.sin(orbitAngle) * orbitRadius - 20
          );
          shipGroup.lookAt(new THREE.Vector3(0, 10, -20));

          // Camera rotates following ship
          camera.position.set(shipGroup.position.x - 8, shipGroup.position.y + 4, shipGroup.position.z + 10);
          camera.lookAt(shipGroup.position);

          if (durationInIntro > 4.5) {
            setCinematicStep('ATMOSPHERE_ENTRY');
            stateRef.current.cinematicStep = 'ATMOSPHERE_ENTRY';
          }
        } 
        else if (step === 'ATMOSPHERE_ENTRY') {
          setCinematicText(ar ? 'دخول الغلاف الجوي! ارتفاع حرارة الهيكل ودخان احتكاك...' : 'Entering atmosphere! Structural Heat Warning / Friction dynamic fires...');
          
          // ship dives plunging down
          shipGroup.position.y -= delta * 12;
          shipGroup.position.z += delta * 4;
          shipGroup.lookAt(new THREE.Vector3(15, 5, -15));

          // ignite visual entry clouds
          reEntryFlameCloud.forEach((c, idx) => {
            c.position.y = shipGroup.position.y + Math.sin(idx + durationInIntro * 10) * 1.5;
            c.position.x = shipGroup.position.x + Math.cos(idx) * 2;
            c.position.z = shipGroup.position.z + Math.sin(idx) * 2;
          });

          camera.position.set(shipGroup.position.x - 6, shipGroup.position.y + 12, shipGroup.position.z + 14);
          camera.lookAt(shipGroup.position);

          if (shipGroup.position.y < 16) {
            // clear flame clouds
            entryCloudGroup.position.y = -200; 
            setCinematicStep('GEAR_DEPLOY');
            stateRef.current.cinematicStep = 'GEAR_DEPLOY';
          }
        } 
        else if (step === 'GEAR_DEPLOY') {
          setCinematicText(ar ? 'فتح عجلات الهبوط الفولاذية والنزول للقطاع المهجور...' : 'Deploying planetary landing gear struts...');
          
          // gears slide down
          landingGearsGroup.position.y = -0.5 - (1.0 - Math.min(1.0, (18 - shipGroup.position.y) / 2)) * 0.8;

          shipGroup.position.y -= delta * 4.0;
          shipGroup.lookAt(new THREE.Vector3(14, getTerrainHeight(14, -14), -14));

          camera.position.set(shipGroup.position.x - 12, shipGroup.position.y + 3, shipGroup.position.z + 8);
          camera.lookAt(shipGroup.position);

          const targetGroundH = getTerrainHeight(14, -14) + 1.8;
          if (shipGroup.position.y <= targetGroundH) {
            shipGroup.position.y = targetGroundH;
            setCinematicStep('TOUCHDOWN');
            stateRef.current.cinematicStep = 'TOUCHDOWN';
          }
        } 
        else if (step === 'TOUCHDOWN') {
          setCinematicText(ar ? 'تم الهبوط بنجاح! هيدروليكيات السفينة مستقرة.' : 'Atmospheric flight completed. Landing gears fully deployed.');
          
          // camera inspects ship touchdown
          camera.position.set(shipGroup.position.x - 8, shipGroup.position.y + 1, shipGroup.position.z + 5);
          camera.lookAt(shipGroup.position);

          if (durationInIntro > 11.5) {
            setCinematicStep('PILOT_EXIT');
            stateRef.current.cinematicStep = 'PILOT_EXIT';
          }
        } 
        else if (step === 'PILOT_EXIT') {
          setCinematicText(ar ? 'خروج الشخصية الفضائية المجهزة ببدلة الطاقة وبدء المهام!' : 'Hero deployment cycle initiated. Air-lock visor release...');
          
          // character steps out of landing ship coordinates
          const deployRatio = Math.min(1.0, (durationInIntro - 11.5) / 2.0);
          playerGroup.position.set(
            shipGroup.position.x + deployRatio * 4.0,
            getTerrainHeight(shipGroup.position.x + deployRatio * 4.0, shipGroup.position.z) + 0.1,
            shipGroup.position.z
          );

          camera.position.set(playerGroup.position.x - 4, playerGroup.position.y + 2, playerGroup.position.z + 4);
          camera.lookAt(playerGroup.position);

          if (durationInIntro > 14.2) {
            setCinematicStep('NONE');
            stateRef.current.cinematicStep = 'NONE';
            
            // set active coords
            sound.playLevelUp();
          }
        }
      } 
      // PLAYING GAME LOOP ACTIVATION
      else if (!stateRef.current.gameOver) {
        // Player stats regeneration
        const hasShieldDrone = stats.currentDrone === 'shield_drone';
        const shieldRegenSpeed = hasShieldDrone ? 8.0 : 2.5;
        if (stateRef.current.playerShield < 100) {
          const nextShield = Math.min(100, stateRef.current.playerShield + delta * shieldRegenSpeed);
          stateRef.current.playerShield = nextShield;
          setPlayerShield(nextShield);
        }
        if (stateRef.current.playerEnergy < 100) {
          const nextEnergy = Math.min(100, stateRef.current.playerEnergy + delta * 12.0); // restore energy buffer
          stateRef.current.playerEnergy = nextEnergy;
          setPlayerEnergy(nextEnergy);
        }
        // Shield drone heals player underlying chassis armor
        if (hasShieldDrone && stateRef.current.playerHp < 100) {
          const nextHp = Math.min(100, stateRef.current.playerHp + delta * 3.5);
          stateRef.current.playerHp = nextHp;
          setPlayerHp(Math.round(nextHp));
        }

        const pilot = stateRef.current.activePilotType;

        // Vector tracking for active entities
        let activeEntity: THREE.Object3D;
        let speed = 0;

        if (pilot === 'character') {
          activeEntity = playerGroup;
          speed = stats.level * 0.15 + 4.8; // move rate
        } else if (pilot === 'buggy') {
          activeEntity = buggyGroup;
          // Stats upgraded engine speeds
          const upgradeLevel = vehiclesInfo()?.find(v => v.id === 'buggy')?.speed || 1;
          speed = 6.0 + upgradeLevel * 2.2;
        } else {
          activeEntity = shipGroup;
          // Cruiser speed upgrade
          const upgradeLevel = vehiclesInfo()?.find(v => v.id === 'spaceship')?.speed || 1;
          speed = 8.0 + upgradeLevel * 3.5;
        }

        // MOVEMENT LOGIC
        let moveX = 0;
        let moveZ = 0;

        if (inputs.w) moveZ -= 1;
        if (inputs.s) moveZ += 1;
        if (inputs.a) moveX -= 1;
        if (inputs.d) moveX += 1;

        // Apply joystick additions if touch active
        if (stateRef.current.touchVector.x !== 0 || stateRef.current.touchVector.y !== 0) {
          moveX = stateRef.current.touchVector.x;
          moveZ = -stateRef.current.touchVector.y;
        }

        if (moveX !== 0 || moveZ !== 0) {
          // Normalize
          const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
          const dirX = moveX / length;
          const dirZ = moveZ / length;

          // Rotate relative to camera look angle
          const forwardX = Math.sin(stateRef.current.cameraYaw);
          const forwardZ = Math.cos(stateRef.current.cameraYaw);
          const rightX = -forwardZ;
          const rightZ = forwardX;

          const finalX = (dirX * rightX + dirZ * forwardX) * speed * delta;
          const finalZ = (dirX * rightZ + dirZ * forwardZ) * speed * delta;

          activeEntity.position.x += finalX;
          activeEntity.position.z += finalZ;

          // Rotate entity to look direction smoothly
          const angle = Math.atan2(finalX, finalZ);
          activeEntity.rotation.y = angle;

          // sound steps trigger for player character walking
          if (pilot === 'character' && Math.floor(durationInIntro * 4) % 3 === 0) {
            sound.playFootstep();
          } else if (pilot !== 'character') {
            // update hum based on speed
            sound.updateEngineHum(70);
          }
        } else if (pilot !== 'character') {
          sound.updateEngineHum(15);
        }

        // BOUNDS LOCK to prevent escaping canyons
        activeEntity.position.x = Math.max(-75, Math.min(75, activeEntity.position.x));
        activeEntity.position.z = Math.max(-75, Math.min(75, activeEntity.position.z));

        // snap to terrain
        const terrainH = getTerrainHeight(activeEntity.position.x, activeEntity.position.z);
        if (pilot !== 'spaceship') {
          activeEntity.position.y = terrainH;
        } else {
          // Spaceship hovers high
          activeEntity.position.y = Math.max(terrainH + 3.0, activeEntity.position.y);
          // damp height back to 3m hover if no fly input
          activeEntity.position.y += (terrainH + 4.5 - activeEntity.position.y) * 0.05;
        }

        // Simple tire rotate animation on buggy movement
        if (pilot === 'buggy' && (moveX !== 0 || moveZ !== 0)) {
          tires.forEach(t => t.rotation.x += delta * 12);
        }

        // Sync player position for visual radar min-map
        telemetryRef.current.playerPos.copy(activeEntity.position);

        // SHOOTING projectile launch triggers
        if ((window as any).__triggerLaserShot) {
          (window as any).__triggerLaserShot = false;

          // spawn bullet mesh geometry matching current weapon color
          const activeW = weapons.find(w => w.id === stateRef.current.activeWeaponId) || weapons[0];
          const color = activeW.id === 'plasma_cannon' ? 0xff4400 : activeW.id === 'accuracy_laser' ? 0x06b6d4 : 0x00ffaa;
          
          const projMat = new THREE.MeshBasicMaterial({ color: color });
          const proj = new THREE.Mesh(activeW.id === 'accuracy_laser' ? laserBeamGeo : bulletGeo, projMat);
          
          // calculate forward direction of active entity
          const phiY = activeEntity.rotation.y;
          const bulletDir = new THREE.Vector3(Math.sin(phiY), 0.1, Math.cos(phiY)).normalize();
          
          // starting position slightly forward
          proj.position.copy(activeEntity.position).addScaledVector(bulletDir, 1.8);
          proj.position.y += pilot === 'character' ? 1.4 : 1.0;

          // rotate laser cylinder to match heading
          if (activeW.id === 'accuracy_laser') {
            proj.rotation.y = phiY;
            proj.rotation.x = Math.PI / 2;
          }

          worldGroup.add(proj);
          playerBullets.push({
            mesh: proj,
            vel: bulletDir.multiplyScalar(35.0), // speed of blast
            life: 2.2, // expires after 2s
          });
        }

        // PROCESS Pluckable Crystals gathering collision checks
        crystalMeshes.forEach((c, idx) => {
          if (c.position.y > -100) {
            c.rotation.y += delta * 2.0; // spin mesh
            
            const dist = activeEntity.position.distanceTo(c.position);
            const rangeMult = stats.currentDrone === 'scout_drone' ? 4.5 : 1.0;
            const collectionRadius = (pilot === 'character' ? 2.0 : 3.8) * rangeMult;
            
            if (dist < collectionRadius) {
              // Collected!
              c.position.y = -500; // bury
              sound.playMissionCompleted();
              
              const nextVal = stateRef.current.crystalsCollected + 1;
              stateRef.current.crystalsCollected = nextVal;
              setCrystalsCollected(nextVal);

              // alert victory in EASY exploration mission
              if (missionId === 'exploration' && nextVal >= 5) {
                triggerGameOverState('victory');
              }
            }
          }
        });

        // BASE COMMUNICATION TOWER activation collision trigger
        const distToBase = activeEntity.position.distanceTo(telemetryRef.current.basePos);
        if (distToBase < 6.0 && missionId === 'skirmish' && stateRef.current.baseStatus === 'OFFLINE') {
          sound.playLevelUp();
          stateRef.current.baseStatus = 'ONLINE';
          setBaseStatus('ONLINE');
          beaconLight.material.color.setHex(0x06b6d4); // glowing cyan for link restored!
          
          // alert victory in MEDIUM skirmish mission if also killed enough enemies
          if (stateRef.current.enemiesDefeated >= 4) {
            triggerGameOverState('victory');
          }
        }

        // COMBAT DRONE AUTOPILOT AUTO-LASER SENTRY ATTACK
        if (stats.currentDrone === 'combat_drone') {
          stateRef.current.droneCombatTimer += delta;
          if (stateRef.current.droneCombatTimer >= 2.0) {
            stateRef.current.droneCombatTimer = 0;
            let closestEnemy: any = null;
            let closestDist = 28.0; // engagement zone
            
            enemyMeshes.forEach((enemy) => {
              if (enemy.hp > 0) {
                const d = activeEntity.position.distanceTo(enemy.mesh.position);
                if (d < closestDist) {
                  closestDist = d;
                  closestEnemy = enemy;
                }
              }
            });
            
            if (closestEnemy) {
              sound.playLaser('laser');
              closestEnemy.hp = Math.max(0, closestEnemy.hp - 25);
              
              const teleItem = telemetryRef.current.enemies.find(t => t.pos === closestEnemy.mesh.position);
              if (teleItem) teleItem.hp = closestEnemy.hp;
              
              if (closestEnemy.hp <= 0) {
                closestEnemy.mesh.position.y = -500;
                sound.playExplosion();
                const nextKillCount = stateRef.current.enemiesDefeated + 1;
                stateRef.current.enemiesDefeated = nextKillCount;
                setEnemiesDefeated(nextKillCount);
                if (closestEnemy.type === 'boss') {
                  setBossHp(0);
                  stateRef.current.bossHp = 0;
                  triggerGameOverState('victory');
                } else if (missionId === 'skirmish' && nextKillCount >= 4 && stateRef.current.baseStatus === 'ONLINE') {
                  triggerGameOverState('victory');
                }
              } else if (closestEnemy.type === 'boss') {
                setBossHp(closestEnemy.hp);
                stateRef.current.bossHp = closestEnemy.hp;
              }
            }
          }
        }

        // UPDATE CUSTOM PROJECTS BULLETS
        playerBullets.forEach((pb, idx) => {
          pb.mesh.position.addScaledVector(pb.vel, delta);
          pb.life -= delta;

          // collision checking against active hostile groups
          enemyMeshes.forEach((enemy) => {
            if (enemy.hp > 0) {
              const enemyRad = enemy.type === 'boss' ? 5.2 : 1.9;
              const dist = pb.mesh.position.distanceTo(enemy.mesh.position);
              if (dist < enemyRad) {
                // Damaged!
                enemy.hp = Math.max(0, enemy.hp - (stateRef.current.activeWeaponId === 'plasma_cannon' ? 30 : 15));
                sound.playLaser('plasma');
                pb.life = 0; // destroy projectile

                // Update telemetry readouts
                const teleItem = telemetryRef.current.enemies.find(t => t.pos === enemy.mesh.position);
                if (teleItem) teleItem.hp = enemy.hp;

                if (enemy.hp <= 0) {
                  enemy.mesh.position.y = -500; // bury corpse
                  sound.playExplosion();
                  
                  const nextKillCount = stateRef.current.enemiesDefeated + 1;
                  stateRef.current.enemiesDefeated = nextKillCount;
                  setEnemiesDefeated(nextKillCount);

                  // check BOSS fight hard victory
                  if (enemy.type === 'boss') {
                    setBossHp(0);
                    stateRef.current.bossHp = 0;
                    triggerGameOverState('victory');
                  } else {
                    // if normal enemy died and mid skirmish is ready
                    if (missionId === 'skirmish' && nextKillCount >= 4 && stateRef.current.baseStatus === 'ONLINE') {
                      triggerGameOverState('victory');
                    }
                  }
                } else if (enemy.type === 'boss') {
                  setBossHp(enemy.hp);
                  stateRef.current.bossHp = enemy.hp;
                }
              }
            }
          });

          if (pb.life <= 0) {
            worldGroup.remove(pb.mesh);
            playerBullets.splice(idx, 1);
          }
        });

        // UPDATE ENEMY ARTIFICIAL AI BEHAVIORS
        enemyMeshes.forEach((enemy) => {
          if (enemy.hp > 0) {
            const distToPlayer = enemy.mesh.position.distanceTo(activeEntity.position);

            // Hostile aggro tracking radius
            if (distToPlayer < (enemy.type === 'boss' ? 45 : 22)) {
              // rotate to face player
              enemy.mesh.lookAt(activeEntity.position);

              // move closer but maintain buffer distance
              if (distToPlayer > (enemy.type === 'drone' ? 8 : enemy.type === 'boss' ? 12 : 1.5)) {
                const stepVec = new THREE.Vector3()
                  .subVectors(activeEntity.position, enemy.mesh.position)
                  .normalize();
                enemy.mesh.position.addScaledVector(stepVec, enemy.speed * (1.0 + delta));
                
                // Keep flight altitude for drone
                if (enemy.type === 'drone') {
                  enemy.mesh.position.y = getTerrainHeight(enemy.mesh.position.x, enemy.mesh.position.z) + 3.0;
                } else {
                  enemy.mesh.position.y = getTerrainHeight(enemy.mesh.position.x, enemy.mesh.position.z);
                }
              }

              // Shoot weapon at character
              enemy.shootCooldown -= delta;
              if (enemy.shootCooldown <= 0) {
                enemy.shootCooldown = enemy.type === 'boss' ? 1.0 : 2.5; // refire rate
                
                // Spawn laser bullet
                const ebGeo = new THREE.SphereGeometry(0.18, 4, 4);
                const ebMat = new THREE.MeshBasicMaterial({ color: 0xff0033 });
                const ebMesh = new THREE.Mesh(ebGeo, ebMat);
                ebMesh.position.copy(enemy.mesh.position);
                ebMesh.position.y += enemy.type === 'drone' ? 1.8 : 1.0;

                const eDir = new THREE.Vector3()
                  .subVectors(activeEntity.position, enemy.mesh.position)
                  .normalize();

                worldGroup.add(ebMesh);
                enemyBullets.push({
                  mesh: ebMesh,
                  vel: eDir.multiplyScalar(22.0),
                  life: 2.5,
                });
                
                if (distToPlayer < 20) sound.playLaser('high');
              }
            }
          }
        });

        // UPDATE ENEMY BULLETS FLIGHT & DAMAGE
        enemyBullets.forEach((eb, idx) => {
          eb.mesh.position.addScaledVector(eb.vel, delta);
          eb.life -= delta;

          const dist = eb.mesh.position.distanceTo(activeEntity.position);
          const blockRad = pilot === 'character' ? 1.6 : 3.5;
          if (dist < blockRad) {
            // Impact! Damage calculation
            eb.life = 0;
            sound.playRocket();

            // process Shield absorbing first, then HP
            let curS = stateRef.current.playerShield;
            let curHp = stateRef.current.playerHp;

            if (curS > 0) {
              curS = Math.max(0, curS - 25);
              stateRef.current.playerShield = curS;
              setPlayerShield(curS);
            } else {
              curHp = Math.max(0, curHp - 15);
              stateRef.current.playerHp = curHp;
              setPlayerHp(curHp);

              if (curHp <= 0) {
                triggerGameOverState('defeat');
              }
            }
          }

          if (eb.life <= 0) {
            worldGroup.remove(eb.mesh);
            enemyBullets.splice(idx, 1);
          }
        });

        // CAMERA THIRD PERSON tracking system
        // rotation handled by mouseDrag values
        const distBehind = 6.2;
        const targetX = activeEntity.position.x - Math.sin(stateRef.current.cameraYaw) * distBehind;
        const targetZ = activeEntity.position.z - Math.cos(stateRef.current.cameraYaw) * distBehind;
        const targetY = activeEntity.position.y + 2.5 + stateRef.current.cameraPitch * 3.0;

        camera.position.x += (targetX - camera.position.x) * 0.12;
        camera.position.y += (targetY - camera.position.y) * 0.12;
        camera.position.z += (targetZ - camera.position.z) * 0.12;

        // lock target slightly above character core
        const lookT = activeEntity.position.clone();
        lookT.y += pilot === 'character' ? 1.3 : 0.8;
        camera.lookAt(lookT);
      }

      renderer.render(scene, camera);
      updateTelemetryRadar();
    };

    // Trigger Game Over screen state
    const triggerGameOverState = (outcome: 'victory' | 'defeat') => {
      sound.stopAmbient();
      stateRef.current.gameOver = outcome;
      setGameOver(outcome);
      if (outcome === 'victory') {
        sound.playMissionCompleted();
        
        // reward calculation based on mission chosen
        let xp = 1500;
        let credits = 1000;
        let cry = 15;
        let tit = 8;
        if (missionId === 'skirmish') { xp = 2500; credits = 1800; cry = 25; tit = 15; }
        if (missionId === 'boss_fight') { xp = 5000; credits = 4500; cry = 50; tit = 35; }

        onMissionCompleted(xp, credits, cry, tit);
      } else {
        sound.playExplosion();
      }
    };

    // Radar HUD rendering sweep
    const updateTelemetryRadar = () => {
      if (!miniMapRef.current) return;
      const ctx2 = miniMapRef.current.getContext('2d');
      if (!ctx2) return;

      const size = 70;
      ctx2.clearRect(0, 0, size, size);

      // outer circle
      ctx2.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx2.lineWidth = 1;
      ctx2.beginPath();
      ctx2.arc(size / 2, size / 2, size / 2 - 2, 0, Math.PI * 2);
      ctx2.stroke();

      // crosshair lines
      ctx2.strokeStyle = 'rgba(6, 182, 212, 0.2)';
      ctx2.beginPath();
      ctx2.moveTo(size / 2, 0); ctx2.lineTo(size / 2, size);
      ctx2.moveTo(0, size / 2); ctx2.lineTo(size, size / 2);
      ctx2.stroke();

      // player center dot
      ctx2.fillStyle = '#06b6d4';
      ctx2.beginPath();
      ctx2.arc(size / 2, size / 2, 2.5, 0, Math.PI * 2);
      ctx2.fill();

      // draw crystals nearby
      telemetryRef.current.crystals.forEach((c) => {
        const dx = c.x - telemetryRef.current.playerPos.x;
        const dz = c.z - telemetryRef.current.playerPos.z;
        const scale = 0.55; // zoom out relative scale
        
        const rx = size / 2 + dx * scale;
        const ry = size / 2 + dz * scale;
        
        if (rx > 0 && rx < size && ry > 0 && ry < size) {
          ctx2.fillStyle = '#00ffff';
          ctx2.beginPath();
          ctx2.arc(rx, ry, 1.8, 0, Math.PI * 2);
          ctx2.fill();
        }
      });

      // draw enemies
      enemyMeshes.forEach((en) => {
        if (en.hp > 0) {
          const dx = en.mesh.position.x - telemetryRef.current.playerPos.x;
          const dz = en.mesh.position.z - telemetryRef.current.playerPos.z;
          const scale = 0.55;

          const rx = size / 2 + dx * scale;
          const ry = size / 2 + dz * scale;

          if (rx > 0 && rx < size && ry > 0 && ry < size) {
            ctx2.fillStyle = en.type === 'boss' ? '#ff0000' : '#ff3b30';
            ctx2.beginPath();
            ctx2.arc(rx, ry, en.type === 'boss' ? 3.0 : 1.8, 0, Math.PI * 2);
            ctx2.fill();
          }
        }
      });
    };

    clock.start();
    renderLoop();

    // Keybindings listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || e.key === 'ArrowUp') stateRef.current.inputs.w = true;
      if (key === 's' || e.key === 'ArrowDown') stateRef.current.inputs.s = true;
      if (key === 'a' || e.key === 'ArrowLeft') stateRef.current.inputs.a = true;
      if (key === 'd' || e.key === 'ArrowRight') stateRef.current.inputs.d = true;
      if (e.key === ' ') {
        e.preventDefault();
        triggerJump();
      }
      if (key === 'f') toggleVehicleF();
      if (key === 'q') triggerWeaponSwap();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || e.key === 'ArrowUp') stateRef.current.inputs.w = false;
      if (key === 's' || e.key === 'ArrowDown') stateRef.current.inputs.s = false;
      if (key === 'a' || e.key === 'ArrowLeft') stateRef.current.inputs.a = false;
      if (key === 'd' || e.key === 'ArrowRight') stateRef.current.inputs.d = false;
    };

    // Camera move dragged listener
    const handleMouseDown = (e: MouseEvent) => {
      stateRef.current.mouseDrag.active = true;
      stateRef.current.mouseDrag.x = e.clientX;
      stateRef.current.mouseDrag.y = e.clientY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!stateRef.current.mouseDrag.active) return;
      const dx = e.clientX - stateRef.current.mouseDrag.x;
      const dy = e.clientY - stateRef.current.mouseDrag.y;
      
      const sens = settings.cameraSensitivity * 0.0015;
      
      stateRef.current.cameraYaw -= dx * sens;
      stateRef.current.cameraPitch = Math.max(-0.4, Math.min(0.6, stateRef.current.cameraPitch + dy * sens));

      stateRef.current.mouseDrag.x = e.clientX;
      stateRef.current.mouseDrag.y = e.clientY;
    };

    const handleMouseUp = () => {
      stateRef.current.mouseDrag.active = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Responsive size tracker
    let resizeFrameId: number | null = null;
    const resizeObserver = new ResizeObserver((entries) => {
      if (resizeFrameId) cancelAnimationFrame(resizeFrameId);
      resizeFrameId = requestAnimationFrame(() => {
        if (!containerRef.current) return;
        for (const entry of entries) {
          width = entry.contentRect.width;
          height = entry.contentRect.height;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        }
      });
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      cancelAnimationFrame(reqId);
      if (resizeFrameId) cancelAnimationFrame(resizeFrameId);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      resizeObserver.disconnect();
      sound.stopAmbient();
    };
  }, [missionId, settings.graphicsQuality]);

  // helper list for customization
  function vehiclesInfo() {
    return vehicles;
  }

  const activeWeapon = weapons.find(w => w.id === stats.currentWeapon) || weapons[0];

  return (
    <div className="w-full h-full flex flex-col relative bg-neutral-950 text-neutral-200 font-sans select-none" ref={containerRef}>
      
      {/* Three WebGL Canvas */}
      <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing z-0" />

      {/* MISSION DEPLOY CINEMATIC OVERLAY GRID */}
      {cinematicStep !== 'NONE' && (
        <div className="absolute inset-0 z-30 bg-black/75 flex flex-col items-center justify-center p-6 text-center select-none backdrop-blur-xs font-sans">
          <div className="max-w-md w-full border border-cyan-500/30 bg-neutral-950/90 rounded-2xl p-6 shadow-[0_0_24px_rgba(6,182,212,0.15)] flex flex-col items-center gap-4 animate-pulse">
            <span className="text-[10px] tracking-[0.3em] text-cyan-400 font-mono uppercase">
              {ar ? 'مدير الملاحة وهبوط المركبة' : 'ORBITAL DESCENT PROCEDURES'}
            </span>
            
            <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin flex items-center justify-center">
              <span className="text-[11px] font-mono text-cyan-400">LO-ORD</span>
            </div>

            <p className="text-sm font-bold text-neutral-100 uppercase tracking-wide">
              {cinematicStep}
            </p>

            <span className="text-xs text-neutral-300 font-medium leading-relaxed max-w-sm">
              {cinematicText}
            </span>
          </div>
        </div>
      )}

      {/* STANDARD HEADS UP DISPLAY / IN-GAME CANVAS CONTROLS */}
      {cinematicStep === 'NONE' && (
        <>
          {/* Top-Left: Mini Radar Scan */}
          <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-black/60 border border-cyan-500/20 py-1.5 px-2 rounded-xl backdrop-blur-md">
            <canvas ref={miniMapRef} width="70" height="70" className="w-11 h-11 bg-neutral-950 rounded-full border border-cyan-500/20" />
            <div className="flex flex-col text-[9px] font-mono leading-none py-1 text-neutral-400">
              <span className="text-cyan-400 font-bold">{ar ? 'الرادار النشط' : 'RADAR LINK'}</span>
              <span className="mt-1 font-mono hover:text-cyan-400">Cryst: {crystalsCollected}/5</span>
              <span className="mt-1 font-mono hover:text-cyan-400">Elims: {enemiesDefeated}</span>
            </div>
          </div>

          {/* Top-Right: Suit Core diagnostics */}
          <div className="absolute top-2 right-2 z-10 flex flex-col gap-1 w-36 bg-black/60 border border-white/5 py-2 px-3 rounded-xl backdrop-blur-md">
            {/* HP */}
            <div className="flex flex-col gap-0.5">
              <div className="flex justify-between items-center text-[9px] font-mono text-neutral-300">
                <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5 text-rose-500 fill-current" /> HP</span>
                <span className="font-bold text-rose-400">{playerHp}%</span>
              </div>
              <div className="w-full bg-neutral-950 h-1 rounded overflow-hidden">
                <div className="bg-rose-500 h-full transition-all duration-300" style={{ width: `${playerHp}%` }} />
              </div>
            </div>

            {/* Shield */}
            <div className="flex flex-col gap-0.5 mt-1">
              <div className="flex justify-between items-center text-[9px] font-mono text-neutral-300">
                <span className="flex items-center gap-0.5"><Shield className="w-2.5 h-2.5 text-cyan-400 fill-current" /> SHIELD</span>
                <span className="font-bold text-cyan-400">{playerShield}%</span>
              </div>
              <div className="w-full bg-neutral-950 h-1 rounded overflow-hidden">
                <div className="bg-cyan-400 h-full transition-all duration-300 animate-pulse" style={{ width: `${playerShield}%` }} />
              </div>
            </div>

            {/* Energy Core */}
            <div className="flex flex-col gap-0.5 mt-1">
              <div className="flex justify-between items-center text-[9px] font-mono text-neutral-300">
                <span className="flex items-center gap-0.5"><Zap className="w-2.5 h-2.5 text-amber-500 fill-current" /> ENERGY</span>
                <span className="font-bold text-amber-500">{playerEnergy}%</span>
              </div>
              <div className="w-full bg-neutral-950 h-1 rounded overflow-hidden">
                <div className="bg-amber-400 h-full transition-all duration-300" style={{ width: `${playerEnergy}%` }} />
              </div>
            </div>
          </div>

          {/* SATELLITE BASE STATUS MESSAGE IN SKIRMISH MODE */}
          {missionId === 'skirmish' && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 bg-black/80 border border-white/5 py-1 px-3 rounded-full text-[10px] font-mono flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full animate-ping ${baseStatus === 'ONLINE' ? 'bg-emerald-400' : 'bg-red-500'}`} />
              <span className="text-neutral-400">{ar ? 'محطة الاتصالات الأولى: ' : 'COMM STATION LINK: '}</span>
              <span className={baseStatus === 'ONLINE' ? 'text-emerald-400 font-bold' : 'text-red-500 font-bold'}>
                {baseStatus === 'ONLINE' ? (ar ? 'متصلة بالشبكة' : 'ONLINE') : (ar ? 'مغلقة - اقترب لتفعيلها' : 'OFFLINE - APPROACH Dish')}
              </span>
            </div>
          )}

          {/* DYNAMIC GIANT BOSS HEALTH BAR FOR HARD MODE */}
          {bossHp !== null && bossHp > 0 && (
            <div className="absolute top-14 left-1/2 -translate-x-1/2 z-10 w-64 max-w-xs bg-black/85 border border-red-500/20 p-2 rounded-xl text-center backdrop-blur-md flex flex-col gap-1">
              <div className="flex justify-between items-center text-[9px] font-mono text-red-500 font-bold">
                <span className="animate-pulse">⚠️ BOSS: CALAMITY GOLEM</span>
                <span>{bossHp} HP</span>
              </div>
              <div className="w-full h-2 bg-neutral-950 rounded-full overflow-hidden border border-red-500/20">
                <div className="bg-red-500 h-full transition-all duration-300" style={{ width: `${(bossHp / 350) * 100}%` }} />
              </div>
            </div>
          )}

          {/* BOTTOM FLOATING JOYSTICK CONTROL OVERLAYS */}
          {/* Left Side: Virtual Movement analog joystick */}
          <div className="absolute bottom-2 left-6 z-10 p-2">
            <div 
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="w-24 h-24 rounded-full bg-black/50 border border-cyan-500/20 flex items-center justify-center relative touch-none shadow-[0_0_15px_rgba(0,0,0,0.5)] active:scale-105 transition-transform"
            >
              {/* Inner analog knob */}
              <div 
                className="w-10 h-10 rounded-full bg-cyan-500/80 border border-white/20 shadow-md flex items-center justify-center"
                style={{ transform: `translate(${analogOffset.x}px, ${analogOffset.y}px)` }}
              >
                <div className="w-3.5 h-3.5 rounded-full bg-white opacity-40" />
              </div>
            </div>
          </div>

          {/* Right Side: Primary touch action nodes */}
          <div className="absolute bottom-2 right-6 z-10 flex items-end gap-3.5">
            {/* Board/Exit vehicle button */}
            <div className="flex flex-col gap-2">
              <button
                onClick={toggleVehicleF}
                className="w-12 h-12 rounded-full bg-amber-500 text-neutral-950 border border-amber-400 flex flex-col items-center justify-center shadow-lg hover:bg-amber-400 active:scale-90 select-none cursor-pointer"
                title={ar ? 'مغادرة/ركوب المركبة' : 'Pilot vehicle (F)'}
              >
                <Landmark className="w-5 h-5" />
                <span className="text-[7px] font-mono uppercase leading-none font-bold">VEH (F)</span>
              </button>

              <button
                onClick={triggerWeaponSwap}
                className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-700 text-cyan-400 flex flex-col items-center justify-center shadow-lg hover:border-cyan-400 active:scale-90 select-none cursor-pointer"
                title={ar ? 'تبديل السلاح' : 'Swap Weapon (Q)'}
              >
                <ArrowLeftRight className="w-5 h-5" />
                <span className="text-[7px] font-mono uppercase leading-none font-bold">SWAP (Q)</span>
              </button>
            </div>

            {/* Jump button */}
            <button
              onClick={triggerJump}
              className="w-14 h-14 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-200 flex flex-col items-center justify-center shadow-lg hover:border-white active:scale-90 select-none cursor-pointer"
              title={ar ? 'قفز' : 'Jump (Space)'}
            >
              <Navigation2 className="w-6 h-6 rotate-90 text-amber-500" />
              <span className="text-[8px] font-mono uppercase mt-0.5 font-bold">JUMP</span>
            </button>

            {/* Primary fire button */}
            <button
              onClick={triggerShoot}
              className="w-18 h-18 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 text-white border-2 border-rose-400 flex flex-col items-center justify-center shadow-xl hover:shadow-[0_0_15px_rgba(244,63,94,0.4)] active:scale-90 select-none cursor-pointer"
              title={ar ? 'إطلاق النار' : 'Shoot'}
            >
              <Crosshair className="w-8 h-8 text-white scale-110" />
              <span className="text-[8px] font-mono ml-0.5 mt-0.5 font-bold uppercase">{activeWeapon.id.replace('_', ' ')}</span>
            </button>
          </div>
        </>
      )}

      {/* GAME OVER DIALOG FLOATING MODALS */}
      {gameOver && (
        <div className="absolute inset-0 z-40 bg-black/85 flex flex-col items-center justify-center p-6 text-center select-none backdrop-blur-md">
          <div className="max-w-md w-full border border-neutral-800 bg-neutral-950/95 rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-4 relative">
            
            {/* Giant Title message card */}
            {gameOver === 'victory' ? (
              <>
                <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500 animate-pulse text-emerald-400">
                  <Trophy className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-bold text-emerald-400 tracking-wide">
                  {ar ? 'تم إكمال المهمة بنجاح!' : 'MISSION LOG RESOLVED!'}
                </h3>
                <p className="text-xs text-neutral-300 max-w-sm leading-relaxed">
                  {ar
                    ? 'كفاحك البطل أثمر عن تأمين السلسلة المطلوبة. تمت إضافة الائتمانات والمكافآت إلى الجرد الخاص بك.'
                    : 'Tactical objectives finalized. Credits bounty and valuable ores added to your central warehouse storage.'}
                </p>

                {/* Rewards report readout */}
                <div className="grid grid-cols-2 gap-2 w-full max-w-sm py-2 px-4 bg-neutral-900 rounded-xl my-1 border border-white/5 text-left font-mono text-[11px]">
                  <div className="text-neutral-400">💳 {ar ? 'ائتمانات: ' : 'Credits: '} <span className="text-amber-400 font-bold">+{missionId === 'exploration' ? 1000 : missionId === 'skirmish' ? 1800 : 4500}</span></div>
                  <div className="text-neutral-400">💎 {ar ? 'بلورات: ' : 'Crystals: '} <span className="text-cyan-400 font-bold">+{missionId === 'exploration' ? 15 : missionId === 'skirmish' ? 25 : 50}</span></div>
                  <div className="text-neutral-400">⚙️ {ar ? 'تيتانيوم: ' : 'Titanium: '} <span className="text-neutral-200 font-bold">+{missionId === 'exploration' ? 8 : missionId === 'skirmish' ? 15 : 35}</span></div>
                  <div className="text-neutral-400">✨ {ar ? 'خبرة: ' : 'Bounty XP: '} <span className="text-emerald-400 font-bold">+{missionId === 'exploration' ? 1500 : missionId === 'skirmish' ? 2500 : 5000}</span></div>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 rounded-full bg-red-500/10 border border-red-500 text-red-500">
                  <RotateCcw className="w-10 h-10 animate-spin-slow" />
                </div>
                <h3 className="text-xl font-bold text-red-500">
                  {ar ? 'تم تدمير بدلة الطاقة الخاصة بك!' : 'SUIT LIFE INTEGRITY CRITICAL'}
                </h3>
                <p className="text-xs text-neutral-300 max-w-sm leading-relaxed">
                  {ar
                    ? 'تجاوز هجوم الخصم مستوى امتصاص تصفيح بدلتك الفسفورية. تراجع وأعد تجميع ترسانتك في الجرد لزيادة مقاومة الدروع.'
                    : 'Armor plating collapsed under plasma impacts. Retreat to orbital garage to upgrade structural defenses.'}
                </p>
              </>
            )}

            {/* Back action */}
            <button
              onClick={() => {
                sound.playClick();
                onBackToMap();
              }}
              className="w-full mt-3 py-2 bg-cyan-400 hover:bg-cyan-300 text-neutral-950 font-bold rounded-xl text-xs transition-all cursor-pointer shadow-[0_4px_12px_rgba(6,182,212,0.25)]"
            >
              {ar ? 'العودة لخريطة الكواكب' : 'Return to Galactic Navigation'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
