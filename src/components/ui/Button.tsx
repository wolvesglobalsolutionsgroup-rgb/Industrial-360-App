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
  const baseStyle = "inline-flex items-center justify-center gap-2 font-bold transition-all rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed select-none";
  
  const variants = {
    primary: "bg-[#0B2239] text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 border border-slate-250 dark:border-slate-800",
    outline: "bg-transparent border border-slate-350 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800",
    ghost: "bg-transparent text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800",
    danger: "bg-red-600 hover:bg-red-700 text-white shadow-xs",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs",
    warning: "bg-amber-500 hover:bg-amber-650 text-slate-950 shadow-xs"
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
