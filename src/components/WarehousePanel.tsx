/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Shield, ChevronLeft, Lock, CheckCircle2, ShoppingCart, Info, Award } from 'lucide-react';
import { PlayerStats, Weapon, WeaponId } from '../types/game';
import { sound } from '../utils/sound';

interface WarehousePanelProps {
  stats: PlayerStats;
  weapons: Weapon[];
  activeLanguage: 'ar' | 'en';
  onBack: () => void;
  onEquipWeapon: (id: WeaponId) => void;
  onUnlockWeapon: (id: WeaponId, price: number) => void;
}

export default function WarehousePanel({
  stats,
  weapons,
  activeLanguage,
  onBack,
  onEquipWeapon,
  onUnlockWeapon,
}: WarehousePanelProps) {
  const ar = activeLanguage === 'ar';

  const handleEquip = (id: WeaponId) => {
    sound.playClick();
    onEquipWeapon(id);
  };

  const handleUnlock = (id: WeaponId, price: number) => {
    if (stats.credits < price) {
      sound.playLaser('high'); // error noise-ish
      alert(ar ? 'رصيد غي كافٍ من الائتمانات الفضائية لشراء هذا السلاح!' : 'Insufficient space credits to purchase this weaponry!');
      return;
    }
    sound.playLevelUp();
    onUnlockWeapon(id, price);
  };

  return (
    <div className="w-full h-full bg-neutral-950 p-4 md:p-8 flex flex-col justify-between font-sans relative overflow-y-auto select-none">
      {/* Sci-fi star Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/40 via-neutral-950 to-neutral-950 pointer-events-none" />

      {/* Header and Currency Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-cyan-500/20 pb-2 z-10 gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold tracking-wider text-cyan-400">
            {ar ? 'مستودع الأسلحة والمعدات المقاتلة' : 'Base Armory & Weapons Depot'}
          </h2>
        </div>

        {/* Inventory resources readout */}
        <div className="flex items-center gap-4 bg-neutral-900/60 border border-white/5 py-1 px-3 rounded-lg text-[11px] font-mono">
          <div className="flex items-center gap-1.5">
            <span className="text-amber-400 font-bold">💳 {stats.credits}</span>
            <span className="text-neutral-500">{ar ? 'رصيد' : 'Credits'}</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
            <span className="text-cyan-400 font-bold">💎 {stats.resources.crystals}</span>
            <span className="text-neutral-500">{ar ? 'بلورات' : 'Crystals'}</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
            <span className="text-neutral-300 font-bold">⚙️ {stats.resources.titanium}</span>
            <span className="text-neutral-500">{ar ? 'تيتانيوم' : 'Titanium'}</span>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onBack();
            }}
            className="ml-2 px-3 py-1 bg-neutral-950 border border-neutral-800 hover:border-cyan-400 text-neutral-300 hover:text-cyan-400 rounded-md transition-all flex items-center gap-1 cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            {ar ? 'خروج' : 'Exit'}
          </button>
        </div>
      </div>

      {/* Armory content panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 z-10 w-full max-w-5xl mx-auto flex-1">
        
        {/* Left Side: Interactive grid list of weapons */}
        <div className="space-y-2.5 max-h-[300px] md:max-h-[380px] overflow-y-auto pr-1">
          {weapons.map((w) => {
            const isUnlocked = stats.unlockedWeapons.includes(w.id);
            const isEquipped = stats.currentWeapon === w.id;

            return (
              <button
                key={w.id}
                onClick={() => {
                  if (isUnlocked) handleEquip(w.id);
                }}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                  isEquipped
                    ? 'bg-cyan-500/10 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.1)]'
                    : isUnlocked
                    ? 'bg-neutral-900/60 border-neutral-800 hover:border-neutral-700'
                    : 'bg-neutral-950/80 border-neutral-900/60 opacity-80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-lg border bg-neutral-950 ${isEquipped ? 'border-cyan-400 text-cyan-450' : 'border-neutral-800 text-neutral-400'}`}>
                    <span>⚡</span>
                  </div>
                  <div className="flex flex-col text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-neutral-100 font-sans">
                        {ar ? w.nameAr : w.nameEn}
                      </span>
                      {isEquipped && (
                        <span className="text-[9px] font-bold px-1.5 py-0 bg-cyan-500 text-neutral-950 rounded uppercase font-mono tracking-widest">
                          {ar ? 'مجهز' : 'Equipped'}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-neutral-400 leading-normal max-w-xs mt-0.5">
                      {ar ? w.descriptionAr : w.descriptionEn}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 pl-3">
                  {isUnlocked ? (
                    <div className="flex items-center gap-1 text-[11px] font-bold font-mono text-cyan-400">
                      {isEquipped ? (
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                      ) : (
                        <span className="text-neutral-500 hover:text-cyan-400 text-[10px] uppercase tracking-wider">{ar ? 'اضغط للتجهيز' : 'Equip'}</span>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // don't select parent
                        handleUnlock(w.id, w.cost);
                      }}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-[0_2px_8px_rgba(245,158,11,0.2)]"
                    >
                      <Lock className="w-3 h-3" />
                      <span className="font-mono">{w.cost} CP</span>
                    </button>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Side: Detailed Stats viewer for the current weapon */}
        {(() => {
          const activeWeapon = weapons.find(w => w.id === stats.currentWeapon) || weapons[0];
          return (
            <div className="bg-neutral-900/50 border border-white/5 rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Award className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span className="text-[9px] font-mono uppercase tracking-widest text-amber-500">
                    {ar ? 'مواصفات الفتك المجهزة للقتال' : 'Active Armament Diagnostics'}
                  </span>
                </div>

                <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2 border-b border-white/5 pb-2">
                  {ar ? activeWeapon.nameAr : activeWeapon.nameEn}
                  <span className="text-xs text-cyan-400 font-mono">[{activeWeapon.id.toUpperCase()}]</span>
                </h3>

                <div className="space-y-3 mt-4">
                  {/* Damage slider */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs text-neutral-400">
                      <span>{ar ? 'الضرر التدميري (Damage)' : 'Damage Yield'}</span>
                      <span className="font-mono text-cyan-400 font-bold">{activeWeapon.damage} HP</span>
                    </div>
                    <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="bg-cyan-500 h-full rounded-full shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                        style={{ width: `${(activeWeapon.damage / 100) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Fire Rate slider */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs text-neutral-400">
                      <span>{ar ? 'معدل الإطلاق (Rate of Fire)' : 'Recoil Rate'}</span>
                      <span className="font-mono text-amber-400 font-bold">{activeWeapon.rate} /s</span>
                    </div>
                    <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="bg-amber-400 h-full rounded-full shadow-[0_0_8px_rgba(245,158,11,0.4)]"
                        style={{ width: `${(activeWeapon.rate / 15) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Ammo capacity bar */}
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between text-xs text-neutral-400">
                      <span>{ar ? 'سعة الخزان والذخيرة' : 'Clip Capacity'}</span>
                      <span className="font-mono text-emerald-400 font-bold">{activeWeapon.ammoCapacity} RDS</span>
                    </div>
                    <div className="w-full bg-neutral-950 h-2 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="bg-emerald-400 h-full rounded-full shadow-[0_0_8px_rgba(52,211,153,0.4)]"
                        style={{ width: `${(activeWeapon.ammoCapacity / 120) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Ammo note block */}
              <div className="mt-4 p-3 bg-neutral-950/60 border border-neutral-800 rounded-lg flex items-start gap-2 text-[10px] text-neutral-400 leading-normal">
                <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                <p>
                  {ar
                    ? 'يتم تغذية الأسلحة الفضائية من المولد الحراري للشخصية تلقائياً. لا حاجة لشراء ذخيرة من المتاجر.'
                    : 'Tactical energy channels feed directly from the suit thermal core. Automatic reload cycles apply.'}
                </p>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
