import type { Player } from '@/types';

/**
 * Jogadores iniciais. Editáveis pela UI — este array é só o estado
 * inicial, nunca um limite: a aplicação nunca assume "sempre 4 jogadores".
 */
export const initialPlayers: Player[] = [
  { id: 'player-1', name: 'Liru' },
  { id: 'player-2', name: 'Iago' },
  { id: 'player-3', name: 'Palombo' },
  { id: 'player-4', name: 'Julio' },
];
