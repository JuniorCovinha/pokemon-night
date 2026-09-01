import type { Deck } from '@/types';
import { localDeckCatalog, type LocalDeckCatalogCard } from '@/data/decks';

const TCGDEX_API_URL = 'https://api.tcgdex.net/v2/pt-br';
const POKEAPI_API_URL = 'https://pokeapi.co/api/v2';
const POKEAPI_LIST_CACHE_KEY = 'pokemon-night:pokeapi-list:v1';
const POKEAPI_LIST_CACHE_MAX_AGE = 24 * 60 * 60 * 1000;
const TCGDEX_RETRY_CACHE_KEY = 'pokemon-night:tcgdex-retry-after';
const TCGDEX_RETRY_DELAY = 5 * 60 * 1000;
const POKEAPI_ARTWORK_URL =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';
const POKEAPI_SPRITE_URL =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const POKEAPI_SHOWDOWN_URL =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/showdown';
const SEARCH_PAGE_SIZE = 16;

export type TcgDexCardSummary = {
  id: string;
  localId: string;
  name: string;
  image?: string;
};

export type TcgDexCard = TcgDexCardSummary & {
  category: string;
  dexId?: number[];
  types?: string[];
  spriteImage?: string;
  animatedImage?: string;
  source?: CardCatalogSource;
  set?: {
    id: string;
    name: string;
  };
};

export type CardCatalogSource = 'tcgdex' | 'pokeapi' | 'local';

export type CardCatalogItem = TcgDexCardSummary & {
  source: CardCatalogSource;
};

export type CardCatalogSearchResult = {
  cards: CardCatalogItem[];
  source: CardCatalogSource;
};

type PokeApiNamedResource = {
  name: string;
  url: string;
};

type PokeApiListResponse = {
  results: PokeApiNamedResource[];
};

type PokeApiPokemon = {
  id: number;
  name: string;
  types: Array<{
    slot: number;
    type: { name: string };
  }>;
  sprites: {
    front_default?: string | null;
    other?: {
      'official-artwork'?: {
        front_default?: string | null;
      };
      showdown?: {
        front_default?: string | null;
      };
    };
  };
};

type PokeApiListCache = {
  savedAt: number;
  results: PokeApiNamedResource[];
};

function isCardSummary(value: unknown): value is TcgDexCardSummary {
  if (!value || typeof value !== 'object') return false;
  const card = value as Record<string, unknown>;

  return (
    typeof card.id === 'string' &&
    (typeof card.localId === 'string' || typeof card.localId === 'number') &&
    typeof card.name === 'string'
  );
}

function isPokeApiNamedResource(value: unknown): value is PokeApiNamedResource {
  if (!value || typeof value !== 'object') return false;
  const resource = value as Record<string, unknown>;
  return typeof resource.name === 'string' && typeof resource.url === 'string';
}

function isPokeApiListResponse(value: unknown): value is PokeApiListResponse {
  if (!value || typeof value !== 'object') return false;
  const response = value as Record<string, unknown>;
  return (
    Array.isArray(response.results) && response.results.every(isPokeApiNamedResource)
  );
}

function isPokeApiPokemon(value: unknown): value is PokeApiPokemon {
  if (!value || typeof value !== 'object') return false;
  const pokemon = value as Record<string, unknown>;
  return (
    typeof pokemon.id === 'number' &&
    typeof pokemon.name === 'string' &&
    Array.isArray(pokemon.types) &&
    pokemon.sprites !== null &&
    typeof pokemon.sprites === 'object'
  );
}

async function getJson(url: URL, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!response.ok) {
    throw new Error(`A TCGdex respondeu com o status ${response.status}.`);
  }

  return response.json();
}

async function getPokeApiJson(url: URL, signal?: AbortSignal): Promise<unknown> {
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  });

  if (!response.ok) {
    throw new Error(`A PokéAPI respondeu com o status ${response.status}.`);
  }

  return response.json();
}

/** Busca apenas cartas Pokémon em português brasileiro. */
export async function buscarCartasTcgDex(
  termo: string,
  signal?: AbortSignal,
): Promise<TcgDexCardSummary[]> {
  const termoTratado = termo.trim();
  if (termoTratado.length < 2) return [];

  const url = new URL(`${TCGDEX_API_URL}/cards`);
  url.searchParams.set('name', termoTratado);
  url.searchParams.set('category', 'Pokemon');
  url.searchParams.set('pagination:page', '1');
  url.searchParams.set('pagination:itemsPerPage', String(SEARCH_PAGE_SIZE));

  const data = await getJson(url, signal);
  if (!Array.isArray(data)) {
    throw new Error('A TCGdex retornou uma resposta inesperada.');
  }

  return data.filter(isCardSummary).map((card) => ({
    ...card,
    localId: String(card.localId),
  }));
}

function normalizarBusca(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

function formatarNomePokemon(slug: string): string {
  return slug
    .split('-')
    .map((part) => part.charAt(0).toLocaleUpperCase('pt-BR') + part.slice(1))
    .join(' ');
}

function obterIdPokeApi(resourceUrl: string): string | undefined {
  const match = resourceUrl.match(/\/pokemon\/(\d+)\/?$/);
  return match?.[1];
}

function obterImagemOficialPokeApi(pokemonId: string | number): string {
  return `${POKEAPI_ARTWORK_URL}/${pokemonId}.png`;
}

function obterSpritePokeApi(pokemonId: string | number): string {
  return `${POKEAPI_SPRITE_URL}/${pokemonId}.png`;
}

function obterImagemAnimadaPokeApi(pokemonId: string | number): string {
  return `${POKEAPI_SHOWDOWN_URL}/${pokemonId}.gif`;
}

function lerCacheDaListaPokeApi(): PokeApiListCache | undefined {
  if (typeof localStorage === 'undefined') return undefined;

  try {
    const value = localStorage.getItem(POKEAPI_LIST_CACHE_KEY);
    if (!value) return undefined;

    const cache = JSON.parse(value) as Partial<PokeApiListCache>;
    if (
      typeof cache.savedAt !== 'number' ||
      !Array.isArray(cache.results) ||
      !cache.results.every(isPokeApiNamedResource)
    ) {
      return undefined;
    }

    return { savedAt: cache.savedAt, results: cache.results };
  } catch {
    return undefined;
  }
}

function salvarCacheDaListaPokeApi(results: PokeApiNamedResource[]): void {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(
      POKEAPI_LIST_CACHE_KEY,
      JSON.stringify({ savedAt: Date.now(), results } satisfies PokeApiListCache),
    );
  } catch {
    // A busca continua funcionando mesmo se o navegador bloquear o armazenamento.
  }
}

function tcgDexTemporarilyUnavailable(): boolean {
  if (typeof sessionStorage === 'undefined') return false;

  try {
    const retryAfter = Number(sessionStorage.getItem(TCGDEX_RETRY_CACHE_KEY));
    return Number.isFinite(retryAfter) && retryAfter > Date.now();
  } catch {
    return false;
  }
}

function rememberTcgDexFailure(): void {
  if (typeof sessionStorage === 'undefined') return;

  try {
    sessionStorage.setItem(
      TCGDEX_RETRY_CACHE_KEY,
      String(Date.now() + TCGDEX_RETRY_DELAY),
    );
  } catch {
    // O fallback continua disponível mesmo sem armazenamento de sessão.
  }
}

function clearTcgDexFailure(): void {
  if (typeof sessionStorage === 'undefined') return;

  try {
    sessionStorage.removeItem(TCGDEX_RETRY_CACHE_KEY);
  } catch {
    // Não é necessário interromper uma busca bem-sucedida por causa do cache.
  }
}

async function obterListaPokeApi(signal?: AbortSignal): Promise<PokeApiNamedResource[]> {
  if (signal?.aborted) {
    throw new DOMException('Busca cancelada', 'AbortError');
  }

  const cached = lerCacheDaListaPokeApi();
  const cacheIsFresh = cached && Date.now() - cached.savedAt < POKEAPI_LIST_CACHE_MAX_AGE;
  if (cacheIsFresh) return cached.results;

  try {
    const url = new URL(`${POKEAPI_API_URL}/pokemon`);
    url.searchParams.set('limit', '2000');
    url.searchParams.set('offset', '0');
    const data = await getPokeApiJson(url, signal);

    if (!isPokeApiListResponse(data)) {
      throw new Error('A PokéAPI retornou uma lista inesperada.');
    }

    salvarCacheDaListaPokeApi(data.results);
    return data.results;
  } catch (error) {
    if (isAbortError(error, signal)) throw error;
    if (cached) return cached.results;
    throw error;
  }
}

/** Busca Pokémon e formas pelo nome usando a lista pública da PokéAPI. */
export async function buscarPokemonsPokeApi(
  termo: string,
  signal?: AbortSignal,
): Promise<CardCatalogItem[]> {
  const termoNormalizado = normalizarBusca(termo.trim()).replace(/\s+/g, '-');
  if (termoNormalizado.length < 2) return [];

  const resources = await obterListaPokeApi(signal);

  return resources
    .map((resource) => ({
      resource,
      id: obterIdPokeApi(resource.url),
      normalizedName: normalizarBusca(resource.name),
    }))
    .filter(
      (item): item is typeof item & { id: string } =>
        Boolean(item.id) && item.normalizedName.includes(termoNormalizado),
    )
    .sort((first, second) => {
      const firstStarts = first.normalizedName.startsWith(termoNormalizado);
      const secondStarts = second.normalizedName.startsWith(termoNormalizado);
      return (
        Number(secondStarts) - Number(firstStarts) ||
        first.normalizedName.localeCompare(second.normalizedName)
      );
    })
    .slice(0, SEARCH_PAGE_SIZE)
    .map(({ resource, id }) => ({
      id: `pokeapi-${id}`,
      localId: id,
      name: formatarNomePokemon(resource.name),
      image: obterImagemOficialPokeApi(id),
      source: 'pokeapi' as const,
    }));
}

/** Carrega tipagem e imagem do Pokémon selecionado na PokéAPI. */
export async function obterPokemonPokeApi(
  pokemonId: string,
  signal?: AbortSignal,
): Promise<TcgDexCard> {
  const url = new URL(`${POKEAPI_API_URL}/pokemon/${encodeURIComponent(pokemonId)}`);
  const data = await getPokeApiJson(url, signal);

  if (!isPokeApiPokemon(data)) {
    throw new Error('A PokéAPI retornou um Pokémon inválido.');
  }

  const officialArtwork = data.sprites.other?.['official-artwork']?.front_default;
  const animatedSprite = data.sprites.other?.showdown?.front_default;
  const types = [...data.types]
    .sort((first, second) => first.slot - second.slot)
    .map((item) => item.type.name);

  return {
    id: `pokeapi-${data.id}`,
    localId: String(data.id),
    name: formatarNomePokemon(data.name),
    category: 'Pokemon',
    types,
    image:
      officialArtwork ?? data.sprites.front_default ?? obterImagemOficialPokeApi(data.id),
    ...(data.sprites.front_default
      ? { spriteImage: data.sprites.front_default }
      : { spriteImage: obterSpritePokeApi(data.id) }),
    ...(animatedSprite ? { animatedImage: animatedSprite } : {}),
    source: 'pokeapi',
  };
}

function buscarNoCatalogoLocal(termo: string): LocalDeckCatalogCard[] {
  const termoNormalizado = normalizarBusca(termo.trim());

  return [...localDeckCatalog]
    .sort((firstCard, secondCard) => {
      const firstMatches = normalizarBusca(firstCard.name).includes(termoNormalizado);
      const secondMatches = normalizarBusca(secondCard.name).includes(termoNormalizado);
      return Number(secondMatches) - Number(firstMatches);
    })
    .slice(0, SEARCH_PAGE_SIZE);
}

function isAbortError(error: unknown, signal?: AbortSignal): boolean {
  return (
    signal?.aborted === true || (error instanceof Error && error.name === 'AbortError')
  );
}

/**
 * Consulta a TCGdex, depois a PokéAPI e por fim o catálogo local.
 * Cancelamentos da busca não ativam o fallback, pois são parte normal do debounce.
 */
export async function buscarCartas(
  termo: string,
  signal?: AbortSignal,
): Promise<CardCatalogSearchResult> {
  if (!tcgDexTemporarilyUnavailable()) {
    try {
      const cards = await buscarCartasTcgDex(termo, signal);
      clearTcgDexFailure();
      return {
        cards: cards.map((card) => ({ ...card, source: 'tcgdex' as const })),
        source: 'tcgdex',
      };
    } catch (error) {
      if (isAbortError(error, signal)) throw error;
      rememberTcgDexFailure();
    }
  }

  try {
    return {
      cards: await buscarPokemonsPokeApi(termo, signal),
      source: 'pokeapi',
    };
  } catch (pokeApiError) {
    if (isAbortError(pokeApiError, signal)) throw pokeApiError;

    return {
      cards: buscarNoCatalogoLocal(termo).map((card) => ({
        id: card.id,
        localId: card.localId,
        name: card.name,
        image: card.image,
        source: 'local' as const,
      })),
      source: 'local',
    };
  }
}

/** Carrega os detalhes necessários para descobrir o tipo da carta escolhida. */
export async function obterCartaTcgDex(
  cardId: string,
  signal?: AbortSignal,
): Promise<TcgDexCard> {
  const url = new URL(`${TCGDEX_API_URL}/cards/${encodeURIComponent(cardId)}`);
  const data = await getJson(url, signal);

  if (!isCardSummary(data)) {
    throw new Error('A TCGdex retornou uma carta inválida.');
  }

  const card = data as TcgDexCard;
  const pokemonId = card.dexId?.[0];
  return {
    ...card,
    localId: String(card.localId),
    ...(pokemonId
      ? {
          spriteImage: obterSpritePokeApi(pokemonId),
          animatedImage: obterImagemAnimadaPokeApi(pokemonId),
        }
      : {}),
    source: 'tcgdex',
  };
}

/** Obtém detalhes na mesma fonte que produziu o resultado da busca. */
export async function obterCartaDoCatalogo(
  card: CardCatalogItem,
  signal?: AbortSignal,
): Promise<TcgDexCard> {
  if (card.source === 'tcgdex') {
    return obterCartaTcgDex(card.id, signal);
  }

  if (card.source === 'pokeapi') {
    try {
      return await obterPokemonPokeApi(card.localId, signal);
    } catch (error) {
      if (isAbortError(error, signal)) throw error;

      const localCard = localDeckCatalog.find(
        (item) => item.localId.split('-')[0] === card.localId,
      );
      if (localCard) return { ...localCard, source: 'local' };
      throw error;
    }
  }

  const localCard = localDeckCatalog.find((item) => item.id === card.id);
  if (!localCard) {
    throw new Error('A carta não foi encontrada no catálogo local.');
  }

  return { ...localCard, source: 'local' };
}

const TIPOS_TCGDEX: Record<string, string> = {
  water: 'Água',
  ice: 'Água',
  água: 'Água',
  fire: 'Fogo',
  fogo: 'Fogo',
  grass: 'Grama',
  bug: 'Grama',
  grama: 'Grama',
  fighting: 'Lutador',
  ground: 'Lutador',
  rock: 'Lutador',
  lutador: 'Lutador',
  luta: 'Lutador',
  darkness: 'Sombrio',
  dark: 'Sombrio',
  escuridão: 'Sombrio',
  escuro: 'Sombrio',
  sombrio: 'Sombrio',
  metal: 'Metálico',
  steel: 'Metálico',
  metálico: 'Metálico',
  lightning: 'Elétrico',
  electric: 'Elétrico',
  elétrico: 'Elétrico',
  raio: 'Elétrico',
  psychic: 'Psíquico',
  ghost: 'Psíquico',
  poison: 'Psíquico',
  psíquico: 'Psíquico',
  dragon: 'Dragão',
  dragão: 'Dragão',
  fairy: 'Fada',
  fada: 'Fada',
  colorless: 'Incolor',
  normal: 'Incolor',
  flying: 'Incolor',
  incolor: 'Incolor',
  incoloro: 'Incolor',
};

export function normalizarTipoTcgDex(tipo?: string): string | undefined {
  if (!tipo) return undefined;
  return TIPOS_TCGDEX[tipo.toLocaleLowerCase('pt-BR')] ?? tipo;
}

export function obterImagemTcgDex(
  imagemBase: string | undefined,
  qualidade: 'low' | 'high',
): string | undefined {
  if (!imagemBase) return undefined;
  if (/\.(?:png|jpe?g|webp)$/i.test(imagemBase)) return imagemBase;
  return `${imagemBase.replace(/\/$/, '')}/${qualidade}.webp`;
}

/** Converte a resposta externa para o modelo de domínio usado pelo torneio. */
export function criarDeckDaCartaTcgDex(card: TcgDexCard): Deck {
  const tipoPrincipal = normalizarTipoTcgDex(card.types?.[0]);
  const source = card.source ?? 'tcgdex';

  if (!tipoPrincipal) {
    throw new Error(`O Pokémon ${card.name} não possui tipagem cadastrada.`);
  }

  return {
    id:
      source === 'tcgdex'
        ? `deck-tcgdex-${card.id}`
        : source === 'pokeapi'
          ? `deck-pokeapi-${card.localId}`
          : `deck-${card.id}`,
    ...(source === 'tcgdex' ? { tcgdexCardId: card.id } : {}),
    ...(source === 'pokeapi' ? { pokeApiPokemonId: card.localId } : {}),
    nome: card.name,
    tipoPrincipal,
    imagem: obterImagemTcgDex(card.image, 'high'),
    miniatura: obterImagemTcgDex(card.image, 'low'),
    ...(card.spriteImage ? { imagemSprite: card.spriteImage } : {}),
    ...(card.animatedImage ? { imagemAnimada: card.animatedImage } : {}),
  };
}
