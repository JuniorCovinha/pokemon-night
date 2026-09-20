import { describe, expect, it } from 'vitest';
import type { Tournament, TournamentMatch, TournamentMatchResultKind } from '@/types';
import { LOCAL_STANDINGS_RULES } from '@/constants/standings';
import { criarTorneio } from './tournamentService';
import {
  configurarCampeonatoSuico,
  criarConfiguracaoSuicaPadrao,
} from './tournamentSetupService';
import {
  finalizarRodadaSuica,
  gerarPrimeiraRodadaSuica,
  iniciarRodadaSuica,
} from './roundService';
import { registrarResultadoPartidaSuica } from './matchResultService';
import { calcularClassificacaoSuica } from './standingsService';

function configured(count = 4) {
  return configurarCampeonatoSuico(criarTorneio([], []), {
    config: criarConfiguracaoSuicaPadrao(count),
    registrations: Array.from({ length: count }, (_, index) => ({
      player: { id: `p${index + 1}`, name: `Jogador ${index + 1}` },
      deck: { id: `d${index + 1}`, nome: `Deck ${index + 1}` },
    })),
  });
}

function match(
  round: number,
  first: number,
  second?: number,
  winner?: number,
  kind: TournamentMatchResultKind = second === undefined
    ? 'bye'
    : winner
      ? 'win'
      : 'draw',
): TournamentMatch {
  return {
    id: `r${round}-p${first}`,
    roundNumber: round,
    player1Id: `p${first}`,
    player2Id: second ? `p${second}` : undefined,
    status: 'confirmed',
    revision: 1,
    result: { kind, winnerId: winner ? `p${winner}` : undefined, gameOutcomes: [] },
  };
}

function withMatches(count: number, matches: TournamentMatch[]): Tournament {
  return {
    ...configured(count),
    tournamentMatches: matches,
    swissRounds: [...new Set(matches.map((item) => item.roundNumber))].map((number) => ({
      number,
      status: 'completed',
      revision: 1,
      matchIds: matches
        .filter((item) => item.roundNumber === number)
        .map((item) => item.id),
    })),
  };
}

function row(tournament: Tournament, playerId: string) {
  return calcularClassificacaoSuica(tournament).find(
    (item) => item.playerId === playerId,
  )!;
}

describe('classificação Suíça local', () => {
  it('não interfere no modo Sorteio e começa com todos empatados sem pontos', () => {
    expect(calcularClassificacaoSuica(criarTorneio([], []))).toEqual([]);
    expect(calcularClassificacaoSuica(configured())).toHaveLength(4);
    expect(
      calcularClassificacaoSuica(configured()).every(
        (item) =>
          item.points === 0 &&
          item.position === 1 &&
          item.tied &&
          item.opponentWinRate === null,
      ),
    ).toBe(true);
  });

  it('conta confrontos, aplica 3/1/0 e preserva empates reais na colocação', () => {
    const tournament = withMatches(4, [match(1, 1, 2, 1), match(1, 3, 4)]);
    const snapshot = structuredClone(tournament);
    expect(
      calcularClassificacaoSuica(tournament).map((item) => [
        item.playerId,
        item.points,
        item.position,
      ]),
    ).toEqual([
      ['p1', 3, 1],
      ['p3', 1, 2],
      ['p4', 1, 2],
      ['p2', 0, 4],
    ]);
    expect(row(tournament, 'p3')).toMatchObject({
      played: 1,
      draws: 1,
      wins: 0,
      opponentWinRate: 0.25,
      tied: true,
    });
    expect(row(tournament, 'p1')).toMatchObject({
      wins: 1,
      losses: 0,
      opponentsOpponentWinRate: 1,
    });
    expect(tournament).toEqual(snapshot);
  });

  it('ignora bye antes do início e conta três pontos ao iniciar a rodada ímpar', () => {
    const paired = gerarPrimeiraRodadaSuica(configured(5), () => 0);
    expect(calcularClassificacaoSuica(paired).every((item) => item.points === 0)).toBe(
      true,
    );
    const active = iniciarRodadaSuica(paired);
    const bye = active.tournamentMatches.find((item) => item.result?.kind === 'bye')!;
    expect(row(active, bye.player1Id)).toMatchObject({
      played: 1,
      wins: 1,
      byes: 1,
      points: 3,
      opponentWinRate: null,
      opponentsOpponentWinRate: null,
    });
    expect(calcularClassificacaoSuica(active)).toHaveLength(5);
  });

  it('exclui byes do numerador e denominador dos percentuais', () => {
    const tournament = withMatches(5, [
      match(1, 1, undefined, 1),
      match(1, 2, 3, 2),
      match(1, 4, 5, 4),
      match(2, 1, 2, 2),
      match(2, 3, 4, 3),
      match(2, 5, undefined, 5),
    ]);
    expect(row(tournament, 'p1')).toMatchObject({
      wins: 1,
      losses: 1,
      byes: 1,
      points: 3,
    });
    // p2 enfrentou p3 (1/2) e p1 (0/1, piso 25%): média 37,5%.
    expect(row(tournament, 'p2').opponentWinRate).toBe(0.375);
  });

  it('ordena pelo percentual dos adversários antes do segundo desempate', () => {
    const tournament = withMatches(4, [
      match(1, 1, 2, 1),
      match(1, 3, 4, 3),
      match(2, 1, 3, 3),
      match(2, 2, 4),
    ]);
    expect(calcularClassificacaoSuica(tournament).map((item) => item.playerId)).toEqual([
      'p3',
      'p1',
      'p4',
      'p2',
    ]);
    expect(row(tournament, 'p4').opponentWinRate).toBe(0.625);
    expect(row(tournament, 'p2').opponentWinRate).toBe(0.375);
    expect(row(tournament, 'p4').opponentsOpponentWinRate).toBe(0.375);
    expect(row(tournament, 'p2').opponentsOpponentWinRate).toBe(0.625);
  });

  it('usa adversários dos adversários quando pontos e primeiro percentual são iguais', () => {
    const tournament = withMatches(8, [
      match(1, 1, 2, 2),
      match(1, 3, 4, 3),
      match(1, 5, 6, 5),
      match(1, 7, 8, 8),
      match(2, 1, 3, 1),
      match(2, 2, 4, 4),
      match(2, 5, 7, 7),
      match(2, 6, 8, 8),
      match(3, 1, 5, 5),
      match(3, 2, 6, 6),
      match(3, 3, 7, 7),
      match(3, 4, 8, 8),
    ]);
    const first = row(tournament, 'p1');
    const third = row(tournament, 'p3');
    expect(first.points).toBe(3);
    expect(third.points).toBe(3);
    expect(first.opponentWinRate).toBeCloseTo(4 / 9);
    expect(third.opponentWinRate).toBeCloseTo(4 / 9);
    expect(first.opponentsOpponentWinRate).toBeCloseTo(11 / 27);
    expect(third.opponentsOpponentWinRate).toBeCloseTo(15 / 27);
    expect(third.position).toBeLessThan(first.position);
  });

  it('não conta resultados apenas reportados ou partidas fora das rodadas', () => {
    const pending = match(1, 3, 4, 3);
    pending.status = 'reported';
    const tournament = withMatches(4, [match(1, 1, 2, 1), pending]);
    tournament.tournamentMatches.push(match(2, 1, 3, 3));
    expect(row(tournament, 'p3')).toMatchObject({
      played: 0,
      points: 0,
      opponentWinRate: null,
    });
    expect(row(tournament, 'p1').played).toBe(1);
  });

  it('recalcula pontos e desempates após correção e mantém a projeção no encerramento', () => {
    let tournament = iniciarRodadaSuica(gerarPrimeiraRodadaSuica(configured(5), () => 0));
    const normalMatches = tournament.tournamentMatches.filter((item) => item.player2Id);
    const target = normalMatches[0];
    expect(() => finalizarRodadaSuica(tournament)).toThrow(/revisão/);
    for (const item of normalMatches)
      tournament = registrarResultadoPartidaSuica(tournament, item.id, {
        gameOutcomes: ['player1-win', 'player1-win'],
      });
    expect(row(tournament, target.player1Id).points).toBe(3);
    expect(row(tournament, target.player1Id).opponentWinRate).toBe(0.25);
    tournament = registrarResultadoPartidaSuica(tournament, target.id, {
      gameOutcomes: ['player2-win', 'player2-win'],
    });
    expect(row(tournament, target.player1Id).points).toBe(0);
    expect(row(tournament, target.player2Id!).points).toBe(3);
    expect(row(tournament, target.player1Id).opponentWinRate).toBe(1);
    const completed = finalizarRodadaSuica(tournament);
    expect(calcularClassificacaoSuica(completed)).toEqual(
      calcularClassificacaoSuica(tournament),
    );
    expect(() =>
      registrarResultadoPartidaSuica(completed, target.id, {
        gameOutcomes: ['draw', 'draw', 'draw'],
      }),
    ).toThrow();
  });

  it('conta derrota dupla e vitória administrativa', () => {
    const tournament = withMatches(4, [
      match(1, 1, 2, undefined, 'double-loss'),
      match(1, 3, 4, 4, 'administrative-win'),
    ]);
    expect(row(tournament, 'p1')).toMatchObject({ losses: 1, points: 0 });
    expect(row(tournament, 'p2')).toMatchObject({ losses: 1, points: 0 });
    expect(row(tournament, 'p4')).toMatchObject({ wins: 1, points: 3 });
  });

  it('aplica teto de 75% ao percentual do adversário desistente', () => {
    const tournament = withMatches(4, [match(1, 1, 2, 1), match(1, 3, 4, 3)]);
    tournament.entries[0].status = 'dropped';
    expect(row(tournament, 'p2').opponentWinRate).toBe(0.75);
    expect(row(tournament, 'p4').opponentWinRate).toBe(1);
  });

  it('guarda um snapshot versionado e aceita configurações anteriores sem snapshot', () => {
    const tournament = withMatches(4, [match(1, 1, 2, 1), match(1, 3, 4)]);
    expect(tournament.config?.standingsRules).toEqual(LOCAL_STANDINGS_RULES);
    expect(tournament.config?.standingsRules).not.toBe(LOCAL_STANDINGS_RULES);
    const expected = calcularClassificacaoSuica(tournament);
    delete tournament.config!.standingsRules;
    expect(calcularClassificacaoSuica(tournament)).toEqual(expected);
  });

  it('usa os valores do snapshot do evento em vez de alterar torneios já criados', () => {
    const tournament = withMatches(4, [match(1, 1, 2, 1), match(1, 3, 4)]);
    tournament.config!.standingsRules = {
      ...LOCAL_STANDINGS_RULES,
      winPoints: 5,
      drawPoints: 2,
      minimumWinRate: 0.3,
    };
    expect(row(tournament, 'p1')).toMatchObject({ points: 5, opponentWinRate: 0.3 });
    expect(row(tournament, 'p3').points).toBe(2);
  });

  it('rejeita resultados inválidos em vez de atribuir pontos a outro jogador', () => {
    expect(() => calcularClassificacaoSuica(withMatches(4, [match(1, 1, 2, 9)]))).toThrow(
      /vencedor/,
    );
    expect(() =>
      calcularClassificacaoSuica(withMatches(4, [match(1, 1, 2, 1), match(1, 3, 1, 3)])),
    ).toThrow(/repetido/);
    expect(() =>
      calcularClassificacaoSuica(withMatches(4, [match(1, 1, 2, 1, 'bye')])),
    ).toThrow(/bye/);
  });
});
