/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Award, ChevronLeft, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { Achievement } from '../types/game';
import { sound } from '../utils/sound';

interface AchievementsPanelProps {
  achievements: Achievement[];
  activeLanguage: 'ar' | 'en';
  onBack: () => void;
}

export default function AchievementsPanel({ achievements, activeLanguage, onBack }: AchievementsPanelProps) {
  const ar = activeLanguage === 'ar';

  return (
    <div className="w-full h-full bg-neutral-950 p-4 md:p-8 flex flex-col justify-between font-sans relative overflow-y-auto select-none">
      {/* Sci-fi Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/40 via-neutral-950 to-neutral-950 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-yellow-400 animate-pulse" />
          <h2 className="text-lg font-bold tracking-wider text-yellow-400">
            {ar ? 'سجل الإنجازات والوسام العسكري الفضائي' : 'Expedition Commendations & Medals'}
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

      {/* Achievements grid container */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-4 z-10 max-w-4xl mx-auto w-full flex-1 max-h-[300px] md:max-h-[385px] overflow-y-auto pr-1">
        {achievements.map((ach) => {
          return (
            <div
              key={ach.id}
              className={`p-3.5 rounded-xl border text-left flex items-start justify-between gap-3 transition-all duration-300 relative overflow-hidden ${
                ach.unlocked
                  ? 'bg-amber-500/5 border-amber-500/45 shadow-[0_0_12px_rgba(245,158,11,0.06)]'
                  : 'bg-neutral-900/30 border-neutral-900 opacity-60'
              }`}
            >
              {ach.unlocked && (
                <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none">
                  {/* Subtle triangle seal */}
                  <div className="absolute top-0 right-0 border-t-8 border-r-8 border-t-amber-400 border-r-amber-400" />
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl border shrink-0 ${
                  ach.unlocked
                    ? 'bg-neutral-950 border-amber-500 text-amber-400 animate-pulse'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-600'
                }`}>
                  {ach.unlocked ? <Award className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>

                <div className="flex flex-col text-left">
                  <span className={`text-xs font-bold leading-none ${ach.unlocked ? 'text-amber-400' : 'text-neutral-450'}`}>
                    {ar ? ach.titleAr : ach.titleEn}
                  </span>
                  <span className="text-[10px] text-neutral-400 leading-normal mt-1.5 max-w-xs block">
                    {ar ? ach.descriptionAr : ach.descriptionEn}
                  </span>
                </div>
              </div>

              {/* Reward indicator */}
              <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                {ach.unlocked ? (
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded uppercase font-mono">
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

      {/* Completion stat footer */}
      <div className="w-full max-w-4xl mx-auto z-10 p-3 bg-neutral-900/60 border border-white/5 rounded-lg flex items-center justify-between text-[11px] font-mono text-neutral-400 shrink-0">
        <div className="flex items-center gap-1.5 text-cyan-400">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>{ar ? 'سجل الخدمة المعتمد' : 'COMBAT EFFICIENCY RECORD'}</span>
        </div>
        <div className="text-right">
          <span>{ar ? 'نسبة الإنجازات المحصلة: ' : 'Unlocked Commendations: '}</span>
          <span className="text-amber-400 font-bold">
            {achievements.filter((a) => a.unlocked).length} / {achievements.length}
          </span>
        </div>
      </div>
    </div>
  );
}
