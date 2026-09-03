import { useState, type MouseEvent } from 'react';
import { Check } from 'lucide-react';
import { getTypeColor } from '@/constants/pokemonTypes';
import { Card } from '@/components/ui';
import { ClickSpark } from './effects';
import { DeckPokemonImage } from './DeckPokemonImage';
import { hasDeckPokemonImage } from './deckMedia';
import type { Deck, Match, Player } from '@/types';

type MatchCardProps = {
  match: Match;
  resolvePlayer: (playerId?: string) => Player | undefined;
  resolveDeck: (playerId?: string) => Deck | undefined;
  onSelectWinner: (playerId: string) => void;
  /** Permite desfazer o vencedor clicando de novo no nome (indisponível após o campeonato terminar). */
  podeDesfazer: boolean;
  onUndoWinner: () => void;
  isFinal?: boolean;
};

export function MatchCard({
  match,
  resolvePlayer,
  resolveDeck,
  onSelectWinner,
  podeDesfazer,
  onUndoWinner,
  isFinal = false,
}: MatchCardProps) {
  const player1 = resolvePlayer(match.player1Id);
  const player2 = resolvePlayer(match.player2Id);
  const podeEscolherVencedor = Boolean(player1 && player2 && !match.winnerId);

  return (
    <Card className="light-card !p-3">
      <MatchSlot
        player={player1}
        deck={resolveDeck(match.player1Id)}
        isWinner={match.winnerId === match.player1Id}
        isSelectable={podeEscolherVencedor}
        isUndoable={podeDesfazer}
        sparkColor={isFinal ? '#ffcb05' : '#ee1c25'}
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
        sparkColor={isFinal ? '#ffcb05' : '#ee1c25'}
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
  sparkColor: string;
  onSelect: () => void;
  onUndo: () => void;
};

function MatchSlot({
  player,
  deck,
  isWinner,
  isSelectable,
  isUndoable,
  sparkColor,
  onSelect,
  onUndo,
}: MatchSlotProps) {
  const [sparkSequence, setSparkSequence] = useState(0);
  const [sparkOrigin, setSparkOrigin] = useState<{ x: number; y: number }>();

  if (!player) {
    return (
      <div className="flex items-center gap-2 rounded-lg px-2 py-2 font-sans text-sm text-ink/60">
        Aguardando...
      </div>
    );
  }

  const clicavel = isWinner ? isUndoable : isSelectable;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (isWinner) {
      onUndo();
      return;
    }

    if (!isSelectable) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const hasPointerCoordinates = event.clientX !== 0 || event.clientY !== 0;
    setSparkOrigin(
      hasPointerCoordinates
        ? { x: event.clientX - rect.left, y: event.clientY - rect.top }
        : { x: rect.width / 2, y: rect.height / 2 },
    );
    setSparkSequence((current) => current + 1);
    onSelect();
  }

  return (
    <ClickSpark
      trigger={sparkSequence}
      color={sparkColor}
      origin={sparkOrigin}
      className="rounded-lg"
    >
      <button
        onClick={handleClick}
        disabled={!clicavel}
        title={isWinner && isUndoable ? 'Clique para desfazer' : undefined}
        className={`
          flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left
          font-sans text-sm transition-all duration-[var(--duration-fast)] ease-[var(--ease-retro)]
          ${isWinner ? 'bg-brand-soft font-semibold text-brand' : 'text-ink'}
          ${clicavel ? 'cursor-pointer hover:-translate-y-0.5 hover:bg-black/5' : 'cursor-default'}
        `}
      >
        <span className="flex min-w-0 items-center gap-2.5">
          {hasDeckPokemonImage(deck) && deck ? (
            <DeckPokemonImage
              deck={deck}
              variant="sprite"
              loading="lazy"
              className="match-pokemon-thumbnail h-10 w-10 shrink-0 rounded-lg bg-surface-alt object-contain"
            />
          ) : deck ? (
            <span
              className="h-8 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: getTypeColor(deck.tipoPrincipal) }}
            />
          ) : null}
          <span className="min-w-0">
            <span className="block truncate">{player.name}</span>
            {deck && (
              <span className="mt-0.5 block truncate text-xs font-normal text-ink-soft">
                {deck.nome}
              </span>
            )}
          </span>
        </span>
        {isWinner && <Check size={14} className="shrink-0" />}
      </button>
    </ClickSpark>
  );
}
