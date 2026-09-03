type BrandTitleProps = {
  as?: 'h1' | 'p';
  className?: string;
};

/** Marca visual única do app, com contraste estável sobre o fundo noturno. */
export function BrandTitle({ as: Component = 'h1', className = '' }: BrandTitleProps) {
  return (
    <Component
      className={`pokemon-night-brand font-display font-bold ${className}`.trim()}
    >
      Pokémon Night
    </Component>
  );
}
