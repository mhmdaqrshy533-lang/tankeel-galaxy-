/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldCheck, Play, Radio, Cpu, Lock, AlertTriangle } from 'lucide-react';
import { sound } from '../utils/sound';

interface ActivationScreenProps {
  onActivate: (isMaster: boolean) => void;
  activeLanguage: 'ar' | 'en';
}

export default function ActivationScreen({ onActivate, activeLanguage }: ActivationScreenProps) {
  const [code, setCode] = useState('');
  const [errorMess, setErrorMess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const ar = activeLanguage === 'ar';

  const handleNumClick = (num: string) => {
    sound.playClick();
    setErrorMess(null);
    if (code.length < 10) {
      setCode(prev => prev + num);
    }
  };

  const handleBackspace = () => {
    sound.playClick();
    setErrorMess(null);
    setCode(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    sound.playClick();
    setErrorMess(null);
    setCode('');
  };

  const handleVerify = () => {
    sound.playClick();
    if (!code) {
      setErrorMess(ar ? 'يرجى إدخال رمز التفعيل أولاً!' : 'Please enter the activation code first!');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      if (code === '715846133') {
        sound.playMissionCompleted(); // Play success tone
        onActivate(false); // Normal mode
      } else if (code === '715562996') {
        sound.playLevelUp(); // Play master tone
        onActivate(true); // Master mode
      } else {
        setErrorMess(
          ar 
            ? 'خطأ: رمز تفعيل الحماية غير صحيح أو منتهي الصيانة! رمز 715846133 للوضع العادي، ورقم 715562996 لوضع الماستر' 
            : 'Error: Code invalid! Type 715846133 for normal, or 715562996 for MASTER mode.'
        );
        sound.playClick(); // warning click
      }
    }, 800);
  };

  // Predefined codes list display to help users know there are other valid ones or show the status dashboard
  const poolCodes = [
    { code: '715846133', type: ar ? 'الوضع العادي' : 'Normal Mode', desc: ar ? 'مصرح للعب' : 'Authorized' },
    { code: '715562996', type: ar ? 'وضع الماستر 🛡️' : 'Master Mode 🛡️', desc: ar ? 'قدرات غير محدودة' : 'Superpower' }
  ];

  return (
    <div className="w-full h-full bg-neutral-950 p-4 md:p-6 flex flex-col justify-between font-sans relative overflow-y-auto select-none">
      {/* Immersive visual style background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900/40 via-neutral-950 to-neutral-950 pointer-events-none" />
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=1200')] bg-cover opacity-5 mix-blend-color-dodge pointer-events-none" />

      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0596690a_1px,transparent_1px),linear-gradient(to_bottom,#0596690a_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />

      {/* Header with Developer Name */}
      <div className="w-full flex flex-col md:flex-row items-center justify-between border-b border-emerald-500/20 pb-2 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5.5 h-5.5 text-emerald-400 animate-pulse" />
          <div>
            <h2 className="text-sm font-bold tracking-wider text-emerald-400 font-mono">
              {ar ? 'نظام الحماية والأمن العسكري العالي' : 'TACTICAL ENCRYPTED FIREWALL GATEWAY'}
            </h2>
            <p className="text-[10px] text-neutral-400">Tankeel Core Security Shield Protocol v4.5e</p>
          </div>
        </div>

        {/* ENGINEER BRANDING ACCORDING TO USER'S LITERAL REQUEST */}
        <div className="mt-2 md:mt-0 px-4 py-1.5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-lg text-center backdrop-blur-sm shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <span className="text-[10px] text-neutral-400 block font-mono">
            {ar ? 'برمجة وتطوير وإشراف هندسي' : 'Supervision & Core Programming'}
          </span>
          <span className="text-xs font-bold text-emerald-300 font-sans">
            {ar ? 'المهندس / سهيل الهزبري' : 'Eng. Suhail Al-Huzbari'}
          </span>
        </div>
      </div>

      {/* Main Core Form Block */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center my-auto z-10 w-full max-w-5xl mx-auto py-3">
        
        {/* Left 5 columns: Numeric Interactive Keypad */}
        <div className="md:col-span-5 bg-neutral-900/80 border border-emerald-500/20 p-4 rounded-xl flex flex-col gap-3 backdrop-blur-md shadow-lg order-2 md:order-1">
          <div className="flex justify-between items-center bg-neutral-950 border border-neutral-800 p-2 text-center rounded-lg">
            <span className="text-[10px] text-neutral-500 font-mono text-left block">CODE INPUT</span>
            <span className="text-lg font-mono font-bold tracking-widest text-emerald-400 truncate max-w-[200px]">
              {code || '• • • • • • • • • •'}
            </span>
            <span className="text-[10px] text-neutral-400 bg-neutral-900 px-1.5 py-0.5 rounded border border-white/5 font-mono">
              {code.length}/10
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
              <button
                key={num}
                onClick={() => handleNumClick(num)}
                className="py-2.5 bg-neutral-950 border border-neutral-800 hover:border-emerald-500/50 hover:bg-emerald-950/20 text-neutral-200 rounded-lg font-mono font-bold text-sm transition-all active:scale-95 cursor-pointer"
              >
                {num}
              </button>
            ))}
            <button
              onClick={handleClear}
              className="py-2.5 bg-rose-950/20 border border-rose-500/30 hover:border-rose-500 hover:bg-rose-950/40 text-rose-400 rounded-lg font-bold text-xs transition-all cursor-pointer"
            >
              {ar ? 'مسح' : 'CLEAR'}
            </button>
            <button
              onClick={() => handleNumClick('0')}
              className="py-2.5 bg-neutral-950 border border-neutral-800 hover:border-emerald-500/50 hover:bg-emerald-950/20 text-neutral-200 rounded-lg font-mono font-bold text-sm transition-all active:scale-95 cursor-pointer"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="py-2.5 bg-neutral-950 border border-neutral-800 hover:border-emerald-400/50 text-neutral-400 hover:text-white rounded-lg font-mono font-bold text-xs transition-all cursor-pointer"
            >
              ←
            </button>
          </div>

          <button
            onClick={handleVerify}
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-lg active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] cursor-pointer mt-1"
          >
            {isLoading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>{ar ? 'اتصال وفك تشفير البوابات' : 'LAUNCH INITIAL COLD DECRYPT'}</span>
              </>
            )}
          </button>
        </div>

        {/* Right 7 columns: Operational Intelligence / Instructions details */}
        <div className="md:col-span-7 space-y-3 p-1 order-1 md:order-2">
          
          <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-2">
            <h3 className="text-xs font-bold text-neutral-100 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <span>{ar ? 'متطلبات دخول نظام الدفاع التوتري' : 'TANKEEL SYSTEM ENTRY CREDENTIALS'}</span>
            </h3>
            
            <p className="text-[11px] text-neutral-300 leading-relaxed">
              {ar 
                ? 'مرحبًا بك في البوابة التنافسية الكبرى المصممة لتنافس أضخم ألعاب العالم. للتمكن من دخول خادم التشغيل والمجال الجوي، يُرجى إدخال أحد أكواد التردد المصرح بها لقائد المركبة.' 
                : 'Welcome to this state-of-the-art space action system. Enter one of the authorized cryptographic commander activation codes below to configure payload systems.'}
            </p>

            <div className="border-t border-neutral-800 pt-2.5 space-y-1.5 text-[10px]">
              <span className="text-neutral-500 font-bold uppercase block">{ar ? 'أكواد الترخيص النشطة للنظام ومفاتيح الدخول' : 'VERIFIED SECTOR ACCESS KEYS'}</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {poolCodes.map((item) => (
                  <div 
                    key={item.code} 
                    onClick={() => {
                      sound.playClick();
                      setCode(item.code);
                    }}
                    className="p-2 bg-neutral-950 border border-emerald-500/10 hover:border-emerald-500/40 rounded-lg flex items-center justify-between cursor-pointer transition-all hover:bg-emerald-950/10"
                  >
                    <span className="font-mono font-bold text-emerald-400 text-xs tracking-wider">{item.code}</span>
                    <div className="text-right">
                      <span className="text-[9px] font-bold text-neutral-300 block">{item.type}</span>
                      <span className="text-[8px] text-neutral-500 font-mono font-medium block">{item.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Validation Logs / Errors section */}
          {errorMess ? (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl flex items-start gap-2 animate-bounce">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-rose-400 font-bold mb-0.5">{ar ? 'تحذير أمني عالي!' : 'SEC_FIREWALL_ALERT!'}</strong>
                <span>{errorMess}</span>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-gradient-to-r from-emerald-950/20 to-neutral-900 border border-emerald-500/10 rounded-xl flex items-center gap-2.5">
              <Radio className="w-4.5 h-4.5 text-emerald-400 shrink-0 animate-pulse" />
              <div className="text-[10px] text-neutral-400 leading-normal font-mono">
                <span className="text-emerald-400 font-bold uppercase block mb-0.5">{ar ? 'جهاز تشفير الأكواد الفضائية' : 'GROUND SAT RECEIVER STABLE'}</span>
                {ar 
                  ? 'المهندس سهيل الهزبري يرحب بكم في معركة عطارد الثنائية الكبرى. اضغط على كرت تفعيل أو أدخل اليدوي.' 
                  : 'Sector commands ready. Connect terminal to secure launch parameters. Tap on any key card to auto-fill.'}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Footer Branding Credit */}
      <div className="w-full text-center border-t border-white/5 pt-2 z-10 shrink-0 flex flex-col sm:flex-row items-center justify-between gap-1 text-[10px] text-neutral-500 font-mono">
        <span>© 2026 TANKEEL INC. {ar ? 'جميع الحقوق للمهندس سهيل الهزبري محفوظة' : 'UNDER POWER OF SUHAIL AL-HUZBARI.'}</span>
        <span className="text-emerald-500/70 font-semibold">{ar ? 'نظام الحوسبة والألعاب الفضائية v4' : 'WEBGL FLUID INTERFACE'}</span>
      </div>
    </div>
  );
}
