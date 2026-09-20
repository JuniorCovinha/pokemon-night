import { createContext } from 'react';
import type { Champion, Deck, Standing, Tournament } from '@/types';
import type {
  PlayerDeckRegistration,
  SwissMatchResultInput,
  SwissTournamentSetup,
} from '@/services';

export type TournamentContextValue = {
  tournament: Tournament;
  champion: Champion | undefined;
  standings: Standing[];
  error: string | null;
  definirDecks: (decks: Deck[]) => void;
  sortearDecks: () => void;
  gerarChave: () => void;
  iniciarCampeonatoComDecks: (registrations: PlayerDeckRegistration[]) => void;
  configurarCampeonatoSuico: (setup: SwissTournamentSetup) => void;
  gerarPrimeiraRodadaSuica: () => void;
  gerarProximaRodadaSuica: () => void;
  iniciarRodadaSuica: () => void;
  registrarResultadoSuico: (matchId: string, result: SwissMatchResultInput) => void;
  finalizarRodadaSuica: () => void;
  reabrirRodadaSuica: (roundNumber: number, reason: string) => void;
  registrarVencedor: (matchId: string, winnerId: string) => void;
  desfazerVencedor: (matchId: string) => void;
  renomearJogador: (playerId: string, novoNome: string) => void;
  reiniciar: () => void;
};

export const TournamentContext = createContext<TournamentContextValue | undefined>(
  undefined,
);
