import { X } from 'lucide-react';
import { DeckCard } from './DeckCard';
import { PokemonDeckSearch } from './PokemonDeckSearch';
import type { Deck } from '@/types';

type DeckSelectionProps = {
  selectedDecks: Deck[];
  requiredDeckCount: number;
  maximumDeckCount: number;
  onChange: (decks: Deck[]) => void;
};

export function DeckSelection({
  selectedDecks,
  requiredDeckCount,
  maximumDeckCount,
  onChange,
}: DeckSelectionProps) {
  function removeDeck(deckId: string) {
    onChange(selectedDecks.filter((deck) => deck.id !== deckId));
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-soft">
            Escolher decks
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Selecione entre {requiredDeckCount} e {maximumDeckCount} decks para o sorteio.
          </p>
        </div>

        <span className="shrink-0 font-display text-xs font-semibold text-ink-soft">
          {selectedDecks.length}/{maximumDeckCount}
        </span>
      </div>

      {selectedDecks.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {selectedDecks.map((deck) => (
            <div key={deck.id} className="relative">
              <DeckCard deck={deck} compact />
              <button
                type="button"
                onClick={() => removeDeck(deck.id)}
                aria-label={`Remover ${deck.nome}`}
                title="Remover deck"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-line bg-white/90 p-1.5 text-ink shadow-sm transition-colors hover:bg-danger-soft hover:text-danger"
              >
                <X size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      <PokemonDeckSearch
        excludedDeckNames={selectedDecks.map((deck) => deck.nome)}
        selectionDisabled={selectedDecks.length >= maximumDeckCount}
        onSelect={(deck) => onChange([...selectedDecks, deck])}
      />
    </section>
  );
}
