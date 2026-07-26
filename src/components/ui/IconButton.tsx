import React from 'react';
import { Loader2 } from 'lucide-react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon: React.ReactNode;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(({
  className = '',
  variant = 'secondary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  type = 'button',
  ...props
}, ref) => {
  const baseStyle = "inline-flex items-center justify-center rounded-xl transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed select-none shrink-0";
  
  const variants = {
    primary: "bg-[#0B2239] text-white hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm",
    secondary: "bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-100 border border-slate-250 dark:border-slate-800",
    outline: "bg-transparent border border-slate-300 dark:border-slate-700 text-slate-750 dark:text-slate-250 hover:bg-slate-50 dark:hover:bg-slate-800",
    ghost: "bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800",
    danger: "bg-red-50 text-red-650 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-400 border border-red-200 dark:border-red-900/50",
    success: "bg-emerald-50 text-emerald-650 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50"
  };

  const sizes = {
    sm: "p-1.5 w-8 h-8",
    md: "p-2.5 w-10 h-10",
    lg: "p-3.5 w-12 h-12"
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`${baseStyle} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin text-current" />
      ) : (
        icon
      )}
    </button>
  );
});

IconButton.displayName = 'IconButton';
export default IconButton;
