import type { Player } from './player';
import type { Deck } from './deck';

/**
 * Representação "pronta para exibir" do campeão: jogador + deck usado.
 *
 * Não é armazenada diretamente no Tournament (que guarda só `championId`).
 * É montada sob demanda (ver `services/tournamentService.ts`) juntando
 * o jogador vencedor com o deck que ele usou na final.
 */
export type Champion = {
  player: Player;
  deck: Deck;
};
