import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export function Card({
  children,
  className = '',
  hoverEffect = false,
  ...props
}: CardProps) {
  return (
    <div
      className={`backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 p-6 rounded-3xl border border-white/80 dark:border-slate-800/80 shadow-xs shadow-slate-200/40 dark:shadow-none transition-all duration-300 ${
        hoverEffect ? 'hover:shadow-md hover:-translate-y-0.5' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`pb-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center gap-3 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`pt-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between gap-3 ${className}`} {...props}>
      {children}
    </div>
  );
}

export default Card;
