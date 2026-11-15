import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'signal' | 'ghost' | 'telemetry';
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
    'relative inline-flex items-center justify-center font-sans font-medium tracking-wide transition-all duration-300 disabled:opacity-40 disabled:pointer-events-none cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D1B77D] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111820]';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 gap-2 rounded-full',
    md: 'text-xs sm:text-sm px-5 py-2.5 gap-2.5 rounded-full',
    lg: 'text-sm sm:text-base px-7 py-3.5 gap-3 rounded-full',
  };

  const variantStyles = {
    primary:
      'bg-[#F0EEE5] text-[#111820] font-semibold hover:bg-white hover:shadow-[0_8px_30px_rgba(240,238,229,0.18)] active:scale-[0.98]',
    secondary:
      'bg-transparent text-[#F0EEE5] border border-[#F0EEE5]/30 hover:border-[#D1B77D] hover:text-[#D1B77D] hover:bg-white/[0.03] active:scale-[0.98]',
    signal:
      'bg-[#E16D54] text-[#F0EEE5] font-semibold hover:bg-[#EB7B63] hover:shadow-[0_8px_25px_rgba(225,109,84,0.3)] active:scale-[0.98]',
    ghost:
      'text-[#F0EEE5]/75 hover:text-white hover:bg-white/[0.05] border border-transparent active:scale-[0.98]',
    telemetry:
      'bg-[#111820]/80 text-[#F0EEE5]/90 border border-[#F0EEE5]/20 hover:border-[#D1B77D] hover:text-[#D1B77D] font-mono tracking-widest text-[11px] py-1.5 px-3 rounded-none',
  };

  const activeStyles = active
    ? 'border-[#D1B77D] bg-white/10 text-white shadow-[0_0_20px_rgba(209,183,125,0.2)]'
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
