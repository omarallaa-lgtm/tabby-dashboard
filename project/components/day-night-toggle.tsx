'use client';

import React from 'react';

interface DayNightToggleProps {
  isDarkMode: boolean;
  onToggle: () => void;
}

export function DayNightToggle({ isDarkMode, onToggle }: DayNightToggleProps) {
  return (
    <div
      onClick={onToggle}
      className={`day-night-toggle-wrapper select-none ${
        isDarkMode ? 'night-mode' : 'day-mode'
      }`}
      title={isDarkMode ? 'Switch to Day Mode' : 'Switch to Night Mode'}
    >
      {/* Night Background Image Layer (IMG_4003.png) */}
      <div
        className={`day-night-bg-image day-night-bg-night ${
          isDarkMode ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Day Background Image Layer (IMG_4004.png) */}
      <div
        className={`day-night-bg-image day-night-bg-day ${
          !isDarkMode ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Animated Sliding Orb Knob */}
      <div className="day-night-orb" />
    </div>
  );
}
