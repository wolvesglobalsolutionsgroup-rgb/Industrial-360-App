import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  glass?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({
  children,
  className = '',
  hoverEffect = false,
  glass = true,
  style,
  ...props
}, ref) => {
  const base = 'rounded-3xl border border-white/80 dark:border-slate-800/80 shadow-sm shadow-slate-200/50 dark:shadow-none overflow-hidden transition-all duration-200';
  const bg = glass 
    ? 'backdrop-blur-xl bg-white/85 dark:bg-slate-900/85' 
    : 'bg-white dark:bg-slate-900';
  const hover = hoverEffect 
    ? 'hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md' 
    : '';

  return (
    <div
      ref={ref}
      style={{ borderRadius: 'var(--theme-radius, 1.25rem)', ...style }}
      className={`${base} ${bg} ${hover} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});
Card.displayName = 'Card';

export const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-5 sm:p-6 pb-2 border-b border-slate-100/80 dark:border-slate-800/80 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight ${className}`}>
    {children}
  </h3>
);

export const CardDescription = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <p className={`text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium ${className}`}>
    {children}
  </p>
);

export const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-5 sm:p-6 ${className}`}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-4 sm:p-5 pt-3 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100/80 dark:border-slate-800/80 ${className}`}>
    {children}
  </div>
);
