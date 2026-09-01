const STARS = [
  [119, 68, 4],
  [188, 132, 3],
  [272, 91, 4],
  [377, 45, 3],
  [481, 110, 4],
  [603, 59, 3],
  [702, 126, 4],
  [810, 71, 3],
  [930, 113, 4],
  [1042, 54, 3],
  [1164, 103, 4],
  [1275, 50, 3],
  [1387, 119, 4],
  [1495, 68, 3],
  [1598, 103, 4],
  [1711, 52, 3],
  [1844, 119, 4],
] as const;

const LIGHTS = [
  [660, 509, 34, 0],
  [899, 377, 24, 0.4],
  [1019, 373, 22, 1.1],
  [1129, 382, 23, 0.7],
  [1375, 389, 22, 1.5],
  [382, 511, 22, 0.9],
  [356, 703, 20, 1.7],
  [644, 856, 23, 1.2],
  [1196, 845, 22, 0.5],
  [1453, 712, 22, 1.9],
] as const;

/**
 * Camada vetorial leve alinhada ao plano 1920x1080 da cidade base.
 * O preserveAspectRatio reproduz o mesmo recorte do object-cover da imagem.
 */
export function TownAmbientLayer() {
  return (
    <svg
      className="town-ambient-layer animate-backdrop-fade"
      viewBox="0 0 1920 1080"
      preserveAspectRatio="xMidYMid slice"
      focusable="false"
      aria-hidden="true"
    >
      <g className="town-moon-light">
        <circle cx="1797" cy="58" r="58" />
      </g>

      <g className="town-cloud town-cloud-left">
        <path d="M-110 112h94V88h82V65h118v14h94v22h126v31H-110z" />
      </g>
      <g className="town-cloud town-cloud-right">
        <path d="M1480 119h94V97h74V73h122v14h82v22h178v31h-550z" />
      </g>

      <g className="town-stars">
        {STARS.map(([x, y, size], index) => (
          <rect
            key={`${x}-${y}`}
            className="town-star"
            x={x}
            y={y}
            width={size}
            height={size}
            style={{
              animationDelay: `${(index % 6) * -0.7}s`,
              animationDuration: `${3.2 + (index % 4) * 0.6}s`,
            }}
          />
        ))}
      </g>

      <g className="town-lights">
        {LIGHTS.map(([x, y, radius, delay]) => (
          <circle
            key={`${x}-${y}`}
            className="town-light"
            cx={x}
            cy={y}
            r={radius}
            style={{ animationDelay: `${-delay}s` }}
          />
        ))}
      </g>
    </svg>
  );
}
