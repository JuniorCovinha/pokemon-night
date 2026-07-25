import { getTypeColor } from '@/constants/pokemonTypes';
import { Card, Badge } from '@/components/ui';
import type { Deck } from '@/types';

type DeckCardProps = {
  deck: Deck;
  /** Ativa a animação de entrada, usada no momento do sorteio. */
  revealed?: boolean;
  /** Ativa o "efeito de captura" (flash + squeeze) no instante do sorteio. */
  justCaptured?: boolean;
};

const DIFFICULTY_VARIANT: Record<NonNullable<Deck['dificuldade']>, 'success' | 'warning' | 'danger'> = {
  Fácil: 'success',
  Média: 'warning',
  Difícil: 'danger',
};

export function DeckCard({ deck, revealed = true, justCaptured = false }: DeckCardProps) {
  const corDoTipo = getTypeColor(deck.tipoPrincipal);

  return (
    <Card
      className={`
        transition-opacity duration-[var(--duration-slow)]
        ${revealed ? 'animate-slide-in-card opacity-100' : 'opacity-0'}
        ${justCaptured ? 'animate-capture' : ''}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="break-words font-display text-xs leading-relaxed text-ink">
            {deck.nome}
          </h3>
          {(deck.arquetipo || deck.tipoPrincipal) && (
            <p className="mt-1.5 flex items-center gap-1 font-sans text-xs text-ink-soft">
              {deck.arquetipo && <span>{deck.arquetipo}</span>}
              {deck.arquetipo && deck.tipoPrincipal && <span>·</span>}
              {deck.tipoPrincipal && (
                <span style={{ color: corDoTipo }} className="font-semibold">
                  {deck.tipoPrincipal}
                </span>
              )}
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
  );
}
