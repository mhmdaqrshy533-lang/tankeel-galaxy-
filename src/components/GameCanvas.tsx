/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { 
  Shield, Heart, Zap, Crosshair, ArrowLeftRight, Landmark, Navigation2, 
  RotateCcw, Compass, Trophy, Play, CheckCircle, Eye, Music, Headphones
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

  const [isSniperMode, setIsSniperMode] = useState(false);
  const [sniperScanProgress, setSniperScanProgress] = useState(0);
  const [currentLevel, setCurrentLevel] = useState(() => {
    const saved = localStorage.getItem('tankeel_player_level');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [currentAltitude, setCurrentAltitude] = useState(0);

  const [crystalsCollected, setCrystalsCollected] = useState(0);
  const [enemiesDefeated, setEnemiesDefeated] = useState(0);
  const [baseStatus, setBaseStatus] = useState<'OFFLINE' | 'ONLINE'>('OFFLINE');
  const [bossHp, setBossHp] = useState<number | null>(null);

  // Pilot vehicles tracker
  const [activePilotType, setActivePilotType] = useState<'character' | 'buggy' | 'spaceship'>('character');

  const [gameOver, setGameOver] = useState<'victory' | 'defeat' | null>(null);

  // Cockpit Music Controller & Hardware warning states
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const [showHeadphonesWarning, setShowHeadphonesWarning] = useState(false);

  // Client multi-peer hotspot network states
  const [clientId] = useState(() => 'pilot_' + Math.random().toString(36).substring(2, 9));
  const [activePeers, setActivePeers] = useState<{ [id: string]: { name: string; pos: [number, number, number]; rotY: number; hp: number; isFiring: boolean; pilotType: string; timestamp: number } }>({});
  const [showTankeelAlert, setShowTankeelAlert] = useState(false);
  const [tankeelAlertText, setTankeelAlertText] = useState({ ar: '', en: '' });

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
    isSniper: false, // sniper scope active state
    peers: {} as { [peerId: string]: { id: string; name: string; mesh: THREE.Group; hp: number; targetPos: THREE.Vector3; targetRotY: number; pilotType: string; isFiring: boolean; lastUpdate: number } },
    meshFrozen: false,
    shakeIntensity: 0
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

  const handleCockpitMusicToggle = async () => {
    sound.playClick();
    if (!isMusicPlaying) {
      // Async hardware-sensing for wired headsets
      const hasHeadphones = await sound.checkWiredHeadphones();
      if (!hasHeadphones) {
        // Block the interface with military glassmorphic pop-up warning
        setShowHeadphonesWarning(true);
        return;
      }
      sound.startTribalZamilSynth();
      setIsMusicPlaying(true);
    } else {
      sound.stopTribalZamilSynth();
      setIsMusicPlaying(false);
    }
  };

  const forceStartCockpitMusic = () => {
    sound.playLevelUp();
    sound.startTribalZamilSynth();
    setIsMusicPlaying(true);
    setShowHeadphonesWarning(false);
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

  // Sniper auto-scan Area Clearance -> Level 2 Progression
  useEffect(() => {
    let scanInterval: any = null;
    if (isSniperMode && activePilotType === 'spaceship') {
      scanInterval = setInterval(() => {
        setSniperScanProgress(prev => {
          if (prev >= 100) {
            clearInterval(scanInterval);
            // Promoted to Level 2
            const newLevel = 2;
            setCurrentLevel(newLevel);
            localStorage.setItem('tankeel_player_level', newLevel.toString());
            sound.playLevelUp();
            setIsSniperMode(false);
            stateRef.current.isSniper = false;
            return 0; // reset
          }
          return prev + 10;
        });
      }, 500);
    } else {
      setSniperScanProgress(0);
    }
    return () => clearInterval(scanInterval);
  }, [isSniperMode, activePilotType]);

  // sync active peers from ThreeJS ref into React state for HUD status panels
  useEffect(() => {
    const peerSyncTimer = setInterval(() => {
      const livePeers: typeof activePeers = {};
      Object.keys(stateRef.current.peers).forEach(id => {
        const p = stateRef.current.peers[id];
        livePeers[id] = {
          name: p.name,
          pos: [p.mesh.position.x, p.mesh.position.y, p.mesh.position.z],
          rotY: p.mesh.rotation.y,
          hp: p.hp,
          isFiring: p.isFiring,
          pilotType: p.pilotType,
          timestamp: p.lastUpdate
        };
      });
      setActivePeers(livePeers);
    }, 250);
    return () => clearInterval(peerSyncTimer);
  }, []);

  const triggerTankeelOverdriveKillFeed = (killer: string, victim: string) => {
    sound.triggerTankeelExplosion();
    
    setTankeelAlertText({
      ar: `اصطدام قاتِل! تم التنكيل بـ [${victim}] بواسطة الطيار [${killer}]`,
      en: `Direct Hit! Tankeel Overdrive Executed on [${victim}] by Pilot [${killer}]`
    });
    
    stateRef.current.shakeIntensity = 2.8; 
    stateRef.current.meshFrozen = true;
    setShowTankeelAlert(true);
    
    setTimeout(() => {
      stateRef.current.meshFrozen = false;
      stateRef.current.shakeIntensity = 0;
      setShowTankeelAlert(false);
    }, 4200);
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

    // DECENTRALIZED MULTIPLAYER LOCAL HOTSPOT MESH GATEWAY
    const peersGroup = new THREE.Group();
    worldGroup.add(peersGroup);

    const meshChannel = new BroadcastChannel('tankeel_galactic_mesh');

    // Factory to construct 3D peer geometries representable in WebGL space
    const createPeerModel = (pilotType: string, customColor: string) => {
      const g = new THREE.Group();
      if (pilotType === 'spaceship') {
        // High-Fidelity 3D Stealth Jet Fighter structure
        const body = new THREE.Mesh(
          new THREE.ConeGeometry(1.2, 5.0, 4),
          new THREE.MeshStandardMaterial({ color: 0x0a0d14, metalness: 0.95, roughness: 0.15 })
        );
        body.rotation.x = Math.PI / 2;
        g.add(body);

        const wings = new THREE.Mesh(
          new THREE.BoxGeometry(4.4, 0.08, 1.8),
          new THREE.MeshStandardMaterial({ color: customColor, metalness: 0.9 })
        );
        wings.position.set(0, -0.05, -0.4);
        g.add(wings);

        const canopy = new THREE.Mesh(
          new THREE.SphereGeometry(0.42, 6, 6),
          new THREE.MeshStandardMaterial({ color: 0x06b6d4, transparent: true, opacity: 0.85 })
        );
        canopy.position.set(0, 0.25, 0.7);
        canopy.scale.set(0.8, 0.5, 1.6);
        g.add(canopy);

        // underbelly propulsion vents
        const ventL = new THREE.Mesh(
          new THREE.CylinderGeometry(0.2, 0.22, 0.9, 5),
          new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8 })
        );
        ventL.position.set(-0.35, -0.32, -1.1);
        ventL.rotation.x = Math.PI / 2;
        g.add(ventL);

        const ventR = ventL.clone();
        ventR.position.x = 0.35;
        g.add(ventR);

        // integrated missile rails on wings
        const railL = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.1, 1.8),
          new THREE.MeshStandardMaterial({ color: 0x475569 })
        );
        railL.position.set(-1.9, -0.1, -0.4);
        g.add(railL);

        const railR = railL.clone();
        railR.position.x = 1.9;
        g.add(railR);
      } else if (pilotType === 'buggy') {
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(2.4, 0.7, 3.8),
          new THREE.MeshStandardMaterial({ color: customColor, metalness: 0.8, roughness: 0.3 })
        );
        g.add(body);

        const cab = new THREE.Mesh(
          new THREE.BoxGeometry(1.6, 0.7, 1.9),
          new THREE.MeshStandardMaterial({ color: 0x0e172a, roughness: 0.1 })
        );
        cab.position.set(0, 0.7, 0);
        g.add(cab);
      } else {
        // character soldier
        const body = new THREE.Mesh(
          new THREE.BoxGeometry(0.9, 1.6, 0.9),
          new THREE.MeshStandardMaterial({ color: customColor, metalness: 0.3 })
        );
        body.position.y = 0.8;
        g.add(body);

        const head = new THREE.Mesh(
          new THREE.SphereGeometry(0.32, 6, 6),
          new THREE.MeshStandardMaterial({ color: 0xffdfba })
        );
        head.position.y = 1.75;
        g.add(head);

        // dual-language backplate mesh for peers
        const backplate = new THREE.Mesh(
          new THREE.BoxGeometry(0.7, 0.7, 0.12),
          new THREE.MeshStandardMaterial({ color: 0x050505 })
        );
        backplate.position.set(0, 0.9, -0.48);
        g.add(backplate);
      }

      // Floating nameplate sprite above the pilot
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const tex = new THREE.CanvasTexture(canvas);
      const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.y = pilotType === 'spaceship' ? 2.2 : 1.9;
      sprite.scale.set(3.2, 0.8, 1.0);
      g.add(sprite);

      return { group: g, sprite };
    };

    // Render floating text metrics for active multiplayer components
    const updatePeerLabel = (sprite: THREE.Sprite, name: string, hp: number) => {
      const canvas = sprite.material.map?.image as HTMLCanvasElement;
      if (!canvas) return;
      const tc = canvas.getContext('2d');
      if (tc) {
        tc.clearRect(0, 0, 256, 64);
        tc.fillStyle = 'rgba(2, 4, 12, 0.75)';
        tc.beginPath();
        tc.roundRect(0, 0, 256, 64, 12);
        tc.fill();
        
        tc.lineWidth = 1.8;
        tc.strokeStyle = '#06b6d4';
        tc.stroke();

        tc.fillStyle = '#06b6d4';
        tc.font = 'bold 15px monospace';
        tc.textAlign = 'center';
        tc.fillText(name, 128, 23);

        // HP dynamic progress indicator bar
        tc.fillStyle = 'rgba(255, 255, 255, 0.15)';
        tc.fillRect(28, 40, 200, 10);
        tc.fillStyle = hp > 35 ? '#10b981' : '#ef4444';
        tc.fillRect(28, 40, 200 * (Math.max(0, hp) / 100), 10);
      }
      if (sprite.material.map) {
        sprite.material.map.needsUpdate = true;
      }
    };

    // Sockets packet receiver & synchronization
    meshChannel.onmessage = (event) => {
      const msg = event.data;
      if (!msg) return;

      if (msg.type === 'state') {
        const id = msg.clientId;
        if (id === clientId) return;

        const peers = stateRef.current.peers;
        if (!peers[id]) {
          const modelData = createPeerModel(msg.pilotType, '#d946ef');
          peersGroup.add(modelData.group);
          
          peers[id] = {
            id,
            name: msg.name,
            mesh: modelData.group,
            hp: msg.hp,
            targetPos: new THREE.Vector3(...msg.pos),
            targetRotY: msg.rotY,
            pilotType: msg.pilotType,
            isFiring: msg.isFiring,
            lastUpdate: Date.now()
          };
          updatePeerLabel(modelData.sprite, msg.name, msg.hp);
        } else {
          const peer = peers[id];
          peer.targetPos.set(...msg.pos);
          peer.targetRotY = msg.rotY;
          peer.lastUpdate = Date.now();
          peer.isFiring = msg.isFiring;
          
          if (peer.hp !== msg.hp || peer.name !== msg.name) {
            peer.hp = msg.hp;
            const sprite = peer.mesh.children.find(c => c instanceof THREE.Sprite) as THREE.Sprite;
            if (sprite) {
              updatePeerLabel(sprite, msg.name, msg.hp);
            }
          }
        }
      } else if (msg.type === 'tankeel_kill') {
        triggerTankeelOverdriveKillFeed(msg.killerName, msg.killedName);
      }
    };

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
    // Procedurally create a photorealistic gray cratered astronomical texture with cyan plasma fractures and amber radar markings
    const createMercuryTexture = () => {
      const size = 512;
      const tCanvas = document.createElement('canvas');
      tCanvas.width = size;
      tCanvas.height = size;
      const ctx = tCanvas.getContext('2d')!;

      // Deep dark charcoal gray base soil
      ctx.fillStyle = '#2c2d2f';
      ctx.fillRect(0, 0, size, size);

      // Fine astronomical asteroid grains/noise shade
      for (let i = 0; i < 4000; i++) {
        const x = Math.random() * size;
        const y = Math.random() * size;
        const r = Math.random() * 1.5 + 0.5;
        const col = Math.floor(Math.random() * 32 - 16) + 40;
        ctx.fillStyle = `rgb(${col}, ${col}, ${col})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Procedural craters (shaded inner rings & flat sun highlights)
      for (let i = 0; i < 35; i++) {
        const cx = Math.random() * size;
        const cy = Math.random() * size;
        const cr = Math.random() * 40 + 6;

        ctx.strokeStyle = '#121213'; // shadow rim
        ctx.lineWidth = cr * 0.15;
        ctx.beginPath();
        ctx.arc(cx + cr * 0.08, cy + cr * 0.08, cr, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = '#4b4d50'; // light rim
        ctx.lineWidth = cr * 0.08;
        ctx.beginPath();
        ctx.arc(cx - cr * 0.06, cy - cr * 0.06, cr, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#1e1f20'; // crater center shadow
        ctx.beginPath();
        ctx.arc(cx, cy, cr - 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Deep Neon cyan plasma fracture lines representing electromagnetic anomaly Layer
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 12;
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 10; i++) {
        ctx.beginPath();
        let sx = Math.random() * size;
        let sy = Math.random() * size;
        ctx.moveTo(sx, sy);
        for (let j = 0; j < 4; j++) {
          sx += (Math.random() - 0.5) * 120;
          sy += (Math.random() - 0.5) * 120;
          ctx.lineTo(sx, sy);
        }
        ctx.stroke();
      }
      ctx.shadowBlur = 0; // reset

      // Amber tactical telemetry grids on planetary surface
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 6;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.lineWidth = 1.0;
      for (let i = 0; i < 2; i++) {
        const rx = Math.random() * size;
        const ry = Math.random() * size;
        const rad = Math.random() * 50 + 20;
        ctx.beginPath();
        ctx.arc(rx, ry, rad, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(rx - rad - 5, ry);
        ctx.lineTo(rx + rad + 5, ry);
        ctx.moveTo(rx, ry - rad - 5);
        ctx.lineTo(rx, ry + rad + 5);
        ctx.stroke();
      }
      ctx.shadowBlur = 0; // reset

      return new THREE.CanvasTexture(tCanvas);
    };

    const planetTex = createMercuryTexture();
    const planetBody = new THREE.Mesh(
      new THREE.SphereGeometry(65, 32, 32),
      new THREE.MeshStandardMaterial({
        map: planetTex,
        roughness: 0.9,
        metalness: 0.25,
        emissive: 0x052e3b, // subtle cyan glow feedback
        emissiveMap: planetTex,
      })
    );
    planetBody.position.set(0, -66, -30); // positioned right below plane terrain
    worldGroup.add(planetBody);

    // Ground Terrain generation heightmap
    const landscapeRes = 48;
    const terrainGeo = new THREE.PlaneGeometry(160, 160, landscapeRes, landscapeRes);
    
    // displace vertices procedurally to make jagged mountains, deep valleys, canyons, and craters
    const vertPos = terrainGeo.attributes.position;
    for (let i = 0; i < vertPos.count; i++) {
      const vx = vertPos.getX(i);
      const vy = vertPos.getY(i);
      
      // mathematical wave displacement
      let zVal = Math.sin(vx * 0.06) * Math.cos(vy * 0.06) * 6.5; // taller step hills/cliffs
      zVal += Math.cos(vx * 0.12) * Math.sin(vy * 0.12) * 3.0; // high frequency rough rocks
      
      // jagged mountain cliffs on border matrix
      if (Math.abs(vx) > 30 || Math.abs(vy) > 30) {
        zVal += Math.sign(vx) * 8.0 * Math.pow(Math.abs(vx) / 75, 2);
      }
      
      // deep physical craters displacement
      const craterDist1 = Math.sqrt((vx - 20) ** 2 + (vy - 20) ** 2);
      if (craterDist1 < 15) {
        zVal -= (15 - craterDist1) * 0.8;
      }

      const craterDist2 = Math.sqrt((vx + 35) ** 2 + (vy - 10) ** 2);
      if (craterDist2 < 20) {
        zVal -= (20 - craterDist2) * 0.9;
      }
      
      // crater punch simulation for communications base
      const distFromBase = Math.sqrt((vx + 15) ** 2 + (vy + 25) ** 2);
      if (distFromBase < 18) {
        // flatten base area
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
      // align with dynamic step hills/cliffs vertices calculations
      let hVal = Math.sin(x * 0.06) * Math.cos(z * 0.06) * 6.5;
      hVal += Math.cos(x * 0.12) * Math.sin(z * 0.12) * 3.0;
      
      if (Math.abs(x) > 30 || Math.abs(z) > 30) {
        hVal += Math.sign(x) * 8.0 * Math.pow(Math.abs(x) / 75, 2);
      }
      
      const craterDist1 = Math.sqrt((x - 20) ** 2 + (z - 20) ** 2);
      if (craterDist1 < 15) {
        hVal -= (15 - craterDist1) * 0.8;
      }

      const craterDist2 = Math.sqrt((x + 35) ** 2 + (z - 10) ** 2);
      if (craterDist2 < 20) {
        hVal -= (20 - craterDist2) * 0.9;
      }

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

    // Shifting torso and head upwards to allow dedicated lower limbs legs
    // Glossy metallic Power armor torso
    const armorSuit = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.5, 1.4, 6),
      new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.15 })
    );
    armorSuit.position.y = 1.35; // shifted up
    playerGroup.add(armorSuit);

    // Glowing electronic helmet/visor
    const helmet = new THREE.Mesh(
      new THREE.SphereGeometry(0.55, 6, 6),
      new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8, roughness: 0.2 })
    );
    helmet.position.y = 2.45; // shifted up corresponding to torso
    playerGroup.add(helmet);

    const visorGlow = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 0.2, 0.4),
      new THREE.MeshBasicMaterial({ color: 0x06b6d4 }) // cyan glowing visor line
    );
    visorGlow.position.set(0, 2.45, 0.45);
    playerGroup.add(visorGlow);

    // Suit jetpack cylinder
    const jetpack = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.32, 1.1, 5),
      new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.7 })
    );
    jetpack.position.set(0, 1.4, -0.55);
    playerGroup.add(jetpack);

    // DEDICATED LOWER-LIMB STRUCTURES (رجلين) for running/walking animation cycles
    const legLGroup = new THREE.Group();
    legLGroup.position.set(-0.32, 0.75, 0);
    const legL = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.12, 0.8, 5),
      new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8, roughness: 0.3 })
    );
    legL.position.y = -0.4;
    legLGroup.add(legL);
    playerGroup.add(legLGroup);

    const legRGroup = new THREE.Group();
    legRGroup.position.set(0.32, 0.75, 0);
    const legR = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.12, 0.8, 5),
      new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.8, roughness: 0.3 })
    );
    legR.position.y = -0.4;
    legRGroup.add(legR);
    playerGroup.add(legRGroup);

    // CUSTOM CANVAS TACTICAL BALLISTIC VEST BACKPLATE
    const createVestBackplateTexture = () => {
      const vCanvas = document.createElement('canvas');
      vCanvas.width = 256;
      vCanvas.height = 128;
      const vCtx = vCanvas.getContext('2d')!;

      // Deep military carbon black background
      vCtx.fillStyle = '#111827';
      vCtx.fillRect(0, 0, 256, 128);

      // Warning hazard borders
      vCtx.fillStyle = '#eab308'; // Amber border
      vCtx.fillRect(8, 8, 240, 6);
      vCtx.fillStyle = '#ef4444'; // Red stripe
      vCtx.fillRect(8, 114, 240, 6);

      // Arabic Title "تنكيل"
      vCtx.fillStyle = '#f8fafc';
      vCtx.font = 'bold 30px system-ui, sans-serif';
      vCtx.textAlign = 'center';
      vCtx.fillText('تَـنْـكِـيـل', 128, 52);

      // English Title "TANKEEL"
      vCtx.fillStyle = '#22d3ee'; // Neon Cyan
      vCtx.font = 'bold 20px monospace';
      vCtx.fillText('TANKEEL', 128, 92);

      return new THREE.CanvasTexture(vCanvas);
    };

    const vestBackplateTex = createVestBackplateTexture();
    const vestBackplate = new THREE.Mesh(
      new THREE.BoxGeometry(0.85, 1.0, 0.1),
      new THREE.MeshStandardMaterial({
        map: vestBackplateTex,
        roughness: 0.75,
        metalness: 0.1,
      })
    );
    vestBackplate.position.set(0, 1.35, -0.42); // attach flush centered on torso's back
    playerGroup.add(vestBackplate);

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
      // spawns dynamic entities depending on mission difficulty and player levels (المستوى الثاني)
      const levelMultiplier = stats.level > 1 ? 1.5 : 1.0;
      const speedMultiplier = stats.level > 1 ? 1.25 : 1.0;

      const specs: { x: number; z: number; type: 'ghost' | 'stone' | 'drone' | 'boss'; hp: number; speed: number }[] = [
        { x: -5, z: 8, type: 'ghost', hp: Math.round(30 * levelMultiplier), speed: 0.05 * speedMultiplier },
        { x: 18, z: 5, type: 'ghost', hp: Math.round(30 * levelMultiplier), speed: 0.05 * speedMultiplier },
        { x: -10, z: -18, type: 'stone', hp: Math.round(60 * levelMultiplier), speed: 0.02 * speedMultiplier },
        { x: -28, z: -28, type: 'drone', hp: Math.round(25 * levelMultiplier), speed: 0.04 * speedMultiplier },
      ];

      // Add extra if medium or hard
      if (missionId !== 'exploration') {
        specs.push(
          { x: -16, z: -32, type: 'drone', hp: Math.round(25 * levelMultiplier), speed: 0.04 * speedMultiplier },
          { x: 3, z: -15, type: 'stone', hp: Math.round(60 * levelMultiplier), speed: 0.02 * speedMultiplier },
          { x: -30, z: 2, type: 'ghost', hp: Math.round(30 * levelMultiplier), speed: 0.05 * speedMultiplier },
          { x: -12, z: -2, type: 'stone', hp: Math.round(60 * levelMultiplier), speed: 0.02 * speedMultiplier }
        );
      }

      // Add advanced High-Altitude fighter drones if Level 2 is unlocked!
      if (stats.level > 1) {
        specs.push(
          { x: -5, z: -15, type: 'drone', hp: 40, speed: 0.06 },
          { x: 20, z: -22, type: 'drone', hp: 40, speed: 0.06 }
        );
      }

      // Add Boss Golem if HARD BOSS FIGHT
      if (missionId === 'boss_fight') {
        specs.push({
          x: -15, z: -42, type: 'boss', hp: Math.round(350 * levelMultiplier), speed: 0.015 * speedMultiplier
        });
        const finalBossHp = Math.round(350 * levelMultiplier);
        stateRef.current.bossHp = finalBossHp;
        setBossHp(finalBossHp);
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

      const rawDelta = Math.min(0.05, clock.getDelta());
      const delta = stateRef.current.meshFrozen ? 0 : rawDelta;
      
      const inputs = stateRef.current.inputs;
      const step = stateRef.current.cinematicStep;

      // HIGH PERFORMANCE PEER COORDINATES BROADCAST CHANNELS
      const nowMs = Date.now();
      if (!(window as any).__lastTankeelBroadcast) {
        (window as any).__lastTankeelBroadcast = 0;
      }
      if (nowMs - (window as any).__lastTankeelBroadcast > 50 && cinematicStep === 'NONE' && !stateRef.current.meshFrozen) {
        (window as any).__lastTankeelBroadcast = nowMs;
        let activeEntityObj: THREE.Object3D | null = null;
        if (stateRef.current.activePilotType === 'character') activeEntityObj = playerGroup;
        else if (stateRef.current.activePilotType === 'buggy') activeEntityObj = buggyGroup;
        else activeEntityObj = shipGroup;

        if (activeEntityObj) {
          meshChannel.postMessage({
            type: 'state',
            clientId: clientId,
            name: stats.isMasterMode 
              ? (ar ? 'المهندس سهيل الهزبري' : 'Eng. Suhail Al-Hazbari')
              : (ar ? 'الطيار التكتيكي ألفا' : 'Pilot Tactical Alpha'),
            pos: [activeEntityObj.position.x, activeEntityObj.position.y, activeEntityObj.position.z],
            rotY: activeEntityObj.rotation.y,
            pilotType: stateRef.current.activePilotType,
            isFiring: (window as any).__triggerLaserShot || inputs.space,
            hp: stateRef.current.playerHp,
            timestamp: nowMs
          });
          (window as any).__triggerLaserShot = false;
        }
      }

      // SIMULATED COOPERATIVE PILOTS SIMULATOR & REMOTE PEERS INTERPOLATOR
      if (!(window as any).__simulatedPilotsSetup) {
        (window as any).__simulatedPilotsSetup = true;
        (window as any).__simulatedSpawnTime = nowMs;
      }
      const peerKeysList = Object.keys(stateRef.current.peers);
      if (peerKeysList.filter(k => !k.startsWith('sim_')).length === 0 && nowMs - (window as any).__simulatedSpawnTime > 2500 && cinematicStep === 'NONE') {
        // Safe to populate active battlefield with 2 simulated peer pilots!
        const bNames = ar 
          ? ['العميد الفضائي رعد', 'مطور اللعبة روبوت ميكا'] 
          : ['Spacer Commander Raad', 'Tankeel Mech Autopilot'];
          
        const configs = [
          { id: 'sim_1', name: bNames[0], color: '#3b82f6', pos: [-25, 24, 10], type: 'spaceship' },
          { id: 'sim_2', name: bNames[1], color: '#f97316', pos: [35, 0, -20], type: 'buggy' }
        ];

        configs.forEach(bc => {
          if (!stateRef.current.peers[bc.id]) {
            const mData = createPeerModel(bc.type, bc.color);
            peersGroup.add(mData.group);
            mData.group.position.set(bc.pos[0], bc.pos[1], bc.pos[2]);
            
            stateRef.current.peers[bc.id] = {
              id: bc.id,
              name: bc.name,
              mesh: mData.group,
              hp: 100,
              targetPos: new THREE.Vector3(...bc.pos),
              targetRotY: 0,
              pilotType: bc.type,
              isFiring: false,
              lastUpdate: nowMs
            };
            updatePeerLabel(mData.sprite, bc.name, 100);
          }
        });
      }

      // Run real-time lerp transitions and motion paths for remote and simulated bots
      Object.keys(stateRef.current.peers).forEach(id => {
        const peer = stateRef.current.peers[id];
        if (id.startsWith('sim_') && peer.hp > 0 && !stateRef.current.meshFrozen && cinematicStep === 'NONE') {
          const tFactor = nowMs * 0.001;
          if (id === 'sim_1') {
            const x = -25 + Math.sin(tFactor * 0.45) * 32;
            const z = 10 + Math.cos(tFactor * 0.45) * 32;
            const y = 26 + Math.sin(tFactor * 0.9) * 10;
            peer.mesh.position.set(x, y, z);
            peer.mesh.rotation.y = tFactor * 0.45 + Math.PI / 2;

            if (Math.random() < 0.02) {
              peer.isFiring = true;
              // spawn beautiful pink tracer lasers
              const laserMat = new THREE.MeshBasicMaterial({ color: 0xec4899 });
              const laserBeam = new THREE.Mesh(laserBeamGeo, laserMat);
              laserBeam.rotation.x = Math.PI / 2;
              laserBeam.rotation.y = peer.mesh.rotation.y;
              laserBeam.position.copy(peer.mesh.position);
              worldGroup.add(laserBeam);

              const pHeading = peer.mesh.rotation.y;
              const pDir = new THREE.Vector3(Math.sin(pHeading), 0.1, Math.cos(pHeading)).normalize();
              playerBullets.push({
                mesh: laserBeam,
                vel: pDir.multiplyScalar(32.0),
                life: 1.2
              });
            } else {
              peer.isFiring = false;
            }
          } else {
            const x = 20 + Math.cos(tFactor * 0.55) * 25;
            const z = -20 + Math.sin(tFactor * 0.55) * 25;
            peer.mesh.position.set(x, getTerrainHeight(x, z), z);
            peer.mesh.rotation.y = -tFactor * 0.55;
          }
        } else if (!id.startsWith('sim_')) {
          peer.mesh.position.lerp(peer.targetPos, 0.15);
          peer.mesh.rotation.y = THREE.MathUtils.lerp(peer.mesh.rotation.y, peer.targetRotY, 0.15);
          
          if (nowMs - peer.lastUpdate > 8000) {
            peersGroup.remove(peer.mesh);
            delete stateRef.current.peers[id];
          }
        }
      });

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
          // If Space is held, engage vertical thursters to ascend rapidly into the upper orbit dogfight layer!
          if (stateRef.current.inputs.space) {
            activeEntity.position.y += delta * 15.0; // rapid ascend
          } else {
            // damp altitude back to normal hover height over landscape if no fly input
            activeEntity.position.y += (terrainH + 4.5 - activeEntity.position.y) * 0.05;
          }
          activeEntity.position.y = Math.max(terrainH + 3.0, activeEntity.position.y);
        }

        // Atmospheric layer telemetry & transition checks
        const altVal = Math.round(activeEntity.position.y);
        if (Math.floor(durationInIntro * 10) % 3 === 0) {
          setCurrentAltitude(altVal);
        }

        const inOrbitLayer = activeEntity.position.y > 18.0;
        if (inOrbitLayer) {
          // Cross atmospheric barrier: thin out fog for deep space view, accelerate Mercury's rotation
          if (scene.fog && 'density' in scene.fog) {
            scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, 0.003, 0.08);
          }
          planetBody.rotation.y += delta * 0.18;
        } else {
          if (scene.fog && 'density' in scene.fog) {
            scene.fog.density = THREE.MathUtils.lerp(scene.fog.density, 0.015, 0.08);
          }
        }

        // Jointed limbs independent leg-swing animations on movement
        if (pilot === 'character') {
          if (moveX !== 0 || moveZ !== 0) {
            const legSwingSpeed = 13.5;
            const legSwingAmplitude = 0.55;
            legLGroup.rotation.x = Math.sin(durationInIntro * legSwingSpeed) * legSwingAmplitude;
            legRGroup.rotation.x = -Math.sin(durationInIntro * legSwingSpeed) * legSwingAmplitude;
          } else {
            legLGroup.rotation.x += (0 - legLGroup.rotation.x) * 0.18;
            legRGroup.rotation.x += (0 - legRGroup.rotation.x) * 0.18;
          }
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

          // HIGH-PRECISION DECENTRALIZED MULTIPLAYER PEER COLLISION matrix
          Object.keys(stateRef.current.peers).forEach((peerId) => {
            const peer = stateRef.current.peers[peerId];
            if (peer.hp > 0 && pb.life > 0) {
              const peerDist = pb.mesh.position.distanceTo(peer.mesh.position);
              // Bounding box approximate sphere radius for combat units is 2.8 units
              if (peerDist < 2.8) {
                // Instantly absorb kinetic force registering direct damage structure
                peer.hp = Math.max(0, peer.hp - 20);
                pb.life = 0; // absorb projectile on target impact

                // Broadcast local high-priority Tankeel overdrive kill-feed across all connected network nodes when health drops to 0!
                if (peer.hp <= 0) {
                  const killerName = stats.isMasterMode 
                    ? (ar ? 'المهندس سهيل الهزبري' : 'Eng. Suhail Al-Hazbari')
                    : (ar ? 'الطيار التكتيكي ألفا' : 'Pilot Tactical Alpha');

                  meshChannel.postMessage({
                    type: 'tankeel_kill',
                    killerName,
                    killedName: peer.name
                  });

                  // Execute locally immediately to guarantee instant response overlay
                  triggerTankeelOverdriveKillFeed(killerName, peer.name);
                } else {
                  // Sync updated peer label
                  const sprite = peer.mesh.children.find(c => c instanceof THREE.Sprite) as THREE.Sprite;
                  if (sprite) {
                    updatePeerLabel(sprite, peer.name, peer.hp);
                  }
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

              const speedScaler = stats.level > 1 ? 1.42 : 1.0;
              const reFireScaler = stats.level > 1 ? 1.6 : 1.0;

              // move closer but maintain buffer distance
              if (distToPlayer > (enemy.type === 'drone' ? 8 : enemy.type === 'boss' ? 12 : 1.5)) {
                const stepVec = new THREE.Vector3()
                  .subVectors(activeEntity.position, enemy.mesh.position)
                  .normalize();
                enemy.mesh.position.addScaledVector(stepVec, enemy.speed * (1.0 + delta) * speedScaler);
                
                // Lift hostiles into upper high-orbit layer for sci-fi dogfights if the spacecraft climbed
                if (inOrbitLayer) {
                  enemy.mesh.position.y += (activeEntity.position.y - enemy.mesh.position.y) * 0.05;
                } else if (enemy.type === 'drone') {
                  enemy.mesh.position.y = getTerrainHeight(enemy.mesh.position.x, enemy.mesh.position.z) + 3.0;
                } else {
                  enemy.mesh.position.y = getTerrainHeight(enemy.mesh.position.x, enemy.mesh.position.z);
                }
              }

              // Shoot weapon at character
              enemy.shootCooldown -= delta * reFireScaler; // scaled attack pacing
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

        let shakeOffset = new THREE.Vector3();
        if (stateRef.current.shakeIntensity > 0) {
          const intensity = stateRef.current.shakeIntensity;
          shakeOffset.set(
            (Math.random() - 0.5) * intensity,
            (Math.random() - 0.5) * intensity,
            (Math.random() - 0.5) * intensity
          );
        }

        camera.position.x += (targetX - camera.position.x) * 0.12 + shakeOffset.x;
        camera.position.y += (targetY - camera.position.y) * 0.12 + shakeOffset.y;
        camera.position.z += (targetZ - camera.position.z) * 0.12 + shakeOffset.z;

        // lock target slightly above character core
        const lookT = activeEntity.position.clone();
        lookT.y += pilot === 'character' ? 1.3 : 0.8;
        camera.lookAt(lookT);

        // Linear matrix transformation zoom representing tactical high magnification cockpit visor
        if (stateRef.current.isSniper && pilot === 'spaceship') {
          camera.fov = THREE.MathUtils.lerp(camera.fov, 11, 0.2); // Magnify targeting view
        } else {
          camera.fov = THREE.MathUtils.lerp(camera.fov, 54, 0.2); // restore standard FOV
        }
        camera.updateProjectionMatrix();
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

      {/* HOLOGRAPHIC RED SNIPER SCOPE RETICLE OVERLAY when Sniper mode is active */}
      {isSniperMode && activePilotType === 'spaceship' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
          <div className="relative w-[320px] h-[320px] md:w-[440px] md:h-[440px] rounded-full border-2 border-red-500/40 p-4 flex items-center justify-center shadow-[0_0_60px_rgba(239,68,68,0.25)] animate-pulse">
            {/* crosshairs lines */}
            <div className="absolute w-[480px] h-0.5 bg-red-500/30" />
            <div className="absolute w-0.5 h-[480px] bg-red-500/30" />
            
            {/* tick cross dividers */}
            <div className="absolute w-12 h-0.5 bg-red-500 top-1/2 left-4 animate-pulse" />
            <div className="absolute w-12 h-0.5 bg-red-500 top-1/2 right-4 animate-pulse" />
            <div className="absolute h-12 w-0.5 bg-red-500 left-1/2 top-4 animate-pulse" />
            <div className="absolute h-12 w-0.5 bg-red-500 left-1/2 bottom-4 animate-pulse" />

            {/* active locked lens center */}
            <div className="w-10 h-10 border border-red-500/80 rounded-full flex items-center justify-center animate-spin">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            </div>

            {/* overlay indicators */}
            <span className="absolute top-12 font-mono text-[9px] text-red-500 font-bold tracking-widest bg-black/60 px-2.5 py-0.5 rounded border border-red-500/30">
              {ar ? 'تَعْقِيبُ الْهُدَفِ: نِشاطُ الْقَنُصِ' : 'TARGET ACQUISITION: ACTIVE'}
            </span>
            <span className="absolute bottom-12 font-mono text-[8px] text-red-400 font-bold tracking-wider bg-black/60 px-2 py-0.5 rounded border border-red-500/20">
              {ar ? 'الزوم الْمُتَعَدِّدُ: 4.5X ليزر' : 'ZOOM AMPLIFIED: 4.5X RAIL'}
            </span>

            {/* SCAN PROGRESS BAR */}
            <div className="absolute bottom-6 w-48 h-1.5 bg-black/60 border border-red-500/30 rounded-full overflow-hidden">
              <div 
                className="h-full bg-red-500 transition-all duration-300 ease-linear shadow-[0_0_10px_rgba(239,68,68,0.8)]"
                style={{ width: `${sniperScanProgress}%` }}
              />
            </div>
            <span className="absolute bottom-2 font-mono text-[7px] text-red-500 font-bold">
              {ar ? 'تصفية النطاق الجوي...' : 'CLEARING SECTOR...'} {sniperScanProgress}%
            </span>
          </div>
        </div>
      )}

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
          {/* Holographic Hotspot Multi-Peer Tactical Mesh Grid Panel */}
          <div className="absolute top-24 left-2 z-10 w-44 bg-black/55 border border-cyan-500/20 rounded-xl p-2 font-mono text-[9px] backdrop-blur-md text-left flex flex-col gap-1 shadow-[0_0_12px_rgba(6,182,212,0.1)]">
            <div className="flex justify-between items-center border-b border-cyan-500/20 pb-1 text-cyan-400 font-bold tracking-wider">
              <span>🛰️ {ar ? 'شبكة النظير المحلية' : 'LOCAL HOTSPOT MESH'}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <div className="text-[8px] text-neutral-400 flex flex-col gap-0.5 mt-1 max-h-[140px] overflow-y-auto">
              <div className="flex justify-between text-cyan-300 font-mono">
                <span>{ar ? 'معرّف الجهاز:' : 'NODE_ID:'}</span>
                <span className="text-neutral-300 font-bold">{clientId}</span>
              </div>
              <div className="flex justify-between text-neutral-400 font-mono">
                <span>{ar ? 'المنظومة:' : 'BANDWIDTH:'}</span>
                <span className="text-neutral-300">240 ms/sync</span>
              </div>
              
              {/* Render lists of connected nodes */}
              <div className="border-t border-neutral-800 my-1 pt-1 font-bold text-amber-500">
                {ar ? 'الطيارون المتصلون:' : 'ACTIVE HOTSPOTS MAPPED:'}
              </div>
              {Object.keys(activePeers).length === 0 ? (
                <div className="text-neutral-500 italic block">{ar ? 'رصد طيارين...' : 'Scanning for pilot nodes...'}</div>
              ) : (
                Object.keys(activePeers).map(pId => {
                  const p = activePeers[pId];
                  return (
                    <div key={pId} className="flex flex-col border-b border-neutral-900 pb-1 mb-1 gap-0.5">
                      <div className="flex justify-between font-bold text-neutral-100">
                        <span className="truncate max-w-[90px]">{p.name}</span>
                        <span className={p.hp > 0 ? 'text-emerald-400 font-bold' : 'text-red-500 animate-pulse font-bold'}>
                          {p.hp > 0 ? `${p.hp}%` : 'DOWN'}
                        </span>
                      </div>
                      <div className="flex justify-between text-neutral-500 text-[7px]">
                        <span>X: {p.pos[0].toFixed(1)} Z: {p.pos[2].toFixed(1)}</span>
                        <span className="capitalize text-cyan-400 font-bold">{p.pilotType}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {/* Proud master developer signature right on the console panel */}
            <div className="border-t border-cyan-500/10 mt-1 pt-1.5 text-[7px] text-cyan-400/40 text-center uppercase tracking-tighter">
              {ar ? 'برمجة المهندس/ سهيل الهزبري' : 'Arch. By Eng. Suhail Al-Hazbari'}
            </div>
          </div>

          {/* Master Developer Neon Watermark */}
          <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 text-center select-none pointer-events-none">
            <div className="text-[10px] md:text-xs font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-amber-300 to-cyan-400 tracking-[0.25em] drop-shadow-[0_0_8px_rgba(6,182,212,0.6)] uppercase animate-pulse">
              برمجة المهندس/ سهيل الهزبري
            </div>
            <div className="text-[7.5px] md:text-[8.5px] font-mono tracking-[0.3em] text-cyan-400/80 uppercase mt-0.5 font-bold">
              هندسة المحركات للمهندس سهيل الهزبري
            </div>
          </div>
          {/* Top-Center Glassmorphic Cockpit Music Controller (135 BPM Tribal Synth) */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 bg-cyan-950/45 border border-cyan-500/35 py-1.5 px-3.5 rounded-2xl backdrop-blur-md shadow-[0_0_15px_rgba(6,182,212,0.15)] max-w-xs md:max-w-md">
            <button
              onClick={handleCockpitMusicToggle}
              className={`w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-all ${
                isMusicPlaying
                  ? 'bg-red-500/90 animate-pulse text-white shadow-[0_0_10px_rgba(239,68,68,0.4)] border border-red-400'
                  : 'bg-cyan-500 text-neutral-950 hover:bg-cyan-400'
              }`}
            >
              {isMusicPlaying ? (
                <span className="w-2 h-2 bg-white rounded-xs" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              )}
            </button>
            <div className="flex flex-col text-left">
              <span className="text-[7.5px] font-mono font-bold tracking-[0.2em] text-cyan-400 uppercase leading-none">
                {ar ? 'الإذاعة العسكرية' : 'COCKPIT BAND LINK'}
              </span>
              <span className="text-[9px] font-mono font-medium text-neutral-200 mt-0.5 truncate max-w-[125px] md:max-w-[185px] leading-tight">
                {isMusicPlaying ? (ar ? 'زامل ترايبال (١٣٥ محاكاة)' : 'Tankeel: 135 Tribal Synth') : (ar ? 'البث مغلق' : 'PLAYER STANDBY')}
              </span>
            </div>
            {isMusicPlaying && (
              <div className="flex items-center gap-0.5 h-3.5 min-w-[18px]">
                <div className="w-[1.5px] bg-cyan-400 rounded-full animate-pulse h-1" />
                <div className="w-[1.5px] bg-cyan-400 rounded-full animate-bounce h-2" style={{ animationDelay: '0.1s' }} />
                <div className="w-[1.5px] bg-cyan-400 rounded-full animate-bounce h-3.5" style={{ animationDelay: '0.2s' }} />
                <div className="w-[1.5px] bg-cyan-400 rounded-full animate-bounce h-2" style={{ animationDelay: '0.3s' }} />
                <div className="w-[1.5px] bg-cyan-400 rounded-full animate-pulse h-1" />
              </div>
            )}
          </div>

          {/* Top-Left: Mini Radar Scan */}
          <div className="absolute top-2 left-2 z-10 flex items-center gap-2 bg-black/60 border border-cyan-500/20 py-1.5 px-2 rounded-xl backdrop-blur-md">
            <canvas ref={miniMapRef} width="70" height="70" className="w-11 h-11 bg-neutral-950 rounded-full border border-cyan-500/20" />
            <div className="flex flex-col text-[9px] font-mono leading-none py-1 text-neutral-400">
              <span className="text-cyan-400 font-bold">{ar ? 'الرادار النشط' : 'RADAR LINK'}</span>
              <span className="mt-1 font-mono hover:text-cyan-400 text-neutral-300">Level: {currentLevel}</span>
              <span className="mt-1 font-mono hover:text-cyan-400 text-neutral-300">Cryst: {crystalsCollected}/5</span>
              <span className="mt-1 font-mono hover:text-cyan-400 text-neutral-300">Elims: {enemiesDefeated}</span>
              <span className="mt-1 font-mono text-amber-400 font-bold">
                {ar ? 'الارتفاع: ' : 'ALT: '}{currentAltitude}m
                {currentAltitude >= 18 && (
                  <span className="text-red-500 ml-1 font-black animate-pulse">[ORBIT]</span>
                )}
              </span>
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
               {/* Interactive cockpit Sniper-Scope Button (زر العدسة) */}
               {activePilotType === 'spaceship' && (
                 <button
                   onClick={() => {
                     sound.playClick();
                     const nextSniper = !isSniperMode;
                     setIsSniperMode(nextSniper);
                     stateRef.current.isSniper = nextSniper;
                   }}
                   className={`w-12 h-12 rounded-full flex flex-col items-center justify-center shadow-lg active:scale-90 transition-all select-none cursor-pointer border ${
                     isSniperMode 
                       ? 'bg-red-500/90 text-white border-red-300 animate-pulse font-bold' 
                       : 'bg-neutral-900/90 border-neutral-700 text-red-500 hover:border-red-500'
                   }`}
                   title={ar ? 'منظار القنص / زر العدسة' : 'Sniper Scope'}
                 >
                   <Eye className="w-5 h-5" />
                   <span className="text-[7px] font-mono uppercase leading-none mt-0.5 font-bold">SCOPE</span>
                 </button>
               )}

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

      {/* MILITARY GLASSMORPHIC DIALOG MODAL ON HEADPHONES NOT DETECTED */}
      {showHeadphonesWarning && (
        <div className="absolute inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-6 text-center select-none backdrop-filter backdrop-blur-[16px]">
          <div className="max-w-md w-full border border-red-500/40 bg-red-950/20 backdrop-blur-xl rounded-2xl p-6 shadow-[0_0_35px_rgba(239,68,68,0.25)] flex flex-col items-center gap-4 relative">
            <div className="p-4 rounded-full bg-red-500/10 border border-red-500 text-red-500">
              <Headphones className="w-10 h-10 animate-pulse text-red-500" />
            </div>

            <h3 className="text-sm font-black text-red-400 uppercase tracking-widest font-mono">
              {ar ? 'بروتوكول البث المشفر: مطلوب سماعة' : 'SECURE AUDIO PIPELINE REQUISITION'}
            </h3>

            <div className="bg-black/40 border border-red-500/20 p-3 rounded-xl font-sans text-xs space-y-2 leading-relaxed text-center">
              <p className="text-neutral-100 font-bold">
                {ar 
                  ? '⚠️ تنبيه عسكري: يرجى توصيل سماعة الأذن السلكية الجديدة لعيش جو الحرب الحماسي!' 
                  : '⚠️ MILITARY ALERT: Please connect a wired headset first to experience the intense battle atmosphere!'}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full mt-2">
              <button
                onClick={async () => {
                  sound.playClick();
                  const headphonesCheck = await sound.checkWiredHeadphones();
                  if (headphonesCheck) {
                    forceStartCockpitMusic();
                  } else {
                    alert(ar ? 'سماعة الرفع غير مكتشفة بعد. جرب تجاوز البروتوكول.' : 'Secure hardware sensor failed to detect headphone jack signature. Try overriding.');
                  }
                }}
                className="flex-1 py-2 bg-neutral-900 border border-red-500/30 hover:border-red-500 text-red-400 rounded-xl text-xs font-mono font-bold hover:bg-red-500/10 cursor-pointer transition-all"
              >
                {ar ? 'إعادة الفحص الدقيق 🔍' : 'Check Hardware Sensor 🔍'}
              </button>

              <button
                onClick={forceStartCockpitMusic}
                className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-neutral-950 rounded-xl text-xs font-bold hover:opacity-90 cursor-pointer shadow-[0_4px_12px_rgba(245,158,11,0.25)] transition-all"
              >
                {ar ? 'تجاوز بروتوكول الأمان ⚡' : 'Bypass Secure Protocol ⚡'}
              </button>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setShowHeadphonesWarning(false);
              }}
              className="mt-1 text-[10px] font-mono text-neutral-500 hover:text-neutral-300 underline cursor-pointer"
            >
              {ar ? 'إلغاء الأمر' : 'Disconnect Audio Link'}
            </button>
          </div>
        </div>
      )}

      {/* TANKEEL OVERDRIVE KILL ALERT SECTION */}
      {showTankeelAlert && (
        <div className="absolute inset-0 z-50 bg-black/85 flex flex-col items-center justify-center p-6 text-center select-none backdrop-filter backdrop-blur-[16px]">
          <div className="max-w-xl w-full border-2 border-red-500 bg-red-950/20 backdrop-blur-2xl rounded-2xl p-8 shadow-[0_0_50px_rgba(239,68,68,0.4)] flex flex-col items-center gap-5 relative overflow-hidden">
            {/* Outer hazard border */}
            <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600 animate-pulse" />
            
            <div className="p-5 rounded-full bg-red-500/10 border border-red-500 text-red-500">
              <Crosshair className="w-12 h-12 text-red-500" />
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-400 to-red-600 leading-none tracking-wider uppercase font-mono animate-pulse">
              {ar ? '⚠️ تم التنكيل بالأهداف' : '⚠️ ELIMINATION REGISTERED'}
            </h1>

            <div className="p-4 bg-black/60 border border-red-500/30 rounded-xl space-y-3 w-full font-mono">
              <p className="text-sm md:text-base font-bold text-red-400 leading-relaxed">
                {ar ? tankeelAlertText.ar : tankeelAlertText.en}
              </p>
              <p className="text-[10px] text-neutral-400 leading-relaxed text-left">
                {ar 
                  ? 'بروتوكول الأوفر درايف النشط: تم تجميد حركة جميع الأجهزة المتصلة مؤقتاً لتزامن بيانات الانفجار عالي التردد.' 
                  : 'Tactical Overdrive protocol active: Freeze command dispatched to all connected clients to synchronize high-frequency kinetic outputs.'}
              </p>
            </div>

            {/* Glowing Master Watermark */}
            <div className="border-t border-neutral-800 w-full pt-4 mt-1 text-center">
              <div className="text-[11px] font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-amber-300 to-cyan-400 tracking-[0.2em] font-bold">
                برمجة المهندس/ سهيل الهزبري
              </div>
              <div className="text-[8px] font-mono tracking-[0.25em] text-cyan-400/70 uppercase mt-1 font-bold">
                هندسة المحركات للمهندس سهيل الهزبري
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
