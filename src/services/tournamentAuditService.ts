import type { Tournament, TournamentAuditChange, TournamentAuditEntry } from '@/types';

/** Acrescenta snapshots independentes do estado corrente e preserva o histórico. */
export function acrescentarAuditoria(
  tournament: Tournament,
  roundNumber: number,
  change: TournamentAuditChange,
  occurredAt: string,
): TournamentAuditEntry[] {
  const previous = tournament.auditLog ?? [];
  const sequence = (previous.at(-1)?.sequence ?? 0) + 1;
  return [
    ...previous,
    {
      ...structuredClone(change),
      id: `${tournament.id}:audit:${sequence}`,
      sequence,
      roundNumber,
      occurredAt,
      actor: 'local-organizer',
    },
  ];
}
