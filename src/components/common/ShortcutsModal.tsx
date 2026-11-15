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
      icon: <Play className="w-3.5 h-3.5 text-[#FF5938]" />,
    },
    {
      keys: ['M'],
      label: 'Mute / Unmute Master Bus',
      desc: 'Toggles master audio output without interrupting playback synchronization.',
      icon: <Volume2 className="w-3.5 h-3.5 text-[#83BBD5]" />,
    },
    {
      keys: ['←', '→'],
      label: 'Seek Timeline Playhead',
      desc: 'Steps temporal playhead backward or forward by one observation year.',
      icon: <FastForward className="w-3.5 h-3.5 text-[#FF5938]" />,
    },
    {
      keys: ['1', '2', '3', '4', '5'],
      label: 'Switch EIC Data Channel',
      desc: 'Selects Thermal, CO2, Sea Level, Aerosols, or Night Lights stream.',
      icon: <Command className="w-3.5 h-3.5 text-[#83BBD5]" />,
    },
    {
      keys: ['R'],
      label: 'Reset Timeline to Origin',
      desc: 'Rewinds playback timeline to the 1880 pre-industrial benchmark.',
      icon: <RotateCcw className="w-3.5 h-3.5 text-[#FF5938]" />,
    },
    {
      keys: ['?'],
      label: 'Toggle Keyboard Guide',
      desc: 'Opens or dismisses this observatory navigation guide.',
      icon: <Command className="w-3.5 h-3.5 text-[#83BBD5]" />,
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
        className="relative w-full max-w-lg bg-[#0E141D] border border-[#252D36] p-6 sm:p-7 shadow-[0_16px_50px_rgba(0,0,0,0.9)] rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#252D36]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 border border-[#FF5938]/40 bg-[#FF5938]/10 text-[#FF5938] rounded-none">
              <Command className="w-4 h-4" />
            </div>
            <div>
              <h2
                id="shortcuts-title"
                className="font-display text-base font-bold text-[#E9EDF0] tracking-wide uppercase"
              >
                Observatory Keyboard Navigation
              </h2>
              <span className="font-mono text-[11px] text-[#83BBD5]">
                WCAG 2.2 AA Accessible Hotkeys
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            data-cursor-label="CLOSE"
            aria-label="Close keyboard shortcuts dialog"
            className="p-1.5 border border-[#252D36] bg-[#070B10] hover:border-[#FF5938] text-[#E9EDF0]/50 hover:text-white transition-colors cursor-pointer rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5938]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="space-y-3 mb-6">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-4 p-2.5 bg-[#070B10] border border-[#252D36] hover:border-[#83BBD5] transition-colors rounded-none"
            >
              <div className="flex items-center gap-2.5">
                <span>{sc.icon}</span>
                <div>
                  <div className="font-display text-sm font-bold uppercase tracking-wide text-[#E9EDF0]">{sc.label}</div>
                  <div className="font-sans text-[11px] text-[#E9EDF0]/60 font-normal">{sc.desc}</div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {sc.keys.map((k, ki) => (
                  <kbd
                    key={ki}
                    className="px-2 py-0.5 text-[11px] font-mono font-bold text-[#FF5938] bg-[#0E141D] border border-[#252D36] rounded-none shadow-inner"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-[#252D36] flex items-center justify-between text-[11px] font-mono text-[#E9EDF0]/50">
          <span>PRESS [ESC] TO DISMISS</span>
          <span className="text-[#FF5938] font-bold">NASA SPACE APPS 2026</span>
        </div>
      </div>
    </div>
  );
};
