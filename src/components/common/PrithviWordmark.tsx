import React from 'react';

interface PrithviWordmarkProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showMissionTag?: boolean;
  showSubtitle?: boolean;
  className?: string;
  theme?: 'dark' | 'light';
}

/**
 * Proprietary PRITHVI Aerospace Wordmark
 * 
 * An architectural, engineered typography lockup inspired by modern aerospace restraint.
 * Avoids direct copies of NASA or SpaceX insignia; utilizes pure typographic proportions,
 * optical kerning, mission classification indexing, and hairline technical datum marks.
 */
export const PrithviWordmark: React.FC<PrithviWordmarkProps> = ({
  size = 'md',
  showMissionTag = true,
  showSubtitle = true,
  className = '',
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  // Typography scaling
  const titleSizes = {
    sm: 'text-lg sm:text-xl tracking-[0.12em]',
    md: 'text-2xl sm:text-3xl tracking-[0.14em]',
    lg: 'text-4xl sm:text-5xl md:text-6xl tracking-[0.14em]',
    hero: 'text-6xl xs:text-7xl sm:text-8xl md:text-9xl lg:text-[10.5rem] xl:text-[12rem] tracking-[0.08em] leading-[0.82]',
  };

  const tagSizes = {
    sm: 'text-[9px] px-1.5 py-0.2',
    md: 'text-[10px] px-2 py-0.5',
    lg: 'text-xs px-2.5 py-1',
    hero: 'text-xs sm:text-sm px-3 py-1',
  };

  return (
    <div className={`inline-flex flex-col select-none ${className}`}>
      {/* Top Mission Identifier */}
      {showMissionTag && size !== 'sm' && (
        <div className="flex items-center gap-2 mb-1.5 font-mono">
          <span
            className={`font-bold tracking-[0.22em] uppercase border ${tagSizes[size]} ${
              isLight
                ? 'border-[#252D36]/30 bg-[#070B10]/5 text-[#FF5938]'
                : 'border-[#FF5938]/40 bg-[#FF5938]/10 text-[#FF5938]'
            }`}
          >
            MISSION EO-26
          </span>
          <span className={`h-px w-4 ${isLight ? 'bg-[#252D36]/20' : 'bg-[#252D36]'}`} />
          <span
            className={`text-[10px] tracking-[0.25em] uppercase font-semibold ${
              isLight ? 'text-[#7E8B98]' : 'text-[#83BBD5]'
            }`}
          >
            MULTIVERSE VENDHAN
          </span>
        </div>
      )}

      {/* Primary Wordmark Typography */}
      <div className="relative flex items-center gap-3">
        {/* Geometric Aerospace Mark (Precision Aperture Horizon) */}
        {size !== 'hero' && (
          <div className="relative w-5 h-5 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-full h-full overflow-visible">
              {/* Outer Reticle Ring */}
              <circle
                cx="12"
                cy="12"
                r="10"
                fill="none"
                stroke={isLight ? '#070B10' : '#E9EDF0'}
                strokeWidth="1"
                strokeDasharray="2,3"
                opacity="0.4"
              />
              {/* Polar Crosshairs */}
              <line
                x1="12"
                y1="2"
                x2="12"
                y2="22"
                stroke={isLight ? '#070B10' : '#E9EDF0'}
                strokeWidth="0.8"
                opacity="0.3"
              />
              <line
                x1="2"
                y1="12"
                x2="22"
                y2="12"
                stroke={isLight ? '#070B10' : '#E9EDF0'}
                strokeWidth="0.8"
                opacity="0.3"
              />
              {/* Central Launch Core */}
              <circle cx="12" cy="12" r="2.5" fill="#FF5938" />
            </svg>
          </div>
        )}

        {/* Wordmark Letters */}
        <span
          className={`font-display font-black uppercase ${titleSizes[size]} ${
            isLight ? 'text-[#070B10]' : 'text-[#E9EDF0]'
          }`}
        >
          PRITHVI
        </span>

        {/* Small inline tag for small sizes */}
        {showMissionTag && size === 'sm' && (
          <span
            className={`font-mono text-[9px] font-bold tracking-widest px-1.5 py-0.5 border ${
              isLight
                ? 'border-[#252D36]/30 text-[#FF5938] bg-[#070B10]/5'
                : 'border-[#FF5938]/40 text-[#FF5938] bg-[#FF5938]/10'
            }`}
          >
            EO-26
          </span>
        )}
      </div>

      {/* Sub-label Taxonomy */}
      {showSubtitle && (
        <div
          className={`flex items-center gap-2 mt-1 font-mono uppercase tracking-[0.28em] sm:tracking-[0.34em] ${
            size === 'hero' ? 'text-xs sm:text-sm text-[#83BBD5]' : 'text-[9px] text-[#7E8B98]'
          }`}
        >
          <span>THE SOUND OF EARTH</span>
          <span className="text-[#252D36]">/</span>
          <span className="hidden sm:inline text-[#83BBD5]">NASA SPACE APPS 2026</span>
        </div>
      )}
    </div>
  );
};
