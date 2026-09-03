import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ChampionCard } from './ChampionCard';
import type { Champion } from '@/types';

function criarCampeao(tipoPrincipal?: string): Champion {
  return {
    player: { id: 'player-1', name: 'Treinador' },
    deck: {
      id: 'deck-1',
      nome: 'Pokémon principal',
      tipoPrincipal,
    },
  };
}

describe('borda do card do campeão', () => {
  it('usa a cor central da tipagem principal', () => {
    const markup = renderToStaticMarkup(<ChampionCard champion={criarCampeao('Fogo')} />);

    expect(markup).toContain('--star-border-color:#F08030');
  });

  it.each([undefined, 'Tipo desconhecido'])(
    'mantém o dourado como fallback para a tipagem %s',
    (tipoPrincipal) => {
      const markup = renderToStaticMarkup(
        <ChampionCard champion={criarCampeao(tipoPrincipal)} />,
      );

      expect(markup).toContain('--star-border-color:#ffcb05');
    },
  );
});
