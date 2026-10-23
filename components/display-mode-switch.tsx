'use client';

import { Monitor, Sparkles } from 'lucide-react';

interface DisplayModeSwitchProps {
  /** true = Citrix (soft / lightweight) mode, false = Normal (full effects) mode */
  citrixMode: boolean;
  onChange: (citrixMode: boolean) => void;
  /** 'dark' = always dark styling (login page), 'auto' = follows light / dark theme */
  tone?: 'auto' | 'dark';
  className?: string;
}

/**
 * Two-way switch: Citrix (soft, lightweight) <-> Normal (all animations and glass effects).
 * Note: class names avoid bg-slate-900 / text-slate-900 because globals.css restyles those in dark mode.
 */
export function DisplayModeSwitch({ citrixMode, onChange, tone = 'auto', className = '' }: DisplayModeSwitchProps) {
  const track =
    tone === 'dark'
      ? 'border-white/15 bg-black/30'
      : 'border-slate-300 bg-slate-100 dark:border-white/10 dark:bg-white/5';
  const idle =
    tone === 'dark'
      ? 'text-slate-300 hover:text-white'
      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200';

  const options = [
    {
      citrix: true,
      label: 'Citrix',
      Icon: Monitor,
      title: 'Citrix mode: soft, lightweight design. Use this on Citrix / remote desktop or a slow PC.',
    },
    {
      citrix: false,
      label: 'Normal',
      Icon: Sparkles,
      title: 'Normal mode: all animations and glass effects. Use this on your own computer.',
    },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Display mode"
      className={`relative grid grid-cols-2 h-8 shrink-0 rounded-full border p-0.5 text-[11px] font-bold select-none ${track} ${className}`}
    >
      {/* sliding highlight */}
      <span
        aria-hidden="true"
        className={`absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-emerald-500 shadow-sm transition-transform duration-200 ${
          citrixMode ? 'translate-x-0' : 'translate-x-full'
        }`}
      />
      {options.map(({ citrix, label, Icon, title }) => {
        const active = citrixMode === citrix;
        return (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={active}
            title={title}
            onClick={() => !active && onChange(citrix)}
            className={`relative z-10 flex items-center justify-center gap-1.5 px-3 rounded-full transition-colors ${
              active ? 'text-emerald-950' : idle
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
