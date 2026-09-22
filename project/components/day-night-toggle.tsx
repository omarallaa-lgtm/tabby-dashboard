'use client';

import React from 'react';

interface DayNightToggleProps {
  isDarkMode: boolean;
  onToggle: () => void;
}

export function DayNightToggle({ isDarkMode, onToggle }: DayNightToggleProps) {
  return (
    <div className="relative inline-block scale-90 sm:scale-100 select-none">
      <input
        type="checkbox"
        id="day-night-toggle-input"
        checked={!isDarkMode}
        onChange={onToggle}
        className="peer hidden"
      />
      <label
        htmlFor="day-night-toggle-input"
        className="relative block w-20 h-10 rounded-full cursor-pointer transition-colors duration-500 overflow-hidden shadow-inner bg-[#1d273a] peer-checked:bg-[#5ebefc]"
      >
        {/* Toggle Circle (Sun / Moon Base) */}
        <span className="absolute top-1 left-1 w-8 h-8 rounded-full bg-[#e6e6e6] shadow-md transition-all duration-500 ease-out z-20 peer-checked:translate-x-10 peer-checked:bg-[#ffde59]">
          {/* Moon Craters (Visible in Dark Mode) */}
          <span
            className={`absolute top-2 left-2 w-2 h-2 rounded-full bg-[#b3b3b3] transition-opacity duration-300 ${
              isDarkMode ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <span
            className={`absolute top-4 left-4 w-1.5 h-1.5 rounded-full bg-[#b3b3b3] transition-opacity duration-300 ${
              isDarkMode ? 'opacity-100' : 'opacity-0'
            }`}
          />
          <span
            className={`absolute top-1 left-4 w-1 h-1 rounded-full bg-[#b3b3b3] transition-opacity duration-300 ${
              isDarkMode ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </span>

        {/* Stars (Dark Mode Accent) */}
        <span
          className={`absolute top-2 left-10 text-[10px] text-white transition-all duration-500 ${
            isDarkMode ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}
        >
          ✦
        </span>
        <span
          className={`absolute top-5 left-14 text-[8px] text-white transition-all duration-500 delay-100 ${
            isDarkMode ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
          }`}
        >
          ★
        </span>

        {/* Clouds (Light Mode Accent) */}
        <span
          className={`absolute -bottom-1 left-1.5 text-white text-xs transition-all duration-500 ${
            !isDarkMode ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          ☁
        </span>
        <span
          className={`absolute -bottom-2 left-4 text-white text-sm transition-all duration-500 delay-75 ${
            !isDarkMode ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          ☁
        </span>
      </label>
    </div>
  );
}
