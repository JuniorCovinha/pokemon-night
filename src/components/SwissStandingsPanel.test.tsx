import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SwissStandingsPanel } from './SwissStandingsPanel';
import type { Standing, SwissRoundStatus } from '@/types';

const standing: Standing = {
  playerId: 'p1',
  position: 1,
  tied: true,
  played: 1,
  wins: 1,
  losses: 0,
  draws: 0,
  byes: 1,
  points: 3,
  opponentWinRate: null,
  opponentsOpponentWinRate: null,
};

function render(status: SwissRoundStatus, row = standing) {
  return renderToStaticMarkup(
    <SwissStandingsPanel
      standings={[row]}
      players={[{ id: 'p1', name: 'Treinador' }]}
      decks={[
        {
          id: 'd1',
          nome: 'Xerneas EX',
          imagem: '/artwork.png',
          imagemSprite: '/sprite.png',
          imagemAnimada: '/animated.gif',
        },
      ]}
      assignments={[{ playerId: 'p1', deckId: 'd1' }]}
      round={{ number: 1, status, matchIds: [], revision: 1 }}
    />,
  );
}

describe('tabela Suíça', () => {
  it('explica a classificação parcial e empates sem transformar bye em adversário', () => {
    const html = render('active');
    expect(html).toContain('Parcial da rodada 1');
    expect(html).toContain('Mesas pendentes');
    expect(html).toContain('aria-label="empatado"');
    expect(html).toContain('—');
    expect(html).toContain('src="/sprite.png"');
    expect(html).not.toContain('/animated.gif');
    expect(html).toContain('scope="col"');
    expect(html).toContain('rolagem horizontal');
    expect(html.match(/font-numeric/g)).toHaveLength(6);
  });

  it('mostra percentuais localizados ao encerrar sem declarar campeão ou Top Cut', () => {
    const html = render('completed', {
      ...standing,
      tied: false,
      opponentWinRate: 0.375,
      opponentsOpponentWinRate: 0.625,
    });
    expect(html).toContain('Após a rodada 1');
    expect(html).toContain('37,50%');
    expect(html).toContain('62,50%');
    expect(html).not.toContain('aria-label="empatado"');
    expect(html).not.toContain('Campeão da noite');
    expect(html).toContain('não define uma vaga no Top 4');
  });
});
