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
      className={`toggle-switch select-none ${isDarkMode ? 'night on' : ''}`}
    >
      <div className="toggle-track">
        {/* Track Stars */}
        <div className="toggle-stars">
          <span style={{ left: '15%', top: '20%', animationDelay: '0.2s' }}></span>
          <span style={{ left: '35%', top: '60%', animationDelay: '1.1s' }}></span>
          <span style={{ left: '50%', top: '25%', animationDelay: '0.5s' }}></span>
          <span style={{ left: '70%', top: '70%', animationDelay: '1.8s' }}></span>
          <span style={{ left: '80%', top: '30%', animationDelay: '0.9s' }}></span>
          <span style={{ left: '25%', top: '80%', animationDelay: '1.4s' }}></span>
        </div>

        {/* Shooting Stars */}
        <div className="toggle-shooting-stars">
          <span className="toggle-shooting s1"></span>
          <span className="toggle-shooting s2"></span>
          <span className="toggle-shooting s3"></span>
        </div>

        {/* Crescent Yellow Moon (Night Mode) */}
        <div className="toggle-moon">
          <div className="toggle-crescent"></div>
        </div>

        {/* Bright Glowing Sun (Day Mode) */}
        <div className="toggle-sun"></div>

        {/* Flying Birds (Day Mode) */}
        <div className="toggle-birds">
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

        {/* Moving Cloud Infinite Loop */}
        <div className="toggle-clouds">
          <div className="toggle-cloud-track">
            <img src="/cloud2.png" alt="" aria-hidden="true" draggable={false} />
            <img src="/cloud2.png" alt="" aria-hidden="true" draggable={false} />
            <img src="/cloud2.png" alt="" aria-hidden="true" draggable={false} />
            <img src="/cloud2.png" alt="" aria-hidden="true" draggable={false} />
          </div>
        </div>
      </div>

      {/* Sliding Knob */}
      <div className="toggle-knob"></div>
    </button>
  );
}
