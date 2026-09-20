import type { SwissRound, TournamentMatch } from './tournamentSwiss';

export type TournamentAuditChange =
  | { kind: 'round-reopened'; reason: string; before: SwissRound; after: SwissRound }
  | { kind: 'round-completed'; before: SwissRound; after: SwissRound }
  | {
      kind: 'match-confirmed' | 'match-corrected';
      roundRevision: number;
      before: TournamentMatch;
      after: TournamentMatch;
    };

/** Histórico local do evento; o operador ainda não possui identidade autenticada. */
export type TournamentAuditEntry = TournamentAuditChange & {
  id: string;
  sequence: number;
  occurredAt: string;
  actor: 'local-organizer';
  roundNumber: number;
};
