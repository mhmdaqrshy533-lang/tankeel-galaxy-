/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState =
  | 'MAIN_MENU'
  | 'PLANET_SELECT'
  | 'CINEMATIC_INTRO'
  | 'PLAYING'
  | 'GARAGE'
  | 'WAREHOUSE'
  | 'SETTINGS'
  | 'ABOUT'
  | 'ACHIEVEMENTS'
  | 'DRONES'
  | 'ACTIVATION_SCREEN';

export type PlanetId = 'mercury_x' | 'venus_z' | 'mars_omega';

export interface Planet {
  id: PlanetId;
  nameAr: string;
  nameEn: string;
  locked: boolean;
  color: string;
  descriptionAr: string;
  descriptionEn: string;
  difficulty: string;
  atmosphereAr: string;
  atmosphereEn: string;
}

export type MissionId = 'exploration' | 'skirmish' | 'boss_fight';

export interface Mission {
  id: MissionId;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  difficulty: 'easy' | 'medium' | 'hard';
  difficultyAr: string;
  difficultyEn: string;
  xpReward: number;
  creditsReward: number;
  resourcesReward: number;
  completed: boolean;
}

export type WeaponId = 'energy_rifle' | 'plasma_cannon' | 'rocket_launcher' | 'accuracy_laser';

export interface Weapon {
  id: WeaponId;
  nameAr: string;
  nameEn: string;
  damage: number;
  rate: number; // fires per second
  ammoCapacity: number;
  unlocked: boolean;
  cost: number;
  elementColor: string;
  descriptionAr: string;
  descriptionEn: string;
}

export type VehicleId = 'none' | 'buggy' | 'spaceship';

export interface Vehicle {
  id: VehicleId;
  nameAr: string;
  nameEn: string;
  speed: number; // upgrade levels
  armor: number; // upgrade levels
  energy: number; // upgrade levels
  color: string; // hex string hex
  sticker: string; // decal id
  cost: number;
  unlocked: boolean;
  descriptionAr: string;
  descriptionEn: string;
}

export type DroneId = 'none' | 'scout_drone' | 'shield_drone' | 'combat_drone';

export interface Drone {
  id: DroneId;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  type: 'buff' | 'loot' | 'combat';
  buffType: 'shield' | 'speed' | 'damage';
  unlocked: boolean;
  cost: number;
  color: string;
  elementColor: string;
}

export interface PlayerStats {
  xp: number;
  level: number;
  credits: number;
  resources: {
    crystals: number;
    titanium: number;
    plasma_cells: number;
  };
  currentWeapon: WeaponId;
  currentVehicle: VehicleId;
  currentDrone: DroneId;
  unlockedPlanets: PlanetId[];
  unlockedWeapons: WeaponId[];
  unlockedVehicles: VehicleId[];
  unlockedDrones: DroneId[];
  lastDailyRewardClaim?: string; // ISO date string or timestamp
  isMasterMode?: boolean; // Unlocked with Master Code
}

export interface Achievement {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  unlocked: boolean;
  xpValue: number;
}

export interface GameSettings {
  graphicsQuality: 'low' | 'medium' | 'high';
  volume: number; // 0 to 100
  cameraSensitivity: number; // 1 to 10
  language: 'ar' | 'en';
  vibration: boolean;
}
