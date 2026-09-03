import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

type PixelRevealProps = {
  children: ReactNode;
  revealed: boolean;
  className?: string;
};

const PIXELS = Array.from({ length: 48 }, (_, index) => index);

/**
 * Adaptação leve do Pixel Swap do React Bits para uma revelação controlada.
 * O conteúdo não volta a ser coberto depois da primeira revelação.
 */
export function PixelReveal({ children, revealed, className = '' }: PixelRevealProps) {
  const [isVisible, setIsVisible] = useState(false);
  const revealedOnceRef = useRef(false);

  useEffect(() => {
    if (!revealed || revealedOnceRef.current) return;

    const frame = window.requestAnimationFrame(() => {
      revealedOnceRef.current = true;
      setIsVisible(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, [revealed]);

  return (
    <div
      className={`rb-pixel-reveal ${className}`.trim()}
      data-react-bits-effect="pixel-swap"
      data-revealed={isVisible}
    >
      <div aria-hidden={!isVisible}>{children}</div>
      <div className="rb-pixel-reveal__cover" aria-hidden="true">
        {PIXELS.map((pixel) => (
          <span
            key={pixel}
            className="rb-pixel-reveal__pixel"
            style={{ '--pixel-order': (pixel * 13) % PIXELS.length } as CSSProperties}
          />
        ))}
      </div>
    </div>
  );
}
