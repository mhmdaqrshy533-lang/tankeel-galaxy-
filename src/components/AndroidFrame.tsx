/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2, Smartphone, Keyboard, Info } from 'lucide-react';
import { sound } from '../utils/sound';

interface AndroidFrameProps {
  children: React.ReactNode;
  activeLanguage: 'ar' | 'en';
}

export default function AndroidFrame({ children, activeLanguage }: AndroidFrameProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(true);
  const [timeStr, setTimeStr] = useState('12:00 PM');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const toggleFullscreen = () => {
    sound.playClick();
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-2 md:p-6 font-sans text-neutral-200 select-none overflow-hidden relative">
      {/* Dynamic Star background in workspace */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-neutral-900 via-neutral-950 to-neutral-950 opacity-80 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1506318137071-a8e063b4bec0?auto=format&fit=crop&q=80&w=1200')] bg-cover opacity-10 mix-blend-color-dodge pointer-events-none" />

      {/* Control Overlay outside the phone */}
      {!isFullscreen && (
        <div className="w-full max-w-4xl flex items-center justify-between mb-3 z-10 px-4">
          <div className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-cyan-400 animate-pulse" />
            <h1 className="text-sm font-bold tracking-wider text-cyan-400">
              {activeLanguage === 'ar' ? 'بوابة محاكاة أندرويد (تنكيل)' : 'Android Simulator (Tankeel)'}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sound.playClick();
                setShowHelp(!showHelp);
              }}
              className="px-3 py-1 bg-neutral-900 border border-cyan-500/35 hover:border-cyan-400 text-xs text-cyan-400 rounded-md transition-all flex items-center gap-1 cursor-pointer"
            >
              <Keyboard className="w-3.5 h-3.5" />
              {activeLanguage === 'ar' ? 'طريقة التحكم' : 'Controls Help'}
            </button>
            <button
              onClick={toggleFullscreen}
              className="px-3 py-1 bg-neutral-900 border border-amber-500/35 hover:border-amber-400 text-xs text-amber-500 rounded-md transition-all flex items-center gap-1 cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              {activeLanguage === 'ar' ? 'ملء الشاشة ممتد' : 'Full Immersion'}
            </button>
          </div>
        </div>
      )}

      {/* Floating Keyboard/Mouse Guide */}
      {showHelp && !isFullscreen && (
        <div className="w-full max-w-4xl bg-gradient-to-r from-neutral-900/95 to-neutral-950/95 border border-cyan-500/20 rounded-xl p-4 mb-4 z-10 text-xs flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-md">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-neutral-100">
                {activeLanguage === 'ar' 
                  ? 'يمكنك اللعب باستخدام لوحة المفاتيح والماوس على الكمبيوتر أو عناصر التحكم اللمسية الشاشية!' 
                  : 'Play using Keyboard/Mouse on desktop or local UI touch controllers on mobile!'}
              </p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 text-neutral-400">
                <span>🎮 <strong>WASD / Arrows</strong>: {activeLanguage === 'ar' ? 'الحركة والقيادة' : 'Move & Drive'}</span>
                <span>Space: {activeLanguage === 'ar' ? 'القفز / فرامل مركبة' : 'Jump / Vehicle Brake'}</span>
                <span>🖱️ Move Drag: {activeLanguage === 'ar' ? 'تدوير الكاميرا ثلاثية الأبعاد' : 'Rotate 3D Camera'}</span>
                <span>Left Click: {activeLanguage === 'ar' ? 'إطلاق النار' : 'Fire'}</span>
                <span>Q / Swap Button: {activeLanguage === 'ar' ? 'تبديل السلاح' : 'Swap Weapon'}</span>
                <span>F / Enter Button: {activeLanguage === 'ar' ? 'ركوب/مغادرة المركبة' : 'Enter/Exit-Board'}</span>
                <span>C: {activeLanguage === 'ar' ? 'الانحناء' : 'Crouch'}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowHelp(false)}
            className="text-neutral-500 hover:text-neutral-300 px-2 py-1 self-end md:self-center cursor-pointer"
          >
            × {activeLanguage === 'ar' ? 'إغلاق' : 'Dismiss'}
          </button>
        </div>
      )}

      {/* Physical Android Frame Wrapper */}
      <div
        className={`transition-all duration-300 relative ${
          isFullscreen
            ? 'w-screen h-screen p-0 m-0 z-50 bg-black'
            : 'w-full max-w-5xl aspect-[16/9.2] bg-neutral-900 border-4 border-neutral-800 rounded-[36px] shadow-[0_0_50px_rgba(0,0,0,0.85)] p-3 flex flex-col border-cyan-500/10 z-10'
        }`}
      >
        {/* Curved Device Corners and Notch decor */}
        {!isFullscreen && (
          <>
            {/* Left Bezel, Speaker slots */}
            <div className="absolute top-1/2 left-1 -translate-y-1/2 w-1.5 h-12 bg-neutral-700/80 rounded-r-md z-20 flex flex-col gap-1 py-1 px-[1px]">
              <div className="w-full h-1 bg-neutral-900 rounded-sm" />
              <div className="w-full h-1 bg-neutral-900 rounded-sm" />
              <div className="w-full h-1 bg-neutral-900 rounded-sm" />
            </div>
            {/* Camera sensor eye and Ambient grill */}
            <div className="absolute top-1/2 right-1.5 -translate-y-1/2 w-4 h-16 bg-neutral-950 border border-neutral-800 rounded-2xl z-20 flex flex-col items-center justify-around py-2">
              <div className="w-2 h-2 rounded-full bg-cyan-900/80 border border-cyan-500/30 flex items-center justify-center">
                <div className="w-0.5 h-0.5 rounded-full bg-blue-400" />
              </div>
              <div className="w-1.5 h-1.5 rounded-full bg-neutral-800" />
            </div>
          </>
        )}

        {/* Display screen and inside viewport */}
        <div className="w-full h-full bg-black rounded-[26px] overflow-hidden relative flex flex-col select-none">
          
          {/* Top Android Status Bar (Immersive Hide state supported implicitly) */}
          {!isFullscreen && (
            <div className="w-full h-6 bg-neutral-950 border-b border-white/5 flex items-center justify-between px-6 text-[10px] font-mono font-medium tracking-wide text-neutral-400 shrink-0 z-30">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] text-emerald-400">Tankeel Mobile OS v4.2</span>
              </div>
              <div className="absolute left-1/2 -translate-x-1/2 text-cyan-400 font-bold tracking-wider">
                {activeLanguage === 'ar' ? 'تنكيل - طاقة الاتصال كاملة' : 'TANKEEL - SECURE COMM LINK'}
              </div>
              <div className="flex items-center gap-2">
                <span>{timeStr}</span>
                <div className="flex items-center gap-0.5 bg-neutral-900 px-1 py-0.5 border border-white/5 rounded">
                  <div className="w-3 h-1.5 bg-cyan-400 rounded-xs" />
                  <span className="text-[9px]">98%</span>
                </div>
              </div>
            </div>
          )}

          {/* Actual Active Game viewport */}
          <div className="flex-1 relative overflow-hidden bg-black flex flex-col">
            {children}
          </div>

          {/* Android Interactive Navigation Bar (Implied screen control) */}
          {!isFullscreen && (
            <div className="w-full h-6 bg-neutral-950 border-t border-white/5 flex items-center justify-center gap-20 shrink-0 z-30">
              {/* Back symbol */}
              <button 
                onClick={() => sound.playClick()} 
                className="w-10 h-3 hover:bg-white/10 rounded flex items-center justify-center text-neutral-400 transition-all cursor-pointer"
              >
                <span className="border-t-2 border-l-2 border-neutral-400 w-2.5 h-2.5 rotate-[-45deg] block" />
              </button>
              {/* Home Circle */}
              <button 
                onClick={() => {
                  sound.playClick();
                  window.location.reload();
                }}
                className="w-4 h-4 border-2 border-neutral-400 rounded-full hover:bg-neutral-800 transition-all cursor-pointer"
              />
              {/* Recents Square */}
              <button 
                onClick={() => sound.playClick()}
                className="w-3 h-3 border-2 border-neutral-400 rounded-xs hover:bg-neutral-800 transition-all cursor-pointer"
              />
            </div>
          )}

          {/* Floating Minimize Immersive Button (always showing when in full screen simulation so they can exit) */}
          {isFullscreen && (
            <button
              onClick={toggleFullscreen}
              className="absolute top-4 right-4 z-[99] bg-black/60 hover:bg-black p-3 border border-amber-500 text-amber-500 rounded-full transition-all backdrop-blur-md cursor-pointer"
              title={activeLanguage === 'ar' ? 'الخروج من ملء الشاشة' : 'Exit Full Screen'}
            >
              <Minimize2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
