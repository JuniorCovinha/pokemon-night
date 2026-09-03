import { DeckCard } from './DeckCard';
import type { Deck } from '@/types';

type DeckGridProps = {
  decks: Deck[];
  revealed?: boolean;
};

export function DeckGrid({ decks, revealed = true }: DeckGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {decks.map((deck) => (
        <DeckCard key={deck.id} deck={deck} revealed={revealed} />
      ))}
    </div>
  );
}
