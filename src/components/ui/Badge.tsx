import type { HTMLAttributes, ReactNode } from 'react';

type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'danger';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  variant?: BadgeVariant;
  /** Sobrepõe a cor do variant — usado para o chip de tipo do deck. */
  color?: string;
};

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: 'bg-surface-alt text-ink-soft',
  brand: 'bg-brand-soft text-brand',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
};

export function Badge({ children, variant = 'neutral', color, className = '', ...rest }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px]
        font-display leading-none
        ${!color ? VARIANT_CLASSES[variant] : ''}
        ${className}
      `}
      style={color ? { color, backgroundColor: `${color}1a` } : undefined}
      {...rest}
    >
      {children}
    </span>
  );
}
