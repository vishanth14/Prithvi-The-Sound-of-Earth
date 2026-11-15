import React from 'react';

interface ReticleCornerProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: number;
  color?: string;
  className?: string;
}

export const ReticleCorner: React.FC<ReticleCornerProps> = ({
  position = 'top-left',
  size = 8,
  color = '#FF5938',
  className = '',
}) => {
  const positionClasses = {
    'top-left': 'top-0 left-0 -translate-x-1/2 -translate-y-1/2',
    'top-right': 'top-0 right-0 translate-x-1/2 -translate-y-1/2',
    'bottom-left': 'bottom-0 left-0 -translate-x-1/2 translate-y-1/2',
    'bottom-right': 'bottom-0 right-0 translate-x-1/2 translate-y-1/2',
  };

  return (
    <div
      className={`absolute pointer-events-none select-none ${positionClasses[position]} ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 10 10" className="w-full h-full overflow-visible">
        <line x1="5" y1="0" x2="5" y2="10" stroke={color} strokeWidth="1" />
        <line x1="0" y1="5" x2="10" y2="5" stroke={color} strokeWidth="1" />
      </svg>
    </div>
  );
};

interface AerospacePanelProps {
  children: React.ReactNode;
  idTag?: string;
  agencyTag?: string;
  className?: string;
  theme?: 'dark' | 'light';
  showCrosshairs?: boolean;
}

/**
 * Aerospace-Style Engineered Framing Container
 * Employs fine technical boundaries, corner crosshairs, and authentic mission classification tags.
 */
export const AerospacePanel: React.FC<AerospacePanelProps> = ({
  children,
  idTag,
  agencyTag,
  className = '',
  theme = 'dark',
  showCrosshairs = true,
}) => {
  const isLight = theme === 'light';

  return (
    <div
      className={`relative p-6 sm:p-8 border rounded-none transition-all duration-300 ${
        isLight
          ? 'bg-white border-[rgba(7,11,16,0.12)] text-[#070B10]'
          : 'bg-[#0E141D] border-[#252D36] text-[#E9EDF0]'
      } ${className}`}
    >
      {/* Corner crosshairs */}
      {showCrosshairs && (
        <>
          <ReticleCorner position="top-left" color={isLight ? '#252D36' : '#FF5938'} />
          <ReticleCorner position="top-right" color={isLight ? '#252D36' : '#FF5938'} />
          <ReticleCorner position="bottom-left" color={isLight ? '#252D36' : '#FF5938'} />
          <ReticleCorner position="bottom-right" color={isLight ? '#252D36' : '#FF5938'} />
        </>
      )}

      {/* Top Header Taxonomy Bar */}
      {(idTag || agencyTag) && (
        <div
          className={`flex items-center justify-between pb-3 mb-4 border-b text-[10px] font-mono tracking-widest uppercase ${
            isLight ? 'border-[rgba(7,11,16,0.08)] text-[#252D36]/70' : 'border-[#252D36] text-[#83BBD5]'
          }`}
        >
          {idTag && (
            <span className="font-bold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#FF5938]" />
              {idTag}
            </span>
          )}
          {agencyTag && <span>{agencyTag}</span>}
        </div>
      )}

      {children}
    </div>
  );
};
