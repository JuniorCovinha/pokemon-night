import type { ReactNode } from 'react';

type NavbarProps = {
  title: string;
  actions?: ReactNode;
};

/**
 * Ícone genérico abstrato (círculo dividido por uma faixa) — não é um
 * logo de nenhuma franquia, é só um pictograma de "esfera de captura"
 * simplificado, coerente com o tema sem reproduzir marca registrada.
 */
function BrandGlyph() {
  return (
    <span className="relative inline-flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-ink bg-white">
      <span className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 bg-ink" />
      <span className="absolute h-1.5 w-1.5 rounded-full border-2 border-ink bg-white" />
    </span>
  );
}

export function Navbar({ title, actions }: NavbarProps) {
  return (
    <header className="flex items-center justify-between border-b-2 border-ink bg-surface px-4 py-3 sm:px-6">
      <div className="flex items-center gap-2.5">
        <BrandGlyph />
        <h1 className="font-display text-xs text-ink sm:text-sm">{title}</h1>
      </div>

      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
