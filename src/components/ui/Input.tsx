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
        <label htmlFor={inputId} className="block text-xs font-extrabold uppercase tracking-wider text-ink-soft">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3.5 text-ink-faint pointer-events-none">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full py-2.5 bg-surface-2 border text-xs sm:text-sm text-ink font-medium placeholder-ink-faint rounded-2xl outline-none transition-all duration-150 focus:ring-2 focus:ring-brand-500 ${
            leftIcon ? 'pl-10' : 'pl-4'
          } ${rightIcon ? 'pr-10' : 'pr-4'} ${
            error 
              ? 'border-error focus:ring-error' 
              : 'border-line focus:border-transparent'
          } ${className}`}
          style={{ borderRadius: 'var(--theme-radius, 1rem)' }}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 text-ink-faint">
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
