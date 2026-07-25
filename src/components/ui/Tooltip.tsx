import { useState, type ReactNode } from 'react';

type TooltipProps = {
  content: string;
  children: ReactNode;
};

/**
 * Posicionamento simples (sempre acima, centralizado) — suficiente para
 * o uso atual (dicas curtas em ícones/botões). Se algum dia precisar de
 * posicionamento inteligente (evitar sair da tela), essa é a hora de
 * trocar por uma lib de positioning, não antes.
 */
export function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}

      {isVisible && (
        <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2">
          <span
            role="tooltip"
            className="
              block animate-slide-in-card whitespace-nowrap rounded-md bg-ink
              px-2.5 py-1.5 font-sans text-xs text-white shadow-[var(--shadow-pixel-sm)]
            "
          >
            {content}
          </span>
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-ink" />
        </span>
      )}
    </span>
  );
}
