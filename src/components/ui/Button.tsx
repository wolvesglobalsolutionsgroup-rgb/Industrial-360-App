import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  className = '',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  type = 'button',
  ...props
}, ref) => {
  const baseStyle = "inline-flex items-center justify-center gap-2 font-bold transition-all rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/40 disabled:opacity-50 disabled:cursor-not-allowed select-none";
  
  const variants = {
    primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-sm",
    secondary: "bg-surface-2 hover:bg-elevated text-ink border border-line",
    outline: "border border-line bg-surface text-ink hover:bg-surface-2",
    ghost: "text-ink-soft hover:bg-surface-2 hover:text-ink",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-xs",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs",
    warning: "bg-amber-500 hover:bg-amber-600 text-ink shadow-xs"
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4.5 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-base"
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin text-current shrink-0" />}
      {!loading && icon && <span className="flex shrink-0">{icon}</span>}
      {children}
    </button>
  );
});

Button.displayName = 'Button';
export default Button;
