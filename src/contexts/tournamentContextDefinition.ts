import { createContext } from 'react';
import type { Champion, Deck, Tournament } from '@/types';
import type { PlayerDeckRegistration } from '@/services';

export type TournamentContextValue = {
  tournament: Tournament;
  champion: Champion | undefined;
  error: string | null;
  definirDecks: (decks: Deck[]) => void;
  sortearDecks: () => void;
  gerarChave: () => void;
  iniciarCampeonatoComDecks: (registrations: PlayerDeckRegistration[]) => void;
  registrarVencedor: (matchId: string, winnerId: string) => void;
  desfazerVencedor: (matchId: string) => void;
  renomearJogador: (playerId: string, novoNome: string) => void;
  reiniciar: () => void;
};

export const TournamentContext = createContext<TournamentContextValue | undefined>(
  undefined,
);
