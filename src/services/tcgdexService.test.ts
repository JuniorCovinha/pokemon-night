import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buscarCartas,
  criarDeckDaCartaTcgDex,
  normalizarTipoTcgDex,
  obterCartaDoCatalogo,
  obterImagemTcgDex,
  type TcgDexCard,
} from './tcgdexService';

const sharpedo: TcgDexCard = {
  id: 'sample-42',
  localId: '42',
  name: 'Sharpedo ex',
  category: 'Pokemon',
  types: ['Water'],
  image: 'https://assets.tcgdex.net/pt-br/sample/42',
};

describe('integração com a TCGdex', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('normaliza tipos em inglês para o vocabulário do app', () => {
    expect(normalizarTipoTcgDex('Water')).toBe('Água');
    expect(normalizarTipoTcgDex('Darkness')).toBe('Sombrio');
    expect(normalizarTipoTcgDex('Metal')).toBe('Metálico');
    expect(normalizarTipoTcgDex('Steel')).toBe('Metálico');
    expect(normalizarTipoTcgDex('Ground')).toBe('Lutador');
    expect(normalizarTipoTcgDex('Normal')).toBe('Incolor');
  });

  it('preserva tipos já localizados em português', () => {
    expect(normalizarTipoTcgDex('Fogo')).toBe('Fogo');
    expect(normalizarTipoTcgDex('Psíquico')).toBe('Psíquico');
  });

  it('monta as URLs de imagem recomendadas pela TCGdex', () => {
    expect(obterImagemTcgDex(sharpedo.image, 'low')).toBe(
      'https://assets.tcgdex.net/pt-br/sample/42/low.webp',
    );
    expect(obterImagemTcgDex(sharpedo.image, 'high')).toBe(
      'https://assets.tcgdex.net/pt-br/sample/42/high.webp',
    );
  });

  it('converte a carta principal em um deck sem arquétipo', () => {
    const deck = criarDeckDaCartaTcgDex(sharpedo);

    expect(deck).toMatchObject({
      id: 'deck-tcgdex-sample-42',
      tcgdexCardId: 'sample-42',
      nome: 'Sharpedo ex',
      tipoPrincipal: 'Água',
    });
    expect(deck).not.toHaveProperty('arquetipo');
  });

  it('rejeita cartas sem tipagem', () => {
    expect(() => criarDeckDaCartaTcgDex({ ...sharpedo, types: undefined })).toThrow(
      /não possui tipagem/,
    );
  });

  it('usa os resultados da TCGdex quando a API responde', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve([sharpedo]),
      }),
    );

    const result = await buscarCartas('Sharpedo');

    expect(result.source).toBe('tcgdex');
    expect(result.cards).toEqual([
      expect.objectContaining({ id: sharpedo.id, source: 'tcgdex' }),
    ]);
  });

  it('usa a PokéAPI quando a TCGdex está indisponível', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              results: [
                { name: 'pikachu', url: 'https://pokeapi.co/api/v2/pokemon/25/' },
                { name: 'lucario', url: 'https://pokeapi.co/api/v2/pokemon/448/' },
                {
                  name: 'lucario-mega',
                  url: 'https://pokeapi.co/api/v2/pokemon/10059/',
                },
              ],
            }),
        }),
    );

    const result = await buscarCartas('lucario');

    expect(result.source).toBe('pokeapi');
    expect(result.cards).toEqual([
      expect.objectContaining({
        id: 'pokeapi-448',
        name: 'Lucario',
        source: 'pokeapi',
      }),
      expect.objectContaining({
        id: 'pokeapi-10059',
        name: 'Lucario Mega',
        source: 'pokeapi',
      }),
    ]);
  });

  it('carrega detalhes da PokéAPI e cria um deck com a origem correta', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              results: [
                { name: 'lucario', url: 'https://pokeapi.co/api/v2/pokemon/448/' },
              ],
            }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              id: 448,
              name: 'lucario',
              types: [
                { slot: 2, type: { name: 'steel' } },
                { slot: 1, type: { name: 'fighting' } },
              ],
              sprites: {
                front_default: 'https://example.com/lucario-sprite.png',
                other: {
                  'official-artwork': {
                    front_default: 'https://example.com/lucario.png',
                  },
                },
              },
            }),
        }),
    );
    const search = await buscarCartas('lucario');

    const card = await obterCartaDoCatalogo(search.cards[0]);
    const deck = criarDeckDaCartaTcgDex(card);

    expect(card.types).toEqual(['fighting', 'steel']);
    expect(deck).toMatchObject({
      id: 'deck-pokeapi-448',
      pokeApiPokemonId: '448',
      nome: 'Lucario',
      tipoPrincipal: 'Lutador',
      imagem: 'https://example.com/lucario.png',
    });
    expect(deck).not.toHaveProperty('tcgdexCardId');
  });

  it('usa o catálogo local quando a TCGdex e a PokéAPI estão indisponíveis', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    const result = await buscarCartas('sharpedo');

    expect(result.source).toBe('local');
    expect(result.cards[0]).toEqual(
      expect.objectContaining({
        id: 'local-sharpedo-ex',
        name: 'Sharpedo ex',
        source: 'local',
      }),
    );
    expect(result.cards.length).toBeGreaterThanOrEqual(4);
  });

  it('obtém a tipagem do catálogo local sem uma segunda chamada de rede', async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetchMock);
    const search = await buscarCartas('lucario');

    const card = await obterCartaDoCatalogo(search.cards[0]);

    expect(card.types).toEqual(['Fighting']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('não ativa o fallback quando a busca foi cancelada', async () => {
    const controller = new AbortController();
    controller.abort();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new DOMException('Busca cancelada', 'AbortError')),
    );

    await expect(buscarCartas('sharpedo', controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
  });
});
