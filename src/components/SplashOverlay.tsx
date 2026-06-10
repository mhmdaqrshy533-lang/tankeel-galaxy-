/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, ShieldAlert, Zap, Orbit } from 'lucide-react';

interface SplashOverlayProps {
  onComplete: () => void;
  activeLanguage: 'ar' | 'en';
}

export default function SplashOverlay({ onComplete, activeLanguage }: SplashOverlayProps) {
  const ar = activeLanguage === 'ar';
  const [phase, setPhase] = useState<1 | 2>(1);
  const [progress, setProgress] = useState(0);

  // Phase 1 timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase(2);
    }, 2500); // exact 2.5 seconds as requested
    return () => clearTimeout(timer);
  }, []);

  // Phase 2 progress bar simulation
  useEffect(() => {
    if (phase !== 2) return;

    const interval = setInterval(() => {
      setProgress(oldProgress => {
        if (oldProgress >= 100) {
          clearInterval(interval);
          // Wait slightly after reaching 100% for immersive completion
          setTimeout(() => {
            onComplete();
          }, 600);
          return 100;
        }
        const diff = Math.random() * 8 + 4; // smooth random increments
        return Math.min(oldProgress + diff, 100);
      });
    }, 120);

    return () => clearInterval(interval);
  }, [phase, onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] bg-neutral-950 flex flex-col items-center justify-center overflow-hidden font-sans select-none select-none">
      {/* Dark Cosmic deep-space canvas star field */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-neutral-900/60 via-black to-black pointer-events-none" />
      
      {/* Cosmic starry particles */}
      <div className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none">
        <div className="absolute top-[12%] left-[15%] w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
        <div className="absolute top-[34%] right-[20%] w-1 h-1 bg-amber-400 rounded-full animate-pulse" />
        <div className="absolute bottom-[20%] left-[45%] w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
        <div className="absolute top-[60%] left-[80%] w-0.5 h-0.5 bg-blue-300 rounded-full" />
        <div className="absolute bottom-[40%] right-[70%] w-1 h-1 bg-purple-400 rounded-full animate-ping" />
      </div>

      <AnimatePresence mode="wait">
        {phase === 1 ? (
          <motion.div
            key="phase1"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.08 }}
            transition={{ duration: 1.0, ease: 'easeOut' }}
            className="flex flex-col items-center justify-center text-center relative max-w-xl px-6"
          >
            {/* Blinding stellar flare background glow */}
            <div className="absolute -inset-10 bg-cyan-500/10 blur-[80px] rounded-full animate-pulse pointer-events-none" />
            
            {/* Blinding flare streak */}
            <motion.div 
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: [0, 0.9, 0.4] }}
              transition={{ delay: 0.3, duration: 1.2 }}
              className="absolute h-[1px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent blur-[2px]"
            />

            <h1 className="text-7xl md:text-8xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-neutral-50 via-cyan-100 to-cyan-500 font-sans z-10 select-none filter drop-shadow-[0_0_35px_rgba(6,182,212,0.6)]">
              تنكيل
            </h1>
            
            <p className="mt-3 text-xs font-mono tracking-[0.4em] font-black text-cyan-400 uppercase">
              GALACTIC FRONTIERS
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="phase2"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="flex flex-col items-center justify-center text-center w-full max-w-lg px-6"
          >
            {/* Animated green holographic circuitry background layout */}
            <div className="absolute -inset-20 bg-emerald-500/[0.04] blur-[60px] rounded-full pointer-events-none" />

            {/* Circuit grid box wrapper */}
            <div className="relative p-6 md:p-8 bg-neutral-900/40 border border-emerald-500/30 rounded-2xl backdrop-blur-md shadow-[0_0_40px_rgba(16,185,129,0.06)] min-w-[320px] max-w-md">
              {/* Circuit corner borders */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400 rounded-tl-sm" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400 rounded-tr-sm" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400 rounded-bl-sm" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400 rounded-br-sm" />

              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 15, ease: 'linear' }}
                className="w-12 h-12 rounded-full border border-emerald-500/30 border-t-emerald-400 flex items-center justify-center mx-auto mb-4"
              >
                <Cpu className="w-6 h-6 text-emerald-400" />
              </motion.div>

              {/* Holographic circuitry titles in both languages */}
              <div className="space-y-2">
                <h3 className="text-emerald-400 font-mono text-[9px] tracking-[0.25em] font-extrabold uppercase mb-1">
                  CORE AUDIO &amp; GRAPHICS ENGINE ARCHITECT
                </h3>
                
                <h2 className="text-xl md:text-2xl font-black text-neutral-100 font-sans tracking-wide">
                  برمجة وتصميم المهندس/ سهيل الهزبري
                </h2>
                
                <p className="text-xs text-neutral-400 font-mono font-medium tracking-tight">
                  Engine Architecture by Engineer Suhail Al-Hazbari
                </p>

                <div className="h-[1px] w-1/3 bg-emerald-500/20 mx-auto my-3" />
                
                <p className="text-[10px] text-emerald-400/80 font-mono uppercase tracking-widest font-semibold flex items-center justify-center gap-1">
                  <Orbit className="w-3.5 h-3.5 animate-spin" />
                  {ar ? 'المؤسس والمبرمج للمحرك الرئيسي' : 'Lead Architect & Systems Engineer'}
                </p>
              </div>

              {/* Military Tactical Progress Bar */}
              <div className="mt-8 text-left space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono text-neutral-400">
                  <span className="flex items-center gap-1 uppercase tracking-wider text-orange-400 font-bold animate-pulse text-left h-4">
                    <ShieldAlert className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span>
                      {progress < 22 ? "INITIALIZING WEBRTC MESH..." :
                       progress < 42 ? "ESTABLISHING MULTI-PEER HOTSPOT CHANNELS..." :
                       progress < 62 ? "LOADING MERCURY-X VOLCANIC TOPOLOGY..." :
                       progress < 80 ? "GENERATING PROCEDURAL CANYON HEIGHTFIELDS..." :
                       progress < 95 ? "MOUNTING COCKPIT LASER SNIPER-GLASS MODULES..." :
                       "INGRESS COMBAT READINESS CONFIRMED."}
                    </span>
                  </span>
                  <span className="font-extrabold text-neutral-200">{Math.round(progress)}%</span>
                </div>

                {/* Loading indicator bar styled with diagonal hazard stripes */}
                <div className="w-full h-4 bg-neutral-950 rounded-lg p-0.5 border border-white/5 overflow-hidden relative">
                  <div
                    className="h-full rounded transition-all duration-150 ease-out bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-500"
                    style={{ 
                      width: `${progress}%`,
                      backgroundImage: `repeating-linear-gradient(45deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 10px, rgba(255,255,255,0.15) 10px, rgba(255,255,255,0.15) 20px)`
                    }}
                  />
                </div>

                <div className="flex justify-between text-[8px] font-mono text-neutral-500 mt-1 uppercase">
                  <span>SYS: OK_v4.5e</span>
                  <span>MERCURY-X_SECTOR_INGRESS</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
