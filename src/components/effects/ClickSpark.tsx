import type { CSSProperties, ReactNode } from 'react';

type ClickSparkProps = {
  children: ReactNode;
  trigger: number;
  color: string;
  origin?: { x: number; y: number };
  className?: string;
};

const SPARKS = Array.from({ length: 6 }, (_, index) => index);

/** Faíscas decorativas acionadas somente depois de uma ação válida. */
export function ClickSpark({
  children,
  trigger,
  color,
  origin,
  className = '',
}: ClickSparkProps) {
  const style = {
    '--spark-color': color,
    '--spark-x': origin ? `${origin.x}px` : '50%',
    '--spark-y': origin ? `${origin.y}px` : '50%',
  } as CSSProperties;

  return (
    <div
      className={`rb-click-spark ${className}`.trim()}
      data-react-bits-effect="click-spark"
      style={style}
    >
      {children}
      {trigger > 0 && (
        <span key={trigger} className="rb-click-spark__burst" aria-hidden="true">
          {SPARKS.map((spark) => (
            <span
              key={spark}
              className="rb-click-spark__ray"
              style={{ '--spark-angle': `${spark * 60}deg` } as CSSProperties}
            />
          ))}
        </span>
      )}
    </div>
  );
}
