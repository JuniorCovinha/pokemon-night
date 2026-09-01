import { describe, expect, it } from 'vitest';
import { criarTorneio } from './tournamentService';
import {
  configurarCampeonatoSuico,
  criarConfiguracaoSuicaPadrao,
} from './tournamentSetupService';
import { gerarPrimeiraRodadaSuica, iniciarRodadaSuica } from './roundService';
import {
  analisarResultadoDosJogos,
  registrarResultadoPartidaSuica,
} from './matchResultService';
import type { MatchFormat } from '@/types';

function createActiveTournament(count = 4, matchFormat: MatchFormat = 'best-of-three') {
  const config = { ...criarConfiguracaoSuicaPadrao(count), matchFormat };
  const configured = configurarCampeonatoSuico(criarTorneio([], []), {
    config,
    registrations: Array.from({ length: count }, (_, index) => ({
      player: { id: `p${index + 1}`, name: `Jogador ${index + 1}` },
      deck: { id: `d${index + 1}`, nome: `Deck ${index + 1}` },
    })),
  });

  return iniciarRodadaSuica(gerarPrimeiraRodadaSuica(configured, () => 0));
}

describe('analisarResultadoDosJogos', () => {
  it('decide o melhor de 3 quando alguém alcança duas vitórias', () => {
    expect(
      analisarResultadoDosJogos('best-of-three', [
        'player1-win',
        'player2-win',
        'player1-win',
      ]),
    ).toEqual({ status: 'win', winnerSide: 'player1' });

    expect(
      analisarResultadoDosJogos('best-of-three', ['player2-win', 'player2-win']),
    ).toEqual({ status: 'win', winnerSide: 'player2' });
  });

  it('considera empate quando os três jogos terminam sem duas vitórias', () => {
    expect(
      analisarResultadoDosJogos('best-of-three', ['player1-win', 'player2-win', 'draw']),
    ).toEqual({ status: 'draw' });
  });

  it('resolve o melhor de 1 com apenas uma caixa', () => {
    expect(analisarResultadoDosJogos('best-of-one', ['player1-win'])).toEqual({
      status: 'win',
      winnerSide: 'player1',
    });
    expect(analisarResultadoDosJogos('best-of-one', ['draw'])).toEqual({
      status: 'draw',
    });
  });
});

describe('registrarResultadoPartidaSuica', () => {
  it('confirma vitória pelos jogos e mantém a rodada ativa enquanto há pendências', () => {
    const tournament = createActiveTournament();
    const match = tournament.tournamentMatches[0];
    const gameOutcomes = ['player1-win', 'player2-win', 'player1-win'] as const;
    const updated = registrarResultadoPartidaSuica(tournament, match.id, {
      gameOutcomes: [...gameOutcomes],
    });

    expect(updated.status).toBe('rodada-suica-ativa');
    expect(updated.tournamentMatches[0]).toMatchObject({
      status: 'confirmed',
      revision: 1,
      result: {
        kind: 'win',
        winnerId: match.player1Id,
        gameOutcomes: [...gameOutcomes],
      },
    });
  });

  it('deriva o empate dos três jogos', () => {
    const tournament = createActiveTournament();
    const match = tournament.tournamentMatches[0];
    const gameOutcomes = ['player1-win', 'player2-win', 'draw'] as const;
    const updated = registrarResultadoPartidaSuica(tournament, match.id, {
      gameOutcomes: [...gameOutcomes],
    });

    expect(updated.tournamentMatches[0].result).toEqual({
      kind: 'draw',
      gameOutcomes: [...gameOutcomes],
    });
  });

  it('entra em revisão quando todas as mesas estão confirmadas', () => {
    let tournament = createActiveTournament();

    for (const match of tournament.tournamentMatches) {
      tournament = registrarResultadoPartidaSuica(tournament, match.id, {
        gameOutcomes: ['player1-win', 'player1-win'],
      });
    }

    expect(tournament.status).toBe('rodada-suica-revisao');
    expect(tournament.swissRounds[0].status).toBe('awaiting-results');
  });

  it('trata uma nova submissão como correção e incrementa a revisão', () => {
    let tournament = createActiveTournament();

    for (const match of tournament.tournamentMatches) {
      tournament = registrarResultadoPartidaSuica(tournament, match.id, {
        gameOutcomes: ['player1-win', 'player1-win'],
      });
    }

    const correctedMatch = tournament.tournamentMatches[0];
    tournament = registrarResultadoPartidaSuica(tournament, correctedMatch.id, {
      gameOutcomes: ['player2-win', 'player1-win', 'player2-win'],
    });

    expect(tournament.tournamentMatches[0]).toMatchObject({
      status: 'corrected',
      revision: 2,
      result: {
        kind: 'win',
        winnerId: correctedMatch.player2Id,
        gameOutcomes: ['player2-win', 'player1-win', 'player2-win'],
      },
    });
    expect(tournament.status).toBe('rodada-suica-revisao');
  });

  it('rejeita resultado incompleto e jogo depois da decisão', () => {
    const tournament = createActiveTournament();
    const match = tournament.tournamentMatches[0];

    expect(() =>
      registrarResultadoPartidaSuica(tournament, match.id, {
        gameOutcomes: ['player1-win'],
      }),
    ).toThrow(/incompleto/);

    expect(() =>
      registrarResultadoPartidaSuica(tournament, match.id, {
        gameOutcomes: ['player1-win', 'player1-win', 'player2-win'],
      }),
    ).toThrow(/depois de o confronto/);
  });

  it('rejeita mais de uma caixa no melhor de 1', () => {
    const tournament = createActiveTournament(4, 'best-of-one');
    const match = tournament.tournamentMatches[0];

    expect(() =>
      registrarResultadoPartidaSuica(tournament, match.id, {
        gameOutcomes: ['player1-win', 'player2-win'],
      }),
    ).toThrow(/no máximo 1 jogo/);
  });

  it('preserva o bye e impede edição manual', () => {
    const tournament = createActiveTournament(5);
    const bye = tournament.tournamentMatches.find(
      (match) => match.result?.kind === 'bye',
    );

    expect(bye).toBeDefined();
    expect(() =>
      registrarResultadoPartidaSuica(tournament, bye!.id, {
        gameOutcomes: ['player1-win'],
      }),
    ).toThrow(/confirmado automaticamente/);
  });
});
