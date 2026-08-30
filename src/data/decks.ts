/**
 * Catálogo mínimo usado somente quando a TCGdex está indisponível.
 *
 * As imagens usam o repositório público de sprites da PokéAPI, que é
 * independente do servidor da TCGdex. Se também estiverem indisponíveis,
 * a interface mantém o nome e a tipagem e exibe seu placeholder de imagem.
 */
export type LocalDeckCatalogCard = {
  id: string;
  localId: string;
  name: string;
  category: 'Pokemon';
  types: string[];
  image: string;
};

const OFFICIAL_ARTWORK_URL =
  'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork';

function officialArtwork(pokedexId: number): string {
  return `${OFFICIAL_ARTWORK_URL}/${pokedexId}.png`;
}

export const localDeckCatalog: LocalDeckCatalogCard[] = [
  {
    id: 'local-sharpedo-ex',
    localId: '319',
    name: 'Sharpedo ex',
    category: 'Pokemon',
    types: ['Darkness'],
    image: officialArtwork(319),
  },
  {
    id: 'local-lucario-ex',
    localId: '448',
    name: 'Lucario ex',
    category: 'Pokemon',
    types: ['Fighting'],
    image: officialArtwork(448),
  },
  {
    id: 'local-ceruledge-ex',
    localId: '937',
    name: 'Ceruledge ex',
    category: 'Pokemon',
    types: ['Fire'],
    image: officialArtwork(937),
  },
  {
    id: 'local-empoleon-ex',
    localId: '395',
    name: 'Empoleon ex',
    category: 'Pokemon',
    types: ['Metal'],
    image: officialArtwork(395),
  },
  {
    id: 'local-abomasnow-ex',
    localId: '460',
    name: 'Abomasnow ex',
    category: 'Pokemon',
    types: ['Water'],
    image: officialArtwork(460),
  },
  {
    id: 'local-garchomp-ex',
    localId: '445',
    name: 'Garchomp ex',
    category: 'Pokemon',
    types: ['Fighting'],
    image: officialArtwork(445),
  },
  {
    id: 'local-dragapult-dusk',
    localId: '887-dusk',
    name: 'Dragapult Dusk',
    category: 'Pokemon',
    types: ['Dragon'],
    image: officialArtwork(887),
  },
  {
    id: 'local-dragapult-m',
    localId: '887-m',
    name: 'Dragapult M',
    category: 'Pokemon',
    types: ['Dragon'],
    image: officialArtwork(887),
  },
  {
    id: 'local-hydrapple',
    localId: '1019',
    name: 'Hydrapple',
    category: 'Pokemon',
    types: ['Grass'],
    image: officialArtwork(1019),
  },
  {
    id: 'local-grimmsnarl',
    localId: '861',
    name: 'Grimmsnarl',
    category: 'Pokemon',
    types: ['Darkness'],
    image: officialArtwork(861),
  },
  {
    id: 'local-mega-excadrill',
    localId: '530',
    name: 'Mega Excadrill',
    category: 'Pokemon',
    types: ['Metal'],
    image: officialArtwork(530),
  },
];
