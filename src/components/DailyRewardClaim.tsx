/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { CalendarDays, Gift, Coins, Radio, CheckCircle, Sparkles, Clock } from 'lucide-react';
import { PlayerStats } from '../types/game';
import { sound } from '../utils/sound';

interface DailyRewardClaimProps {
  stats: PlayerStats;
  activeLanguage: 'ar' | 'en';
  onClaim: (creditsGained: number, crystalsGained: number) => void;
}

export default function DailyRewardClaim({ stats, activeLanguage, onClaim }: DailyRewardClaimProps) {
  const [canClaim, setCanClaim] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');
  const [showCelebration, setShowCelebration] = useState(false);
  const [rewardsList, setRewardsList] = useState({ credits: 0, crystals: 0 });

  const ar = activeLanguage === 'ar';

  const checkClaimStatus = () => {
    if (!stats.lastDailyRewardClaim) {
      setCanClaim(true);
      return;
    }

    const lastClaim = new Date(stats.lastDailyRewardClaim).getTime();
    const now = new Date().getTime();
    const diff = now - lastClaim;
    const cooldown = 24 * 60 * 60 * 1000; // 24 hours

    if (diff >= cooldown) {
      setCanClaim(true);
    } else {
      setCanClaim(false);
      // format remaining time
      const remaining = cooldown - diff;
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    }
  };

  useEffect(() => {
    checkClaimStatus();
    const interval = setInterval(checkClaimStatus, 5000);
    return () => clearInterval(interval);
  }, [stats.lastDailyRewardClaim]);

  const handleClaimClick = () => {
    if (!canClaim) {
      sound.playClick();
      return;
    }

    sound.playLevelUp(); // Play level up for epic feeling

    // Deterministic random reward
    // Master mode gets double daily rewards!
    const multiplier = stats.isMasterMode ? 2 : 1;
    const creditsReward = Math.floor(Math.random() * 500 + 500) * multiplier; // 500-1000 credits
    const crystalsReward = (Math.floor(Math.random() * 3) + 2) * multiplier; // 2-4 crystals

    setRewardsList({ credits: creditsReward, crystals: crystalsReward });
    setShowCelebration(true);

    onClaim(creditsReward, crystalsReward);
  };

  return (
    <div className="w-full">
      {canClaim ? (
        <div className="relative overflow-hidden rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-900/40 to-teal-950/40 p-3 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_0_20px_rgba(16,185,129,0.1)] animate-pulse">
          
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="p-2 rounded-lg bg-emerald-500 text-neutral-950 animate-bounce">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-100 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>{ar ? 'المكافأة اليومية المجانية جاهزة!' : 'Free Daily Supply Drop Available!'}</span>
                {stats.isMasterMode && (
                  <span className="text-[8px] font-mono bg-amber-500 text-black px-1 rounded uppercase font-bold">2X MASTER</span>
                )}
              </h4>
              <p className="text-[10px] text-neutral-400">
                {ar 
                  ? 'تم وصول تموين الفضائي المستقل لشاصك وبدلتك المدرعة. اضغط للاستلام فورا!' 
                  : 'Cargo drop arrived in your sector hanger. Claim high-grade minerals & CP tokens.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClaimClick}
            className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-neutral-950 font-bold text-xs rounded-lg active:scale-95 transition-all shadow-md cursor-pointer hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] shrink-0"
          >
            {ar ? 'استلام الإمدادات ⚡' : 'SECURE DROP ⚡'}
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/30 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-center sm:text-left">
            <Clock className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-neutral-400 font-bold block">{ar ? 'التموين القادم قيد الشحن بالمدار' : 'NEXT SUPPLY COLD CARGO LOADING'}</span>
              <span className="text-[10px] text-neutral-500">
                {ar 
                  ? 'تم أخذ المكافأة اليومية، يرجى انتظار تعبئة تلسكوب الفضاء.' 
                  : 'Sector receiver already fueled today. Daily counter is currently ticking down.'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 bg-black border border-neutral-800 rounded text-cyan-400 font-mono font-bold shrink-0">
            <Radio className="w-3 text-cyan-400 animate-pulse" />
            <span>{timeRemaining || 'Loading...'}</span>
          </div>
        </div>
      )}

      {/* Flashing Claim Celebration Modal Dialog */}
      {showCelebration && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-[9999] backdrop-blur-md animate-fade-in">
          <div className="bg-neutral-900 border border-emerald-500 max-w-md w-full p-6 rounded-2xl text-center space-y-4 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
            <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center text-neutral-950 shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-8 h-8 animate-spin-slow" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                {ar ? 'تهانينا! تم تدفق التموين' : 'SUPPLY ENCRYPT SECURED!'}
              </h3>
              <p className="text-xs text-neutral-400">
                {ar 
                  ? 'أفرغ الطيار الآلي الترسيبات التالية بنجاح في خزنتك العسكرية:' 
                  : 'Automated launch bays successfully docked the following spoils in your account:'}
              </p>
            </div>

            {/* SPOILS GRID DISPLAY */}
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <div className="text-left">
                  <span className="text-[9px] text-neutral-500 block">CREDITS</span>
                  <span className="font-bold text-amber-400">+{rewardsList.credits} CP</span>
                </div>
              </div>

              <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-center gap-2">
                <span className="text-lg">💎</span>
                <div className="text-left">
                  <span className="text-[9px] text-neutral-500 block">CRYSTALS</span>
                  <span className="font-bold text-cyan-400">+{rewardsList.crystals}</span>
                </div>
              </div>
            </div>

            {/* Engineer Suhail Al-Huzbari Attribution */}
            <div className="py-2.5 border-t border-b border-white/5 text-[10px] text-neutral-400 font-mono">
              <span>{ar ? 'برمجة وإتقان المهندس / سهيل الهزبري' : 'Developed by Eng. Suhail Al-Huzbari'}</span>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setShowCelebration(false);
              }}
              className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs rounded-lg transition-all cursor-pointer shadow-md"
            >
              {ar ? 'حسناً، متابعة المعارك' : 'CONFIRM SPOILS'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
