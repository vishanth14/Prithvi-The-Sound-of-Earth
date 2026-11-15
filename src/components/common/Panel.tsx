import React from 'react';

interface PanelProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  cornerBorders?: boolean;
  surface?: 'dark' | 'paper';
}

export const Panel: React.FC<PanelProps> = ({
  children,
  className = '',
  surface = 'dark',
}) => {
  const surfaceStyles =
    surface === 'paper'
      ? 'bg-[#FFFFFF] text-[#070B10] border border-[rgba(7,11,16,0.12)] shadow-[0_4px_24px_rgba(7,11,16,0.06)]'
      : 'bg-[#0E141D] text-[#E9EDF0] border border-[#252D36] shadow-[0_8px_32px_rgba(0,0,0,0.5)]';

  return (
    <div
      className={`relative p-6 sm:p-8 transition-all duration-300 rounded-none ${surfaceStyles} ${className}`}
    >
      {children}
    </div>
  );
};
