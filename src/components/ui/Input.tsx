import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full py-2.5 bg-slate-50 dark:bg-slate-800/70 border text-xs sm:text-sm text-slate-900 dark:text-slate-100 font-medium placeholder-slate-400 dark:placeholder-slate-500 rounded-2xl outline-none transition-all duration-150 focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-500 ${
            leftIcon ? 'pl-10' : 'pl-4'
          } ${rightIcon ? 'pr-10' : 'pr-4'} ${
            error 
              ? 'border-red-500 focus:ring-red-500' 
              : 'border-slate-200 dark:border-slate-700/80 focus:border-transparent'
          } ${className}`}
          style={{ borderRadius: 'var(--theme-radius, 1rem)' }}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 text-slate-400 dark:text-slate-500">
            {rightIcon}
          </div>
        )}
      </div>
      {error && (
        <p className="text-[11px] font-bold text-red-600 dark:text-red-400 mt-1">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
