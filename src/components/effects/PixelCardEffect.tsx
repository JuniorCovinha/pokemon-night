import type { CSSProperties, ReactNode } from 'react';

type PixelCardEffectProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
};

const PIXELS = [
  [8, 14],
  [21, 8],
  [36, 19],
  [52, 10],
  [68, 16],
  [86, 9],
  [12, 42],
  [28, 34],
  [45, 48],
  [62, 37],
  [79, 46],
  [91, 32],
  [7, 72],
  [23, 83],
  [39, 68],
  [55, 78],
  [73, 66],
  [88, 82],
] as const;

/** Camada de pixels decorativa; o conteúdo permanece sempre acima e legível. */
export function PixelCardEffect({
  children,
  className = '',
  contentClassName = '',
}: PixelCardEffectProps) {
  return (
    <div
      className={`rb-pixel-card ${className}`.trim()}
      data-react-bits-effect="pixel-card"
    >
      <span className="rb-pixel-card__field" aria-hidden="true">
        {PIXELS.map(([left, top], index) => (
          <span
            key={`${left}-${top}`}
            className="rb-pixel-card__pixel"
            style={
              {
                '--pixel-left': `${left}%`,
                '--pixel-top': `${top}%`,
                '--pixel-delay': `${index * 18}ms`,
              } as CSSProperties
            }
          />
        ))}
      </span>
      <div className={`rb-pixel-card__content ${contentClassName}`.trim()}>
        {children}
      </div>
    </div>
  );
}
