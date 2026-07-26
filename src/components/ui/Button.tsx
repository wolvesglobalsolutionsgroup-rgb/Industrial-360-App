import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'accent' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}, ref) => {
  const baseStyles = 'inline-flex items-center justify-center font-bold transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none';
  
  const variantStyles = {
    primary: 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm hover:shadow-md active:scale-[0.99]',
    secondary: 'bg-surface-2 hover:bg-elevated text-ink active:scale-[0.99]',
    outline: 'border border-line bg-transparent hover:bg-surface-2 text-ink active:scale-[0.99]',
    ghost: 'bg-transparent hover:bg-surface-2 text-ink-soft hover:text-ink',
    danger: 'bg-error hover:bg-red-700 text-white shadow-sm hover:shadow-md active:scale-[0.99]',
    success: 'bg-success hover:bg-emerald-700 text-white shadow-sm hover:shadow-md active:scale-[0.99]',
    accent: 'bg-brand-accent hover:bg-brand-accent-600 text-white font-black shadow-sm hover:shadow-md active:scale-[0.99]',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 rounded-xl gap-1.5',
    md: 'text-xs sm:text-sm px-4 py-2.5 rounded-2xl gap-2',
    lg: 'text-sm sm:text-base px-6 py-3.5 rounded-2xl gap-2.5',
  };

  const borderRadius = 'var(--theme-radius, 1rem)';

  return (
    <button
      ref={ref}
      disabled={disabled || isLoading}
      style={{ borderRadius }}
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="animate-spin shrink-0" size={size === 'sm' ? 14 : size === 'md' ? 16 : 18} />
      ) : leftIcon ? (
        <span className="shrink-0">{leftIcon}</span>
      ) : null}
      
      <span>{children}</span>

      {!isLoading && rightIcon && (
        <span className="shrink-0">{rightIcon}</span>
      )}
    </button>
  );
});

Button.displayName = 'Button';
