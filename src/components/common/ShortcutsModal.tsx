import React, { useEffect } from 'react';
import { X, Command, Volume2, Play, FastForward, RotateCcw } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    {
      keys: ['Space'],
      label: 'Play / Pause Sonification',
      desc: 'Starts or pauses synchronized multi-decadal audio-visual playback.',
      icon: <Play className="w-3.5 h-3.5 text-cyan-400" />,
    },
    {
      keys: ['M'],
      label: 'Mute / Unmute Master Bus',
      desc: 'Toggles master audio output without interrupting playback synchronization.',
      icon: <Volume2 className="w-3.5 h-3.5 text-cyan-400" />,
    },
    {
      keys: ['←', '→'],
      label: 'Seek Timeline Playhead',
      desc: 'Steps temporal playhead backward or forward by one observation year.',
      icon: <FastForward className="w-3.5 h-3.5 text-cyan-400" />,
    },
    {
      keys: ['1', '2', '3', '4', '5'],
      label: 'Switch EIC Data Channel',
      desc: 'Selects Thermal, CO2, Sea Level, Aerosols, or Night Lights stream.',
      icon: <Command className="w-3.5 h-3.5 text-cyan-400" />,
    },
    {
      keys: ['R'],
      label: 'Reset Timeline to Origin',
      desc: 'Rewinds playback timeline to the 1880 pre-industrial benchmark.',
      icon: <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />,
    },
    {
      keys: ['?'],
      label: 'Toggle Keyboard Guide',
      desc: 'Opens or dismisses this observatory navigation guide.',
      icon: <Command className="w-3.5 h-3.5 text-cyan-400" />,
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#020510] border border-cyan-500/30 p-6 sm:p-7 shadow-[0_0_35px_rgba(56,189,248,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 border border-cyan-500/30 bg-cyan-950/30 text-cyan-400">
              <Command className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="shortcuts-title"
                className="font-display text-base font-bold text-white tracking-wide uppercase"
              >
                Observatory Keyboard Navigation
              </h2>
              <span className="font-mono text-[11px] text-slate-400">
                WCAG 2.2 AA Accessible Hotkeys
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close keyboard shortcuts dialog"
            className="p-1.5 border border-white/10 hover:border-white/30 text-slate-400 hover:text-white transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="space-y-3.5 mb-6">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 p-2.5 bg-white/[0.02] border border-white/5"
            >
              <div className="flex items-center gap-2.5">
                {sc.icon}
                <div>
                  <div className="font-sans text-xs font-semibold text-white">{sc.label}</div>
                  <div className="font-sans text-[11px] text-slate-400">{sc.desc}</div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {sc.keys.map((k, ki) => (
                  <kbd
                    key={ki}
                    className="px-2 py-0.5 text-[11px] font-mono font-semibold text-cyan-300 bg-black/60 border border-cyan-500/30 shadow-inner"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <span>PRESS [ESC] TO DISMISS</span>
          <span className="text-cyan-400">NASA SPACE APPS 2026</span>
        </div>
      </div>
    </div>
  );
};
