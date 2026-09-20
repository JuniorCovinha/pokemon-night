/** Snapshot das regras locais usadas para calcular a classificação do evento. */
export type StandingsRules = {
  version: string;
  winPoints: number;
  drawPoints: number;
  lossPoints: number;
  minimumWinRate: number;
  droppedMaximumWinRate: number;
};

/** Projeção dos resultados confirmados; nunca é editada ou persistida à parte. */
export type Standing = {
  playerId: string;
  position: number;
  tied: boolean;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  /** Já incluídos nas vitórias e nos pontos. */
  byes: number;
  points: number;
  /** Frações de 0 a 1; null quando ainda não houve adversário real. */
  opponentWinRate: number | null;
  opponentsOpponentWinRate: number | null;
};
