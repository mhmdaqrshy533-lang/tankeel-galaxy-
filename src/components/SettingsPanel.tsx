/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Settings, Volume2, Sliders, Languages, Zap, RefreshCw, ChevronLeft, Save } from 'lucide-react';
import { GameSettings } from '../types/game';
import { sound } from '../utils/sound';

interface SettingsPanelProps {
  settings: GameSettings;
  onChangeSettings: (newSettings: GameSettings) => void;
  onBack: () => void;
}

export default function SettingsPanel({ settings, onChangeSettings, onBack }: SettingsPanelProps) {
  
  const handleQualityChange = (quality: 'low' | 'medium' | 'high') => {
    sound.playClick();
    onChangeSettings({ ...settings, graphicsQuality: quality });
  };

  const handleLanguageChange = (lang: 'ar' | 'en') => {
    sound.playClick();
    onChangeSettings({ ...settings, language: lang });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseInt(e.target.value);
    onChangeSettings({ ...settings, volume: vol });
    sound.setVolume(vol);
  };

  const handleSensitivityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sens = parseInt(e.target.value);
    onChangeSettings({ ...settings, cameraSensitivity: sens });
  };

  const handleVibrationToggle = () => {
    sound.playClick();
    onChangeSettings({ ...settings, vibration: !settings.vibration });
    if (!settings.vibration && navigator.vibrate) {
      navigator.vibrate(100); // trigger quick test rumble
    }
  };

  const handleResetData = () => {
    sound.playClick();
    if (confirm(settings.language === 'ar' ? 'هل أنت متأكد من حذف وحذف تقدم اللعبة؟' : 'Are you sure you want to reset all game data?')) {
      localStorage.removeItem('tankeel_save');
      alert(settings.language === 'ar' ? 'تم إعادة تعيين النظام بنجاح.' : 'Data reset complete. Reloading app.');
      window.location.reload();
    }
  };

  const ar = settings.language === 'ar';

  return (
    <div className="w-full h-full bg-neutral-950 p-4 md:p-8 flex flex-col justify-between font-sans relative overflow-y-auto select-none">
      {/* Sci-fi Overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-neutral-900/30 via-neutral-950 to-neutral-950 pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 z-10 shrink-0">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold tracking-wider text-cyan-400">
            {ar ? 'إعدادات النظام العكسي' : 'System Configuration'}
          </h2>
        </div>
        <button
          onClick={() => {
            sound.playClick();
            onBack();
          }}
          className="px-4 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-cyan-400 text-xs text-neutral-300 hover:text-cyan-400 rounded-md transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          {ar ? 'رجوع للقائمة' : 'MainMenu'}
        </button>
      </div>

      {/* Main settings options grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 my-4 z-10 max-w-4xl mx-auto w-full">
        {/* Left Column */}
        <div className="space-y-4">
          {/* Quality Select */}
          <div className="bg-neutral-900/40 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-neutral-300">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold font-mono uppercase tracking-wider">{ar ? 'جودة الرسومات' : 'Graphics Quality'}</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => handleQualityChange(q)}
                  className={`py-2 text-xs font-bold rounded-lg uppercase transition-all cursor-pointer ${
                    settings.graphicsQuality === q
                      ? 'bg-cyan-500/15 border border-cyan-500 text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.15)]'
                      : 'bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-400'
                  }`}
                >
                  {q === 'low' ? (ar ? 'منخفضة' : 'LOW') : q === 'medium' ? (ar ? 'متوسطة' : 'MED') : (ar ? 'عالية' : 'HIGH')}
                </button>
              ))}
            </div>
            <span className="text-[10px] text-neutral-500 leading-normal">
              {ar 
                ? 'الجودة العالية تدعم تظليل ثلاثي الأبعاد ديناميكي. اختر منخفضة إذا كان التطبيق ثقيلاً.' 
                : 'High quality enables detailed 3D reflections. Choose structures if gameplay experiences stutter.'}
            </span>
          </div>

          {/* Volume control */}
          <div className="bg-neutral-900/40 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between text-neutral-300">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold font-mono uppercase tracking-wider">{ar ? 'مستوى الصوت الكلي' : 'Master Volume'}</span>
              </div>
              <span className="text-xs text-cyan-400 font-mono font-bold">{settings.volume}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={settings.volume}
              onChange={handleVolumeChange}
              className="w-full accent-cyan-500 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-[10px] text-neutral-500">
              {ar ? 'يتحكم في مستوى المؤثرات والموسيقى التصويرية الفضائية.' : 'Controls master system gains for live synths & ambience.'}
            </span>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Language Selection */}
          <div className="bg-neutral-900/40 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-neutral-300">
              <Languages className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold font-mono uppercase tracking-wider">{ar ? 'لغة الواجهة' : 'System Language'}</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleLanguageChange('ar')}
                className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  settings.language === 'ar'
                    ? 'bg-cyan-500/15 border border-cyan-500 text-cyan-400 font-medium'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
                }`}
              >
                العربية
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`py-2 text-xs font-mono font-bold rounded-lg transition-all cursor-pointer ${
                  settings.language === 'en'
                    ? 'bg-cyan-500/15 border border-cyan-500 text-cyan-400'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
                }`}
              >
                ENGLISH
              </button>
            </div>
          </div>

          {/* Camera Sensitivity - Vibration */}
          <div className="bg-neutral-900/40 border border-white/5 rounded-xl p-4 flex flex-col gap-3">
            {/* Camera Sensitivity */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-neutral-300 text-xs">
                <span className="font-bold font-mono tracking-wider">{ar ? 'حساسية تدوير الكاميرا' : 'Camera Sensitivity'}</span>
                <span className="text-cyan-400 font-mono font-bold">{settings.cameraSensitivity}</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.cameraSensitivity}
                onChange={handleSensitivityChange}
                className="w-full accent-cyan-500 h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Vibration Toggle */}
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
              <div className="flex items-center gap-2 text-neutral-300 text-xs">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="font-bold font-mono tracking-wider">{ar ? 'الاهتزاز واللمس' : 'Haptic Vibration'}</span>
              </div>
              <button
                onClick={handleVibrationToggle}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.vibration ? 'bg-cyan-500' : 'bg-neutral-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.vibration ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Extreme Operations / Reset Data */}
      <div className="w-full max-w-4xl mx-auto z-10 p-3 bg-red-500/5 border border-red-500/15 rounded-lg flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
        <div className="text-neutral-400 text-[10px] md:text-left leading-normal">
          <p className="font-bold text-red-400 uppercase tracking-widest">{ar ? 'إجراءات تدمير البيانات' : 'FACTORY CORRUPTION PROTOCOL'}</p>
          <p>{ar ? 'سيؤدي هذا لمسح جميع الأسلحة، المركبات، والعملات، والعودة للبداية.' : 'Resets player credentials, weapons cache, custom garage upgrades, and planet logs.'}</p>
        </div>
        <button
          onClick={handleResetData}
          className="px-4 py-1.5 bg-red-950/40 border border-red-500/30 hover:bg-red-500 hover:text-neutral-950 text-red-400 hover:border-red-500 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {ar ? 'حذف كافة البيانات' : 'Destroy Game Progress'}
        </button>
      </div>
    </div>
  );
}
