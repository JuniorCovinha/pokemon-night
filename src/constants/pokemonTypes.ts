/**
 * Cores associadas a cada tipo principal, inspiradas na identidade visual
 * oficial do TCG. Usadas como chip de cor no DeckCard — vocabulário do
 * próprio jogo, não uma paleta arbitrária.
 */
export const POKEMON_TYPE_COLORS: Record<string, string> = {
  Fogo: '#F08030',
  Água: '#6890F0',
  Elétrico: '#F8D030',
  Grama: '#78C850',
  Psíquico: '#F85888',
  Lutador: '#C03028',
  Sombrio: '#705848',
  Metálico: '#B8B8D0',
  Dragão: '#7038F8',
  Fada: '#EE99AC',
  Incolor: '#A8A878',
  Inseto: '#A8B820',
  Fantasma: '#705898',
  Gelo: '#98D8D8',
  Voador: '#A890F0',
};

export const DEFAULT_TYPE_COLOR = '#9CA3AF';

export function getTypeColor(tipoPrincipal?: string): string {
  if (!tipoPrincipal) return DEFAULT_TYPE_COLOR;
  return POKEMON_TYPE_COLORS[tipoPrincipal] ?? DEFAULT_TYPE_COLOR;
}
