export type DeckDifficulty = 'Fácil' | 'Média' | 'Difícil';

/**
 * Referência a uma carta dentro da lista completa do deck.
 * Preparado para a v2 (fotos e páginas individuais de deck).
 */
export type DeckCard = {
  nome: string;
  quantidade: number;
  imagem?: string;
};

/**
 * Link útil relacionado ao deck (guia, vídeo, torneio de referência, etc).
 */
export type DeckLink = {
  titulo: string;
  url: string;
};

/**
 * Modelo completo de um Deck do TCG.
 *
 * Todos os campos além de `id` e `nome` são opcionais de propósito:
 * o deck pode nascer só com o nome e ser enriquecido depois (v2, v3...)
 * sem exigir migração de dados ou refatoração do tipo.
 */
export type Deck = {
  id: string;
  nome: string;

  // Carta principal usada para representar este deck na TCGdex.
  tcgdexCardId?: string;

  // Pokémon principal usado quando os dados vieram da PokéAPI.
  pokeApiPokemonId?: string;

  // Mídia
  imagem?: string;
  miniatura?: string;
  imagemSprite?: string;
  imagemAnimada?: string;
  videoTutorial?: string;

  // Identidade do deck
  descricao?: string;
  tipoPrincipal?: string;
  formato?: string;
  expansao?: string;
  dataCriacao?: string;

  // Perfil de jogo (usado em filtros e páginas de detalhe futuramente)
  dificuldade?: DeckDifficulty;
  agressividade?: number;
  controle?: number;
  consistencia?: number;

  // Conteúdo estratégico (v2+)
  pontosFortes?: string[];
  pontosFracos?: string[];
  matchupsFavoraveis?: string[];
  matchupsDesfavoraveis?: string[];
  listaCompleta?: DeckCard[];
  linksUteis?: DeckLink[];

  // Metadados de uso
  favorito?: boolean;
};
