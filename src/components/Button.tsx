import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  disabled,
  ...rest
}) => {
  const base =
    'inline-flex items-center justify-center gap-2 font-display font-bold tracking-wider uppercase rounded-xl transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none';

  const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary:
      'bg-gradient-to-r from-[#ff3366] to-[#ff5533] hover:from-[#ff4775] hover:to-[#ff6b4a] text-white shadow-lg shadow-[#ff3366]/25 border border-white/10',
    secondary:
      'bg-[#1b2234] hover:bg-[#252e46] text-white border border-[#2e3854]',
    outline:
      'bg-transparent hover:bg-white/5 text-white border-2 border-[#2e3854] hover:border-[#00f0ff]',
    danger:
      'bg-red-600/90 hover:bg-red-500 text-white border border-red-400/30',
    ghost: 'bg-transparent hover:bg-white/10 text-slate-300 hover:text-white',
  };

  const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
    sm: 'text-xs px-3.5 py-2',
    md: 'text-sm px-5 py-3',
    lg: 'text-base px-7 py-4',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${
        fullWidth ? 'w-full' : ''
      } ${className}`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  );
};
