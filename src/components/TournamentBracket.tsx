import { MatchCard } from './MatchCard';
import type { Bracket, Deck, Match, Player, Round } from '@/types';

type TournamentBracketProps = {
  bracket: Bracket;
  players: Player[];
  decks: Deck[];
  assignments: { playerId: string; deckId: string }[];
  onSelectWinner: (matchId: string, playerId: string) => void;
  /** Falso assim que o campeonato é finalizado — não dá mais pra desfazer por aqui. */
  podeDesfazer: boolean;
  onUndoWinner: (matchId: string) => void;
};

export function TournamentBracket({
  bracket,
  players,
  decks,
  assignments,
  onSelectWinner,
  podeDesfazer,
  onUndoWinner,
}: TournamentBracketProps) {
  function resolvePlayer(playerId?: string): Player | undefined {
    return playerId ? players.find((p) => p.id === playerId) : undefined;
  }

  function resolveDeck(playerId?: string): Deck | undefined {
    if (!playerId) return undefined;
    const assignment = assignments.find((a) => a.playerId === playerId);
    return decks.find((d) => d.id === assignment?.deckId);
  }

  function renderMatch(match: Match, isFinal = false) {
    return (
      <MatchCard
        key={match.id}
        match={match}
        resolvePlayer={resolvePlayer}
        resolveDeck={resolveDeck}
        onSelectWinner={(playerId) => onSelectWinner(match.id, playerId)}
        podeDesfazer={podeDesfazer}
        onUndoWinner={() => onUndoWinner(match.id)}
        isFinal={isFinal}
      />
    );
  }

  function renderRound(round: Round) {
    return (
      <div key={round.index} className="flex flex-col gap-3">
        <h3 className="font-display text-[10px] uppercase tracking-wide text-ink-soft">
          {round.name}
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {round.matches.map((match) => renderMatch(match))}
        </div>
      </div>
    );
  }

  const rondaFinal = bracket.rounds.at(-1);
  const rondaSemifinal = bracket.rounds.length >= 2 ? bracket.rounds.at(-2) : undefined;
  const rondasAnteriores = bracket.rounds.slice(
    0,
    Math.max(bracket.rounds.length - 2, 0),
  );

  // Caso simples (ex: só 1 rodada, com 2 jogadores): sem o que convergir.
  if (!rondaSemifinal || !rondaFinal) {
    return (
      <div className="flex flex-col gap-6">
        {bracket.rounds.map((round) => (
          <div key={round.index} className="flex flex-col gap-3">
            <h3 className="font-display text-[10px] uppercase tracking-wide text-ink-soft">
              {round.name}
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {round.matches.map((match) => renderMatch(match, true))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const metade = Math.ceil(rondaSemifinal.matches.length / 2);
  const confrontosEsquerda = rondaSemifinal.matches.slice(0, metade);
  const confrontosDireita = rondaSemifinal.matches.slice(metade);

  return (
    <div className="flex flex-col gap-6">
      {rondasAnteriores.map(renderRound)}

      {/*
        Layout "confronto > final < confronto": as duas chaves da semifinal
        ficam nas laterais e a final fica no centro, para onde os
        vencedores convergem visualmente. Em telas pequenas, empilha na
        ordem semifinal 1 → final → semifinal 2.
      */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-4">
        <div className="flex flex-col gap-3">
          <h3 className="font-display text-[10px] uppercase tracking-wide text-ink-soft">
            {rondaSemifinal.name}
          </h3>
          {confrontosEsquerda.map((match) => renderMatch(match))}
        </div>

        <div className="flex flex-col gap-3 md:w-56">
          <h3 className="text-center font-display text-[10px] uppercase tracking-wide text-ink-soft">
            {rondaFinal.name}
          </h3>
          {rondaFinal.matches.map((match) => renderMatch(match, true))}
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="font-display text-[10px] uppercase tracking-wide text-ink-soft md:text-right">
            {rondaSemifinal.name}
          </h3>
          {confrontosDireita.map((match) => renderMatch(match))}
        </div>
      </div>
    </div>
  );
}
