/**
 * Um confronto dentro da chave.
 *
 * Guarda apenas os IDs de jogador/vencedor (não os objetos completos).
 * Isso mantém uma única fonte de verdade: os dados completos de Player
 * e Deck vivem em `Tournament.players` / `Tournament.decks`, e são
 * buscados por id quando a UI precisa exibi-los. Evita duplicação e
 * estados divergentes (ex: editar o nome de um jogador e o confronto
 * continuar com o nome antigo).
 */
export type Match = {
  id: string;
  roundIndex: number;
  matchIndex: number;
  player1Id?: string;
  player2Id?: string;
  winnerId?: string;
};
