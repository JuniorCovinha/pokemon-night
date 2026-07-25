import { Check } from 'lucide-react';
import { getTypeColor } from '@/constants/pokemonTypes';
import { Card } from '@/components/ui';
import type { Deck, Match, Player } from '@/types';

type MatchCardProps = {
  match: Match;
  resolvePlayer: (playerId?: string) => Player | undefined;
  resolveDeck: (playerId?: string) => Deck | undefined;
  onSelectWinner: (playerId: string) => void;
  /** Permite desfazer o vencedor clicando de novo no nome (indisponível após o campeonato terminar). */
  podeDesfazer: boolean;
  onUndoWinner: () => void;
};

export function MatchCard({
  match,
  resolvePlayer,
  resolveDeck,
  onSelectWinner,
  podeDesfazer,
  onUndoWinner,
}: MatchCardProps) {
  const player1 = resolvePlayer(match.player1Id);
  const player2 = resolvePlayer(match.player2Id);
  const podeEscolherVencedor = Boolean(player1 && player2 && !match.winnerId);

  return (
    <Card className="!p-3">
      <MatchSlot
        player={player1}
        deck={resolveDeck(match.player1Id)}
        isWinner={match.winnerId === match.player1Id}
        isSelectable={podeEscolherVencedor}
        isUndoable={podeDesfazer}
        onSelect={() => player1 && onSelectWinner(player1.id)}
        onUndo={onUndoWinner}
      />
      <div className="my-1.5 border-t-2 border-dashed border-line" />
      <MatchSlot
        player={player2}
        deck={resolveDeck(match.player2Id)}
        isWinner={match.winnerId === match.player2Id}
        isSelectable={podeEscolherVencedor}
        isUndoable={podeDesfazer}
        onSelect={() => player2 && onSelectWinner(player2.id)}
        onUndo={onUndoWinner}
      />
    </Card>
  );
}

type MatchSlotProps = {
  player?: Player;
  deck?: Deck;
  isWinner: boolean;
  isSelectable: boolean;
  isUndoable: boolean;
  onSelect: () => void;
  onUndo: () => void;
};

function MatchSlot({
  player,
  deck,
  isWinner,
  isSelectable,
  isUndoable,
  onSelect,
  onUndo,
}: MatchSlotProps) {
  if (!player) {
    return (
      <div className="flex items-center gap-2 rounded-lg px-2 py-2 font-sans text-sm text-ink-soft/60">
        Aguardando...
      </div>
    );
  }

  const clicavel = isWinner ? isUndoable : isSelectable;

  return (
    <button
      onClick={isWinner ? onUndo : onSelect}
      disabled={!clicavel}
      title={isWinner && isUndoable ? 'Clique para desfazer' : undefined}
      className={`
        flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left
        font-sans text-sm transition-all duration-[var(--duration-fast)] ease-[var(--ease-retro)]
        ${isWinner ? 'bg-brand-soft font-semibold text-brand' : 'text-ink'}
        ${clicavel ? 'cursor-pointer hover:-translate-y-0.5 hover:bg-black/5' : 'cursor-default'}
      `}
    >
      <span className="flex min-w-0 items-center gap-2">
        {deck && (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: getTypeColor(deck.tipoPrincipal) }}
          />
        )}
        <span className="truncate">{player.name}</span>
      </span>
      {isWinner && <Check size={14} className="shrink-0" />}
    </button>
  );
}
