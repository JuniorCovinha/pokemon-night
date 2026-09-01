import type { Player } from './player';
import type { Deck } from './deck';
import type { Bracket } from './bracket';
import type {
  TournamentConfig,
  TournamentDeckRegistration,
  TournamentEntry,
} from './tournamentConfig';
import type { SwissRound, TournamentMatch } from './tournamentSwiss';

/**
 * Vínculo entre um jogador e o deck sorteado para ele.
 * Separado em seu próprio tipo porque, futuramente (v6), o mesmo jogador
 * pode ter decks diferentes em formatos diferentes.
 */
export type PlayerDeckAssignment = {
  playerId: string;
  deckId: string;
};

/**
 * Estágios do campeonato. Controla o que a UI pode fazer em cada momento
 * (ex: não é possível sortear a chave antes dos decks estarem sorteados)
 * e evita estados inválidos.
 */
export type TournamentStatus =
  | 'registrando-jogadores'
  | 'inscricoes-confirmadas'
  | 'rodada-suica-pareada'
  | 'rodada-suica-ativa'
  | 'rodada-suica-revisao'
  | 'rodada-suica-concluida'
  | 'decks-sorteados'
  | 'chave-gerada'
  | 'em-andamento'
  | 'finalizado';

/**
 * Agregado raiz: representa um campeonato completo.
 *
 * `players` e `decks` são a única fonte de verdade sobre esses dados;
 * o `bracket` referencia jogadores só por id (ver `types/match.ts`).
 */
export type Tournament = {
  id: string;
  status: TournamentStatus;
  players: Player[];
  decks: Deck[];
  assignments: PlayerDeckAssignment[];
  config?: TournamentConfig;
  entries: TournamentEntry[];
  deckRegistrations: TournamentDeckRegistration[];
  swissRounds: SwissRound[];
  tournamentMatches: TournamentMatch[];
  bracket?: Bracket;
  championId?: string;
  createdAt: string;
};
