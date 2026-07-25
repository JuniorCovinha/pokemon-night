import { shuffle } from '@/utils';
import type { Deck, Player, PlayerDeckAssignment } from '@/types';

/**
 * Sorteia um deck distinto para cada jogador.
 *
 * Embaralha jogadores e decks de forma independente e os pareia em ordem —
 * isso garante que nenhum deck se repita entre jogadores, sem precisar de
 * lógica de "sortear e verificar se já foi usado" (mais simples e sempre
 * termina, ao contrário de sorteio com retry).
 */
export function sortearDecks(
  players: readonly Player[],
  decks: readonly Deck[],
): PlayerDeckAssignment[] {
  if (players.length === 0) {
    throw new Error('É preciso ao menos um jogador para sortear decks.');
  }

  if (decks.length < players.length) {
    throw new Error(
      `Decks insuficientes: há ${players.length} jogador(es) e apenas ${decks.length} deck(s) disponível(is).`,
    );
  }

  const jogadoresSorteados = shuffle(players);
  const decksSorteados = shuffle(decks).slice(0, players.length);

  return jogadoresSorteados.map((player, index) => ({
    playerId: player.id,
    deckId: decksSorteados[index].id,
  }));
}
