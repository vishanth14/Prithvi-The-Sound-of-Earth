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
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  number,
  category,
  title,
  subtitle,
  badge,
  badgeVariant = 'sand',
  centered = false,
}) => {
  return (
    <div className={`mb-12 sm:mb-16 ${centered ? 'text-center max-w-3xl mx-auto' : 'max-w-3xl'}`}>
      <div
        className={`flex items-center gap-3 mb-4 ${
          centered ? 'justify-center' : 'justify-start'
        }`}
      >
        <span className="font-mono text-xs sm:text-[13px] text-[#D1B77D] tracking-[0.25em] font-medium uppercase">
          CHAPTER {number}
        </span>
        <span className="h-px w-6 bg-[#D1B77D]/40" />
        <span className="font-sans text-xs sm:text-[13px] text-[#F0EEE5]/70 tracking-widest uppercase">
          {category}
        </span>
        {badge && (
          <Badge variant={badgeVariant} pulse>
            {badge}
          </Badge>
        )}
      </div>

      <h2 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#F0EEE5] mb-4 leading-[1.08]">
        {title}
      </h2>

      <p className="font-sans text-sm sm:text-base text-[#F0EEE5]/80 leading-relaxed max-w-2xl font-light">
        {subtitle}
      </p>
    </div>
  );
};
