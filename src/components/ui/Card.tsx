import React from 'react';

/* ─── Tipos ─────────────────────────────────────────── */

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Activa elevación suave al hover (shadow + translateY) */
  hoverEffect?: boolean;
  /** Color del glow radial en esquina superior derecha (ej. "#ff6b00", "var(--color-brand-accent)") */
  glowColor?: string;
}

/* ─── Card principal — glassmorphism premium ────────── */

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({
  children,
  className = '',
  hoverEffect = false,
  glowColor,
  style,
  ...props
}, ref) => {
  const hoverClasses = hoverEffect
    ? 'hover:-translate-y-0.5 hover:shadow-[0_20px_50px_rgba(15,23,42,0.14),0_6px_16px_rgba(15,23,42,0.07)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.4)] transition-all duration-300 ease-spring'
    : '';

  return (
    <div
      ref={ref}
      className={[
        'relative overflow-hidden',
        /* Light mode — glass premium */
        'bg-white/80 backdrop-blur-xl rounded-3xl border border-[#0A2540]/10 shadow-lg',
        /* Dark mode */
        'dark:bg-[#0A1628]/70 dark:backdrop-blur-xl dark:border-white/[0.07] dark:shadow-2xl',
        hoverClasses,
        className,
      ].filter(Boolean).join(' ')}
      style={style}
      {...props}
    >
      {/* Glow radial en esquina superior derecha */}
      {glowColor && (
        <div
          className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full opacity-35 dark:opacity-25"
          style={{
            background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)`,
          }}
        />
      )}

      {/* Children con z-index por encima del glow */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
});
Card.displayName = 'Card';

/* ─── Subcomponentes ────────────────────────────────── */

export const CardHeader = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`px-6 pt-6 pb-3 ${className}`}>
    {children}
  </div>
);

export const CardTitle = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h3 className={`text-base sm:text-lg font-black text-ink tracking-tight ${className}`}>
    {children}
  </h3>
);

export const CardDescription = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <p className={`text-xs text-ink-soft mt-1 font-medium ${className}`}>
    {children}
  </p>
);

export const CardContent = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`px-6 pb-6 ${className}`}>
    {children}
  </div>
);

export const CardFooter = ({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <div className={`px-6 py-4 bg-surface/50 border-t border-line ${className}`}>
    {children}
  </div>
);