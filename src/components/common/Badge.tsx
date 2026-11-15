import React from 'react';

export type BadgeVariant =
  | 'sand'
  | 'signal'
  | 'ocean'
  | 'paper'
  | 'neutral'
  | 'cyan'
  | 'amber'
  | 'crimson'
  | 'emerald'
  | 'violet';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  pulse?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'sand',
  pulse = false,
  className = '',
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    sand: 'border-[#83BBD5]/40 bg-[#83BBD5]/10 text-[#83BBD5]',
    signal: 'border-[#FF5938]/40 bg-[#FF5938]/10 text-[#FF5938]',
    ocean: 'border-[#83BBD5]/50 bg-[#162432] text-[#83BBD5]',
    paper: 'border-[#252D36] bg-[#E9EDF0] text-[#070B10] font-bold',
    neutral: 'border-[#252D36] bg-[#0E141D] text-[#E9EDF0]/70',
    cyan: 'border-[#83BBD5]/40 bg-[#162432]/60 text-[#83BBD5]',
    amber: 'border-[#FF5938]/40 bg-[#FF5938]/10 text-[#FF5938]',
    crimson: 'border-[#FF5938]/50 bg-[#FF5938]/20 text-[#FF5938]',
    emerald: 'border-emerald-600/40 bg-emerald-950/30 text-emerald-300',
    violet: 'border-purple-500/30 bg-purple-950/30 text-purple-300',
  };

  const dotColors: Record<BadgeVariant, string> = {
    sand: 'bg-[#83BBD5]',
    signal: 'bg-[#FF5938]',
    ocean: 'bg-[#83BBD5]',
    paper: 'bg-[#070B10]',
    neutral: 'bg-[#E9EDF0]/60',
    cyan: 'bg-[#83BBD5]',
    amber: 'bg-[#FF5938]',
    crimson: 'bg-[#FF5938]',
    emerald: 'bg-emerald-400',
    violet: 'bg-purple-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-mono tracking-widest uppercase border rounded-none ${variantStyles[variant]} ${className}`}
    >
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${dotColors[variant]}`}
          />
          <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${dotColors[variant]}`} />
        </span>
      )}
      {children}
    </span>
  );
};
