export type TournamentStructure = 'single-elimination' | 'swiss' | 'swiss-top-cut';

export type TcgFormat = 'standard' | 'expanded' | 'casual';

export type MatchFormat = 'best-of-one' | 'best-of-three';

/** Configuração congelada quando as inscrições do torneio são confirmadas. */
export type TournamentConfig = {
  name: string;
  gameType: 'tcg';
  structure: TournamentStructure;
  tcgFormat: TcgFormat;
  matchFormat: MatchFormat;
  roundDurationMinutes: number;
  swissRoundCount: number;
  topCutSize?: 4;
  /** Identifica o conjunto de padrões locais usado para criar o evento. */
  rulesVersion: string;
};

export type TournamentEntryStatus = 'checked-in' | 'dropped' | 'disqualified';

/** Inscrição competitiva de um jogador em um torneio específico. */
export type TournamentEntry = {
  playerId: string;
  deckRegistrationId: string;
  status: TournamentEntryStatus;
  activeFromRound: number;
};

/** Vínculo imutável entre jogador e deck no momento da inscrição. */
export type TournamentDeckRegistration = {
  id: string;
  playerId: string;
  deckId: string;
};
