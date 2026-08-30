import { describe, expect, it } from 'vitest';
import { tournamentReducer, type TournamentState } from './tournamentReducer';
import { criarTorneio } from '@/services';
import type { Deck, Player } from '@/types';

const players: Player[] = [
  { id: 'p1', name: 'João' },
  { id: 'p2', name: 'Pedro' },
  { id: 'p3', name: 'Lucas' },
  { id: 'p4', name: 'Rafael' },
];

const decks: Deck[] = [
  { id: 'd1', nome: 'Charizard ex' },
  { id: 'd2', nome: 'Lugia VSTAR' },
  { id: 'd3', nome: 'Miraidon ex' },
  { id: 'd4', nome: 'Lost Box' },
];

function estadoInicial(): TournamentState {
  return { tournament: criarTorneio(players, decks), error: null };
}

describe('tournamentReducer', () => {
  it('DEFINIR_DECKS configura os decks que participarão do sorteio', () => {
    const semDecks = {
      tournament: criarTorneio(players, []),
      error: null,
    };
    const novoEstado = tournamentReducer(semDecks, {
      type: 'DEFINIR_DECKS',
      payload: { decks },
    });

    expect(novoEstado.tournament.decks).toEqual(decks);
    expect(novoEstado.error).toBeNull();
  });

  it('SORTEAR_DECKS avança o status para decks-sorteados', () => {
    const novoEstado = tournamentReducer(estadoInicial(), { type: 'SORTEAR_DECKS' });

    expect(novoEstado.tournament.status).toBe('decks-sorteados');
    expect(novoEstado.tournament.assignments).toHaveLength(4);
    expect(novoEstado.error).toBeNull();
  });

  it('INICIAR_CAMPEONATO_COM_DECKS gera confrontos sem trocar os decks informados', () => {
    const novoEstado = tournamentReducer(
      { tournament: criarTorneio([], []), error: null },
      {
        type: 'INICIAR_CAMPEONATO_COM_DECKS',
        payload: {
          registrations: players.map((player, index) => ({
            player,
            deck: decks[index],
          })),
        },
      },
    );

    expect(novoEstado.tournament.status).toBe('chave-gerada');
    expect(novoEstado.tournament.assignments).toEqual(
      players.map((player, index) => ({
        playerId: player.id,
        deckId: decks[index].id,
      })),
    );
    expect(novoEstado.tournament.bracket?.rounds).toHaveLength(2);
  });

  it('GERAR_CHAVE antes de sortear decks produz erro e mantém o estado anterior', () => {
    const estadoAnterior = estadoInicial();
    const novoEstado = tournamentReducer(estadoAnterior, { type: 'GERAR_CHAVE' });

    expect(novoEstado.tournament).toBe(estadoAnterior.tournament);
    expect(novoEstado.error).toMatch(/sortear os decks/);
  });

  it('fluxo completo: sortear decks → gerar chave → registrar vencedores → campeão', () => {
    let estado = estadoInicial();
    estado = tournamentReducer(estado, { type: 'SORTEAR_DECKS' });
    estado = tournamentReducer(estado, { type: 'GERAR_CHAVE' });

    expect(estado.tournament.bracket?.rounds).toHaveLength(2);

    const semifinal1 = estado.tournament.bracket!.rounds[0].matches[0];
    const semifinal2 = estado.tournament.bracket!.rounds[0].matches[1];

    estado = tournamentReducer(estado, {
      type: 'REGISTRAR_VENCEDOR',
      payload: { matchId: semifinal1.id, winnerId: semifinal1.player1Id! },
    });
    estado = tournamentReducer(estado, {
      type: 'REGISTRAR_VENCEDOR',
      payload: { matchId: semifinal2.id, winnerId: semifinal2.player1Id! },
    });

    const final = estado.tournament.bracket!.rounds[1].matches[0];
    estado = tournamentReducer(estado, {
      type: 'REGISTRAR_VENCEDOR',
      payload: { matchId: final.id, winnerId: final.player1Id! },
    });

    expect(estado.tournament.status).toBe('finalizado');
    expect(estado.tournament.championId).toBe(final.player1Id);
    expect(estado.error).toBeNull();
  });

  it('REINICIAR volta o campeonato ao estado inicial', () => {
    let estado = estadoInicial();
    estado = tournamentReducer(estado, { type: 'SORTEAR_DECKS' });
    estado = tournamentReducer(estado, { type: 'REINICIAR' });

    expect(estado.tournament.status).toBe('registrando-jogadores');
    expect(estado.tournament.assignments).toHaveLength(0);
  });

  it('uma ação com erro não impede ações válidas em seguida', () => {
    let estado = estadoInicial();
    estado = tournamentReducer(estado, { type: 'GERAR_CHAVE' }); // erro esperado
    expect(estado.error).not.toBeNull();

    estado = tournamentReducer(estado, { type: 'SORTEAR_DECKS' }); // deve funcionar normalmente
    expect(estado.error).toBeNull();
    expect(estado.tournament.status).toBe('decks-sorteados');
  });
});
