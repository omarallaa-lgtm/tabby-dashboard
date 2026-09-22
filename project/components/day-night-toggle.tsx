'use client';

import React from 'react';

interface DayNightToggleProps {
  isDarkMode: boolean;
  onToggle: () => void;
}

export function DayNightToggle({ isDarkMode, onToggle }: DayNightToggleProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label="Toggle day and night mode"
      aria-pressed={isDarkMode}
      className={`switch ${isDarkMode ? 'night on' : ''}`}
    >
      <div className="track">
        {/* Track Stars */}
        <div className="stars">
          <span style={{ left: '15%', top: '20%' }}></span>
          <span style={{ left: '35%', top: '60%' }}></span>
          <span style={{ left: '50%', top: '25%' }}></span>
          <span style={{ left: '70%', top: '70%' }}></span>
          <span style={{ left: '80%', top: '30%' }}></span>
          <span style={{ left: '25%', top: '80%' }}></span>
        </div>

        {/* Shooting Stars inside Track */}
        <div className="toggle-shooting-stars">
          <span className="toggle-shooting s1"></span>
          <span className="toggle-shooting s2"></span>
          <span className="toggle-shooting s3"></span>
        </div>

        {/* Moon */}
        <div className="moon">
          <div className="moon">🌙</div>
        </div>

        {/* Sun */}
        <div className="sun"></div>

        {/* Flying Birds */}
        <div className="birds">
          <svg className="bird b1" viewBox="0 0 14 8" aria-hidden="true">
            <path className="wing" d="M0 6 Q7 -2 14 6 Q7 3 0 6Z" fill="#eef6ff" />
          </svg>
          <svg className="bird b2" viewBox="0 0 14 8" aria-hidden="true">
            <path className="wing" d="M0 6 Q7 -2 14 6 Q7 3 0 6Z" fill="#eef6ff" />
          </svg>
          <svg className="bird b3" viewBox="0 0 14 8" aria-hidden="true">
            <path className="wing" d="M0 6 Q7 -2 14 6 Q7 3 0 6Z" fill="#eef6ff" />
          </svg>
        </div>

        {/* Moving Cloud Track using cloud.png */}
        <div className="clouds">
          <div className="cloud-track">
            <img src="/cloud.png" alt="" aria-hidden="true" draggable={false} />
            <img src="/cloud.png" alt="" aria-hidden="true" draggable={false} />
            <img src="/cloud.png" alt="" aria-hidden="true" draggable={false} />
            <img src="/cloud.png" alt="" aria-hidden="true" draggable={false} />
          </div>
        </div>
      </div>

      {/* Sliding Knob */}
      <div className="knob"></div>
    </button>
  );
}
