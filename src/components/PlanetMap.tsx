/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Globe, Lock, ShieldAlert, Award, Compass, Sparkles, ChevronLeft, Play, ArrowRightLeft } from 'lucide-react';
import { Planet, PlanetId, Mission, MissionId, PlayerStats } from '../types/game';
import { sound } from '../utils/sound';

interface PlanetMapProps {
  stats: PlayerStats;
  planets: Planet[];
  missions: Mission[];
  activeLanguage: 'ar' | 'en';
  onBack: () => void;
  onLaunchMission: (planetId: PlanetId, missionId: MissionId) => void;
}

export default function PlanetMap({
  stats,
  planets,
  missions,
  activeLanguage,
  onBack,
  onLaunchMission,
}: PlanetMapProps) {
  const ar = activeLanguage === 'ar';
  
  // Inspected planet inside the galaxy radar view
  const [selectedPlanetId, setSelectedPlanetId] = useState<PlanetId>('mercury_x');

  const activePlanet = planets.find((p) => p.id === selectedPlanetId) || planets[0];

  const handleLaunch = (missionId: MissionId) => {
    sound.playClick();
    onLaunchMission(selectedPlanetId, missionId);
  };

  return (
    <div className="w-full h-full bg-neutral-950 p-4 md:p-8 flex flex-col justify-between font-sans relative overflow-y-auto select-none">
      {/* Heavy Celestial Cloud Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/60 via-neutral-950 to-neutral-950 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1543722530-d2c3201371e7?auto=format&fit=crop&q=80&w=1200')] bg-cover opacity-10 mix-blend-color-dodge pointer-events-none" />

      {/* Galaxy Coordinate labels */}
      <div className="absolute top-4 left-4 text-[9px] font-mono text-cyan-400/40 z-0 select-none">
        <span>GALAXY_COORD: SOL.CRATER.89X9</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyan-400 animate-pulse" />
          <h2 className="text-lg font-bold tracking-wider text-cyan-400">
            {ar ? 'نظام الملاحة وخريطة الكواكب المجرية' : 'Orbital Command & Celestial Map'}
          </h2>
        </div>
        <button
          onClick={() => {
            sound.playClick();
            onBack();
          }}
          className="px-4 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-cyan-400 text-neutral-300 hover:text-cyan-400 rounded-md transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          {ar ? 'القائمة الرئيسية' : 'MainMenu'}
        </button>
      </div>

      {/* Main Galaxy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 my-4 z-10 w-full max-w-5xl mx-auto flex-1 items-stretch">
        
        {/* Left Grid: Planetary system list with rotation simulators */}
        <div className="md:col-span-5 space-y-3 max-h-[300px] md:max-h-[380px] overflow-y-auto pr-1">
          <span className="text-[10px] text-neutral-400 block font-bold tracking-widest uppercase mb-1">
            {ar ? 'الكواكب المستهدفة حالياً' : 'DETECTION RADAR FEED'}
          </span>

          {planets.map((planet) => {
            const isSelected = selectedPlanetId === planet.id;
            const isUnlocked = stats.unlockedPlanets.includes(planet.id);

            return (
              <button
                key={planet.id}
                onClick={() => {
                  sound.playClick();
                  setSelectedPlanetId(planet.id);
                }}
                className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all duration-300 transform cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                    : 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Rotating Globe Circle */}
                  <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 border border-white/10 shadow-inner">
                    {/* Locked black gas cloud wrapper */}
                    {!isUnlocked ? (
                      <div className="absolute inset-0 bg-neutral-950 flex items-center justify-center z-10">
                        {/* Dynamic rotating ring */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950 opacity-90" />
                        <Lock className="w-4.5 h-4.5 text-red-500 animate-pulse" />
                      </div>
                    ) : (
                      <>
                        {/* Globe graphic skin */}
                        <div
                          className="absolute inset-0 opacity-85 hover:scale-110 transition-transform duration-500 animate-spin-slow"
                          style={{
                            background: `radial-gradient(circle at 35% 35%, #ffffff 0%, transparent 60%), ${planet.color}`,
                            animationDuration: '60s',
                          }}
                        />
                        {/* Atmosphere glowing halo ring */}
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-transparent via-transparent to-black/70" />
                      </>
                    )}
                  </div>

                  <div className="flex flex-col text-left">
                    <span className="text-xs font-bold text-neutral-100 font-sans">
                      {ar ? planet.nameAr : planet.nameEn}
                    </span>
                    <span className="text-[9px] font-mono text-neutral-400 leading-none mt-1">
                      {ar ? planet.atmosphereAr : planet.atmosphereEn}
                    </span>
                  </div>
                </div>

                <div className="pr-1 shrink-0">
                  {isUnlocked ? (
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded uppercase ${planet.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      {planet.difficulty === 'Easy' ? (ar ? 'آمن نسبياً' : 'EASY') : (ar ? 'خطر داهم' : 'LOCKED')}
                    </span>
                  ) : (
                    <span className="text-[9px] text-red-500 font-bold tracking-wider font-mono uppercase">{ar ? 'محظور المعاينة' : 'RESTRICTED'}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Grid: Detailed target panel showing details of Mercury-X & available operations */}
        <div className="md:col-span-7 flex flex-col justify-between bg-neutral-900/40 border border-white/5 rounded-2xl p-4 gap-4">
          
          {/* Planet description */}
          <div>
            <div className="flex items-center gap-1.5 text-xs text-amber-500 font-mono mb-2">
              <ShieldAlert className="w-4 h-4" />
              <span>{ar ? 'نشرة بيولوجية واستطلاعية من مجس الأقمار الصناعية' : 'SATELLITE INTELLIGENCE DIAGNOSTIC'}</span>
            </div>

            <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2 border-b border-white/5 pb-2">
              {ar ? activePlanet.nameAr : activePlanet.nameEn}
              {activePlanet.id !== 'mercury_x' && <Lock className="w-4 h-4 text-red-500" />}
            </h3>

            <p className="text-xs text-neutral-300 leading-relaxed mt-2.5">
              {ar ? activePlanet.descriptionAr : activePlanet.descriptionEn}
            </p>
          </div>

          {/* Core Level Missions Selector (rendered for Mercury-X, showing Locked placeholders for others) */}
          <div className="space-y-2">
            <span className="text-[10px] text-cyan-400 block font-mono font-bold uppercase tracking-wider">
              {ar ? 'عمليات الهبوط والعمليات المتاحة' : 'AVAILABLE EXPEDITION MISSIONS'}
            </span>

            {activePlanet.id === 'mercury_x' ? (
              <div className="space-y-2 max-h-[170px] overflow-y-auto pr-1">
                {missions.map((mission) => (
                  <div
                    key={mission.id}
                    className="bg-neutral-950/80 border border-white/5 p-2.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left hover:border-cyan-500/30 transition-all"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-neutral-100">
                          {ar ? mission.titleAr : mission.titleEn}
                        </span>
                        <span className={`text-[9px] font-mono px-1 py-0 rounded uppercase font-bold ${
                          mission.difficulty === 'easy' 
                            ? 'bg-emerald-500/15 text-emerald-400' 
                            : mission.difficulty === 'medium'
                            ? 'bg-amber-500/15 text-amber-500'
                            : 'bg-red-500/15 text-red-400'
                        }`}>
                          {ar ? mission.difficultyAr : mission.difficultyEn}
                        </span>
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-normal mt-0.5">
                        {ar ? mission.descriptionAr : mission.descriptionEn}
                      </p>
                    </div>

                    <button
                      onClick={() => handleLaunch(mission.id)}
                      className="px-3.5 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-neutral-950 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      {ar ? 'هبوط ونشر' : 'LO-ORD'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              /* Venus / Mars Locked Alert Screen */
              <div className="p-6 bg-red-500/5 border border-red-500/15 rounded-xl flex flex-col items-center justify-center text-center gap-1.5">
                <Lock className="w-7 h-7 text-red-500 animate-bounce" />
                <span className="text-xs font-bold text-red-400 uppercase tracking-widest">{ar ? 'المنطقة مشفرة بالدرع النجمي' : 'SECTOR LOCK ACTIVE'}</span>
                <p className="text-[10px] text-neutral-500 leading-normal max-w-sm">
                  {ar
                    ? 'هذا الكوكب مقفل في الوقت الحالي. أكمل المرحلة الصعبة من عطارد-X للحصول على شيفرات الملاحة اللازمة لفك ضباب الغاز الكثيف.'
                    : 'Orbit tracking scanner unable to penetrate atmosphere logs. Complete Mercury-X Hard Boss stage to retrieve next access codes.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
