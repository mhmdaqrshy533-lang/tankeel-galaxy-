/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Info, ChevronLeft, Map, Target, CalendarDays, Rocket } from 'lucide-react';
import { sound } from '../utils/sound';

interface AboutPanelProps {
  activeLanguage: 'ar' | 'en';
  onBack: () => void;
}

export default function AboutPanel({ activeLanguage, onBack }: AboutPanelProps) {
  const ar = activeLanguage === 'ar';

  const roadmap = [
    {
      version: 'v1.0 (Current Act)',
      titleAr: 'الرحلات الاستكشافية الأولى',
      titleEn: 'First Expedition',
      descAr: 'كوكب واحد (عطارد-X)، مركبة هبوط وبغّي قيادة واحدة، شخصية مدرعة رئيسية واحدة، الأعداء الرئيسيين.',
      descEn: 'One target planet (Mercury-X), standard landing ship, one buggy, full mobile touch simulation & three difficulty missions.',
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
      descAr: 'عالم تضاريس ثلاثية الأبعاد أكبر بعشرة أضعاف، كهوف عملاقة، وديان وجبال وعواصف رملية، تفعيل مهام مجمعة.',
      descEn: 'Generates ten-fold maps, massive craters, basalt valleys, and intense magnetic sandstorms with cooperative base missions.',
    },
    {
      version: 'v4.0 (Phase IV)',
      titleAr: 'التحسينات الفائقة واللعب المحلي',
      titleEn: 'Next-Gen Visual Overhaul',
      descAr: 'تحسين الرسوم وتأثيرات الاحتكاك الجوي الكاملة، طاقة الحطام، اللعب الجماعي المحلي لمستخدمين.',
      descEn: 'Ultra advanced geometric rendering, atmospheric entry friction fire, scrap customizers, and local multi-player lobbies.',
    },
  ];

  return (
    <div className="w-full h-full bg-neutral-950 p-4 md:p-8 flex flex-col justify-between font-sans relative overflow-y-auto select-none">
      {/* Background Star Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/40 via-neutral-950 to-neutral-950 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold tracking-wider text-cyan-400">
            {ar ? 'قصة اللعبة وتخطيط الإطلاق العسكري' : 'Story Lore & Version Roadmap'}
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

      {/* Main content layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-4 z-10 w-full max-w-5xl mx-auto flex-1 items-stretch">
        
        {/* Left Column: Narrative Lore & Target Audience */}
        <div className="space-y-3.5 bg-neutral-900/40 border border-white/5 p-4 rounded-xl flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-1 text-xs text-cyan-400 font-mono font-bold uppercase tracking-widest leading-none">
              <Target className="w-4 h-4" />
              <span>{ar ? 'رؤية مشروع تنكيل العسكري' : 'OPERATION TANKEEL INITIATIVE'}</span>
            </div>

            <p className="text-xs text-neutral-300 leading-relaxed">
              {ar
                ? 'تنكيل هي لعبة حركة ومغامرات فضائية ثلاثية الأبعاد تنقلك إلى عالم مستقبلي غامض. في تضاريس كوكب عطارد-X القاسية، تتحكم ببطل مدرع يرتدي بدلة طاقة بالكامل، يواجه تهديدات فضائية ويسترد قنوات الاتصال المهجورة دفاعاً عن قطاع النظام الشمسي الأول.'
                : 'Tankeel is a 3D tactical space-military shooter. Armed with high-power thermo weapons, you penetrate restricted thermal cores on Planet Mercury-X to recover disabled satellites and command networks.'}
            </p>

            {/* Target audience block */}
            <div className="border-t border-white/5 pt-3 space-y-1">
              <span className="text-[10px] text-neutral-500 font-bold block">{ar ? 'الفئة المستهدفة ومحبو التجربة' : 'TARGET PROTOCOL AUDIENCE'}</span>
              <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-cyan-400">
                <span className="bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">{ar ? 'المراهقين والشباب' : 'Teens & Young Adults'}</span>
                <span className="bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">{ar ? 'سفر واستكشاف صخور الكواكب' : 'Space Explorers'}</span>
                <span className="bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/40">{ar ? 'محاكاة القيادة والأجهزة المتوسطة' : 'Drivable Physics Simulators'}</span>
              </div>
            </div>
          </div>

          {/* Graphic quote */}
          <div className="p-3 bg-neutral-950/60 border border-neutral-800 rounded-lg flex items-center gap-2 text-[10px] text-neutral-400 leading-normal">
            <Rocket className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="font-mono">
              {ar
                ? 'مطور بمحرك WebGL ثلاثي الأبعاد ليعمل بسلاسة من 30 إلى 60 إطاراً في الثانية على الهواتف والأجهزة المكتبية.'
                : 'Synthesized rendering structures support seamless 30-60 FPS execution on mid-tier Android devices.'}
            </p>
          </div>
        </div>

        {/* Right Column: Roadmap timeline versions */}
        <div className="space-y-2 bg-neutral-900/20 max-h-[300px] md:max-h-[380px] overflow-y-auto pr-1">
          <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest pl-1 block mb-2">
            {ar ? 'خطة التطوير والإصدارات التوسعية' : 'DEVELOPMENT ROADMAP LOGS'}
          </span>

          <div className="space-y-2">
            {roadmap.map((v, index) => (
              <div key={v.version} className="bg-neutral-900/60 border border-white/5 p-3 rounded-xl hover:border-amber-500/20 transition-all flex flex-col gap-1 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-1.5 py-0.5 rounded">
                    {v.version}
                  </span>
                  <span className="text-[9px] font-mono text-neutral-500 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    ACT {index + 1}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-neutral-100 font-sans mt-1">
                  {ar ? v.titleAr : v.titleEn}
                </h4>
                <p className="text-[10px] text-neutral-400 leading-relaxed mt-0.5">
                  {ar ? v.descAr : v.descEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
