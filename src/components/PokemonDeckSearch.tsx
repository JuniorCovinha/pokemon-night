import { useEffect, useState } from 'react';
import { Check, ImageOff, LoaderCircle, Plus, Search, WifiOff } from 'lucide-react';
import {
  buscarCartas,
  criarDeckDaCartaTcgDex,
  obterCartaDoCatalogo,
  obterImagemTcgDex,
  type CardCatalogItem,
  type CardCatalogSource,
} from '@/services';
import { Card, Input } from '@/components/ui';
import type { Deck } from '@/types';

type PokemonDeckSearchProps = {
  onSelect: (deck: Deck) => void;
  excludedDeckNames?: string[];
  selectionDisabled?: boolean;
};

function normalizedName(name: string): string {
  return name.trim().toLocaleLowerCase('pt-BR');
}

export function PokemonDeckSearch({
  onSelect,
  excludedDeckNames = [],
  selectionDisabled = false,
}: PokemonDeckSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CardCatalogItem[]>([]);
  const [catalogSource, setCatalogSource] = useState<CardCatalogSource>();
  const [isSearching, setIsSearching] = useState(false);
  const [addingCardId, setAddingCardId] = useState<string>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;

    const controller = new AbortController();
    let active = true;

    const timer = window.setTimeout(async () => {
      try {
        const searchResult = await buscarCartas(term, controller.signal);
        if (active) {
          setResults(searchResult.cards);
          setCatalogSource(searchResult.source);
        }
      } catch (err) {
        if (active && !(err instanceof DOMException && err.name === 'AbortError')) {
          setResults([]);
          setCatalogSource(undefined);
          setError(
            err instanceof Error
              ? err.message
              : 'Não foi possível consultar os Pokémon agora.',
          );
        }
      } finally {
        if (active) setIsSearching(false);
      }
    }, 350);

    return () => {
      active = false;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  function updateSearch(newTerm: string) {
    setQuery(newTerm);
    setResults([]);
    setCatalogSource(undefined);
    setError(null);
    setIsSearching(newTerm.trim().length >= 2);
  }

  async function selectCard(card: CardCatalogItem) {
    const alreadySelected = excludedDeckNames.some(
      (name) => normalizedName(name) === normalizedName(card.name),
    );
    if (alreadySelected || selectionDisabled) return;

    setAddingCardId(card.id);
    setError(null);

    try {
      const cardDetail = await obterCartaDoCatalogo(card);
      onSelect(criarDeckDaCartaTcgDex(cardDetail));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Não foi possível adicionar este Pokémon.',
      );
    } finally {
      setAddingCardId(undefined);
    }
  }

  return (
    <Card className="light-card !p-4">
      <Input
        label="Buscar Pokémon"
        value={query}
        onChange={(event) => updateSearch(event.target.value)}
        placeholder="Ex.: Sharpedo, Lucario..."
        autoComplete="off"
      />

      {(catalogSource === 'pokeapi' || catalogSource === 'local') && (
        <div
          role="status"
          className="mt-3 flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning"
        >
          <WifiOff size={16} className="mt-0.5 shrink-0" />
          <span>
            {catalogSource === 'pokeapi'
              ? 'TCGdex indisponível. Exibindo os Pokémon encontrados na PokéAPI.'
              : 'TCGdex e PokéAPI indisponíveis. Exibindo o catálogo local de contingência.'}
          </span>
        </div>
      )}

      <div className="mt-3 min-h-20">
        {query.trim().length < 2 ? (
          <div className="flex items-center justify-center gap-2 py-5 text-sm text-ink-soft">
            <Search size={16} />
            Digite ao menos duas letras para buscar.
          </div>
        ) : isSearching ? (
          <div className="flex items-center justify-center gap-2 py-5 text-sm text-ink-soft">
            <LoaderCircle size={16} className="animate-spin" />
            Buscando Pokémon...
          </div>
        ) : results.length === 0 && !error ? (
          <p className="py-5 text-center text-sm text-ink-soft">
            Nenhum Pokémon encontrado para “{query.trim()}”.
          </p>
        ) : (
          <div className="grid max-h-96 grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-4">
            {results.map((card) => {
              const selected = excludedDeckNames.some(
                (name) => normalizedName(name) === normalizedName(card.name),
              );
              const adding = addingCardId === card.id;

              return (
                <button
                  key={card.id}
                  type="button"
                  onClick={() => selectCard(card)}
                  disabled={selected || Boolean(addingCardId) || selectionDisabled}
                  className={`group overflow-hidden rounded-xl border text-left transition-all ${
                    selected
                      ? 'border-success bg-success-soft'
                      : 'border-line bg-surface hover:-translate-y-0.5 hover:border-ink'
                  } disabled:cursor-default disabled:opacity-70`}
                >
                  <PokemonImage card={card} />
                  <span className="flex items-center justify-between gap-1 p-2.5">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-ink">
                        {card.name}
                      </span>
                      <span className="block truncate text-xs text-ink-soft">
                        {getCardSourceLabel(card)}
                      </span>
                    </span>
                    {adding ? (
                      <LoaderCircle size={15} className="shrink-0 animate-spin" />
                    ) : selected ? (
                      <Check size={15} className="shrink-0 text-success" />
                    ) : (
                      <Plus
                        size={15}
                        className="shrink-0 text-ink-soft group-hover:text-ink"
                      />
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}
    </Card>
  );
}

function PokemonImage({ card }: { card: CardCatalogItem }) {
  const [failed, setFailed] = useState(false);
  const image = obterImagemTcgDex(card.image, 'low');

  if (!image || failed) {
    return (
      <span className="flex aspect-[245/337] items-center justify-center bg-surface-alt text-ink-soft">
        <ImageOff size={22} />
      </span>
    );
  }

  return (
    <img
      src={image}
      alt={`Imagem de ${card.name}`}
      loading="lazy"
      onError={() => setFailed(true)}
      className="aspect-[245/337] w-full bg-surface-alt object-contain"
    />
  );
}

function getCardSourceLabel(card: CardCatalogItem): string {
  if (card.source === 'tcgdex') return card.id;
  if (card.source === 'pokeapi') return `PokéAPI #${card.localId}`;
  return 'Catálogo local';
}
