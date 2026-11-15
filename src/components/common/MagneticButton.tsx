import React, { useRef, useState, useEffect } from 'react';
import { uiAudioFeedback } from '../../audio/uiAudioFeedback';

export interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  magneticRadius?: number; // Proximity threshold in pixels
  magneticStrength?: number; // Pull factor (0.1 to 0.4)
  maxDisplacement?: number; // Maximum offset in pixels
  cursorLabel?: string; // Optional context label for custom cursor (LISTEN, EXPLORE, etc.)
  variant?: 'primary' | 'secondary' | 'signal' | 'ghost' | 'paper' | 'custom';
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
}

/**
 * PRITHVI — Aerospace Tactile Magnetic Button
 * 
 * Provides restrained physical proximity magnetic pull with dual-layer depth:
 * - Outer container translates subtly toward cursor.
 * - Inner content translates with secondary parallax.
 * - Springs smoothly back to rest on pointer exit.
 * - Zero React re-renders during high-frequency pointer movement.
 * - Keyboard accessible with visible focus rings.
 * - Disabled automatically on touch devices and for reduced motion.
 */
export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  magneticRadius = 80,
  magneticStrength = 0.24,
  maxDisplacement = 9,
  cursorLabel,
  variant = 'primary',
  size = 'md',
  active = false,
  className = '',
  disabled,
  onClick,
  ...rest
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLSpanElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const prefersReducedMotionRef = useRef(false);

  useEffect(() => {
    prefersReducedMotionRef.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
  }, []);

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (disabled || prefersReducedMotionRef.current || e.pointerType === 'touch') return;

    const btn = buttonRef.current;
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const distFromCenterX = e.clientX - centerX;
    const distFromCenterY = e.clientY - centerY;
    const distance = Math.hypot(distFromCenterX, distFromCenterY);

    if (distance < magneticRadius) {
      // Calculate restrained spring displacement
      const pullX = Math.max(
        -maxDisplacement,
        Math.min(maxDisplacement, distFromCenterX * magneticStrength)
      );
      const pullY = Math.max(
        -maxDisplacement,
        Math.min(maxDisplacement, distFromCenterY * magneticStrength)
      );

      btn.style.transform = `translate3d(${pullX}px, ${pullY}px, 0)`;
      if (contentRef.current) {
        // Inner depth parallax layer
        contentRef.current.style.transform = `translate3d(${pullX * 0.45}px, ${pullY * 0.45}px, 0)`;
      }
    }
  };

  const handlePointerEnter = () => {
    if (disabled) return;
    setIsHovered(true);
    uiAudioFeedback.play('hover');
    if (buttonRef.current) {
      buttonRef.current.style.transition = 'transform 0.12s cubic-bezier(0.2, 0, 0.2, 1)';
    }
    if (contentRef.current) {
      contentRef.current.style.transition = 'transform 0.12s cubic-bezier(0.2, 0, 0.2, 1)';
    }
  };

  const handlePointerLeave = () => {
    setIsHovered(false);
    const btn = buttonRef.current;
    if (btn) {
      btn.style.transition = 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)';
      btn.style.transform = 'translate3d(0, 0, 0)';
    }
    if (contentRef.current) {
      contentRef.current.style.transition = 'transform 0.45s cubic-bezier(0.25, 1, 0.5, 1)';
      contentRef.current.style.transform = 'translate3d(0, 0, 0)';
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    uiAudioFeedback.play('click');
    onClick?.(e);
  };

  // Base styling variants
  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 gap-2',
    md: 'text-xs sm:text-sm px-5 py-2.5 gap-2.5',
    lg: 'text-sm sm:text-base px-7 py-3.5 gap-3',
  };

  const variantStyles = {
    primary:
      'bg-[#FF5938] text-[#070B10] border border-[#FF5938] hover:bg-[#E84C2C] shadow-[0_4px_24px_rgba(255,89,56,0.25)] hover:shadow-[0_6px_32px_rgba(255,89,56,0.45)]',
    secondary:
      'bg-[#0E141D] text-[#E9EDF0] border border-[#252D36] hover:border-[#83BBD5] hover:text-white',
    signal:
      'bg-[#FF5938] text-white border border-[#FF5938] hover:bg-[#E84C2C] shadow-[0_4px_20px_rgba(255,89,56,0.35)]',
    ghost:
      'text-[#E9EDF0]/80 hover:text-white hover:bg-white/[0.05] border border-transparent',
    paper:
      'bg-[#070B10] text-[#E9EDF0] border border-[#070B10] hover:bg-[#252D36]',
    custom: '',
  };

  const activeStyles = active
    ? 'border-[#FF5938] bg-[#FF5938]/15 text-white shadow-[0_0_16px_rgba(255,89,56,0.3)]'
    : '';

  return (
    <button
      ref={buttonRef}
      disabled={disabled}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      data-cursor-label={cursorLabel}
      data-cursor-magnetic="true"
      className={`relative inline-flex items-center justify-center font-display font-extrabold uppercase tracking-wider select-none cursor-pointer rounded-none disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5938] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070B10] will-change-transform ${
        variant !== 'custom' ? `${sizeStyles[size]} ${variantStyles[variant]} ${activeStyles}` : ''
      } ${className}`}
      {...rest}
    >
      {/* Subtle Corner Reticle Accents on Hover */}
      <span
        aria-hidden="true"
        className={`absolute top-0 left-0 w-1.5 h-1.5 border-t border-l border-white/40 transition-opacity duration-200 pointer-events-none ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <span
        aria-hidden="true"
        className={`absolute bottom-0 right-0 w-1.5 h-1.5 border-b border-r border-white/40 transition-opacity duration-200 pointer-events-none ${
          isHovered ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* Inner Content with Secondary Parallax */}
      <span
        ref={contentRef}
        className="relative z-10 inline-flex items-center justify-center gap-2 will-change-transform pointer-events-none"
      >
        {children}
      </span>
    </button>
  );
};
