import type { HTMLAttributes, ReactNode } from 'react';

type CardVariant = 'default' | 'pixel';

type CardProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  /**
   * "default": cantos arredondados, sombra suave — uso geral (DeckCard,
   * PlayerCard, listas densas de informação).
   * "pixel": cantos em degrau + sombra dura — reservado a elementos
   * âncora do retrô (ex: destaque do campeão), não para uso geral.
   */
  variant?: CardVariant;
  /** Aplica hover com leve "salto", como um sprite sendo selecionado. */
  interactive?: boolean;
};

const VARIANT_CLASSES: Record<CardVariant, string> = {
  default: 'rounded-2xl shadow-sm',
  pixel: 'pixel-corners shadow-[var(--shadow-pixel-md)]',
};

export function Card({
  children,
  variant = 'default',
  interactive = false,
  className = '',
  ...rest
}: CardProps) {
  return (
    <div
      className={`
        border border-line bg-surface p-5
        transition-transform duration-[var(--duration-fast)] ease-[var(--ease-retro)]
        ${VARIANT_CLASSES[variant]}
        ${interactive ? 'hover:-translate-y-0.5 hover:shadow-md cursor-pointer' : ''}
        ${className}
      `}
      {...rest}
    >
      {children}
    </div>
  );
}
