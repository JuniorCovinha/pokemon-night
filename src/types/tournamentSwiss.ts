export type SwissRoundStatus = 'paired' | 'active' | 'awaiting-results' | 'completed';

export type SwissRound = {
  number: number;
  status: SwissRoundStatus;
  matchIds: string[];
  revision: number;
  startedAt?: string;
  completedAt?: string;
};

export type TournamentMatchStatus =
  'paired' | 'active' | 'reported' | 'confirmed' | 'corrected';

export type TournamentMatchResultKind =
  'win' | 'draw' | 'bye' | 'double-loss' | 'administrative-win';

export type TournamentGameOutcome = 'player1-win' | 'player2-win' | 'draw';

export type TournamentMatchResult = {
  kind: TournamentMatchResultKind;
  winnerId?: string;
  gameOutcomes: TournamentGameOutcome[];
};

/** Partida Suíça separada do Match usado pelo bracket eliminatório. */
export type TournamentMatch = {
  id: string;
  roundNumber: number;
  tableNumber?: number;
  player1Id: string;
  /** Ausente somente quando a partida representa um bye. */
  player2Id?: string;
  status: TournamentMatchStatus;
  result?: TournamentMatchResult;
  revision: number;
};
