/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, RotateCcw, Globe, Compass, Shield, Award, Settings, Info, Radio, Flame, Cpu, Sparkles } from 'lucide-react';
import { GameState, PlayerStats } from '../types/game';
import { sound } from '../utils/sound';
import DailyRewardClaim from './DailyRewardClaim';

interface MainMenuProps {
  onSelectState: (state: GameState) => void;
  activeLanguage: 'ar' | 'en';
  hasSavedGame: boolean;
  stats: PlayerStats;
  onClaimDailyReward: (credits: number, crystals: number) => void;
}

export default function MainMenu({ 
  onSelectState, 
  activeLanguage, 
  hasSavedGame,
  stats,
  onClaimDailyReward
}: MainMenuProps) {
  
  const handleMenuClick = (target: GameState) => {
    sound.playClick();
    onSelectState(target);
  };

  const menuItems = [
    {
      id: 'PLANET_SELECT' as GameState,
      labelAr: 'ابدأ اللعبة',
      labelEn: 'Start Game',
      icon: Play,
      color: 'from-cyan-500/20 to-blue-600/30 border-cyan-400',
      textColor: 'text-cyan-400',
      badgeAr: 'جديد',
      badgeEn: 'NEW',
    },
    {
      id: 'PLAYING' as GameState, // will act as continue
      labelAr: 'متابعة اللعب',
      labelEn: 'Continue Game',
      icon: RotateCcw,
      color: hasSavedGame ? 'from-emerald-500/20 to-teal-600/30 border-emerald-400' : 'from-neutral-900 to-neutral-950 border-neutral-800 opacity-50 cursor-not-allowed',
      textColor: hasSavedGame ? 'text-emerald-400' : 'text-neutral-500',
      disabled: !hasSavedGame,
    },
    {
      id: 'DRONES' as GameState,
      labelAr: 'المرافق والدرونات',
      labelEn: 'AI Drones Hangar',
      icon: Cpu,
      color: 'from-emerald-500/10 to-teal-600/25 border-emerald-500/40',
      textColor: 'text-emerald-400',
      badgeAr: 'مرافق',
      badgeEn: 'DRONE',
    },
    {
      id: 'GARAGE' as GameState,
      labelAr: 'المركبات والجراج',
      labelEn: 'Vehicles & Garage',
      icon: Compass,
      color: 'from-amber-500/10 to-orange-600/25 border-amber-500/40',
      textColor: 'text-amber-400',
    },
    {
      id: 'WAREHOUSE' as GameState,
      labelAr: 'المستودع والمخزن',
      labelEn: 'Warehouse Depot',
      icon: Shield,
      color: 'from-teal-500/10 to-cyan-600/25 border-teal-500/40',
      textColor: 'text-teal-400',
    },
    {
      id: 'ACHIEVEMENTS' as GameState,
      labelAr: 'الإنجازات والجوائز',
      labelEn: 'Achievements',
      icon: Award,
      color: 'from-yellow-500/10 to-amber-600/25 border-yellow-500/40',
      textColor: 'text-yellow-400',
    },
    {
      id: 'SETTINGS' as GameState,
      labelAr: 'إعدادات النظام',
      labelEn: 'System Settings',
      icon: Settings,
      color: 'from-neutral-800 to-neutral-900 border-neutral-700',
      textColor: 'text-neutral-300',
    },
    {
      id: 'ABOUT' as GameState,
      labelAr: 'قصة اللعبة والجنرال',
      labelEn: 'About Tankeel',
      icon: Info,
      color: 'from-neutral-800 to-neutral-900 border-neutral-700',
      textColor: 'text-neutral-300',
    },
  ];

  return (
    <div className="w-full h-full bg-neutral-950 flex flex-col items-center justify-between p-4 md:p-8 select-none relative font-sans overflow-y-auto">
      {/* Cinematic Sci-fi Nebula Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-900/60 via-neutral-950/95 to-neutral-950 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1462331940025-496dfbfc7564?auto=format&fit=crop&q=80&w=1200')] bg-cover opacity-15 mix-blend-screen pointer-events-none" />

      {/* Grid crosshair visual decorations in margins to look incredibly military-radared */}
      <div className="absolute top-4 left-4 text-[10px] font-mono text-cyan-500/40 pointer-events-none flex flex-col gap-1 z-0">
        <span>SYS.MAIN_BOOT_LOC [AR_EN]</span>
        <span>SECTOR: SOL.MERCURY.X</span>
      </div>
      <div className="absolute bottom-4 right-4 text-[10px] font-mono text-amber-500/30 pointer-events-none flex flex-col items-end gap-0.5 z-0">
        <span>RADAR ACTIVE: SCANNING...</span>
        <span>OS: MOBILE_TANKEEL v4.2</span>
      </div>

      {/* Top Banner with Game Brand Title */}
      <div className="w-full flex flex-col items-center mt-2 md:mt-4 z-10 text-center">
        <div className="relative flex items-center justify-center mb-1">
          {/* Futuristic background wing line */}
          <div className="absolute h-[1px] w-48 md:w-80 bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent" />
          
          <div className="bg-neutral-950/90 border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.15)] px-6 py-1 rounded-sm flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span className="text-[10px] tracking-[0.25em] text-cyan-400 uppercase font-mono">
              MILITARY SCI-FI EXPEDITION
            </span>
          </div>
        </div>

        {/* Outer Glow Custom Brand Heading */}
        <h1 className="text-4xl md:text-6xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-neutral-100 via-neutral-200 to-cyan-200 drop-shadow-[0_2px_15px_rgba(6,182,212,0.3)] select-none">
          {activeLanguage === 'ar' ? 'تَـنْـكِـيـل' : 'TANKEEL'}
        </h1>
        <p className="text-xs text-neutral-400 tracking-widest mt-1 uppercase font-mono max-w-md">
          {activeLanguage === 'ar' 
            ? 'لعبة الخيال العلمي والقتال ثلاثي الأبعاد' 
            : '3D Space Tactical & Combat Adventure'}
        </p>
      </div>

      {/* Centered Actions Dashboard Grid with Glassmorphism */}
      <div className="glass-panel p-6 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full my-4 z-10">
        {menuItems.map((item, index) => {
          const IconComponent = item.icon;
          const isDisabled = item.disabled;
          // Apply cyber-btn for starter, cyber-btn-amber for main garage items
          const isAmberItem = item.id === 'GARAGE' || item.id === 'ACHIEVEMENTS';
          const buttonClass = isAmberItem ? 'cyber-btn-amber' : 'cyber-btn';

          return (
            <button
              key={`${item.id}-${index}`}
              disabled={isDisabled}
              onClick={() => {
                if (!isDisabled) {
                  handleMenuClick(item.id);
                }
              }}
              onMouseEnter={() => {
                if (!isDisabled) sound.playHover();
              }}
              className={`group flex flex-col justify-between p-4 text-left cursor-pointer transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden ${buttonClass} ${
                isDisabled ? 'opacity-30 cursor-not-allowed border-neutral-700!' : 'active:scale-95'
              }`}
            >
              {/* Internal warning lines background decor */}
              <div className="absolute right-0 bottom-0 opacity-2 pointer-events-none translate-x-4 translate-y-4 group-hover:opacity-5 transition-all duration-300">
                <IconComponent className="w-24 h-24" />
              </div>

              {/* Header inside button */}
              <div className="flex items-center justify-between w-full mb-4">
                <div className={`p-2 rounded-lg bg-neutral-900/90 border border-white/5 group-hover:scale-110 transition-all duration-300 ${item.textColor}`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                {item.badgeAr && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500 text-neutral-950 font-mono flex items-center gap-0.5 animate-pulse">
                    <Flame className="w-2.5 h-2.5 fill-current" />
                    {activeLanguage === 'ar' ? item.badgeAr : item.badgeEn}
                  </span>
                )}
              </div>

              {/* Title texts */}
              <div className="flex flex-col">
                <span className={`text-[10px] font-mono tracking-widest text-neutral-500 uppercase ${isDisabled ? '' : 'group-hover:text-neutral-400'}`}>
                  {item.id}
                </span>
                <span className="text-sm font-bold text-neutral-100 mt-1 transition-colors group-hover:text-white font-sans">
                  {activeLanguage === 'ar' ? item.labelAr : item.labelEn}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono leading-tight mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {activeLanguage === 'ar' ? 'اضغط للتوجيه والتحميل' : 'Click to interface...'}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Daily supply drop claim widget */}
      <div className="w-full max-w-4xl z-10 my-1">
        <DailyRewardClaim 
          stats={stats} 
          activeLanguage={activeLanguage} 
          onClaim={onClaimDailyReward} 
        />
      </div>

      {/* Footer credits and information */}
      <div className="w-full max-w-4xl border-t border-white/5 pt-3 z-10 flex flex-col md:flex-row items-center justify-between gap-2.5 text-[10px] font-mono text-neutral-500">
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <span>{activeLanguage === 'ar' ? 'نسخة المعاينة الفضائية' : 'Tactical Preview Build'}</span>
            <span className="text-cyan-500">v1.2.0 (ACT I)</span>
          </div>
          <p className="text-[10px] text-neutral-400">
            {activeLanguage === 'ar' ? 'تصميم وبرمجة: المهندس/ سهيل الهزبري' : 'Developer & Architect: Eng. Suhail Al-Huzbari'}
          </p>
        </div>
        <p className="max-w-xs md:max-w-xl text-center md:text-right">
          {activeLanguage === 'ar'
            ? 'تم تصميم اللعبة بتقنيات المحاكاة الثلاثية الأبعاد الحديثة - مع ميزات المرافقين الطيارين والتموين اليومي الفضائي.'
            : 'Explore, complete hazardous operations, deploy floating drones, claim supply drops, and operate high-orbit cruisers.'}
        </p>
      </div>
    </div>
  );
}
