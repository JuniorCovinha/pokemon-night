import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import {
  ClickSpark,
  GlareHover,
  PixelCardEffect,
  PixelReveal,
  StarBorder,
} from './effects';

describe('efeitos visuais inspirados no React Bits', () => {
  it('mantém o conteúdo real no DOM durante a revelação pixelada', () => {
    const markup = renderToStaticMarkup(
      <PixelReveal revealed>
        <p>Deck revelado</p>
      </PixelReveal>,
    );

    expect(markup).toContain('data-react-bits-effect="pixel-swap"');
    expect(markup).toContain('Deck revelado');
    expect(markup.match(/rb-pixel-reveal__pixel/g)).toHaveLength(48);
  });

  it('renderiza seis traços decorativos no disparo do Click Spark', () => {
    const markup = renderToStaticMarkup(
      <ClickSpark trigger={1} color="#ee1c25">
        <button>Vencedor</button>
      </ClickSpark>,
    );

    expect(markup).toContain('data-react-bits-effect="click-spark"');
    expect(markup.match(/rb-click-spark__ray/g)).toHaveLength(6);
    expect(markup).toContain('aria-hidden="true"');
  });

  it('identifica separadamente os efeitos de brilho, borda e card pixelado', () => {
    const markup = renderToStaticMarkup(
      <>
        <GlareHover>
          <img src="/pokemon.png" alt="Pokémon" />
        </GlareHover>
        <StarBorder>
          <p>Campeão</p>
        </StarBorder>
        <PixelCardEffect>
          <p>Modo</p>
        </PixelCardEffect>
      </>,
    );

    expect(markup).toContain('data-react-bits-effect="glare-hover"');
    expect(markup).toContain('data-react-bits-effect="star-border"');
    expect(markup).toContain('data-react-bits-effect="pixel-card"');
  });
});
