/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Settings, ChevronLeft, Shield, Gauge, Zap, Sparkles, Check } from 'lucide-react';
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
  const [selectedGarageId, setSelectedGarageId] = useState<VehicleId>(
    stats.currentVehicle !== 'none' ? stats.currentVehicle : 'buggy'
  );

  const activeVehicle = vehicles.find((v) => v.id === selectedGarageId) || vehicles[1];

  const handleSelectActive = () => {
    sound.playClick();
    onSelectVehicle(selectedGarageId);
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
          <div className="grid grid-cols-2 gap-2 bg-neutral-950 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => {
                sound.playClick();
                setSelectedGarageId('buggy');
              }}
              className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
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
              className={`py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedGarageId === 'spaceship' ? 'bg-amber-500 text-neutral-950' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {ar ? 'المركبة الفضائية' : 'Star Cruiser'}
            </button>
          </div>

          {/* Vehicle info block */}
          <div className="bg-neutral-900/50 p-3 rounded-xl border border-white/5">
            <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5 justify-between">
              <span>{ar ? activeVehicle.nameAr : activeVehicle.nameEn}</span>
              <span className="text-[10px] font-mono font-medium text-neutral-500 uppercase">
                {activeVehicle.id}
              </span>
            </h3>
            <p className="text-[10px] text-neutral-400 leading-normal mt-1">
              {ar ? activeVehicle.descriptionAr : activeVehicle.descriptionEn}
            </p>
          </div>

          {/* Locked vs Selected Action Button */}
          {activeVehicle.unlocked ? (
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

          {/* Color & Stickers customizers (only accessible if unlocked) */}
          <div className={`bg-neutral-900/30 p-3.5 rounded-xl border border-white/5 space-y-3.5 ${!activeVehicle.unlocked ? 'opacity-40 pointer-events-none' : ''}`}>
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
              { id: 'speed' as const, label: ar ? 'التسارع والمحرك' : 'Engine Acceleration', icon: Gauge, color: 'text-cyan-400', val: activeVehicle.speed },
              { id: 'armor' as const, label: ar ? 'تصفيح الدروع والهيكل' : 'Nanomesh Heavy Shield', icon: Shield, color: 'text-amber-400', val: activeVehicle.armor },
              { id: 'energy' as const, label: ar ? 'مخزن الطاقة والبطاريات' : 'Reactors & Fuel Capacity', icon: Zap, color: 'text-emerald-400', val: activeVehicle.energy },
            ].map((st) => {
              const upgradeCost = (st.val + 1) * 350;
              const isMax = st.val >= 5;

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
            <div className="absolute inset-0 opacity-15" style={{ background: `radial-gradient(circle, ${activeVehicle.color} 0%, transparent 70%)` }} />
            
            {/* Grid blueprint pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

            <div className="flex flex-col items-center justify-center z-10 gap-1.5 transition-transform duration-500 group-hover:scale-105">
              {activeVehicle.id === 'spaceship' ? (
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
                {activeVehicle.sticker} / {colors.find(c => c.value === activeVehicle.color)?.nameAr || 'Custom'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
