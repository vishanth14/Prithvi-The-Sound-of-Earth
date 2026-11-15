import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'signal' | 'ghost' | 'telemetry' | 'paper';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  active?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  active = false,
  className = '',
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-display uppercase tracking-wider font-bold transition-all duration-200 disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none rounded-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5938] focus-visible:ring-offset-2 focus-visible:ring-offset-[#070B10]';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 gap-2',
    md: 'text-xs sm:text-sm px-5 py-2.5 gap-2.5',
    lg: 'text-sm sm:text-base px-7 py-3.5 gap-3',
  };

  const variantStyles = {
    primary:
      'bg-[#FF5938] text-white border border-[#FF5938] hover:bg-[#E84C2C] hover:border-[#E84C2C] hover:shadow-[0_4px_20px_rgba(255,89,56,0.35)] active:translate-y-[1px]',
    secondary:
      'bg-[#0E141D] text-[#E9EDF0] border border-[#252D36] hover:border-[#83BBD5] hover:text-white active:translate-y-[1px]',
    signal:
      'bg-[#FF5938] text-white border border-[#FF5938] hover:bg-[#E84C2C] hover:shadow-[0_4px_20px_rgba(255,89,56,0.35)] active:translate-y-[1px]',
    ghost:
      'text-[#E9EDF0]/75 hover:text-white hover:bg-white/[0.05] border border-transparent active:translate-y-[1px]',
    telemetry:
      'bg-[#070B10] text-[#E9EDF0]/90 border border-[#252D36] hover:border-[#FF5938] hover:text-[#FF5938] font-mono tracking-widest text-[11px] py-1.5 px-3',
    paper:
      'bg-[#070B10] text-white border border-[#070B10] hover:bg-[#252D36] active:translate-y-[1px]',
  };

  const activeStyles = active
    ? 'border-[#FF5938] bg-[#FF5938]/10 text-white shadow-[0_0_16px_rgba(255,89,56,0.25)]'
    : '';

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${activeStyles} ${className}`}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  );
};
