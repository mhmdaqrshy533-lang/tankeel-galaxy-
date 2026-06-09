/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Info, ChevronLeft, Map, Target, CalendarDays, Rocket, Trophy, Gamepad2, Award, User, Edit3, CheckCircle, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { sound } from '../utils/sound';
import { PlayerStats } from '../types/game';

interface PilotLeaderboardEntry {
  nameAr: string;
  nameEn: string;
  xp: number;
  credits: number;
  isGold?: boolean;
  isPlayer?: boolean;
  descAr: string;
  descEn: string;
}

interface AboutPanelProps {
  activeLanguage: 'ar' | 'en';
  stats?: PlayerStats;
  onBack: () => void;
}

export default function AboutPanel({ activeLanguage, stats, onBack }: AboutPanelProps) {
  const ar = activeLanguage === 'ar';
  const [activeTab, setActiveTab] = useState<'lore' | 'leaderboard'>('lore');

  // Load / Store custom callsign (Pilot Name)
  const [pilotCallsign, setPilotCallsign] = useState(() => {
    const saved = localStorage.getItem('tankeel_pilot_callsign');
    if (saved) return saved;
    return stats?.isMasterMode ? 'سهيل الهزبري (MASTER)' : 'طيار مستجد #42';
  });
  const [isEditingCallsign, setIsEditingCallsign] = useState(false);
  const [tempCallsign, setTempCallsign] = useState(pilotCallsign);

  const saveCallsign = () => {
    const trimmed = tempCallsign.trim();
    if (trimmed) {
      setPilotCallsign(trimmed);
      localStorage.setItem('tankeel_pilot_callsign', trimmed);
      sound.playClick();
    }
    setIsEditingCallsign(false);
  };

  // Safe default calculations for player scores
  const playerXP = stats?.xp || 0;
  const playerCredits = stats?.credits || 0;
  const playerCombinedScore = Math.round(playerXP * 1.5 + playerCredits);

  // Elite AI Pilot Competitors
  const baseRivals: PilotLeaderboardEntry[] = [
    { nameAr: 'القائد الأعلى/ سهيل الهزبري', nameEn: 'Grand Commander Suhail Al-Hazbari', xp: 95000, credits: 150000, isGold: true, descAr: 'مهندس اللعبة ومنشئ المحرك العسكري الفضائي الرئيسي.', descEn: 'Lead Game Architect & Creator of the Galactic Engine.' },
    { nameAr: 'العقيد/ فانس تورينق', nameEn: 'Colonel Vance Turing', xp: 24000, credits: 35000, descAr: 'خبير الاستطلاع واسترجاع الأقمار الصناعية لقطاع عطارد.', descEn: 'Mercury sector navigation veteran and satellite security chief.' },
    { nameAr: 'الملازم/ مارا لوكس', nameEn: 'Lieutenant Mara Lux', xp: 18500, credits: 19500, descAr: 'قائدة سفينة الأشباح المتسللة وخريجة الأكاديمية الأولى.', descEn: 'Stealth glider flight tactics coordinator and orbital vanguard.' },
    { nameAr: 'الرقيب/ قيلر كريستال', nameEn: 'Sergeant Geller Crystal', xp: 12000, credits: 14500, descAr: 'مستكشف الكوارتز والمعدن الثقيل وخبير الدروع والمرافقات.', descEn: 'Heavy crystal miner and drone defense system specialist.' },
    { nameAr: 'المجند/ ريان ألفا', nameEn: 'Cadet Rayan Alpha', xp: 8500, credits: 5000, descAr: 'طيار رائد لمركبات الدفع الرباعي الرياضية للشواص الفضائي.', descEn: 'High-speed mountain buggy racer, junior celestial patrol.' },
  ];

  // Dynamic ranking list combining the active player + predefined elites, sorted by combined rating!
  const leaderboardList: PilotLeaderboardEntry[] = [
    ...baseRivals,
    {
      nameAr: `🎖️ ${pilotCallsign} (${ar ? 'أنت' : 'YOU'})`,
      nameEn: `🎖️ ${pilotCallsign} (${ar ? 'أنت' : 'YOU'})`,
      xp: playerXP,
      credits: playerCredits,
      isPlayer: true,
      descAr: ar ? 'سجل طيرانك النشط وتقدمك العسكري على عطارد.' : 'Your active combat deployment in the Mercury-X quadrant.',
      descEn: ar ? 'سجل طيرانك النشط وتقدمك العسكري على عطارد.' : 'Your active combat deployment in the Mercury-X quadrant.',
    }
  ].sort((a, b) => (b.xp * 1.5 + b.credits) - (a.xp * 1.5 + a.credits));

  const roadmap = [
    {
      version: 'v1.0 (Current Act)',
      titleAr: 'الرحلات الاستكشافية الأولى',
      titleEn: 'First Expedition',
      descAr: 'كوكب واحد (عطارد-X)، مركبة هبوط وبغّي قيادة واحدة، شخصية مدرعة رئيسية واحدة، الأعداء الرئيسيين ودرونات المرافقة اللاسلكية.',
      descEn: 'One target planet (Mercury-X), standard landing ship, customizable orbital drone companion, touch navigation & mobile layouts.',
    },
    {
      version: 'v2.0 (Phase II)',
      titleAr: 'تمديد ترسانة الأسلحة',
      titleEn: 'Armament Deployment',
      descAr: 'إضافة كوكب جديد بالكامل، وإدراج أسلحة بلازما وليزر ومقذوفات متقدمة، وتحسين تعليق المركبات الأرضية.',
      descEn: 'Unlocks secondary planet coordinates, multi-frequency lasers, heavy thermal plasma rocket turrets, and optimized surface buggy suspension.',
    },
    {
      version: 'v3.0 (Phase III)',
      titleAr: 'توسيع التضاريس والخرائط',
      titleEn: 'Extended Terrain Scope',
      descAr: 'عالم تضاريس ثلاثية الأبعاد أكبر بعشرة أضعاف، كهوف عملاقة، وديان وجبال وعواصف رملية، تفعيل مهام مجمعة لخرائط المجرة.',
      descEn: 'Generates ten-fold maps, massive craters, basalt valleys, and intense magnetic sandstorms with cooperative base missions.',
    },
    {
      version: 'v4.0 (Phase IV)',
      titleAr: 'التحسينات الفائقة ولعب جماعي حقيقي',
      titleEn: 'Next-Gen Visual Overhaul',
      descAr: 'تحسين الرسوم وتأثيرات الاحتكاك الجوي الكاملة، طاقة الحطام، اللعب الجماعي اللاسلكي لمستخدمين ومزامنة النقاط غيابياً.',
      descEn: 'Ultra advanced geometric rendering, atmospheric entry friction fire, build customs, and low-latency client-side sync lobbies.',
    },
  ];

  return (
    <div className="w-full h-full bg-neutral-950 p-4 md:p-6 flex flex-col justify-between font-sans relative overflow-y-auto select-none">
      {/* Background Star Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/40 via-neutral-950 to-neutral-950 pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0ea5e905_1px,transparent_1px),linear-gradient(to_bottom,#0ea5e905_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Header section displaying the Designer Watermark */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-cyan-500/20 pb-2.5 z-10 shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <Info className="w-5.5 h-5.5 text-cyan-400 animate-pulse" />
          <div>
            <h2 className="text-base md:text-lg font-black tracking-wider text-cyan-400 font-mono text-left leading-tight">
              {ar ? 'قصة اللعبة واللوحة الشرفية للاتحاد الفضائي' : 'TANKEEL MISSION ARCHIVES & HALL OF FAME'}
            </h2>
            <p className="text-[10px] text-amber-400 font-mono text-left font-bold tracking-tight">
              {ar ? 'برمجة وإشراف وتصميم المهندس سهيل الهزبري' : 'Architected & Programmed by Eng. Suhail Al-Hazbari'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Main Back Button */}
          <button
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="px-3.5 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-cyan-400 text-neutral-300 hover:text-cyan-400 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer text-[11px] font-bold"
          >
            <ChevronLeft className="w-4 h-4" />
            {ar ? 'القائمة الرئيسية' : 'MainMenu'}
          </button>
        </div>
      </div>

      {/* Interactive Tabs */}
      <div className="flex gap-1 bg-neutral-900/80 p-0.5 rounded-lg border border-white/5 my-3.5 max-w-md mx-auto w-full z-10 relative">
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('lore');
          }}
          className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === 'lore' ? 'text-cyan-400 bg-neutral-950/80 border border-cyan-500/15' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          {ar ? 'القصة وخريطة التطوير 🗺️' : 'Story Lore & Roadmap 🗺️'}
        </button>
        <button
          onClick={() => {
            sound.playClick();
            setActiveTab('leaderboard');
          }}
          className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all relative cursor-pointer ${
            activeTab === 'leaderboard' ? 'text-amber-400 bg-neutral-950/80 border border-amber-500/15' : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          {ar ? 'قائمة نخبة الطيارين 🏆' : 'Top Pilots Rankings 🏆'}
        </button>
      </div>

      {/* Main Dynamic Viewport Swapper */}
      <div className="flex-1 w-full max-w-5xl mx-auto z-10 flex flex-col justify-start min-h-[300px]">
        <AnimatePresence mode="wait">
          {activeTab === 'lore' ? (
            <motion.div
              key="lore-view"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full"
            >
              {/* Narrative Lore */}
              <div className="space-y-4 bg-neutral-900/40 border border-white/5 p-4 rounded-xl flex flex-col justify-between text-left">
                <div className="space-y-3">
                  <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-mono font-bold uppercase tracking-widest leading-none">
                    <Target className="w-4 h-4 text-cyan-400" />
                    <span>{ar ? 'سياق مشروع تنكيل الفضائي' : 'SYSTEM PROTOCOL INITIATIVE'}</span>
                  </div>

                  <p className="text-xs text-neutral-300 leading-relaxed font-sans">
                    {ar
                      ? 'تنكيل هي تجربة أكشن فضائية ثلاثية الأبعاد تنقلك إلى طيات المجموعة الشمسية الأولى. وسط الصخور البازلتية الرمادية الحارة لكوكب عطارد-X المحروق بواسطة النجم المتأهب، ترتدي بدلة مكافحة الضغط الجوي المتقدمة لتقود مركبة استكشافية، وتستخلص قوالب البلازما، وتقاوم تحركات وحوش وفطريات الصخور والدرونات المارقة المهددة لاتصالات المجرة.'
                      : 'You command a futuristic orbital pilot traversing the high-heat, basalt canyons of Planet Mercury-X. Surrounded by glowing mineral geodes and hostile volcanic rock elemental titans, you must deploy mining harvesters and protect solar system beacon satellites.'}
                  </p>

                  <div className="border-t border-white/5 pt-3 space-y-2">
                    <span className="text-[10px] text-neutral-500 font-bold block tracking-wider uppercase">
                      {ar ? 'حيازة المنصات والقيادة المدعومة' : 'APPROVED SYSTEMS SPECS'}
                    </span>
                    <div className="flex flex-wrap gap-1.5 text-[9px] font-mono text-cyan-400">
                      <span className="bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-500/20">{ar ? 'الأندرويد والأجهزة المتوسطة' : 'Mobile Landscape Optimization'}</span>
                      <span className="bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-500/20">{ar ? 'فيزياء الشواص العسكري' : 'Heavy Suspension Rig'}</span>
                      <span className="bg-cyan-500/5 px-2 py-0.5 rounded border border-cyan-500/20">{ar ? 'صناعة محاكاة المهندس سهيل' : 'Precision Engine Code'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-neutral-950/60 border border-cyan-500/10 rounded-lg flex items-center gap-2.5 text-[10px] text-neutral-400 leading-normal">
                  <Rocket className="w-5 h-5 text-amber-500 shrink-0" />
                  <p className="font-mono text-neutral-300">
                    {ar
                      ? 'تفعيل محركات ومصفوفات WebGL يمنح شحذ إطارات ممتاز لتشغيل مستمر بدون الحاجة للاتصال بالإنترنت مطلقاً.'
                      : 'Fully simulated Web Audio synthetics and WebGL frameworks run offline at solid 60 FPS without high loads.'}
                  </p>
                </div>
              </div>

              {/* Development Timeline Roadmap */}
              <div className="space-y-2 max-h-[310px] md:max-h-[360px] overflow-y-auto pr-1">
                {roadmap.map((v, idx) => (
                  <div key={v.version} className="bg-neutral-900/50 border border-white/5 p-3 rounded-lg hover:border-cyan-500/25 transition-all flex flex-col gap-1 text-left">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-mono font-bold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-1.5 py-0.5 rounded">
                        {v.version}
                      </span>
                      <span className="text-[8px] font-mono text-neutral-500 flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        PHASE {idx + 1}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-neutral-200 mt-1">
                      {ar ? v.titleAr : v.titleEn}
                    </h4>
                    <p className="text-[10px] text-neutral-400 leading-relaxed">
                      {ar ? v.descAr : v.descEn}
                    </p>
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="leaderboard-view"
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-4 w-full"
            >
              {/* Callsign Editor Banner */}
              <div className="bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border border-amber-500/30 p-3.5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 text-left">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="p-2.5 bg-amber-500/5 border border-amber-500/20 text-amber-400 rounded-lg shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  {isEditingCallsign ? (
                    <div className="flex items-center gap-2 w-full max-w-sm">
                      <input
                        type="text"
                        maxLength={22}
                        value={tempCallsign}
                        onChange={(e) => setTempCallsign(e.target.value)}
                        className="bg-neutral-900 text-xs text-neutral-100 border border-amber-400 px-3 py-1.5 rounded focus:outline-none focus:ring-1 focus:ring-amber-400 w-full font-sans"
                        placeholder={ar ? "أدخل اسم الطيار المرغوب..." : "Enter Call-Sign name..."}
                      />
                      <button
                        onClick={saveCallsign}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-[10px] rounded cursor-pointer shrink-0 uppercase"
                      >
                        {ar ? 'توفير' : 'SAVE'}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-neutral-400 lowercase">{ar ? 'رمز النداء الحالي:' : 'Active pilot callsign:'}</span>
                        <h4 className="text-sm font-black text-amber-400 tracking-wide font-sans">{pilotCallsign}</h4>
                        <button
                          onClick={() => {
                            sound.playClick();
                            setIsEditingCallsign(true);
                          }}
                          className="p-1 hover:text-amber-300 text-neutral-500 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[10px] text-neutral-400 mt-1 max-w-md">
                        {ar ? 'قلم التعديل يتيح لك إعادة صياغة مسمى رتبتك العسكرية في اللائحة الشرفية مجاناً.' : 'Customize your visual callsign easily to register onto the live solar quadrant rankings.'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3 shrink-0 bg-neutral-900 px-3 py-2 rounded-lg border border-white/5 self-end sm:self-auto font-mono text-xs">
                  <div className="text-right">
                    <div className="text-[8px] text-neutral-500 uppercase">{ar ? 'التقييم التكتيكي الخاص بك' : 'YOUR RATED RATING SCORE'}</div>
                    <span className="text-amber-400 font-bold text-sm tracking-widest">{playerCombinedScore} pt</span>
                  </div>
                </div>
              </div>

              {/* Rankings Table Grid */}
              <div className="bg-neutral-900/30 border border-white/5 rounded-xl p-2.5 max-h-[240px] md:max-h-[290px] overflow-y-auto space-y-1.5 font-mono">
                <div className="grid grid-cols-12 text-[9px] text-neutral-500 font-bold uppercase tracking-wider px-3.5 py-1 border-b border-white/5">
                  <div className="col-span-2 text-left">{ar ? 'المرتبة' : 'RANK ID'}</div>
                  <div className="col-span-5 text-left">{ar ? 'الفدائي والطيار العسكري' : 'PILOT COMMANDER'}</div>
                  <div className="col-span-2 text-center">{ar ? 'الخبرة XP' : 'COMBAT XP'}</div>
                  <div className="col-span-3 text-right">{ar ? 'الذهب الإجمالي' : 'CREDITS'}</div>
                </div>

                {leaderboardList.map((pilot, idx) => {
                  const isSuhailMaster = pilot.nameEn.includes('Suhail Al-Hazbari');
                  return (
                    <div
                      key={idx}
                      className={`grid grid-cols-12 text-xs py-2 px-3.5 rounded-lg border items-center text-left ${
                        pilot.isPlayer
                          ? 'bg-amber-500/10 border-amber-500/40 text-amber-200 font-black shadow-[0_0_12px_rgba(245,158,11,0.08)]'
                          : isSuhailMaster
                          ? 'bg-cyan-500/10 border-cyan-500/25 text-cyan-200'
                          : 'bg-neutral-900/40 border-transparent text-neutral-300'
                      }`}
                    >
                      {/* Rank Medal */}
                      <div className="col-span-2 flex items-center gap-1">
                        {idx === 0 ? (
                          <span className="text-yellow-400 font-bold flex items-center gap-1">🥇 1</span>
                        ) : idx === 1 ? (
                          <span className="text-neutral-300 font-bold flex items-center gap-1">🥈 2</span>
                        ) : idx === 2 ? (
                          <span className="text-amber-600 font-bold flex items-center gap-1">🥉 3</span>
                        ) : (
                          <span className="text-neutral-500 tracking-widest pl-2">#{idx + 1}</span>
                        )}
                      </div>

                      {/* Pilot Name and Detail */}
                      <div className="col-span-5 flex flex-col justify-center">
                        <span className="font-sans font-bold text-xs truncate max-w-[210px]">
                          {ar ? pilot.nameAr : pilot.nameEn}
                        </span>
                        <span className="text-[9px] text-neutral-500 font-sans leading-none mt-0.5 truncate max-w-[210px]">
                          {ar ? pilot.descAr : pilot.descEn}
                        </span>
                      </div>

                      {/* XP */}
                      <div className="col-span-2 text-center text-[11px] text-neutral-300 font-semibold font-mono">
                        {pilot.xp.toLocaleString()}
                      </div>

                      {/* Credits */}
                      <div className="col-span-3 text-right text-[11px] text-amber-400 font-bold font-mono">
                        {pilot.credits.toLocaleString()} Cr
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Structured Footer emphasizing Offline compatibility & Engineer signature */}
      <div className="w-full max-w-5xl mx-auto z-10 p-3 bg-gradient-to-r from-neutral-900/90 to-neutral-950/90 border border-cyan-500/10 rounded-xl flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-neutral-400 shrink-0 gap-2 mt-4">
        <div className="flex items-center gap-1.5 text-cyan-400 text-left">
          <Shield className="w-4 h-4 text-cyan-400 animate-pulse shrink-0" />
          <span className="font-bold">{ar ? 'حماية تامة من الإنترنت وتشفير محلي للـ مهندس سهيل' : 'OFFLINE-FIRST SECURE ENCRYPTED BY ENG. SUHAIL'}</span>
        </div>
        <div className="text-right">
          <span className="text-neutral-500 text-[9px] block uppercase">{ar ? 'لوحة شرف الأسطول الفضائي' : 'TANKEEL FRONT HALL OF INTEL'}</span>
          <span className="text-amber-400 font-bold">{ar ? 'عضوية الاتحاد العسكري النشط' : 'SOLAR ALLIANCE VOLUNTEER ID'}</span>
        </div>
      </div>
    </div>
  );
}
