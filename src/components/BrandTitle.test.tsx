import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BrandTitle } from './BrandTitle';

describe('BrandTitle', () => {
  it('centraliza a marca e preserva o elemento semântico escolhido', () => {
    const headingMarkup = renderToStaticMarkup(<BrandTitle className="text-2xl" />);
    const labelMarkup = renderToStaticMarkup(<BrandTitle as="p" />);

    expect(headingMarkup).toContain('<h1');
    expect(headingMarkup).toContain('pokemon-night-brand');
    expect(headingMarkup).toContain('Pokémon Night');
    expect(labelMarkup).toContain('<p');
  });
});
