import React from 'react';
import { Badge, type BadgeVariant } from './Badge';

interface SectionHeaderProps {
  number: string;
  category: string;
  title: string;
  subtitle: string;
  badge?: string;
  badgeVariant?: BadgeVariant;
  centered?: boolean;
  theme?: 'dark' | 'light';
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  number,
  category,
  title,
  subtitle,
  badge,
  badgeVariant = 'sand',
  centered = false,
  theme = 'dark',
}) => {
  const isLight = theme === 'light';

  return (
    <div className={`mb-12 sm:mb-16 ${centered ? 'text-center max-w-3xl mx-auto' : 'max-w-3xl'}`}>
      <div
        className={`flex flex-wrap items-center gap-3 mb-4 ${
          centered ? 'justify-center' : 'justify-start'
        }`}
      >
        <span
          className={`font-mono text-xs sm:text-[13px] tracking-[0.25em] font-bold uppercase ${
            isLight ? 'text-[#FF5938]' : 'text-[#FF5938]'
          }`}
        >
          CHAPTER {number}
        </span>
        <span className={`h-px w-6 ${isLight ? 'bg-black/15' : 'bg-[#252D36]'}`} />
        <span
          className={`font-mono text-xs sm:text-[13px] tracking-widest uppercase font-semibold ${
            isLight ? 'text-[#252D36]/80' : 'text-[#83BBD5]/90'
          }`}
        >
          {category}
        </span>
        {badge && (
          <Badge variant={badgeVariant} pulse>
            {badge}
          </Badge>
        )}
      </div>

      <div className="relative">
        {/* Subtle aerospace datum guide tick */}
        <div
          className={`hidden sm:block absolute -left-6 top-1.5 w-3 h-px ${
            isLight ? 'bg-[#FF5938]' : 'bg-[#FF5938]'
          }`}
        />

        <h2
          className={`font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold uppercase tracking-tight mb-4 leading-[0.92] ${
            isLight ? 'text-[#070B10]' : 'text-[#E9EDF0]'
          }`}
        >
          {title}
        </h2>
      </div>

      <p
        className={`font-sans text-sm sm:text-base leading-relaxed max-w-2xl font-normal ${
          isLight ? 'text-[#252D36]/80' : 'text-[#E9EDF0]/75'
        }`}
      >
        {subtitle}
      </p>
    </div>
  );
};
