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
        className={`flex items-center gap-3 mb-4 ${
          centered ? 'justify-center' : 'justify-start'
        }`}
      >
        <span
          className={`font-mono text-xs sm:text-[13px] tracking-[0.25em] font-medium uppercase ${
            isLight ? 'text-[#FF5938]' : 'text-[#FF5938]'
          }`}
        >
          CHAPTER {number}
        </span>
        <span className={`h-px w-6 ${isLight ? 'bg-black/15' : 'bg-[#252D36]'}`} />
        <span
          className={`font-mono text-xs sm:text-[13px] tracking-widest uppercase ${
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

      <h2
        className={`font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight mb-4 leading-[0.98] ${
          isLight ? 'text-[#070B10]' : 'text-[#E9EDF0]'
        }`}
      >
        {title}
      </h2>

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
