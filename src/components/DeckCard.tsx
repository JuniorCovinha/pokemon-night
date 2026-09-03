import { getTypeColor } from '@/constants/pokemonTypes';
import { Card, Badge } from '@/components/ui';
import { GlareHover, PixelReveal } from './effects';
import { DeckPokemonImage } from './DeckPokemonImage';
import { hasDeckPokemonImage } from './deckMedia';
import type { Deck } from '@/types';

type DeckCardProps = {
  deck: Deck;
  /** Exibe miniatura, nome e tipo em uma linha, usado em listas de seleção. */
  compact?: boolean;
  /** Ativa a animação de entrada, usada no momento do sorteio. */
  revealed?: boolean;
};

const DIFFICULTY_VARIANT: Record<
  NonNullable<Deck['dificuldade']>,
  'success' | 'warning' | 'danger'
> = {
  Fácil: 'success',
  Média: 'warning',
  Difícil: 'danger',
};

export function DeckCard({ deck, compact = false, revealed = true }: DeckCardProps) {
  const corDoTipo = getTypeColor(deck.tipoPrincipal);

  if (compact) {
    return (
      <Card className="light-card flex min-h-16 items-center gap-3 !p-3 !pr-12">
        {hasDeckPokemonImage(deck) ? (
          <DeckPokemonImage
            deck={deck}
            variant="sprite"
            loading="lazy"
            className="h-10 w-10 shrink-0 rounded-lg bg-surface-alt object-contain"
          />
        ) : (
          <span
            className="h-9 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: corDoTipo }}
          />
        )}

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-sans text-sm font-semibold text-ink">
            {deck.nome}
          </h3>
          {deck.tipoPrincipal && (
            <p className="mt-0.5 truncate font-sans text-xs font-semibold">
              <span style={{ color: corDoTipo }}>{deck.tipoPrincipal}</span>
            </p>
          )}
        </div>
      </Card>
    );
  }

  return (
    <PixelReveal revealed={revealed}>
      <Card>
        {hasDeckPokemonImage(deck) && (
          <GlareHover className="mb-4 aspect-[245/337] rounded-xl bg-surface-alt">
            <DeckPokemonImage
              deck={deck}
              variant="artwork"
              loading="lazy"
              className="h-full w-full rounded-xl object-contain"
            />
          </GlareHover>
        )}

        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="break-words font-display text-xs leading-relaxed text-ink">
              {deck.nome}
            </h3>
            {deck.tipoPrincipal && (
              <p className="mt-1.5 flex items-center gap-1 font-sans text-xs text-ink-soft">
                <span style={{ color: corDoTipo }} className="font-semibold">
                  {deck.tipoPrincipal}
                </span>
              </p>
            )}
          </div>

          {deck.tipoPrincipal && (
            <span
              className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: corDoTipo }}
              title={deck.tipoPrincipal}
            />
          )}
        </div>

        {deck.dificuldade && (
          <Badge variant={DIFFICULTY_VARIANT[deck.dificuldade]} className="mt-3">
            {deck.dificuldade}
          </Badge>
        )}
      </Card>
    </PixelReveal>
  );
}
