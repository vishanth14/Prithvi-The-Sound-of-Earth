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
    sand: 'border-[#D1B77D]/40 bg-[#D1B77D]/10 text-[#D1B77D]',
    signal: 'border-[#E16D54]/40 bg-[#E16D54]/10 text-[#E16D54]',
    ocean: 'border-[#17465B] bg-[#17465B]/30 text-[#8BC4DE]',
    paper: 'border-[#F0EEE5]/30 bg-[#F0EEE5]/10 text-[#F0EEE5]',
    neutral: 'border-[#F0EEE5]/15 bg-white/[0.03] text-[#F0EEE5]/70',
    cyan: 'border-[#508CA4]/40 bg-[#17465B]/40 text-[#A2D2E2]',
    amber: 'border-[#D1B77D]/50 bg-[#D1B77D]/15 text-[#E6CCA0]',
    crimson: 'border-[#E16D54]/50 bg-[#E16D54]/15 text-[#FFA894]',
    emerald: 'border-emerald-600/40 bg-emerald-950/30 text-emerald-300',
    violet: 'border-purple-500/30 bg-purple-950/30 text-purple-300',
  };

  const dotColors: Record<BadgeVariant, string> = {
    sand: 'bg-[#D1B77D]',
    signal: 'bg-[#E16D54]',
    ocean: 'bg-[#508CA4]',
    paper: 'bg-[#F0EEE5]',
    neutral: 'bg-[#F0EEE5]/60',
    cyan: 'bg-[#508CA4]',
    amber: 'bg-[#D1B77D]',
    crimson: 'bg-[#E16D54]',
    emerald: 'bg-emerald-400',
    violet: 'bg-purple-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-0.5 text-[10px] sm:text-[11px] font-mono tracking-widest uppercase border rounded-full backdrop-blur-md ${variantStyles[variant]} ${className}`}
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
