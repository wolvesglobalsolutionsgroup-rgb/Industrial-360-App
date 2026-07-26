import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  icon,
  className = '',
  type = 'text',
  id,
  ...props
}, ref) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-slate-400 shrink-0 pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`w-full ${
            icon ? 'pl-10' : 'pl-4'
          } pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900/50 dark:hover:bg-slate-900 border ${
            error ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-emerald-500/20'
          } rounded-2xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-3 transition-all ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-[10px] sm:text-xs font-bold text-red-650 font-mono mt-0.5">
          {error}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

// Select Component
export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  options,
  className = '',
  id,
  ...props
}, ref) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <label htmlFor={selectId} className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={selectId}
        className={`w-full px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900/50 dark:hover:bg-slate-900 border ${
          error ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 dark:border-slate-800 focus:ring-emerald-500/20'
        } rounded-2xl text-sm font-semibold text-slate-900 dark:text-white outline-none focus:border-emerald-500 dark:focus:border-emerald-500 focus:ring-3 transition-all ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-[10px] sm:text-xs font-bold text-red-650 font-mono mt-0.5">
          {error}
        </p>
      )}
    </div>
  );
});

Select.displayName = 'Select';
