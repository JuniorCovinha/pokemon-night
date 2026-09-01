import {
  sortearDecksDoTorneio,
  gerarChaveDoTorneio,
  registrarVencedorDoTorneio,
  desfazerVencedorDoTorneio,
  renomearJogador,
  reiniciarCampeonato,
  definirDecksDoTorneio,
  iniciarCampeonatoComDecksDefinidos,
  configurarCampeonatoSuico,
  gerarPrimeiraRodadaSuica,
  iniciarRodadaSuica,
  registrarResultadoPartidaSuica,
  finalizarRodadaSuica,
} from '@/services';
import type {
  PlayerDeckRegistration,
  SwissMatchResultInput,
  SwissTournamentSetup,
} from '@/services';
import type { Deck, Tournament } from '@/types';

export type TournamentState = {
  tournament: Tournament;
  /** Última mensagem de erro de uma transição inválida (ex: gerar chave sem sortear decks). */
  error: string | null;
};

export type TournamentAction =
  | { type: 'DEFINIR_DECKS'; payload: { decks: Deck[] } }
  | { type: 'SORTEAR_DECKS' }
  | { type: 'GERAR_CHAVE' }
  | {
      type: 'INICIAR_CAMPEONATO_COM_DECKS';
      payload: { registrations: PlayerDeckRegistration[] };
    }
  | { type: 'CONFIGURAR_CAMPEONATO_SUICO'; payload: SwissTournamentSetup }
  | { type: 'GERAR_PRIMEIRA_RODADA_SUICA' }
  | { type: 'INICIAR_RODADA_SUICA' }
  | {
      type: 'REGISTRAR_RESULTADO_SUICO';
      payload: { matchId: string; result: SwissMatchResultInput };
    }
  | { type: 'FINALIZAR_RODADA_SUICA' }
  | { type: 'REGISTRAR_VENCEDOR'; payload: { matchId: string; winnerId: string } }
  | { type: 'DESFAZER_VENCEDOR'; payload: { matchId: string } }
  | { type: 'RENOMEAR_JOGADOR'; payload: { playerId: string; novoNome: string } }
  | { type: 'REINICIAR' };

/**
 * O reducer NUNCA contém lógica de sorteio ou regra de negócio — ele só
 * traduz uma ação para a chamada de service correspondente (já testada
 * isoladamente em `services/`). Isso mantém a regra do projeto de que a
 * lógica de sorteio vive fora da camada de interface/estado.
 *
 * Erros de transição inválida (ex: registrar vencedor antes da chave
 * existir) são capturados aqui e viram `error` no estado, em vez de
 * quebrar a árvore de componentes — a UI decide o que fazer com isso
 * (ex: mostrar um toast), mas a aplicação nunca trava.
 */
export function tournamentReducer(
  state: TournamentState,
  action: TournamentAction,
): TournamentState {
  try {
    switch (action.type) {
      case 'DEFINIR_DECKS':
        return {
          tournament: definirDecksDoTorneio(state.tournament, action.payload.decks),
          error: null,
        };

      case 'SORTEAR_DECKS':
        return { tournament: sortearDecksDoTorneio(state.tournament), error: null };

      case 'GERAR_CHAVE':
        return { tournament: gerarChaveDoTorneio(state.tournament), error: null };

      case 'INICIAR_CAMPEONATO_COM_DECKS':
        return {
          tournament: iniciarCampeonatoComDecksDefinidos(
            state.tournament,
            action.payload.registrations,
          ),
          error: null,
        };

      case 'CONFIGURAR_CAMPEONATO_SUICO':
        return {
          tournament: configurarCampeonatoSuico(state.tournament, action.payload),
          error: null,
        };

      case 'GERAR_PRIMEIRA_RODADA_SUICA':
        return {
          tournament: gerarPrimeiraRodadaSuica(state.tournament),
          error: null,
        };

      case 'INICIAR_RODADA_SUICA':
        return { tournament: iniciarRodadaSuica(state.tournament), error: null };

      case 'REGISTRAR_RESULTADO_SUICO':
        return {
          tournament: registrarResultadoPartidaSuica(
            state.tournament,
            action.payload.matchId,
            action.payload.result,
          ),
          error: null,
        };

      case 'FINALIZAR_RODADA_SUICA':
        return { tournament: finalizarRodadaSuica(state.tournament), error: null };

      case 'REGISTRAR_VENCEDOR':
        return {
          tournament: registrarVencedorDoTorneio(
            state.tournament,
            action.payload.matchId,
            action.payload.winnerId,
          ),
          error: null,
        };

      case 'DESFAZER_VENCEDOR':
        return {
          tournament: desfazerVencedorDoTorneio(state.tournament, action.payload.matchId),
          error: null,
        };

      case 'RENOMEAR_JOGADOR':
        return {
          tournament: renomearJogador(
            state.tournament,
            action.payload.playerId,
            action.payload.novoNome,
          ),
          error: null,
        };

      case 'REINICIAR':
        return { tournament: reiniciarCampeonato(state.tournament), error: null };

      default:
        return state;
    }
  } catch (err) {
    return {
      ...state,
      error:
        err instanceof Error
          ? err.message
          : 'Erro desconhecido ao atualizar o campeonato.',
    };
  }
}
