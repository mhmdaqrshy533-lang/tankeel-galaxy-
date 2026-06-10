/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  GameState, PlayerStats, Planet, Mission, Weapon, Vehicle, Achievement, GameSettings, PlanetId, MissionId, WeaponId, VehicleId, Drone, DroneId
} from './types/game';
import AndroidFrame from './components/AndroidFrame';
import MainMenu from './components/MainMenu';
import PlanetMap from './components/PlanetMap';
import SettingsPanel from './components/SettingsPanel';
import WarehousePanel from './components/WarehousePanel';
import GaragePanel from './components/GaragePanel';
import AchievementsPanel from './components/AchievementsPanel';
import AboutPanel from './components/AboutPanel';
import GameCanvas from './components/GameCanvas';
import ActivationScreen from './components/ActivationScreen';
import DronesPanel from './components/DronesPanel';
import SplashOverlay from './components/SplashOverlay';
import { sound } from './utils/sound';

// Initial default settings state
const defaultSettings: GameSettings = {
  graphicsQuality: 'high',
  volume: 75,
  cameraSensitivity: 5,
  language: 'ar',
  vibration: true,
};

// Initial default progression state
const defaultPlayerStats: PlayerStats = {
  xp: 0,
  level: 1,
  credits: 500, // starting funds for act I
  resources: {
    crystals: 3,
    titanium: 1,
    plasma_cells: 0,
  },
  currentWeapon: 'energy_rifle',
  currentVehicle: 'buggy',
  currentDrone: 'none',
  unlockedPlanets: ['mercury_x'],
  unlockedWeapons: ['energy_rifle'],
  unlockedVehicles: ['buggy'],
  unlockedDrones: ['none'],
};

// List of available autonomous drones
const initialDrones: Drone[] = [
  {
    id: 'none',
    nameAr: 'بدون مرافق طائر',
    nameEn: 'No Floating Companion',
    descriptionAr: 'لا يوجد مساعد جوي مجهز. لن تحصل على ميزات الجمع والتحصين التلقائية.',
    descriptionEn: 'No active aerial drone companion. Demotes passive buffs or helper shields.',
    type: 'buff',
    buffType: 'shield',
    unlocked: true,
    cost: 0,
    color: '#4b5563',
    elementColor: '#4b5563',
  },
  {
    id: 'scout_drone',
    nameAr: 'درون الحصاد والجمع التلقائي',
    nameEn: 'Ore Siphoning Scout Drone',
    descriptionAr: 'مستكشف طائر لجمع بلورات بل البلازما ومعدن الرصاص تلقائياً وجلبها إليك بمجال 15 متراً.',
    descriptionEn: 'Hovering collector with vacuum siphons. Automatically vacuums nearby energy crystals during missions.',
    type: 'loot',
    buffType: 'speed',
    unlocked: false,
    cost: 1500,
    color: '#06b6d4',
    elementColor: '#06b6d4',
  },
  {
    id: 'shield_drone',
    nameAr: 'حارس الدروع ومجدد الصحة وممتص الصدمات',
    nameEn: 'Guardian Protective Shield',
    descriptionAr: 'رفيق دفاعي يزيد درع بدلتك لسرعة الشحن X4، ويقوم بإصلاح دروع وهياكل العربات المتضررة ببطء.',
    descriptionEn: 'Gravity shield bubble emitter. Boosts maximum shield armor points and automatically repairs damage.',
    type: 'buff',
    buffType: 'shield',
    unlocked: false,
    cost: 3000,
    color: '#f59e0b',
    elementColor: '#f59e0b',
  },
  {
    id: 'combat_drone',
    nameAr: 'المنصة القتالية والمهاجم التكتيكي الغاضب',
    nameEn: 'Vanguard Laser Seeker Drone',
    descriptionAr: 'مقاتل جوي ذكي يتعرف على درونات الأشباح ووحوش الصخور، ويصعقهم بشعاع ليزر متواصل كل ثانيتين.',
    descriptionEn: 'Fires tracking plasma beams every 2 seconds to damage nearby spatial hostile elements automatically.',
    type: 'combat',
    buffType: 'damage',
    unlocked: false,
    cost: 4500,
    color: '#ef4444',
    elementColor: '#ef4444',
  },
];

// List of target planets in Sol system
const initialPlanets: Planet[] = [
  {
    id: 'mercury_x',
    nameAr: 'عُطَارِد-X',
    nameEn: 'MERCURY-X',
    locked: false,
    color: '#b45309', // metallic rocky amber
    difficulty: 'Easy',
    atmosphereAr: 'ضعيف جداً - درجات حرارة متقلبة',
    atmosphereEn: 'Minimal - High thermal fluctuations',
    descriptionAr: 'كوكب مغمور بالفوهات العميقة والمواقع المهجورة لقنوات الاتصال الفضائية الأولى. استكشف الثروات المعدنية من بلورات البلازما وواجه قراصنة الفضاء.',
    descriptionEn: 'A sun-scorched basalt sphere dotted with crater fields and abandoned military communications relay towers. Rich in energy crystal elements.',
  },
  {
    id: 'venus_z',
    nameAr: 'الزُّهَرَة-Z',
    nameEn: 'VENUS-Z',
    locked: true,
    color: '#0d9488', // acid cyan storm
    difficulty: 'LOCKED',
    atmosphereAr: 'حمضي كثيف جداً وعواصف برق',
    atmosphereEn: 'Dense toxic cloud - Acid lightning',
    descriptionAr: 'كوكب عاصف مغطى بالضباب الحمضي والبرق الكهروستاتيكي. يحتاج لفك تشفير شيفرات التنقل العليا من عطارد-X للوصول إليه.',
    descriptionEn: 'A highly toxic pressurized furnace with perpetual acid storms and rogue mineral hives. Locked until orbital access coordinates are resolved.',
  },
  {
    id: 'mars_omega',
    nameAr: 'الْمِرِّيخ أوميجا',
    nameEn: 'MARS-OMEGA',
    locked: true,
    color: '#e11d48', // deep iron rust red
    difficulty: 'LOCKED',
    atmosphereAr: 'رقيق - عواصف رملية مغناطيسية',
    atmosphereEn: 'Thin oxide carbon - Intense magnetic storms',
    descriptionAr: 'قلاع الأعداء الكبرى ومصانع الحطام المؤتمتة. يضم معاقل الحارس ومقذوفات ليزر عالية التدمير.',
    descriptionEn: 'Automated scrap processing facilities and command structures of hostiles. High-orbit scanners report thermonuclear bunkers and shield grids.',
  },
];

// List of missions available for Mercury-X
const initialMissions: Mission[] = [
  {
    id: 'exploration',
    titleAr: 'المرحلة السهلة: استكشاف وجمع موارد',
    titleEn: 'Easy: Tactical Search & Gather',
    descriptionAr: 'هبط بمركبتك الأرضية (Buggy) واجمع 5 بلورات طاقة فضائية مشعة منتشرة على تضاريس الهضاب لتموين مفاعل بدلتك.',
    descriptionEn: 'Deploy ground buggy to locate & gather 5 energy crystals glowing on the basalt valleys. No active threats detected yet.',
    difficulty: 'easy',
    difficultyAr: 'مبتدئ / سهل',
    difficultyEn: 'RECRUIT',
    xpReward: 1500,
    creditsReward: 1000,
    resourcesReward: 15,
    completed: false,
  },
  {
    id: 'skirmish',
    titleAr: 'المرحلة المتوسطة: تفعيل الاتصالات والقتال',
    titleEn: 'Medium: Communication Skirmish',
    descriptionAr: 'اشتبك مع مجموعة أعداء من الأشباح والدرونات الطائرة وتوجه نحو قاعدة القمر الصناعي المهجورة لتفعيل هوائي الاتصال المنهار.',
    descriptionEn: 'Neutralize defensive space ghosts and flying seeker drones, then approach the satellite dish console to establish link feed.',
    difficulty: 'medium',
    difficultyAr: 'محارب / متوسط',
    difficultyEn: 'SOLDIER',
    xpReward: 2500,
    creditsReward: 1800,
    resourcesReward: 25,
    completed: false,
  },
  {
    id: 'boss_fight',
    titleAr: 'المرحلة الصعبة: غضب القائد وحرس المركبة',
    titleEn: 'Hard: Titan Golem Overlord Catalyst',
    descriptionAr: 'مواجهة الزعيم "العملاق الناري الثقيل" الذي يحرس مخارج الطاقة وسحق فرقة الحراسة المعادية لحماية سفينتك النازلة.',
    descriptionEn: 'Confront the Goliath Golem Boss of Planet Mercury. Pilot your heavy spacecraft in low altitude or drive the buggy to survive.',
    difficulty: 'hard',
    difficultyAr: 'جنرال / صعب جداً',
    difficultyEn: 'GENERAL',
    xpReward: 5000,
    creditsReward: 4500,
    resourcesReward: 50,
    completed: false,
  },
];

// Available military-grade weaponry
const initialWeapons: Weapon[] = [
  {
    id: 'energy_rifle',
    nameAr: 'بندقية طاقة حرارية',
    nameEn: 'Thermo Energy Rifle',
    damage: 20,
    rate: 6.5,
    ammoCapacity: 45,
    unlocked: true,
    cost: 0,
    elementColor: '#00ffaa',
    descriptionAr: 'السلاح القياسي خفيف الوزن ذو ارتداد منخفض ودقة متوسطة المدى.',
    descriptionEn: 'Standard issue infantry asset. Moderate heat dissipation and reliable continuous fire.',
  },
  {
    id: 'plasma_cannon',
    nameAr: 'قاذف البلازما المدمر',
    nameEn: 'Vortex Plasma Core',
    damage: 55,
    rate: 3.2,
    ammoCapacity: 20,
    unlocked: false,
    cost: 1200,
    elementColor: '#ec4899',
    descriptionAr: 'يطلق شحنات مشعة وبواقي شمسية ومقذوفات حرارية عالية الفتك التدميري للأعداء.',
    descriptionEn: 'Concentrates nuclear stellar fuel. Detonates on impact dealing massive structural splash.',
  },
  {
    id: 'rocket_launcher',
    nameAr: 'قاذفة الصواريخ المضادة لمركبات',
    nameEn: 'Hyperion Rocket Pod',
    damage: 90,
    rate: 1.2,
    ammoCapacity: 8,
    unlocked: false,
    cost: 2500,
    elementColor: '#f59e0b',
    descriptionAr: 'قذائف صاروخية متوجهة لإحداث خرق جسيم في تحصينات الزعماء ووحوش الصخور.',
    descriptionEn: 'Heavy duty tactical ordnance designed for planetary operations, demolishing armored shields.',
  },
  {
    id: 'accuracy_laser',
    nameAr: 'بندقية الليزر الدقيق',
    nameEn: 'Sol Accuracy Laser Beam',
    damage: 15,
    rate: 12.0,
    ammoCapacity: 75,
    unlocked: false,
    cost: 4500,
    elementColor: '#06b6d4',
    descriptionAr: 'إشعاع حراري ليزري متواصل عالي الدقة دون ارتداد يثقب الهياكل المعدنية فوراً.',
    descriptionEn: 'Generates cohesive laser beam. Zero recoil and maximum precision at long target marks.',
  },
];

// Available space vehicles and custom attributes
const initialVehicles: Vehicle[] = [
  {
    id: 'buggy',
    nameAr: 'المركبة الأرضية الاستكشافية',
    nameEn: 'Scout Ground Buggy',
    speed: 1,
    armor: 1,
    energy: 1,
    color: '#f97316', // default body warning orange
    sticker: 'none',
    cost: 0,
    unlocked: true,
    descriptionAr: 'مركبة خفيفة بـ 4 إطارات ممتصة للصدمات وتعليق مناسب للملاحة فوق فوهات عطارد القاسية.',
    descriptionEn: 'All-terrain utility chassis featuring independent suspension for rocky planet surfaces.',
  },
  {
    id: 'spaceship',
    nameAr: 'سفينة الهبوط والقتال المنزلقة',
    nameEn: 'Heavy Orbital Lander Ship',
    speed: 2,
    armor: 2,
    energy: 2,
    color: '#0f172a', // coal default
    sticker: 'none',
    cost: 5000,
    unlocked: false,
    descriptionAr: 'سفينة حربية متطورة للإقلاع والهبوط والتحويم والتحليق بالأسلحة الثقيلة.',
    descriptionEn: 'Sub-orbital delta-wing tactical glider with hovering thrusters and built-in heat shielding.',
  },
];

// List of target achievement medals
const initialAchievements: Achievement[] = [
  {
    id: 'FIRST_CONTACT',
    titleAr: 'الاتصال الأول الفضائي',
    titleEn: 'First Contact',
    descriptionAr: 'اهبط بمركبتك بنجاح على كوكب عطارد-X واخط خطوتك الاستطلاعية الأولى.',
    descriptionEn: 'Survive atmospheric orbit friction and step out onto surface of Mercury.',
    unlocked: false,
    xpValue: 500,
  },
  {
    id: 'CRYSTAL_HUNTER',
    titleAr: 'جامع بلورات المورد',
    titleEn: 'Stellar Ore Collector',
    descriptionAr: 'اجمع بلورات الطاقة لتموين المولد العسكري الخاص بك.',
    descriptionEn: 'Secure dynamic planetary crystals to power up base modules.',
    unlocked: false,
    xpValue: 1000,
  },
  {
    id: 'COMPUTING_COMM',
    titleAr: 'إعادة الاتصال للشبكة',
    titleEn: 'Secure Comms Est.',
    descriptionAr: 'قم بتفعيل تلسكوب وقاعدة الاتصالات المهجورة وأعد توجيه البينات للقطاع.',
    descriptionEn: 'Approach the satellite dish cluster and switch on the planetary comm link.',
    unlocked: false,
    xpValue: 1500,
  },
  {
    id: 'OVERLORD_DESTROYER',
    titleAr: 'قاهر العمالقة والزعيم',
    titleEn: 'Cataclysm Purged',
    descriptionAr: 'اسحق العملاق الناري الضخم وهياكل حراسة وخلص طبقات عطارد-X.',
    descriptionEn: 'Defeat the towering volcanic Golem Overlord in Hard difficulty mode.',
    unlocked: false,
    xpValue: 3000,
  },
  {
    id: 'MODDING_MASTER',
    titleAr: 'خبير التشييد والجراج',
    titleEn: 'Grease Monkey Master',
    descriptionAr: 'قم بترقية محرك، أو درع أو طاقة مركبة أرضية أو سفينة في الجراج.',
    descriptionEn: 'Upgrade any vehicle speed, armor or core energy attribute up to level 3.',
    unlocked: false,
    xpValue: 1200,
  },
  {
    id: 'WEAPONS_DEPOT',
    titleAr: 'ترسانة الدمار الكامل',
    titleEn: 'Tactical Arsenal Unlocked',
    descriptionAr: 'قم بشراء وفتح سلاح جديد بالكامل في المستودع والمخزن.',
    descriptionEn: 'Spend CP credits to unlock any second tier energy weapon at warehouse.',
    unlocked: false,
    xpValue: 1500,
  },
];

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [gameState, setGameState] = useState<GameState>(() => {
    const isActed = localStorage.getItem('tankeel_activated');
    return isActed ? 'MAIN_MENU' : 'ACTIVATION_SCREEN';
  });
  
  // Game persistent states
  const [playerStats, setPlayerStats] = useState<PlayerStats>(defaultPlayerStats);
  const [settings, setSettings] = useState<GameSettings>(defaultSettings);
  const [planets, setPlanets] = useState<Planet[]>(initialPlanets);
  const [missions, setMissions] = useState<Mission[]>(initialMissions);
  const [weapons, setWeapons] = useState<Weapon[]>(initialWeapons);
  const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
  const [achievements, setAchievements] = useState<Achievement[]>(initialAchievements);
  const [drones, setDrones] = useState<Drone[]>(initialDrones);

  // Active chosen mission details to forward to 3D simulation canvas
  const [activeMissionId, setActiveMissionId] = useState<MissionId>('exploration');

  const [hasSavedGame, setHasSavedGame] = useState(false);

  // 1. Initial State Load
  useEffect(() => {
    const saved = localStorage.getItem('tankeel_save');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.stats) setPlayerStats(parsed.stats);
        if (parsed.settings) {
          setSettings(parsed.settings);
          sound.setVolume(parsed.settings.volume);
        }
        if (parsed.weapons) setWeapons(parsed.weapons);
        if (parsed.vehicles) setVehicles(parsed.vehicles);
        if (parsed.achievements) setAchievements(parsed.achievements);
        if (parsed.missions) setMissions(parsed.missions);
        if (parsed.drones) setDrones(parsed.drones);
        setHasSavedGame(true);
      } catch (err) {
        console.warn('Unable to load Tankeel save state', err);
      }
    }
  }, []);

  // 2. State Auto-saving triggered on stats modifications
  const saveGameState = (
    currentStats: PlayerStats,
    currentSettings: GameSettings,
    currWeapons: Weapon[],
    currVehicles: Vehicle[],
    currAchievements: Achievement[],
    currMissions: Mission[],
    currDrones: Drone[] = drones
  ) => {
    try {
      const payload = {
        stats: currentStats,
        settings: currentSettings,
        weapons: currWeapons,
        vehicles: currVehicles,
        achievements: currAchievements,
        missions: currMissions,
        drones: currDrones
      };
      localStorage.setItem('tankeel_save', JSON.stringify(payload));
      setHasSavedGame(true);
    } catch (e) {
      console.warn('Failed to commit save game to local storage', e);
    }
  };

  // UI modification triggers: settings changes
  const handleSettingsChange = (newSettings: GameSettings) => {
    setSettings(newSettings);
    sound.setVolume(newSettings.volume);
    saveGameState(playerStats, newSettings, weapons, vehicles, achievements, missions);
  };

  // Equip weapon trigger
  const handleEquipWeapon = (weaponId: WeaponId) => {
    const nextStats = { ...playerStats, currentWeapon: weaponId };
    setPlayerStats(nextStats);
    saveGameState(nextStats, settings, weapons, vehicles, achievements, missions);
  };

  // Purchase/Unlock weapon in Warehouse
  const handleUnlockWeapon = (weaponId: WeaponId, price: number) => {
    const nextStats = {
      ...playerStats,
      credits: Math.max(0, playerStats.credits - price),
      unlockedWeapons: [...playerStats.unlockedWeapons, weaponId]
    };

    const nextWeapons = weapons.map((w) => 
      w.id === weaponId ? { ...w, unlocked: true } : w
    );

    // achievement check: WEAPONS_DEPOT
    const nextAchievements = achievements.map((ach) => {
      if (ach.id === 'WEAPONS_DEPOT' && !ach.unlocked) {
        sound.playMissionCompleted();
        return { ...ach, unlocked: true };
      }
      return ach;
    });

    setPlayerStats(nextStats);
    setWeapons(nextWeapons);
    setAchievements(nextAchievements);
    saveGameState(nextStats, settings, nextWeapons, vehicles, nextAchievements, missions);
  };

  // Equiping direct vehicle in Garage
  const handleSelectVehicle = (vId: VehicleId) => {
    const nextStats = { ...playerStats, currentVehicle: vId };
    setPlayerStats(nextStats);
    saveGameState(nextStats, settings, weapons, vehicles, achievements, missions);
  };

  // Purchasing vehicle
  const handleUnlockVehicle = (vehicleId: VehicleId, price: number) => {
    const nextStats = {
      ...playerStats,
      credits: Math.max(0, playerStats.credits - price),
      unlockedVehicles: [...playerStats.unlockedVehicles, vehicleId]
    };

    const nextVehicles = vehicles.map((v) => 
      v.id === vehicleId ? { ...v, unlocked: true } : v
    );

    setPlayerStats(nextStats);
    setVehicles(nextVehicles);
    saveGameState(nextStats, settings, weapons, nextVehicles, achievements, missions);
  };

  // Upgradinge structural attributes of buggy/ spaceship
  const handleUpgradeStat = (vId: VehicleId, stat: 'speed' | 'armor' | 'energy', cost: number) => {
    let targetUpgradeVal = 1;

    const nextVehicles = vehicles.map((v) => {
      if (v.id === vId) {
        const nextVal = Math.min(5, v[stat] + 1);
        targetUpgradeVal = nextVal;
        return { ...v, [stat]: nextVal };
      }
      return v;
    });

    const nextStats = {
      ...playerStats,
      credits: Math.max(0, playerStats.credits - cost)
    };

    // achievement check: MODDING_MASTER
    const nextAchievements = achievements.map((ach) => {
      if (ach.id === 'MODDING_MASTER' && !ach.unlocked && targetUpgradeVal >= 3) {
        sound.playMissionCompleted();
        return { ...ach, unlocked: true };
      }
      return ach;
    });

    setPlayerStats(nextStats);
    setVehicles(nextVehicles);
    setAchievements(nextAchievements);
    saveGameState(nextStats, settings, weapons, nextVehicles, nextAchievements, missions);
  };

  // Apply colors & decals
  const handleCustomizeVehicle = (vId: VehicleId, colorValue: string, stickerValue: string) => {
    const nextVehicles = vehicles.map((v) => 
      v.id === vId ? { ...v, color: colorValue, sticker: stickerValue } : v
    );
    setVehicles(nextVehicles);
    saveGameState(playerStats, settings, weapons, nextVehicles, achievements, missions);
  };

  // Planet selects + launches mission
  const handleLaunchMission = (planetId: PlanetId, missionId: MissionId) => {
    sound.playClick();
    sound.init(); // ensure Web Audio handles click trigger
    setActiveMissionId(missionId);
    setGameState('PLAYING');
  };

  // Complete mission rewards callback pipeline
  const handleMissionCompleted = (xpReward: number, creditsReward: number, crystalsReward: number, titaniumReward: number) => {
    // 1. Calculate achievements unlocking
    let nextAchievements = [...achievements];

    // standard FIRST_CONTACT trigger
    nextAchievements = nextAchievements.map(ach => {
      if (ach.id === 'FIRST_CONTACT' && !ach.unlocked) {
        return { ...ach, unlocked: true };
      }
      return ach;
    });

    if (activeMissionId === 'exploration') {
      nextAchievements = nextAchievements.map(ach => {
        if (ach.id === 'CRYSTAL_HUNTER' && !ach.unlocked) return { ...ach, unlocked: true };
        return ach;
      });
    }

    if (activeMissionId === 'skirmish') {
      nextAchievements = nextAchievements.map(ach => {
        if (ach.id === 'COMPUTING_COMM' && !ach.unlocked) return { ...ach, unlocked: true };
        return ach;
      });
    }

    if (activeMissionId === 'boss_fight') {
      nextAchievements = nextAchievements.map(ach => {
        if (ach.id === 'OVERLORD_DESTROYER' && !ach.unlocked) return { ...ach, unlocked: true };
        return ach;
      });
    }

    // Mark mission completed
    const nextMissions = missions.map(m => 
      m.id === activeMissionId ? { ...m, completed: true } : m
    );

    // Process Level progression math
    const totalXP = playerStats.xp + xpReward;
    const currentMaxXP = playerStats.level * 3000;
    let finalLvl = playerStats.level;
    let finalXP = totalXP;

    if (totalXP >= currentMaxXP) {
      finalLvl += 1;
      finalXP = totalXP - currentMaxXP;
      setTimeout(() => {
        sound.playLevelUp();
      }, 1000);
    }

    const nextStats: PlayerStats = {
      ...playerStats,
      xp: finalXP,
      level: finalLvl,
      credits: playerStats.credits + creditsReward,
      resources: {
        crystals: playerStats.resources.crystals + crystalsReward,
        titanium: playerStats.resources.titanium + titaniumReward,
        plasma_cells: playerStats.resources.plasma_cells + (activeMissionId === 'boss_fight' ? 1 : 0),
      }
    };

    setPlayerStats(nextStats);
    setAchievements(nextAchievements);
    setMissions(nextMissions);
    saveGameState(nextStats, settings, weapons, vehicles, nextAchievements, nextMissions);
  };

  // 1. Activation code gate handler
  const handleActivate = (isMaster: boolean) => {
    localStorage.setItem('tankeel_activated', isMaster ? 'master' : 'normal');
    
    if (isMaster) {
      // MASTER CODE POWER: grants massive starting funds, crystals, and unlocks everything!
      const nextStats: PlayerStats = {
        ...playerStats,
        credits: playerStats.credits + 65000,
        resources: {
          crystals: playerStats.resources.crystals + 120,
          titanium: playerStats.resources.titanium + 60,
          plasma_cells: playerStats.resources.plasma_cells + 6,
        },
        currentWeapon: 'railgun',
        currentVehicle: 'spaceship',
        currentDrone: 'combat_drone',
        unlockedPlanets: ['mercury_x', 'venus_z', 'mars_omega'],
        unlockedWeapons: ['energy_rifle', 'plasma_cannon', 'railgun'],
        unlockedVehicles: ['buggy', 'spaceship'],
        unlockedDrones: ['none', 'scout_drone', 'shield_drone', 'combat_drone'],
        isMasterMode: true
      };

      const nextWeapons = weapons.map(w => ({ ...w, unlocked: true }));
      const nextVehicles = vehicles.map(v => ({ ...v, unlocked: true }));
      const nextDrones = drones.map(d => ({ ...d, unlocked: true }));

      // Unlock all map planets in initial list
      const nextPlanets = planets.map(p => ({ ...p, locked: false }));

      setPlayerStats(nextStats);
      setWeapons(nextWeapons);
      setVehicles(nextVehicles);
      setDrones(nextDrones);
      setPlanets(nextPlanets);

      saveGameState(nextStats, settings, nextWeapons, nextVehicles, achievements, missions, nextDrones);
    } else {
      // Normal Mode Activation
      const nextStats: PlayerStats = {
        ...playerStats,
        isMasterMode: false
      };
      setPlayerStats(nextStats);
      saveGameState(nextStats, settings, weapons, vehicles, achievements, missions, drones);
    }

    setGameState('MAIN_MENU');
  };

  // 2. Daily Supplies Drop reward claim handler
  const handleClaimDailyReward = (creditsGained: number, crystalsGained: number) => {
    const nextStats: PlayerStats = {
      ...playerStats,
      credits: playerStats.credits + creditsGained,
      resources: {
        ...playerStats.resources,
        crystals: playerStats.resources.crystals + crystalsGained
      },
      lastDailyRewardClaim: new Date().toISOString()
    };
    setPlayerStats(nextStats);
    saveGameState(nextStats, settings, weapons, vehicles, achievements, missions, drones);
  };

  // 3. Select / Equip Drone
  const handleSelectDrone = (dId: DroneId) => {
    const nextStats = {
      ...playerStats,
      currentDrone: dId
    };
    setPlayerStats(nextStats);
    saveGameState(nextStats, settings, weapons, vehicles, achievements, missions, drones);
  };

  // 4. Unlock Drone
  const handleUnlockDrone = (dId: DroneId, price: number) => {
    const nextStats = {
      ...playerStats,
      credits: Math.max(0, playerStats.credits - price),
      unlockedDrones: [...playerStats.unlockedDrones, dId]
    };

    const nextDrones = drones.map(d => 
      d.id === dId ? { ...d, unlocked: true } : d
    );

    setPlayerStats(nextStats);
    setDrones(nextDrones);
    saveGameState(nextStats, settings, weapons, vehicles, achievements, missions, nextDrones);
  };

  const activeLanguage = settings.language;

  return (
    <AndroidFrame activeLanguage={activeLanguage}>
      {showSplash && (
        <SplashOverlay 
          activeLanguage={activeLanguage} 
          onComplete={() => setShowSplash(false)} 
        />
      )}
      {/* GAME STATE ROUTER */}
      {gameState === 'MAIN_MENU' && (
        <MainMenu
          onSelectState={setGameState}
          activeLanguage={activeLanguage}
          hasSavedGame={hasSavedGame}
          stats={playerStats}
          onClaimDailyReward={handleClaimDailyReward}
        />
      )}

      {gameState === 'PLANET_SELECT' && (
        <PlanetMap
          stats={playerStats}
          planets={planets}
          missions={missions}
          activeLanguage={activeLanguage}
          onBack={() => {
            sound.playClick();
            setGameState('MAIN_MENU');
          }}
          onLaunchMission={handleLaunchMission}
        />
      )}

      {gameState === 'PLAYING' && (
        <GameCanvas
          stats={playerStats}
          weapons={weapons}
          vehicles={vehicles}
          missionId={activeMissionId}
          settings={settings}
          activeLanguage={activeLanguage}
          onBackToMap={() => {
            sound.playClick();
            setGameState('PLANET_SELECT');
          }}
          onMissionCompleted={handleMissionCompleted}
          onUpdateStats={setPlayerStats}
        />
      )}

      {gameState === 'GARAGE' && (
        <GaragePanel
          stats={playerStats}
          vehicles={vehicles}
          activeLanguage={activeLanguage}
          onBack={() => {
            sound.playClick();
            setGameState('MAIN_MENU');
          }}
          onSelectVehicle={handleSelectVehicle}
          onUpgradeStat={handleUpgradeStat}
          onCustomizeVehicle={handleCustomizeVehicle}
          onUnlockVehicle={handleUnlockVehicle}
        />
      )}

      {gameState === 'WAREHOUSE' && (
        <WarehousePanel
          stats={playerStats}
          weapons={weapons}
          activeLanguage={activeLanguage}
          onBack={() => {
            sound.playClick();
            setGameState('MAIN_MENU');
          }}
          onEquipWeapon={handleEquipWeapon}
          onUnlockWeapon={handleUnlockWeapon}
        />
      )}

      {gameState === 'ACHIEVEMENTS' && (
        <AchievementsPanel
          achievements={achievements}
          activeLanguage={activeLanguage}
          onBack={() => {
            sound.playClick();
            setGameState('MAIN_MENU');
          }}
        />
      )}

      {gameState === 'SETTINGS' && (
        <SettingsPanel
          settings={settings}
          onChangeSettings={handleSettingsChange}
          onBack={() => {
            sound.playClick();
            setGameState('MAIN_MENU');
          }}
        />
      )}

      {gameState === 'ABOUT' && (
        <AboutPanel
          activeLanguage={activeLanguage}
          stats={playerStats}
          onBack={() => {
            sound.playClick();
            setGameState('MAIN_MENU');
          }}
        />
      )}

      {gameState === 'ACTIVATION_SCREEN' && (
        <ActivationScreen
          onActivate={handleActivate}
          activeLanguage={activeLanguage}
        />
      )}

      {gameState === 'DRONES' && (
        <DronesPanel
          stats={playerStats}
          drones={drones}
          activeLanguage={activeLanguage}
          onBack={() => {
            sound.playClick();
            setGameState('MAIN_MENU');
          }}
          onSelectDrone={handleSelectDrone}
          onUnlockDrone={handleUnlockDrone}
        />
      )}
    </AndroidFrame>
  );
}
