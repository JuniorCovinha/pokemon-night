import { describe, expect, it } from 'vitest';
import type { Tournament } from '@/types';
import { criarTorneio } from './tournamentService';
import {
  configurarCampeonatoSuico,
  criarConfiguracaoSuicaPadrao,
} from './tournamentSetupService';
import {
  gerarPrimeiraRodadaSuica,
  gerarProximaRodadaSuica,
  iniciarRodadaSuica,
  finalizarRodadaSuica,
} from './roundService';
import { registrarResultadoPartidaSuica } from './matchResultService';
import { calcularClassificacaoSuica } from './standingsService';

function configured(count: number, rounds?: number): Tournament {
  const config = criarConfiguracaoSuicaPadrao(count);
  if (rounds) config.swissRoundCount = rounds;
  return configurarCampeonatoSuico(criarTorneio([], []), {
    config,
    registrations: Array.from({ length: count }, (_, index) => ({
      player: { id: `p${index + 1}`, name: `Jogador ${index + 1}` },
      deck: { id: `d${index + 1}`, nome: `Deck ${index + 1}` },
    })),
  });
}

function complete(tournament: Tournament): Tournament {
  let state = iniciarRodadaSuica(tournament);
  for (const match of state.tournamentMatches.filter(
    (item) => item.roundNumber === state.swissRounds.at(-1)!.number && item.player2Id,
  )) {
    state = registrarResultadoPartidaSuica(state, match.id, {
      gameOutcomes: ['player1-win', 'player1-win'],
    });
  }
  return finalizarRodadaSuica(state);
}

describe('progressão Suíça', () => {
  it.each(Array.from({ length: 13 }, (_, index) => index + 4))(
    'completa todas as rodadas recomendadas com %i jogadores sem revanche ou bye repetido',
    (count) => {
      let state = configured(count);
      let seed = count;
      const random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 2 ** 32;
      };
      let id = 0;
      const ids = () => `match-${++id}`;
      const opponents = new Set<string>();
      const byes = new Set<string>();
      const roundCount = state.config!.swissRoundCount;
      for (let number = 1; number <= roundCount; number += 1) {
        const previous = structuredClone(state);
        const oldRoundCount = state.swissRounds.length;
        state =
          number === 1
            ? gerarPrimeiraRodadaSuica(state, random, ids)
            : gerarProximaRodadaSuica(state, random, ids);
        expect(state.swissRounds.slice(0, oldRoundCount)).toEqual(previous.swissRounds);
        expect(
          state.tournamentMatches.slice(0, previous.tournamentMatches.length),
        ).toEqual(previous.tournamentMatches);
        expect(state.status).toBe('rodada-suica-pareada');
        const round = state.swissRounds.at(-1)!;
        const matches = state.tournamentMatches.filter((match) =>
          round.matchIds.includes(match.id),
        );
        const participants = matches.flatMap((match) =>
          match.player2Id ? [match.player1Id, match.player2Id] : [match.player1Id],
        );
        expect(participants).toHaveLength(count);
        expect(new Set(participants).size).toBe(count);
        expect(matches.filter((match) => !match.player2Id)).toHaveLength(count % 2);
        expect(
          matches.filter((match) => match.player2Id).map((match) => match.tableNumber),
        ).toEqual(Array.from({ length: Math.floor(count / 2) }, (_, index) => index + 1));
        for (const match of matches) {
          if (match.player2Id) {
            const pair = [match.player1Id, match.player2Id].sort().join('/');
            expect(opponents.has(pair)).toBe(false);
            opponents.add(pair);
          } else {
            expect(byes.has(match.player1Id)).toBe(false);
            byes.add(match.player1Id);
          }
        }
        if (number > 1) {
          expect(round.pairingOrder).toHaveLength(count);
          expect(round.pairingRulesVersion).toBe('local-pairing-2026-09-v1');
          expect(calcularClassificacaoSuica(state)).toEqual(
            calcularClassificacaoSuica(previous),
          );
        }
        state = complete(state);
        expect(
          calcularClassificacaoSuica(state).every((row) => row.played === number),
        ).toBe(true);
      }
      expect(state.status).toBe('suico-concluido');
      expect(state.championId).toBeUndefined();
      expect(() => gerarProximaRodadaSuica(state)).toThrow(/já foram concluídas/);
    },
  );

  it('bloqueia avanço antes do fechamento, duplo clique e resultados antigos', () => {
    const initial = configured(4);
    const paired = gerarPrimeiraRodadaSuica(initial, () => 0.999);
    const active = iniciarRodadaSuica(paired);
    for (const state of [initial, paired, active])
      expect(() => gerarProximaRodadaSuica(state)).toThrow(/Encerre/);
    const completed = complete(paired);
    const next = gerarProximaRodadaSuica(completed, () => 0.999);
    expect(() => gerarProximaRodadaSuica(next)).toThrow(/Encerre/);
    expect(() =>
      registrarResultadoPartidaSuica(
        iniciarRodadaSuica(next),
        completed.tournamentMatches[0].id,
        { gameOutcomes: ['draw', 'draw', 'draw'] },
      ),
    ).toThrow(/não pertence/);
  });

  it('usa os resultados corrigidos para os próximos grupos de pontos', () => {
    let state = iniciarRodadaSuica(gerarPrimeiraRodadaSuica(configured(4), () => 0.999));
    for (const match of state.tournamentMatches)
      state = registrarResultadoPartidaSuica(state, match.id, {
        gameOutcomes: ['player1-win', 'player1-win'],
      });
    state = registrarResultadoPartidaSuica(state, state.tournamentMatches[0].id, {
      gameOutcomes: ['player2-win', 'player2-win'],
    });
    const completed = finalizarRodadaSuica(state);
    const next = gerarProximaRodadaSuica(completed, () => 0.999);
    const keys = next.tournamentMatches
      .filter((match) => match.roundNumber === 2)
      .map((match) => [match.player1Id, match.player2Id].sort().join('/'));
    expect(keys).toEqual(['p2/p3', 'p1/p4']);
    expect(completed.tournamentMatches[0].revision).toBe(2);
  });

  it('pareia somente inscrições ativas e mantém o histórico dos desistentes', () => {
    const completed = complete(gerarPrimeiraRodadaSuica(configured(6), () => 0.999));
    completed.entries[0].status = 'dropped';
    completed.entries[1].status = 'disqualified';
    const next = gerarProximaRodadaSuica(completed, () => 0.999);
    const players = next.tournamentMatches
      .filter((match) => match.roundNumber === 2)
      .flatMap((match) => [match.player1Id, match.player2Id]);
    expect(players).not.toContain('p1');
    expect(players).not.toContain('p2');
    expect(next.tournamentMatches.slice(0, 3)).toEqual(completed.tournamentMatches);
  });

  it('rejeita histórico incompleto ou pendente e colisões de IDs', () => {
    const completed = complete(gerarPrimeiraRodadaSuica(configured(4), () => 0.999));
    expect(() =>
      gerarProximaRodadaSuica({
        ...completed,
        tournamentMatches: completed.tournamentMatches.slice(1),
      }),
    ).toThrow(/ausente/);
    const pending = structuredClone(completed);
    pending.tournamentMatches[0].status = 'reported';
    expect(() => gerarProximaRodadaSuica(pending)).toThrow(/pendentes/);
    expect(() =>
      gerarProximaRodadaSuica(
        completed,
        () => 0.999,
        () => completed.tournamentMatches[0].id,
      ),
    ).toThrow(/identificador único/);
  });

  it('mantém estado intacto se esgotar adversários numa configuração longa', () => {
    let state = configured(4, 4);
    state = complete(gerarPrimeiraRodadaSuica(state, () => 0.999));
    state = complete(gerarProximaRodadaSuica(state, () => 0.999));
    state = complete(gerarProximaRodadaSuica(state, () => 0.999));
    const before = structuredClone(state);
    expect(() => gerarProximaRodadaSuica(state)).toThrow(/Não há combinação/);
    expect(state).toEqual(before);
  });

  it('encerra também eventos de uma rodada e Suíço com Top 4 sem gerar chave automaticamente', () => {
    const tournament = configured(4, 1);
    tournament.config!.structure = 'swiss-top-cut';
    tournament.config!.topCutSize = 4;
    const completed = complete(gerarPrimeiraRodadaSuica(tournament));
    expect(completed.status).toBe('suico-concluido');
    expect(completed.bracket).toBeUndefined();
  });
});
