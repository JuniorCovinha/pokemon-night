import { useMemo, useReducer, type ReactNode } from 'react';
import { tournamentReducer, type TournamentState } from './tournamentReducer';
import { TournamentContext, type TournamentContextValue } from './tournamentContextDefinition';
import { criarTorneio, obterCampeao } from '@/services';
import { initialPlayers } from '@/data/players';
import { decks as initialDecksData } from '@/data/decks';
import type { Deck, Player } from '@/types';

type TournamentProviderProps = {
  children: ReactNode;
  /** Permite injetar jogadores/decks diferentes (ex: em testes). */
  initialPlayers?: Player[];
  initialDecks?: Deck[];
};

function estadoInicial(players: Player[], decks: Deck[]): TournamentState {
  return { tournament: criarTorneio(players, decks), error: null };
}

export function TournamentProvider({
  children,
  initialPlayers: playersProp = initialPlayers,
  initialDecks: decksProp = initialDecksData,
}: TournamentProviderProps) {
  const [state, dispatch] = useReducer(
    tournamentReducer,
    undefined,
    () => estadoInicial(playersProp, decksProp),
  );

  const value = useMemo<TournamentContextValue>(
    () => ({
      tournament: state.tournament,
      champion: obterCampeao(state.tournament),
      error: state.error,
      sortearDecks: () => dispatch({ type: 'SORTEAR_DECKS' }),
      gerarChave: () => dispatch({ type: 'GERAR_CHAVE' }),
      registrarVencedor: (matchId, winnerId) =>
        dispatch({ type: 'REGISTRAR_VENCEDOR', payload: { matchId, winnerId } }),
      desfazerVencedor: (matchId) => dispatch({ type: 'DESFAZER_VENCEDOR', payload: { matchId } }),
      renomearJogador: (playerId, novoNome) =>
        dispatch({ type: 'RENOMEAR_JOGADOR', payload: { playerId, novoNome } }),
      reiniciar: () => dispatch({ type: 'REINICIAR' }),
    }),
    [state],
  );

  return (
    <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>
  );
}
