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
      expect.objectContaining({
        id: sharpedo.id,
        source: 'tcgdex',
        tcgdexLocale: 'pt-br',
      }),
    ]);
  });

  it('busca Dragapult em inglês quando o catálogo pt-br está vazio e usa o mesmo idioma nos detalhes', async () => {
    const dragapult = {
      id: 'sv08-130',
      localId: '130',
      name: 'Dragapult ex',
      image: 'https://assets.tcgdex.net/en/sv/sv08/130',
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([dragapult]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            ...dragapult,
            category: 'Pokemon',
            dexId: [887],
            types: ['Dragon'],
          }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const search = await buscarCartas('Dragapult');

    expect(search).toMatchObject({
      source: 'tcgdex',
      cards: [
        expect.objectContaining({
          id: dragapult.id,
          source: 'tcgdex',
          tcgdexLocale: 'en',
        }),
      ],
    });
    expect(String(fetchMock.mock.calls[0][0])).toContain('/v2/pt-br/cards?');
    expect(String(fetchMock.mock.calls[1][0])).toContain('/v2/en/cards?');

    const detail = await obterCartaDoCatalogo(search.cards[0]);

    expect(detail.types).toEqual(['Dragon']);
    expect(detail.tcgdexLocale).toBe('en');
    expect(String(fetchMock.mock.calls[2][0])).toContain('/v2/en/cards/sv08-130');
  });

  it('usa a PokéAPI quando os catálogos pt-br e en retornam vazios', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve([]),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            results: [
              {
                name: 'dragapult',
                url: 'https://pokeapi.co/api/v2/pokemon/887/',
              },
            ],
          }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const result = await buscarCartas('Dragapult');

    expect(result.source).toBe('pokeapi');
    expect(result.cards).toEqual([
      expect.objectContaining({
        id: 'pokeapi-887',
        name: 'Dragapult',
        source: 'pokeapi',
      }),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('adiciona o GIF da PokéAPI ao carregar uma carta com dexId', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ ...sharpedo, dexId: [319] }),
      }),
    );

    const card = await obterCartaDoCatalogo({
      ...sharpedo,
      source: 'tcgdex',
      tcgdexLocale: 'pt-br',
    });
    const deck = criarDeckDaCartaTcgDex(card);

    expect(deck.imagemAnimada).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown/319.gif',
    );
    expect(deck.imagemSprite).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/319.png',
    );
  });

  it('usa a PokéAPI quando a TCGdex está indisponível', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
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

  it('mantém o cache de falha quando os dois catálogos da TCGdex estão indisponíveis', async () => {
    const storedValues = new Map<string, string>();
    vi.stubGlobal('sessionStorage', {
      getItem: vi.fn((key: string) => storedValues.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => storedValues.set(key, value)),
      removeItem: vi.fn((key: string) => storedValues.delete(key)),
    });
    const pokeApiResponse = {
      ok: true,
      json: () =>
        Promise.resolve({
          results: [{ name: 'lucario', url: 'https://pokeapi.co/api/v2/pokemon/448/' }],
        }),
    };
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(pokeApiResponse)
      .mockResolvedValueOnce(pokeApiResponse);
    vi.stubGlobal('fetch', fetchMock);

    await buscarCartas('lucario');
    await buscarCartas('lucario');

    expect(storedValues.has('pokemon-night:tcgdex-retry-after')).toBe(true);
    expect(String(fetchMock.mock.calls[0][0])).toContain('/v2/pt-br/cards?');
    expect(String(fetchMock.mock.calls[1][0])).toContain('/v2/en/cards?');
    expect(String(fetchMock.mock.calls[2][0])).toContain('/api/v2/pokemon?');
    expect(String(fetchMock.mock.calls[3][0])).toContain('/api/v2/pokemon?');
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  it('carrega detalhes da PokéAPI e cria um deck com a origem correta', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValueOnce(new TypeError('Failed to fetch'))
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
                  showdown: {
                    front_default: 'https://example.com/lucario.gif',
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
      imagemSprite: 'https://example.com/lucario-sprite.png',
      imagemAnimada: 'https://example.com/lucario.gif',
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
    expect(fetchMock).toHaveBeenCalledTimes(3);
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
