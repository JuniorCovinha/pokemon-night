import { useState } from 'react';
import { Check, CheckCircle2, Clock3, Flag, Play, RotateCcw, Swords } from 'lucide-react';
import { getTypeColor } from '@/constants/pokemonTypes';
import { Button, Card } from '@/components/ui';
import { analisarResultadoDosJogos, type SwissMatchResultInput } from '@/services';
import type {
  Deck,
  MatchFormat,
  Player,
  PlayerDeckAssignment,
  SwissRound,
  TournamentGameOutcome,
  TournamentMatch,
} from '@/types';

type SwissRoundPanelProps = {
  round: SwissRound;
  matches: TournamentMatch[];
  players: Player[];
  decks: Deck[];
  assignments: PlayerDeckAssignment[];
  matchFormat: MatchFormat;
  onStartRound: () => void;
  onSubmitResult: (matchId: string, result: SwissMatchResultInput) => void;
  onFinishRound: () => void;
};

type PlayerRowProps = {
  player?: Player;
  deck?: Deck;
  isWinner?: boolean;
};

function PlayerRow({ player, deck, isWinner = false }: PlayerRowProps) {
  if (!player) return null;

  return (
    <div
      className={`flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 ${
        isWinner ? 'bg-success-soft ring-1 ring-success/30' : 'bg-surface-alt'
      }`}
    >
      {deck?.miniatura || deck?.imagem ? (
        <img
          src={deck.miniatura ?? deck.imagem}
          alt={deck.nome}
          className="h-12 w-12 shrink-0 rounded-lg object-contain"
        />
      ) : (
        <span
          className="h-9 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: getTypeColor(deck?.tipoPrincipal) }}
        />
      )}

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">{player.name}</p>
        <p className="truncate text-xs text-ink-soft">
          {deck?.nome ?? 'Deck não informado'}
        </p>
      </div>

      {isWinner && <CheckCircle2 size={18} className="shrink-0 text-success" />}
    </div>
  );
}

type GameOutcomeSlotsProps = {
  gameOutcomes: TournamentGameOutcome[];
  maximumGames: number;
  player1Name: string;
  player2Name: string;
  onRemoveFrom?: (index: number) => void;
};

function GameOutcomeSlots({
  gameOutcomes,
  maximumGames,
  player1Name,
  player2Name,
  onRemoveFrom,
}: GameOutcomeSlotsProps) {
  return (
    <div
      className={
        maximumGames === 1 ? 'mx-auto grid w-28 grid-cols-1' : 'grid grid-cols-3 gap-2'
      }
      aria-label="Resultados dos jogos"
    >
      {Array.from({ length: maximumGames }, (_, index) => {
        const outcome = gameOutcomes[index];
        const label =
          outcome === 'player1-win'
            ? player1Name
            : outcome === 'player2-win'
              ? player2Name
              : outcome === 'draw'
                ? 'Empate'
                : `Jogo ${index + 1}`;
        const circleClasses =
          outcome === 'player1-win'
            ? 'bg-brand text-white'
            : outcome === 'player2-win'
              ? 'bg-ink text-white'
              : outcome === 'draw'
                ? 'bg-slate-400 text-white'
                : 'border-2 border-dashed border-line bg-white text-ink-soft';

        return (
          <button
            key={index}
            type="button"
            disabled={!outcome || !onRemoveFrom}
            onClick={() => onRemoveFrom?.(index)}
            className="flex min-w-0 flex-col items-center gap-1 rounded-xl border border-line bg-surface-alt px-1.5 py-2 disabled:cursor-default disabled:opacity-100"
            title={
              outcome && onRemoveFrom
                ? `Remover o jogo ${index + 1} e os seguintes`
                : label
            }
            aria-label={`Jogo ${index + 1}: ${label}`}
          >
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${circleClasses}`}
            >
              {outcome === 'player1-win' ? (
                '1'
              ) : outcome === 'player2-win' ? (
                '2'
              ) : outcome === 'draw' ? (
                <span className="h-2.5 w-2.5 rounded-full bg-white/90" />
              ) : (
                index + 1
              )}
            </span>
            <span className="w-full truncate text-[10px] font-semibold text-ink-soft">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

type MatchResultControlsProps = {
  match: TournamentMatch;
  player1: Player;
  player2: Player;
  matchFormat: MatchFormat;
  onSubmit: (result: SwissMatchResultInput) => void;
};

function MatchResultControls({
  match,
  player1,
  player2,
  matchFormat,
  onSubmit,
}: MatchResultControlsProps) {
  const [gameOutcomes, setGameOutcomes] = useState<TournamentGameOutcome[]>(
    match.result?.gameOutcomes ?? [],
  );
  const maximumGames = matchFormat === 'best-of-one' ? 1 : 3;
  const analysis = analisarResultadoDosJogos(matchFormat, gameOutcomes);
  const isComplete = analysis.status === 'win' || analysis.status === 'draw';

  function addOutcome(outcome: TournamentGameOutcome) {
    if (gameOutcomes.length >= maximumGames || isComplete) return;
    setGameOutcomes((current) => [...current, outcome]);
  }

  return (
    <div className="flex flex-col gap-3 border-t border-line pt-3">
      <GameOutcomeSlots
        gameOutcomes={gameOutcomes}
        maximumGames={maximumGames}
        player1Name={player1.name}
        player2Name={player2.name}
        onRemoveFrom={(index) => setGameOutcomes((current) => current.slice(0, index))}
      />

      <p className="text-center text-[10px] text-ink-soft">
        Clique em uma opção para preencher o próximo jogo. Clique em uma caixa preenchida
        para corrigir.
      </p>

      {match.result && (
        <p className="flex items-center gap-1.5 text-xs text-ink-soft">
          <RotateCcw size={13} />
          Resultado registrado. Confirmar novamente será tratado como correção.
        </p>
      )}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={isComplete}
          onClick={() => addOutcome('player1-win')}
          title={`Registrar vitória de ${player1.name} no próximo jogo`}
        >
          Vitória {player1.name}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isComplete}
          onClick={() => addOutcome('draw')}
          className="!border-slate-400 !bg-slate-200 !text-slate-700"
        >
          Empate
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={isComplete}
          onClick={() => addOutcome('player2-win')}
          className="!bg-ink !text-white"
          title={`Registrar vitória de ${player2.name} no próximo jogo`}
        >
          Vitória {player2.name}
        </Button>
      </div>

      <Button
        type="button"
        size="sm"
        disabled={!isComplete}
        onClick={() => onSubmit({ gameOutcomes })}
        className="self-stretch sm:self-end"
      >
        <Check size={14} />
        {match.result ? 'Confirmar correção' : 'Confirmar resultado'}
      </Button>
    </div>
  );
}

const ROUND_STATUS_LABELS = {
  paired: 'Aguardando início',
  active: 'Em andamento',
  'awaiting-results': 'Revisar resultados',
  completed: 'Rodada encerrada',
} as const;

export function SwissRoundPanel({
  round,
  matches,
  players,
  decks,
  assignments,
  matchFormat,
  onStartRound,
  onSubmitResult,
  onFinishRound,
}: SwissRoundPanelProps) {
  function resolvePlayer(playerId?: string) {
    return playerId ? players.find((player) => player.id === playerId) : undefined;
  }

  function resolveDeck(playerId?: string) {
    const assignment = assignments.find((item) => item.playerId === playerId);
    return decks.find((deck) => deck.id === assignment?.deckId);
  }

  const canEditResults = round.status === 'active' || round.status === 'awaiting-results';

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-display text-[10px] uppercase tracking-widest text-brand">
            <Swords size={14} />
            {ROUND_STATUS_LABELS[round.status]}
          </p>
          <h2 className="mt-2 font-display text-lg font-semibold uppercase tracking-wide text-ink-soft">
            Rodada {round.number}
          </h2>
        </div>

        {round.status === 'paired' && (
          <Button type="button" onClick={onStartRound}>
            <Play size={15} />
            Iniciar rodada
          </Button>
        )}

        {round.status === 'awaiting-results' && (
          <Button type="button" onClick={onFinishRound}>
            <Flag size={15} />
            Encerrar rodada
          </Button>
        )}

        {(round.status === 'active' || round.status === 'completed') && (
          <span className="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 text-xs font-semibold text-ink">
            {round.status === 'completed' ? (
              <CheckCircle2 size={14} />
            ) : (
              <Clock3 size={14} />
            )}
            {ROUND_STATUS_LABELS[round.status]}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {matches.map((match) => {
          const isBye = match.result?.kind === 'bye';
          const player1 = resolvePlayer(match.player1Id);
          const player2 = resolvePlayer(match.player2Id);
          const winnerId = match.result?.winnerId;

          return (
            <Card
              key={match.id}
              className={`light-card flex flex-col gap-3 !p-4 ${
                isBye ? '!border-champion !bg-champion-soft' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="font-display text-[10px] uppercase tracking-wide text-ink">
                  {isBye ? 'Bye' : `Mesa ${match.tableNumber}`}
                </span>
                <span
                  className={`text-xs font-semibold ${
                    match.result ? 'text-success' : 'text-warning'
                  }`}
                >
                  {match.status === 'corrected'
                    ? 'Corrigido'
                    : match.result
                      ? 'Confirmado'
                      : 'Pendente'}
                </span>
              </div>

              <PlayerRow
                player={player1}
                deck={resolveDeck(match.player1Id)}
                isWinner={winnerId === match.player1Id}
              />

              {isBye ? (
                <p className="text-xs text-ink-soft">
                  Vitória automática nesta rodada, sem adversário fictício.
                </p>
              ) : (
                <>
                  <div className="text-center font-display text-[9px] text-brand">VS</div>
                  <PlayerRow
                    player={player2}
                    deck={resolveDeck(match.player2Id)}
                    isWinner={winnerId === match.player2Id}
                  />

                  {match.result && !canEditResults && (
                    <GameOutcomeSlots
                      gameOutcomes={match.result.gameOutcomes}
                      maximumGames={matchFormat === 'best-of-one' ? 1 : 3}
                      player1Name={player1?.name ?? 'Jogador 1'}
                      player2Name={player2?.name ?? 'Jogador 2'}
                    />
                  )}

                  {canEditResults && player1 && player2 && (
                    <MatchResultControls
                      match={match}
                      player1={player1}
                      player2={player2}
                      matchFormat={matchFormat}
                      onSubmit={(result) => onSubmitResult(match.id, result)}
                    />
                  )}
                </>
              )}
            </Card>
          );
        })}
      </div>

      {round.status === 'active' && (
        <div className="rounded-xl border border-line bg-white/90 px-4 py-3 text-sm text-ink">
          Registre todas as mesas. Quando a última for confirmada, a rodada entrará em
          revisão automaticamente.
        </div>
      )}

      {round.status === 'awaiting-results' && (
        <div className="rounded-xl border border-warning/40 bg-warning-soft px-4 py-3 text-sm text-warning">
          Revise os resultados. Você ainda pode corrigir qualquer mesa antes de encerrar.
        </div>
      )}

      {round.status === 'completed' && (
        <div className="rounded-xl border border-success/30 bg-success-soft px-4 py-3 text-sm text-success">
          Rodada encerrada. A próxima etapa será calcular e exibir a classificação.
        </div>
      )}
    </section>
  );
}
