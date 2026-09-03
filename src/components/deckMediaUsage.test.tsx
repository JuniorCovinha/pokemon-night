import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ChampionCard } from './ChampionCard';
import { DeckCard } from './DeckCard';
import type { Deck } from '@/types';

const deckComTodasAsMidias: Deck = {
  id: 'deck-media',
  nome: 'Pikachu',
  imagem: '/pikachu-artwork.png',
  miniatura: '/pikachu-thumbnail.png',
  imagemSprite: '/pikachu-sprite.png',
  imagemAnimada: '/pikachu-animated.gif',
};

describe('uso de mídia dos decks', () => {
  it('usa a sprite no card compacto de um deck escolhido', () => {
    const markup = renderToStaticMarkup(<DeckCard deck={deckComTodasAsMidias} compact />);

    expect(markup).toContain('src="/pikachu-sprite.png"');
    expect(markup).not.toContain('src="/pikachu-artwork.png"');
    expect(markup).not.toContain('src="/pikachu-animated.gif"');
  });

  it('usa artwork estática no deck sorteado', () => {
    const markup = renderToStaticMarkup(<DeckCard deck={deckComTodasAsMidias} />);

    expect(markup).toContain('src="/pikachu-artwork.png"');
    expect(markup).not.toContain('src="/pikachu-animated.gif"');
  });

  it('reserva a imagem animada para o card do campeão', () => {
    const markup = renderToStaticMarkup(
      <ChampionCard
        champion={{
          player: { id: 'player-1', name: 'Treinador' },
          deck: deckComTodasAsMidias,
        }}
      />,
    );

    expect(markup).toContain('src="/pikachu-animated.gif"');
  });
});
