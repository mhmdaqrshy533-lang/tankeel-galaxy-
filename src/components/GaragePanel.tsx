/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Settings, ChevronLeft, Shield, Gauge, Zap, Sparkles, Check, Lock, Unlock } from 'lucide-react';
import { PlayerStats, Vehicle, VehicleId } from '../types/game';
import { sound } from '../utils/sound';

interface GaragePanelProps {
  stats: PlayerStats;
  vehicles: Vehicle[];
  activeLanguage: 'ar' | 'en';
  onBack: () => void;
  onSelectVehicle: (id: VehicleId) => void;
  onUpgradeStat: (vehicleId: VehicleId, stat: 'speed' | 'armor' | 'energy', cost: number) => void;
  onCustomizeVehicle: (vehicleId: VehicleId, color: string, sticker: string) => void;
  onUnlockVehicle: (id: VehicleId, price: number) => void;
}

export default function GaragePanel({
  stats,
  vehicles,
  activeLanguage,
  onBack,
  onSelectVehicle,
  onUpgradeStat,
  onCustomizeVehicle,
  onUnlockVehicle,
}: GaragePanelProps) {
  const ar = activeLanguage === 'ar';
  
  // Track currently inspected vehicle inside the garage panel view
  const [selectedGarageId, setSelectedGarageId] = useState<string>(
    stats.currentVehicle !== 'none' ? stats.currentVehicle : 'buggy'
  );

  // Quantum Coins State
  const [quantumCoins, setQuantumCoins] = useState<number>(350);

  // Next-generation classified fighter aircraft models
  const classifiedVehicles = [
    {
      id: 'f35_fusion',
      nameAr: 'إف-35 فيوجن الشبحية (سري للغاية)',
      nameEn: 'F-35 Fusion Quantum Strike (CLASSIFIED)',
      descriptionAr: 'منظومة قتالية شبحية من الجيل السادس برادارات متداخلة وأشعة المادة المظلمة الذاتية.',
      descriptionEn: 'Ultra-classified 6th-gen stealth interceptor. Features hyper-advanced dark matter thrusters.',
      costQC: 1500,
      speed: 5,
      armor: 5,
      energy: 5,
      sticker: 'galaxy',
      color: '#4f46e5',
      customSvg: (
        <svg className="w-16 h-16 animate-pulse" viewBox="0 0 64 64" fill="none">
          <path d="M32 4 L48 24 L56 50 L32 42 L8 50 L16 24 Z" fill="#4f46e5" stroke="#ec4899" strokeWidth="2.5" />
          <polygon points="32,15 28,30 36,30" fill="#22d3ee" />
          <line x1="16" y1="24" x2="48" y2="24" stroke="#f59e0b" strokeWidth="1" />
        </svg>
      )
    },
    {
      id: 'b2_spirit',
      nameAr: 'بي-٢ روح المجرة الثقيلة (سري للغاية)',
      nameEn: 'B-2 Galactic Spirit Orbiter (CLASSIFIED)',
      descriptionAr: 'قاذفة ثقيلة خارقة للأغلفة الحمضية، مع حواضن لإطلاق قنابل البلازما التكتيكية.',
      descriptionEn: 'Deep-space stealth heavy bomber. Employs advanced shield arrays and nuclear plasma missiles.',
      costQC: 4500,
      speed: 5,
      armor: 5,
      energy: 5,
      sticker: 'skull',
      color: '#1e1b4b',
      customSvg: (
        <svg className="w-20 h-20 animate-pulse" viewBox="0 0 64 64" fill="none">
          <path d="M32 8 L60 48 L44 44 L32 36 L20 44 L4 48 Z" fill="#1e1b4b" stroke="#3b82f6" strokeWidth="2.5" />
          <circle cx="32" cy="24" r="5" fill="#ef4444" />
          <line x1="32" y1="8" x2="32" y2="36" stroke="#fbbf24" strokeWidth="1.5" />
        </svg>
      )
    },
  ];

  const isClassified = selectedGarageId === 'f35_fusion' || selectedGarageId === 'b2_spirit';
  const activeClassified = classifiedVehicles.find((v) => v.id === selectedGarageId);

  const activeVehicle = vehicles.find((v) => v.id === selectedGarageId) || vehicles[1];

  const handleSelectActive = () => {
    sound.playClick();
    if (isClassified) {
      sound.playLaser('high');
      alert(ar ? 'بروتوكولات الأمان العسكري تمنع تشغيل النماذج التجريبية داخل هذه المهمة لمجرد عدم التصنيف الكافي!' : 'Military intelligence protocol blocks deployment of classified X-type fighters into generic scout operations!');
      return;
    }
    onSelectVehicle(selectedGarageId as VehicleId);
  };

  const handleUnlock = () => {
    if (stats.credits < activeVehicle.cost) {
      sound.playLaser('high');
      alert(ar ? 'رصيد الائتمان غير كافٍ لفتح هذه المركبة الفضائية!' : 'Insufficient credit balance to purchase this vessel!');
      return;
    }
    sound.playLevelUp();
    onUnlockVehicle(selectedGarageId, activeVehicle.cost);
  };

  const handleUpgrade = (stat: 'speed' | 'armor' | 'energy') => {
    const currentVal = activeVehicle[stat];
    if (currentVal >= 5) {
      sound.playLaser('high');
      alert(ar ? 'تم الوصول للترقية القصوى لهيكل المحاكاة!' : 'Maximum modification level reached!');
      return;
    }
    
    const cost = (currentVal + 1) * 350; // stats level upgrade cost
    if (stats.credits < cost) {
      sound.playLaser('high');
      alert(ar ? 'الائتمانات غير كافية لترقية هذا الجزء!' : 'Insufficient credits for this performance part!');
      return;
    }

    sound.playLevelUp();
    onUpgradeStat(selectedGarageId, stat, cost);
  };

  const colors = [
    { value: '#0f172a', nameAr: 'الأسود اللامع', nameEn: 'Metallic Coal' },
    { value: '#06b6d4', nameAr: 'الأزرق الفضائي', nameEn: 'Laser Cyan' },
    { value: '#f97316', nameAr: 'البرتقالي التحذيري', nameEn: 'Warning Flame' },
    { value: '#10b981', nameAr: 'الأخضر الراداري', nameEn: 'Radar Emerald' },
  ];

  const stickers = [
    { value: 'none', labelAr: 'بدون ملصقات', labelEn: 'No Decal' },
    { value: 'skull', labelAr: 'شعار القاتل', labelEn: 'Skull Strike' },
    { value: 'galaxy', labelAr: 'رمز الدوران', labelEn: 'Sol Emblem' },
    { value: 'flame', labelAr: 'طيف السرعة', labelEn: 'Flame Trail' },
  ];

  const applyCustomization = (color: string, sticker: string) => {
    sound.playClick();
    onCustomizeVehicle(selectedGarageId, color, sticker);
  };

  return (
    <div className="w-full h-full bg-neutral-950 p-4 md:p-8 flex flex-col justify-between font-sans relative overflow-y-auto select-none">
      {/* Background Star Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-neutral-900/40 via-neutral-950 to-neutral-950 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyan-500/20 pb-2 z-10 gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-amber-500 animate-spin-slow" />
          <h2 className="text-lg font-bold tracking-wider text-amber-500">
            {ar ? 'جراج المركبات والتعديل الهيكلي' : 'Spaceship Modification & Orbital Garage'}
          </h2>
        </div>

        {/* Resource summary info */}
        <div className="flex items-center gap-4 bg-neutral-900/60 border border-white/5 py-1 px-3 rounded-lg text-[11px] font-mono">
          <div className="flex items-center gap-1">
            <span className="text-amber-400 font-bold">💳 {stats.credits} CP</span>
          </div>
          <div className="flex items-center gap-1 border-l border-white/10 pl-3">
            <span className="text-violet-400 font-bold">🌀 {quantumCoins} QC</span>
          </div>
          <div className="flex items-center gap-1 border-l border-white/10 pl-3">
            <span className="text-cyan-400 font-bold">💎 {stats.resources.crystals}</span>
            <span className="text-neutral-500">{ar ? 'شظايا' : 'Crystals'}</span>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="ml-2 px-3 py-1 bg-neutral-950 border border-neutral-800 hover:border-cyan-400 text-neutral-300 hover:text-cyan-400 rounded-md transition-all flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            {ar ? 'القائمة' : 'Back'}
          </button>
        </div>
      </div>

      {/* Content layout split */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 my-4 z-10 w-full max-w-5xl mx-auto flex-1 items-stretch">
        
        {/* Left Side: Vehicle Selectors & customization (Body color and decal) */}
        <div className="md:col-span-5 space-y-3 flex flex-col justify-start">
          {/* Tab buttons for choosing Vehicle type */}
          <div className="grid grid-cols-2 gap-1.5 bg-neutral-950 p-1.5 rounded-xl border border-white/5">
            <button
              onClick={() => {
                sound.playClick();
                setSelectedGarageId('buggy');
              }}
              className={`py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                selectedGarageId === 'buggy' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {ar ? 'المُركبة الأرضية' : 'Ground Buggy'}
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setSelectedGarageId('spaceship');
              }}
              className={`py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                selectedGarageId === 'spaceship' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {ar ? 'المركبة الفضائية' : 'Star Cruiser'}
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setSelectedGarageId('f35_fusion');
              }}
              className={`py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                selectedGarageId === 'f35_fusion' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white border border-indigo-400/40' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {ar ? 'فيوجن F-35 🔐' : 'F-35 Fusion 🔐'}
            </button>
            <button
              onClick={() => {
                sound.playClick();
                setSelectedGarageId('b2_spirit');
              }}
              className={`py-1 text-[10px] font-bold rounded transition-all cursor-pointer ${
                selectedGarageId === 'b2_spirit' ? 'bg-gradient-to-r from-purple-600 to-rose-600 text-white border border-rose-400/40' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {ar ? 'روح المجرة B-2 🔐' : 'B-2 Spirit 🔐'}
            </button>
          </div>

          {/* Vehicle info block */}
          <div className="bg-neutral-900/50 p-3 rounded-xl border border-white/5">
            <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5 justify-between">
              <span>{isClassified ? (ar ? activeClassified?.nameAr : activeClassified?.nameEn) : (ar ? activeVehicle.nameAr : activeVehicle.nameEn)}</span>
              <span className="text-[10px] font-mono font-medium text-amber-500 uppercase">
                {isClassified ? 'CLASSIFIED' : activeVehicle.id}
              </span>
            </h3>
            <p className="text-[10px] text-neutral-400 leading-normal mt-1">
              {isClassified ? (ar ? activeClassified?.descriptionAr : activeClassified?.descriptionEn) : (ar ? activeVehicle.descriptionAr : activeVehicle.descriptionEn)}
            </p>
          </div>

          {/* Action button conditional layout */}
          {isClassified ? (
            <div className="space-y-2">
              <button
                onClick={() => {
                  if (quantumCoins >= (activeClassified?.costQC || 0)) {
                    sound.playLevelUp();
                    setQuantumCoins(prev => prev - (activeClassified?.costQC || 0));
                    alert(ar ? '🔓 بروتوكول فك التشفير ناجح! تم الحصول على الترخيص للمخطط!' : '🔓 Quantum decryption successful! Experimental schematics downloaded.');
                  } else {
                    sound.playLaser('high');
                    alert(ar ? 'رصيد كوانتم كوينز (QC) غير كافي! فك تشفير هذا الطراز يتطلب طاقة إضافية.' : 'Insufficient Quantum Coins (QC)! Additional energy matrices required.');
                  }
                }}
                className="w-full py-2 bg-gradient-to-r from-violet-600 via-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(139,92,246,0.3)] hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4 text-amber-400 animate-pulse" />
                <span>{ar ? `شراء رخصة المخطط بـ ${activeClassified?.costQC} QC` : `Acquire Blueprints for ${activeClassified?.costQC} QC`}</span>
              </button>

              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    sound.playClick();
                    if (stats.credits >= 400) {
                      // Allow converting 400 CP to 500 QC
                      setQuantumCoins(prev => prev + 500);
                      alert(ar ? '🔄 تم تحويل 400 CP إلى 550 شظية كوانتم بنجاح!' : '🔄 Conversion successful! Exchanged 400 CP for 550 Quantum Coins.');
                    } else {
                      sound.playLaser('high');
                      alert(ar ? 'الائتمانات العادية CP غير كافية للتحويل!' : 'Insufficient CP credits to perform conversion!');
                    }
                  }}
                  className="flex-1 py-1.5 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded-lg text-[9px] font-mono border border-white/5 cursor-pointer text-center"
                >
                  {ar ? '🔄 تحويل 400 CP' : '🔄 Exchange 400 CP'}
                </button>
                <button
                  onClick={() => {
                    sound.playLevelUp();
                    setQuantumCoins(prev => prev + 1500);
                  }}
                  className="flex-1 py-1.5 bg-gradient-to-r from-amber-550/20 to-orange-550/20 hover:from-amber-500/30 hover:to-orange-550/30 text-amber-400 rounded-lg text-[9px] font-mono border border-amber-500/30 cursor-pointer text-center animate-pulse"
                >
                  ⚡ Synthesize +1500 QC
                </button>
              </div>
            </div>
          ) : activeVehicle.unlocked ? (
            <button
              onClick={handleSelectActive}
              className={`w-full py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                stats.currentVehicle === activeVehicle.id
                  ? 'bg-neutral-900 border border-emerald-500 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-neutral-950'
              }`}
            >
              {stats.currentVehicle === activeVehicle.id ? (
                <>
                  <Check className="w-4 h-4" />
                  {ar ? 'مركبة النشاط الحالية' : 'Active Mission Vehicle'}
                </>
              ) : (
                (ar ? 'تجهيز لقيادة هذه المركبة' : 'Deploy This Vehicle')
              )}
            </button>
          ) : (
            <button
              onClick={handleUnlock}
              className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-neutral-950 rounded-xl text-xs font-bold shadow-[0_4px_15px_rgba(245,158,11,0.2)] transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>🔓 {ar ? 'شراء المركبة الفضائية بـ' : 'Unlock Transport Vessel for'}</span>
              <span className="font-mono">{activeVehicle.cost} CP</span>
            </button>
          )}

          {/* Color & Stickers customizers (only accessible if unlocked and not classified) */}
          <div className={`bg-neutral-900/30 p-3.5 rounded-xl border border-white/5 space-y-3.5 ${(!activeVehicle.unlocked || isClassified) ? 'opacity-40 pointer-events-none' : ''}`}>
            {/* Paint select */}
            <div>
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1.5">{ar ? 'الطلاء الخارجي للهيكل' : 'Body Armor Shader'}</span>
              <div className="grid grid-cols-4 gap-1.5">
                {colors.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => applyCustomization(c.value, activeVehicle.sticker)}
                    className="h-7 rounded-md border relative flex items-center justify-center transition-all cursor-pointer"
                    style={{ backgroundColor: c.value, borderColor: activeVehicle.color === c.value ? '#fbbf24' : 'rgba(255,255,255,0.1)' }}
                    title={ar ? c.nameAr : c.nameEn}
                  >
                    {activeVehicle.color === c.value && (
                      <Check className="w-3.5 h-3.5 text-amber-400 drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Sticker select */}
            <div>
              <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1.5">{ar ? 'شارات المعارك والتزيين' : 'Battle Decals & Stickers'}</span>
              <div className="grid grid-cols-2 gap-1.5">
                {stickers.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => applyCustomization(activeVehicle.color, s.value)}
                    className={`py-1 px-1.5 text-[10px] font-medium rounded-lg border cursor-pointer transition-all ${
                      activeVehicle.sticker === s.value
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                        : 'bg-neutral-950 border-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {ar ? s.labelAr : s.labelEn}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Upgrades workshop dashboard and preview visualization */}
        <div className="md:col-span-7 flex flex-col justify-between bg-neutral-900/40 border border-white/5 rounded-2xl p-4 gap-4">
          
          {/* Diagnostic Stats upgrade rows */}
          <div className="space-y-4">
            <div className="flex items-center gap-1 text-[11px] font-mono text-amber-500">
              <Sparkles className="w-3.5 h-3.5 text-amber-550 animate-pulse" />
              <span>{ar ? 'قسم التعديل وتطوير الأداء الميكانيكي' : 'PROPULSION PERFORMANCE WORKSHOP'}</span>
            </div>

            {/* UPGRADE ROWS FOR STATS */}
            {[
              { id: 'speed' as const, label: ar ? 'التسارع والمحرك' : 'Engine Acceleration', icon: Gauge, color: 'text-cyan-400', val: isClassified ? (activeClassified?.speed || 5) : activeVehicle.speed },
              { id: 'armor' as const, label: ar ? 'تصفيح الدروع والهيكل' : 'Nanomesh Heavy Shield', icon: Shield, color: 'text-amber-400', val: isClassified ? (activeClassified?.armor || 5) : activeVehicle.armor },
              { id: 'energy' as const, label: ar ? 'مخزن الطاقة والبطاريات' : 'Reactors & Fuel Capacity', icon: Zap, color: 'text-emerald-400', val: isClassified ? (activeClassified?.energy || 5) : activeVehicle.energy },
            ].map((st) => {
              const upgradeCost = (st.val + 1) * 350;
              const isMax = isClassified || st.val >= 5;

              return (
                <div key={st.id} className="bg-neutral-950/80 p-3 rounded-xl border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-1.5 text-neutral-200">
                        <st.icon className={`w-3.5 h-3.5 ${st.color}`} />
                        <span className="font-bold">{st.label}</span>
                      </div>
                      <span className="font-mono text-neutral-400">LVL {st.val} / 5</span>
                    </div>

                    {/* Glowing level pips */}
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((pip) => (
                        <div
                          key={pip}
                          className={`h-2 flex-1 rounded-sm border ${
                            pip <= st.val
                              ? 'bg-amber-400 border-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.2)]'
                              : 'bg-neutral-900 border-neutral-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Upgrade button */}
                  <button
                    disabled={isMax || !activeVehicle.unlocked}
                    onClick={() => handleUpgrade(st.id)}
                    className={`px-3 py-2 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center gap-1 shrink-0 cursor-pointer min-w-[85px] transition-all duration-300 ${
                      isMax
                        ? 'bg-neutral-900 text-emerald-400 border border-emerald-500/20'
                        : !activeVehicle.unlocked
                        ? 'bg-neutral-950 text-neutral-600 border border-transparent'
                        : 'bg-amber-500 hover:bg-amber-400 text-neutral-950'
                    }`}
                  >
                    {isMax ? (ar ? 'أقصى مستوى' : 'MAX LEVEL') : (
                      <>
                        <span>UP</span>
                        <span>- {upgradeCost} CP</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* Simple Vector Mockup of the Customizations in real-time */}
          <div className="h-28 bg-neutral-950/80 rounded-xl border border-white/5 flex items-center justify-center relative overflow-hidden group">
            {/* Decal background glow effect */}
            <div className="absolute inset-0 opacity-15" style={{ background: `radial-gradient(circle, ${isClassified ? activeClassified?.color : activeVehicle.color} 0%, transparent 70%)` }} />
            
            {/* Grid blueprint pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

            <div 
              className="flex flex-col items-center justify-center z-10 gap-1.5 transition-transform duration-500 group-hover:scale-105"
              style={isClassified ? { filter: 'blur(25px) brightness(0.04) contrast(1.6)' } : {}}
            >
              {isClassified ? (
                activeClassified?.customSvg
              ) : activeVehicle.id === 'spaceship' ? (
                /* Spaceship vector wireframe */
                <svg className="w-14 h-14" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M32 4L42 22L40 44L48 54L32 46L16 54L24 44L22 22L32 4Z" fill={activeVehicle.color} stroke="#fbbf24" strokeWidth="1.5" />
                  <circle cx="32" cy="24" r="3" fill="#ffffff" />
                  {activeVehicle.sticker === 'skull' && <path d="M30 30H34V34H30V30Z" fill="#ff0000" />}
                  {activeVehicle.sticker === 'flame' && <path d="M32 46V60" stroke="#f97316" strokeWidth="2" strokeDasharray="2" />}
                  {activeVehicle.sticker === 'galaxy' && <circle cx="32" cy="40" r="2.5" fill="#00ffff" />}
                </svg>
              ) : (
                /* Buggy vector wireframe */
                <svg className="w-14 h-14" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="18" y="24" width="28" height="20" rx="3" fill={activeVehicle.color} stroke="#fbbf24" strokeWidth="1.5" />
                  <rect x="22" y="16" width="20" height="8" rx="2" fill="none" stroke="#fbbf24" strokeWidth="1" />
                  <circle cx="16" cy="44" r="6" fill="#000000" stroke="#ffffff" strokeWidth="2" />
                  <circle cx="48" cy="44" r="6" fill="#000000" stroke="#ffffff" strokeWidth="2" />
                  {activeVehicle.sticker === 'skull' && <rect x="30" y="28" width="4" height="4" fill="#ff0000" />}
                  {activeVehicle.sticker === 'flame' && <path d="M10 28H18" stroke="#f97316" strokeWidth="2" />}
                  {activeVehicle.sticker === 'galaxy' && <circle cx="32" cy="34" r="3" fill="#00ffff" />}
                </svg>
              )}
              <span className="text-[10px] font-mono text-neutral-400 capitalize">
                {isClassified ? 'CLASSIFIED' : `${activeVehicle.sticker} / ${colors.find(c => c.value === activeVehicle.color)?.nameAr || 'Custom'}`}
              </span>
            </div>

            {/* HIGH-CONTRAST GLOWING NEON PADLOCK OVERLAY FOR CLASSIFIED SHIPS */}
            {isClassified && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-25 bg-black/75 backdrop-blur-[4px]">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 to-rose-500 p-0.5 shadow-[0_0_20px_rgba(245,158,11,0.5)] flex items-center justify-center animate-pulse cursor-pointer">
                  <div className="w-full h-full rounded-full bg-neutral-950 flex items-center justify-center text-amber-400">
                    <Lock className="w-5 h-5 text-amber-500 fill-current" />
                  </div>
                </div>
                <span className="text-[9px] font-mono font-bold text-red-400 tracking-widest mt-2 uppercase drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                  {ar ? 'مشروع سري فيدرالي مغلق' : 'CLASSIFIED X-GEN PROJECT'}
                </span>
                <span className="text-[8px] font-mono text-amber-400 font-bold bg-black/80 px-2 py-0.5 mt-1 border border-amber-500/30 rounded shadow-[0_0_8px_rgba(245,158,11,0.2)]">
                  {ar ? `يتطلب ${activeClassified?.costQC} QC` : `Requires ${activeClassified?.costQC} QC`}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* High-tech proud watermark bar */}
      <div className="border-t border-cyan-500/10 mt-4 pt-3 flex flex-col sm:flex-row items-center justify-between z-10 text-[9px] text-neutral-500 font-mono tracking-wide gap-1 shrink-0">
        <span className="text-cyan-500/40">TANKEEL: ORBIT MODULATION LABORATORY</span>
        <div className="flex items-center gap-1.5 bg-neutral-900/40 px-3 py-1 rounded border border-white/5 text-center">
          <span className="text-amber-500 font-medium">برمجة وتصميم المهندس/ سهيل الهزبري</span>
          <span className="text-neutral-700">|</span>
          <span className="text-cyan-400 font-bold">Engine Architecture by Engineer Suhail Al-Hazbari</span>
        </div>
      </div>
    </div>
  );
}
