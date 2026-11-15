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
      ? 'bg-[#F0EEE5] text-[#111820] border border-[#111820]/10 shadow-[0_4px_30px_rgba(0,0,0,0.08)]'
      : 'bg-[#111820]/80 text-[#F0EEE5] border border-[#F0EEE5]/10 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.3)]';

  return (
    <div
      className={`relative p-6 sm:p-8 transition-all duration-300 rounded-none ${surfaceStyles} ${className}`}
    >
      {children}
    </div>
  );
};
