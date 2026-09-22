'use client';

import React from 'react';

interface DayNightToggleProps {
  isDarkMode: boolean;
  onToggle: () => void;
}

export function DayNightToggle({ isDarkMode, onToggle }: DayNightToggleProps) {
  return (
    <div className="relative inline-block select-none">
      <input
        type="checkbox"
        id="day-night-toggle-input"
        checked={!isDarkMode}
        onChange={onToggle}
        className="peer hidden"
      />
      <label
        htmlFor="day-night-toggle-input"
        className={`toggle-container relative block w-36 h-12 rounded-full cursor-pointer transition-all duration-700 overflow-hidden shadow-lg border border-white/20 ${
          isDarkMode
            ? 'bg-gradient-to-r from-[#0c1427] via-[#111c38] to-[#18254b]'
            : 'bg-gradient-to-r from-[#5099de] via-[#6cb1ee] to-[#8dc5f8]'
        }`}
      >
        {/* DAY MODE: Sun Element */}
        <div
          className={`absolute top-2.5 right-4 w-7 h-7 rounded-full bg-[#fcd34d] shadow-[0_0_12px_#fcd34d] transition-all duration-700 ease-in-out ${
            !isDarkMode ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 -translate-y-6'
          }`}
        />

        {/* NIGHT MODE: Crescent Moon Element */}
        <div
          className={`absolute top-2.5 left-4 w-7 h-7 transition-all duration-700 ease-in-out ${
            isDarkMode ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-50 translate-y-6'
          }`}
        >
          <div className="w-7 h-7 rounded-full bg-[#fef08a] shadow-[inset_-3px_-2px_0_0_#ca8a04,0_0_10px_rgba(254,240,138,0.5)] relative overflow-hidden">
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#111c38]" />
          </div>
        </div>

        {/* NIGHT MODE: Stars */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ${
            isDarkMode ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <span className="absolute top-2 left-16 text-[9px] text-white animate-pulse">✦</span>
          <span className="absolute top-6 left-20 text-[7px] text-yellow-200">★</span>
          <span className="absolute top-3 left-24 text-[6px] text-white animate-ping" style={{ animationDuration: '3s' }}>✦</span>
        </div>

        {/* CLOUDS ANIMATION LAYER */}
        <div
          className={`absolute -bottom-2 w-full h-8 transition-transform duration-700 ease-out ${
            !isDarkMode ? 'translate-y-0' : 'translate-y-8'
          }`}
        >
          {/* Layered Fluffy Clouds */}
          <div className="absolute -bottom-3 left-1 w-12 h-8 bg-white/90 rounded-full blur-[0.5px]" />
          <div className="absolute -bottom-2 left-8 w-14 h-9 bg-white/95 rounded-full" />
          <div className="absolute -bottom-3 left-18 w-16 h-8 bg-white/80 rounded-full" />
          <div className="absolute -bottom-2 right-1 w-12 h-7 bg-white/90 rounded-full" />
        </div>

        {/* SLIDING GLOWING ORB / KNOB */}
        <span
          className={`absolute top-1 w-10 h-10 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.9)] transition-transform duration-700 cubic-bezier(0.68,-0.55,0.265,1.55) z-30 flex items-center justify-center ${
            !isDarkMode ? 'translate-x-1' : 'translate-x-24'
          }`}
        >
          {/* Orb Inner Glow Ring */}
          <span className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-100 to-white shadow-inner" />
        </span>
      </label>
    </div>
  );
}
