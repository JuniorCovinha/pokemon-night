import type { ReactNode } from 'react';

type GlareHoverProps = {
  children: ReactNode;
  className?: string;
};

/** Brilho holográfico em CSS, restrito a mouse/caneta e movimento permitido. */
export function GlareHover({ children, className = '' }: GlareHoverProps) {
  return (
    <div
      className={`rb-glare-hover ${className}`.trim()}
      data-react-bits-effect="glare-hover"
    >
      {children}
    </div>
  );
}
