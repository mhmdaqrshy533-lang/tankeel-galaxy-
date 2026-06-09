/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Award, ChevronLeft, Lock, Sparkles, CheckCircle, ShieldAlert, Star, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Achievement } from '../types/game';
import { sound } from '../utils/sound';

interface AchievementsPanelProps {
  achievements: Achievement[];
  activeLanguage: 'ar' | 'en';
  onBack: () => void;
}

export default function AchievementsPanel({ achievements, activeLanguage, onBack }: AchievementsPanelProps) {
  const ar = activeLanguage === 'ar';
  
  // Track which achievements have already been celebrated
  const [celebratedIds, setCelebratedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('tankeel_celebrated_achievements');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentCelebrate, setCurrentCelebrate] = useState<Achievement | null>(null);

  // Check for any newly unlocked but un-celebrated achievements
  useEffect(() => {
    const uncelebrated = achievements.filter(
      (ach) => ach.unlocked && !celebratedIds.includes(ach.id)
    );

    if (uncelebrated.length > 0) {
      // Pick the first uncelebrated one
      const target = uncelebrated[0];
      setCurrentCelebrate(target);
      
      // Delay slightly to let screen settle, then play the majestic audio fanfare
      const timer = setTimeout(() => {
        sound.playAchievementUnlock();
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setCurrentCelebrate(null);
    }
  }, [achievements, celebratedIds]);

  // Mark an achievement as celebrated, updating persistence
  const handleDismissCelebration = () => {
    if (!currentCelebrate) return;
    sound.playClick();
    
    const updated = [...celebratedIds, currentCelebrate.id];
    setCelebratedIds(updated);
    try {
      localStorage.setItem('tankeel_celebrated_achievements', JSON.stringify(updated));
    } catch (e) {
      console.warn('Unable to persist celebrated achievements', e);
    }
  };

  // Helper utility to render shiny particle sparks
  const sparkCoordinates = [
    { delay: 0.1, left: '15%', top: '25%' },
    { delay: 0.3, left: '80%', top: '20%' },
    { delay: 0.5, left: '20%', top: '70%' },
    { delay: 0.2, left: '85%', top: '65%' },
    { delay: 0.7, left: '48%', top: '15%' },
    { delay: 0.4, left: '50%', top: '75%' },
  ];

  return (
    <div className="w-full h-full bg-neutral-950 p-4 md:p-8 flex flex-col justify-between font-sans relative overflow-y-auto select-none">
      {/* Sci-fi Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/40 via-neutral-950 to-neutral-950 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e908_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e908_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Header with Developer Signature */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <Award className="w-5.5 h-5.5 text-yellow-400 animate-pulse" />
          <div>
            <h2 className="text-lg font-bold tracking-wider text-yellow-400 font-mono">
              {ar ? 'سجل الإنجازات والوسام العسكري الفضائي' : 'EXPEDITION COMMENDATIONS & MEDALS'}
            </h2>
            <p className="text-[10px] text-neutral-400 font-sans">
              {ar ? 'برمجة وإشراف وتصميم المهندس سهيل الهزبري' : 'Architected & Designed by Eng. Suhail Al-Huzbari'}
            </p>
          </div>
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

      {/* Achievements grid container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 my-4 z-10 max-w-4xl mx-auto w-full flex-1 max-h-[300px] md:max-h-[385px] overflow-y-auto pr-1">
        {achievements.map((ach) => {
          return (
            <div
              key={ach.id}
              className={`p-4 rounded-xl border text-left flex items-start justify-between gap-3 transition-all duration-300 relative overflow-hidden ${
                ach.unlocked
                  ? 'bg-amber-500/5 border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.08)]'
                  : 'bg-neutral-900/30 border-white/5 opacity-55'
              }`}
            >
              {ach.unlocked && (
                <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none">
                  {/* Glowing gold tag seal */}
                  <div className="absolute top-0 right-0 border-t-8 border-r-8 border-t-amber-400 border-r-amber-400" />
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl border shrink-0 ${
                  ach.unlocked
                    ? 'bg-neutral-950 border-amber-500/80 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)] animate-pulse'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-600'
                }`}>
                  {ach.unlocked ? <Award className="w-5.5 h-5.5" /> : <Lock className="w-5.5 h-5.5" />}
                </div>

                <div className="flex flex-col text-left">
                  <span className={`text-xs font-bold leading-none ${ach.unlocked ? 'text-amber-400' : 'text-neutral-300'}`}>
                    {ar ? ach.titleAr : ach.titleEn}
                  </span>
                  <span className="text-[10px] text-neutral-400 leading-normal mt-2 max-w-[240px] block">
                    {ar ? ach.descriptionAr : ach.descriptionEn}
                  </span>
                </div>
              </div>

              {/* Reward indicator */}
              <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                {ach.unlocked ? (
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-1.5 py-0.5 rounded uppercase font-mono">
                    {ar ? 'مكتمل' : 'RESOLVED'}
                  </span>
                ) : (
                  <span className="text-[9px] font-bold text-neutral-500 font-mono">
                    {ar ? 'مغلق' : 'LOCKED'}
                  </span>
                )}
                
                <span className="text-[9px] font-mono text-amber-500 font-bold mt-2">
                  +{ach.xpValue} XP
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion stat footer with official watermark */}
      <div className="w-full max-w-4xl mx-auto z-10 p-4 bg-gradient-to-r from-neutral-900/80 to-neutral-950/80 border border-cyan-500/10 rounded-xl flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-neutral-400 shrink-0 gap-2">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="font-bold">{ar ? 'سجل الخدمة والمرافقات للـ مهندس سهيل ' : 'ENG. SUHAIL SERVICE COMMENDATION RECORD'}</span>
        </div>
        <div className="text-right flex items-center gap-2">
          <span>{ar ? 'أوسمة الاستحقاق المكتشفة: ' : 'Unlocked Flight Medals: '}</span>
          <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 text-xs">
            {achievements.filter((a) => a.unlocked).length} / {achievements.length}
          </span>
        </div>
      </div>

      {/* Majestic Epic Unlock Celebration Screen Overlay */}
      <AnimatePresence>
        {currentCelebrate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-neutral-950/95 backdrop-blur-xl z-[99999] flex flex-col justify-center items-center p-4"
          >
            {/* Animated Sci-Fi Rotating Light Halo Backdrop */}
            <div className="absolute w-[360px] h-[360px] md:w-[500px] md:h-[500px] rounded-full bg-gradient-to-tr from-amber-500/20 via-yellow-500/5 to-transparent blur-3xl pointer-events-none animate-spin-slow" />
            
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(245,158,11,0.1)_0%,_transparent_70%)] pointer-events-none" />

            {/* Glowing Golden Grid Overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#eab30805_1px,transparent_1px),linear-gradient(to_bottom,#eab30805_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

            {/* Float Particles / Sparkles */}
            {sparkCoordinates.map((pt, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0, y: 10 }}
                animate={{ 
                  scale: [0, 1.2, 0.8, 1], 
                  opacity: [0, 0.9, 0.4, 0.8], 
                  y: [-15, 15, -5, 0] 
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 3 + i, 
                  delay: pt.delay 
                }}
                className="absolute text-yellow-400 select-none pointer-events-none"
                style={{ left: pt.left, top: pt.top }}
              >
                <Star className="w-5 h-5 fill-current text-amber-400/80 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              </motion.div>
            ))}

            {/* Main Interactive Award Container */}
            <motion.div
              initial={{ scale: 0.6, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.8, y: -20, opacity: 0 }}
              transition={{ type: 'spring', damping: 15 }}
              className="max-w-md w-full bg-neutral-900 border-2 border-amber-500/60 p-6 rounded-2xl flex flex-col justify-center items-center gap-5 text-center relative overflow-hidden shadow-[0_0_60px_rgba(245,158,11,0.25)]"
            >
              <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-amber-500/10 to-transparent h-20 pointer-events-none" />

              {/* Glowing outer volumetric ring */}
              <div className="relative w-28 h-28 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-500 via-yellow-400 to-orange-500 animate-spin-slow opacity-80 blur-xs" />
                <div className="absolute inset-2 bg-neutral-900 rounded-full flex items-center justify-center z-10" />
                
                {/* Gold Medal Icon */}
                <motion.div
                  animate={{ 
                    scale: [1, 1.08, 0.96, 1.05, 1],
                    rotateY: [0, 180, 360],
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity,
                    repeatType: "loop",
                    ease: "easeInOut"
                  }}
                  className="z-20 text-yellow-500 relative flex items-center justify-center filter drop-shadow-[0_0_15px_rgba(234,179,8,0.6)]"
                >
                  <Award className="w-16 h-16 text-yellow-400 stroke-[1.5]" />
                  <Star className="w-4 h-4 text-neutral-950 fill-amber-400 absolute top-[18px]" />
                </motion.div>
              </div>

              {/* Medal Unlocked Title banner */}
              <div className="space-y-1 z-10">
                <span className="text-[10px] uppercase tracking-[0.25em] text-yellow-500 font-mono font-bold block animate-pulse">
                  🏆 {ar ? 'تم حصد وسام عسكري ذهبي جديد' : 'NEW GOLD COMMENDATION EARNED'} 🏆
                </span>
                <h3 className="text-xl font-black text-white tracking-wide">
                  {ar ? currentCelebrate.titleAr : currentCelebrate.titleEn}
                </h3>
                <p className="text-xs text-neutral-400 font-sans max-w-sm mx-auto leading-relaxed mt-2.5">
                  {ar ? currentCelebrate.descriptionAr : currentCelebrate.descriptionEn}
                </p>
              </div>

              {/* Spoils / XP Reward */}
              <div className="px-5 py-2.5 bg-neutral-950 border border-amber-500/20 rounded-xl flex items-center gap-2.5 font-mono text-sm shadow-inner z-10">
                <span className="text-amber-400">⚡</span>
                <span className="text-neutral-300 font-medium">{ar ? 'المكافأة التكتيكية:' : 'EXP BONUS:'}</span>
                <span className="font-bold text-amber-400 text-base">+{currentCelebrate.xpValue} XP</span>
              </div>

              {/* OFFICIAL ARCHITECT SIGNATURE WATERMARK */}
              <div className="w-full border-t border-white/5 pt-4 text-center z-10">
                <span className="text-[9px] text-neutral-500 block uppercase tracking-wider font-mono">
                  {ar ? 'برمجة وتطوير وإشراف هندسي' : 'Supervision & Engine Architecture by'}
                </span>
                <span className="text-[11px] font-bold text-amber-300 tracking-wider">
                  {ar ? 'المهندس / سهيل الهزبري' : 'Engineer / Suhail Al-Huzbari'}
                </span>
              </div>

              {/* Claim award Action button */}
              <button
                onClick={handleDismissCelebration}
                className="w-full py-3 bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 font-black text-xs rounded-xl active:scale-95 transition-all shadow-lg hover:shadow-[0_0_25px_rgba(245,158,11,0.4)] cursor-pointer z-10 select-none uppercase tracking-wider"
              >
                {ar ? 'استلام الوسام العسكري والعودة 🎖️' : 'COLLECT GOLD MEDAL 🎖️'}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

