import { createContext } from 'react';
import type { Champion, Tournament } from '@/types';

export type TournamentContextValue = {
  tournament: Tournament;
  champion: Champion | undefined;
  error: string | null;
  sortearDecks: () => void;
  gerarChave: () => void;
  registrarVencedor: (matchId: string, winnerId: string) => void;
  desfazerVencedor: (matchId: string) => void;
  renomearJogador: (playerId: string, novoNome: string) => void;
  reiniciar: () => void;
};

export const TournamentContext = createContext<TournamentContextValue | undefined>(
  undefined,
);
