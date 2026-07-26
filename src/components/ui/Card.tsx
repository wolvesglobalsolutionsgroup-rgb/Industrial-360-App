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
      className={`card p-6 transition-all duration-300 ${
        hoverEffect ? 'hover:shadow-soft hover:-translate-y-0.5' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`pb-4 border-b border-line flex justify-between items-center gap-3 ${className}`} {...props}>
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
    <div className={`pt-4 border-t border-line mt-4 flex items-center justify-between gap-3 ${className}`} {...props}>
      {children}
    </div>
  );
}

export default Card;
