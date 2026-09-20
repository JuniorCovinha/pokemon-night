import type { Player, TournamentAuditEntry, TournamentMatch } from '@/types';

type TournamentAuditLogProps = {
  entries: TournamentAuditEntry[];
  players: Player[];
};

function describeResult(match: TournamentMatch, players: Player[]): string {
  const name = (id?: string) =>
    players.find((player) => player.id === id)?.name ?? 'Jogador';
  const result = match.result;
  if (!result) return 'Sem resultado confirmado';
  const label =
    result.kind === 'draw'
      ? 'Empate'
      : result.kind === 'double-loss'
        ? 'Derrota dupla'
        : result.kind === 'bye'
          ? `Bye de ${name(result.winnerId)}`
          : `${result.kind === 'administrative-win' ? 'Vitória administrativa' : 'Vitória'} de ${name(result.winnerId)}`;
  const games = result.gameOutcomes.map((outcome) =>
    outcome === 'draw'
      ? 'empate'
      : name(outcome === 'player1-win' ? match.player1Id : match.player2Id),
  );
  return games.length ? `${label} · jogos: ${games.join(' / ')}` : label;
}

function ChangeDetails({
  entry,
  players,
}: {
  entry: TournamentAuditEntry;
  players: Player[];
}) {
  if (entry.kind === 'round-reopened')
    return (
      <>
        <p className="font-semibold">Rodada {entry.roundNumber} reaberta para correção</p>
        <p className="mt-1 whitespace-pre-wrap break-words">
          Justificativa: {entry.reason}
        </p>
        <p className="mt-1 text-xs">
          Revisão {entry.before.revision} → {entry.after.revision}. Resultados anteriores
          preservados.
        </p>
      </>
    );
  if (entry.kind === 'round-completed')
    return (
      <p className="font-semibold">
        Rodada {entry.roundNumber} encerrada · revisão {entry.after.revision}
      </p>
    );
  return (
    <>
      <p className="font-semibold">
        Rodada {entry.roundNumber} · Mesa {entry.after.tableNumber} ·{' '}
        {entry.kind === 'match-corrected'
          ? 'Resultado corrigido'
          : 'Resultado confirmado'}
      </p>
      <p className="mt-1 break-words">Antes: {describeResult(entry.before, players)}</p>
      <p className="mt-1 break-words">Depois: {describeResult(entry.after, players)}</p>
      <p className="mt-1 text-xs">
        Revisão da partida {entry.before.revision} → {entry.after.revision} · rodada{' '}
        {entry.roundRevision}
      </p>
    </>
  );
}

export function TournamentAuditLog({ entries, players }: TournamentAuditLogProps) {
  if (!entries.length) return null;
  return (
    <details
      id="championship-audit"
      tabIndex={-1}
      data-guide-section
      className="light-card rounded-xl border border-line bg-white p-4 text-ink"
    >
      <summary className="cursor-pointer text-sm font-semibold">
        Histórico de alterações ({entries.length})
      </summary>
      <p className="mt-3 text-xs">
        Ações do organizador local, sem identificação por login. Este histórico acompanha
        o evento aberto; o salvamento entre sessões ainda não está disponível.
      </p>
      <ol
        className="mt-4 flex max-h-[32rem] flex-col gap-3 overflow-y-auto pr-2"
        aria-label="Alterações do campeonato, da mais recente à mais antiga"
      >
        {[...entries].reverse().map((entry) => (
          <li
            key={entry.id}
            className="rounded-lg border border-line bg-surface-alt p-3 text-sm"
          >
            <div className="mb-2 flex flex-wrap justify-between gap-2 text-xs">
              <span>Registro {entry.sequence}</span>
              <time dateTime={entry.occurredAt}>
                {new Date(entry.occurredAt).toLocaleString('pt-BR')}
              </time>
            </div>
            <ChangeDetails entry={entry} players={players} />
          </li>
        ))}
      </ol>
    </details>
  );
}
