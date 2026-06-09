/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ChevronLeft, Cpu, Radio, Shield, Zap, Target, Coins, ShieldAlert, BadgeCheck } from 'lucide-react';
import { PlayerStats, Drone, DroneId } from '../types/game';
import { sound } from '../utils/sound';

interface DronesPanelProps {
  stats: PlayerStats;
  drones: Drone[];
  activeLanguage: 'ar' | 'en';
  onBack: () => void;
  onSelectDrone: (dId: DroneId) => void;
  onUnlockDrone: (dId: DroneId, price: number) => void;
}

export default function DronesPanel({
  stats,
  drones,
  activeLanguage,
  onBack,
  onSelectDrone,
  onUnlockDrone,
}: DronesPanelProps) {
  const ar = activeLanguage === 'ar';

  const handleDroneAction = (drone: Drone) => {
    sound.playClick();
    if (stats.unlockedDrones.includes(drone.id)) {
      onSelectDrone(drone.id);
    } else {
      if (stats.credits >= drone.cost) {
        onUnlockDrone(drone.id, drone.cost);
      } else {
        sound.playClick(); // play warning/click
      }
    }
  };

  const getDroneIcon = (id: DroneId) => {
    switch (id) {
      case 'scout_drone':
        return <Radio className="w-5 h-5 text-cyan-400" />;
      case 'shield_drone':
        return <Shield className="w-5 h-5 text-amber-400" />;
      case 'combat_drone':
        return <Zap className="w-5 h-5 text-rose-400" />;
      default:
        return <Cpu className="w-5 h-5 text-neutral-400" />;
    }
  };

  return (
    <div className="w-full h-full bg-neutral-950 p-4 md:p-8 flex flex-col justify-between font-sans relative overflow-y-auto select-none">
      {/* Cinematic space backgrounds */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/40 via-neutral-950 to-neutral-950 pointer-events-none" />
      <div className="absolute top-10 left-12 w-72 h-72 bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <Cpu className="w-5.5 h-5.5 text-cyan-400 animate-spin-slow" />
          <div>
            <h2 className="text-lg font-bold tracking-wider text-cyan-400 font-mono">
              {ar ? 'المرافق الطائر وحظيرة الدرونات' : 'DEPLOYABLE DRONE COMPANIONS'}
            </h2>
            <p className="text-[10px] text-neutral-500 font-mono uppercase tracking-[0.15em]">
              {ar ? 'تجهيز رفيق تكتيكي بميزات الحصاد والدعم الهجومي' : 'AI Autonomous Floating Command Hangar'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Credits Display */}
          <div className="flex items-center gap-1.5 bg-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-800 text-xs text-amber-400 font-mono font-bold">
            <Coins className="w-4 h-4" />
            <span>{stats.credits} CP</span>
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="px-4 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-cyan-400 text-neutral-300 hover:text-cyan-400 rounded-md transition-all flex items-center gap-1.5 cursor-pointer text-xs font-bold"
          >
            <ChevronLeft className="w-4 h-4" />
            {ar ? 'القائمة الرئيسية' : 'MainMenu'}
          </button>
        </div>
      </div>

      {/* Main Drones Cards Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 my-auto z-10 w-full max-w-5.5xl mx-auto py-4 items-stretch">
        
        {/* Info Explanatory Panel cards */}
        <div className="md:col-span-1 bg-gradient-to-b from-neutral-900/80 to-neutral-950/60 border border-white/5 p-4 rounded-xl flex flex-col justify-between space-y-4 shadow-lg backdrop-blur-md">
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-mono font-bold uppercase tracking-widest leading-none">
              <Target className="w-4 h-4" />
              <span>{ar ? 'التدريب الجوي المرافق' : 'DRONE PROTOCOL'}</span>
            </div>
            <p className="text-[11px] text-neutral-300 leading-relaxed font-sans">
              {ar
                ? 'الدرونات هي مرافقات طائرة متطورة تحوم حول بدلتك المدرعة أو مركبتك. توفر طاقة سحب مغناطيسية، أو تطلق أشعة علاج، أو تهاجم الأشباح والدرونات المعادية.'
                : 'Drones are tactical assets which hover around you in planetary sorties to augment shields, siphon resource ores, or blast aggressive hostile targets.'}
            </p>
            <div className="border-t border-white/5 pt-3 text-[10px] space-y-2">
              <span className="text-neutral-500 font-bold block">{ar ? 'الميزات النشطة' : 'REQUISITIONS'}</span>
              <ul className="space-y-1.5 text-neutral-300">
                <li className="flex items-center gap-1">✅ {ar ? 'جمع البلورات تلقائياً' : 'Auto Crystal Looting'}</li>
                <li className="flex items-center gap-1">🛡️ {ar ? 'دعم الدرع والصدمات' : 'Shield Buffer Upgrades'}</li>
                <li className="flex items-center gap-1">⚡ {ar ? 'إطلاق صواريخ تكتيكية' : 'Auto Defensive Laser'}</li>
              </ul>
            </div>
          </div>

          <div className="pt-2 border-t border-white/5">
            <span className="text-[10px] text-rose-400 font-semibold uppercase font-mono block mb-1">
              ⚠️ {ar ? 'الحد المسموح' : 'DEPLOY LIMIT'}
            </span>
            <p className="text-[9px] text-neutral-400 font-sans leading-relaxed">
              {ar 
                ? 'يمكنك تنشيط درون واحد مفعل في المهمة الواحدة لموازنة الطاقة السلكية بدفء من الفضاء.' 
                : 'Only one hovering companion can be actively deployed at a time due to orbital link restriction.'}
            </p>
          </div>
        </div>

        {/* Dynamic Drones display Grid */}
        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {drones.map((drone) => {
            const isUnlocked = stats.unlockedDrones.includes(drone.id);
            const isActive = stats.currentDrone === drone.id;
            const canAfford = stats.credits >= drone.cost;

            return (
              <div
                key={drone.id}
                className={`flex flex-col justify-between p-4 rounded-xl border transition-all duration-300 transform relative bg-neutral-900/50 backdrop-blur-md ${
                  isActive
                    ? 'border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.15)] bg-emerald-950/5'
                    : isUnlocked
                    ? 'border-cyan-500/30 hover:border-cyan-400 hover:-translate-y-1'
                    : 'border-white/5 hover:border-white/10 opacity-85'
                }`}
              >
                {/* Active Tag indicator */}
                {isActive && (
                  <span className="absolute top-2 right-2 flex items-center gap-0.5 bg-emerald-500 text-neutral-950 text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider font-mono">
                    <BadgeCheck className="w-3 h-3" />
                    {ar ? 'مستدعى' : 'ACTIVE'}
                  </span>
                )}

                <div className="space-y-3 flex-1 flex flex-col">
                  {/* Icon Block */}
                  <div className="flex items-center gap-2">
                    <div className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800">
                      {getDroneIcon(drone.id)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-neutral-100">{ar ? drone.nameAr : drone.nameEn}</h4>
                      <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block font-medium mt-0.5">
                        {drone.type === 'loot' && (ar ? 'حصاد تلقائي' : 'Resource Looting')}
                        {drone.type === 'buff' && (ar ? 'تحسين طاقة البدلة' : 'Max-HP Armor Buff')}
                        {drone.type === 'combat' && (ar ? 'دعم ناري وهجومي' : 'Defensive Gunship')}
                      </span>
                    </div>
                  </div>

                  {/* Description text */}
                  <p className="text-[10px] text-neutral-400 leading-normal font-sans">
                    {ar ? drone.descriptionAr : drone.descriptionEn}
                  </p>

                  {/* Drone Specs attributes values */}
                  <div className="bg-neutral-950 border border-neutral-800/40 p-2 rounded-lg text-[9px] font-mono space-y-1.5 mt-auto">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">{ar ? 'النوع الوظيفي' : 'FUNCTION'}</span>
                      <span className="text-cyan-400 font-bold uppercase">{drone.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">{ar ? 'تحسين المرافق' : 'SPECIAL EFFECT'}</span>
                      <span className="text-amber-400">
                        {drone.id === 'scout_drone' && (ar ? 'شفط البلورات عالي المدى' : 'Magnet Vacuum Range')}
                        {drone.id === 'shield_drone' && (ar ? 'قوة استعادة وحيوية' : 'Passive HP Auto-Recover')}
                        {drone.id === 'combat_drone' && (ar ? 'شعاع صاعق كل ثانيتين' : 'Laser pulse each 2s')}
                        {drone.id === 'none' && (ar ? 'لا شيء' : 'N/A')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Buy / Deploy button */}
                <div className="mt-4 pt-3 border-t border-white/5">
                  {drone.id === 'none' ? (
                    <button
                      onClick={() => handleDroneAction(drone)}
                      className={`w-full py-1.5 text-center text-[10px] font-bold rounded-lg transition-all border cursor-pointer ${
                        isActive
                          ? 'bg-neutral-950 border-neutral-800 text-neutral-500 cursor-not-allowed'
                          : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                      }`}
                      disabled={isActive}
                    >
                      {ar ? 'إلغاء تنشيط الدرونات' : 'No Companion Config'}
                    </button>
                  ) : isUnlocked ? (
                    <button
                      onClick={() => handleDroneAction(drone)}
                      className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                        isActive
                          ? 'bg-emerald-500 text-neutral-950 font-bold scale-100'
                          : 'bg-neutral-900 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10'
                      }`}
                    >
                      {isActive ? (ar ? 'تم التجهيز والربط' : 'DEPLOYED & ACTIVE') : (ar ? 'تجهيز واستدعاء' : 'DEPLOY COMPANION')}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDroneAction(drone)}
                      disabled={!canAfford}
                      className={`w-full py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-md'
                          : 'bg-neutral-900 border border-neutral-800 text-neutral-500 cursor-not-allowed'
                      }`}
                    >
                      <Coins className="w-3.5 h-3.5" />
                      <span>{ar ? 'شراء وتدريب الموديل' : 'PURCHASE COMPANION'}</span>
                      <span className="font-mono text-[10px] bg-black/30 px-1 py-0.5 rounded border border-white/5">{drone.cost} CP</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>

      </div>

      {/* Engineer Supervised Footer signature */}
      <div className="w-full text-center border-t border-white/5 pt-2.5 z-10 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-1 text-[10px] text-neutral-500 font-mono">
        <span>© 2026 {ar ? 'برمجة وإشراف وتصميم المهندس سهيل الهزبري' : 'SUPERVISED BY ENG. SUHAIL AL-HUZBARI.'}</span>
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-cyan-400">{ar ? 'نظام تحليق ثلاثي الأبعاد بالمتجهات' : 'ROTATIONAL FLOAT SPEED ALGORITHM'}</span>
        </div>
      </div>
    </div>
  );
}
