import type { CSSProperties, ReactNode } from 'react';

type StarBorderProps = {
  children: ReactNode;
  color?: string;
  className?: string;
};

/** Contorno animado discreto que não ocupa espaço nem altera o layout do filho. */
export function StarBorder({
  children,
  color = '#ffcb05',
  className = '',
}: StarBorderProps) {
  return (
    <div
      className={`rb-star-border ${className}`.trim()}
      data-react-bits-effect="star-border"
      style={{ '--star-border-color': color } as CSSProperties}
    >
      {children}
      <span className="rb-star-border__track" aria-hidden="true" />
    </div>
  );
}
