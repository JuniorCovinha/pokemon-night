import { describe, expect, it } from 'vitest';
import type { Tournament } from '@/types';
import { criarTorneio, reiniciarCampeonato } from './tournamentService';
import {
  configurarCampeonatoSuico,
  criarConfiguracaoSuicaPadrao,
} from './tournamentSetupService';
import {
  gerarPrimeiraRodadaSuica,
  iniciarRodadaSuica,
  finalizarRodadaSuica,
  gerarProximaRodadaSuica,
  reabrirRodadaSuica,
} from './roundService';
import { registrarResultadoPartidaSuica } from './matchResultService';
import { calcularClassificacaoSuica } from './standingsService';

const firstTime = '2026-09-07T22:00:00.000Z';
const reopenTime = '2026-09-07T22:10:00.000Z';
const correctionTime = '2026-09-07T22:11:00.000Z';
const finishTime = '2026-09-07T22:12:00.000Z';

function active(count = 4, rounds = 3): Tournament {
  const configured = configurarCampeonatoSuico(criarTorneio([], []), {
    config: { ...criarConfiguracaoSuicaPadrao(count), swissRoundCount: rounds },
    registrations: Array.from({ length: count }, (_, index) => ({
      player: { id: `p${index + 1}`, name: `Jogador ${index + 1}` },
      deck: { id: `d${index + 1}`, nome: `Deck ${index + 1}` },
    })),
  });
  return iniciarRodadaSuica(
    gerarPrimeiraRodadaSuica(configured, () => 0.999),
    () => firstTime,
  );
}

function close(state: Tournament): Tournament {
  for (const match of state.tournamentMatches.filter(
    (item) => item.roundNumber === state.swissRounds.at(-1)!.number && item.player2Id,
  )) {
    state = registrarResultadoPartidaSuica(
      state,
      match.id,
      { gameOutcomes: ['player1-win', 'player1-win'] },
      () => firstTime,
    );
  }
  return finalizarRodadaSuica(state, () => firstTime);
}

describe('reabertura e histórico de alterações', () => {
  it('reabre a rodada ímpar preservando resultados, bye e classificação', () => {
    const completed = close(active(5));
    const original = structuredClone(completed);
    const reopened = reabrirRodadaSuica(
      completed,
      1,
      '  Erro na mesa 1  ',
      () => reopenTime,
    );
    expect(reopened.status).toBe('rodada-suica-revisao');
    expect(reopened.swissRounds[0]).toMatchObject({
      status: 'awaiting-results',
      revision: 2,
      startedAt: firstTime,
    });
    expect(reopened.swissRounds[0]).not.toHaveProperty('completedAt');
    expect(reopened.tournamentMatches).toEqual(completed.tournamentMatches);
    expect(calcularClassificacaoSuica(reopened)).toEqual(
      calcularClassificacaoSuica(completed),
    );
    expect(reopened.auditLog?.at(-1)).toMatchObject({
      kind: 'round-reopened',
      reason: 'Erro na mesa 1',
      actor: 'local-organizer',
      occurredAt: reopenTime,
      before: { status: 'completed', completedAt: firstTime, revision: 1 },
      after: { status: 'awaiting-results', revision: 2 },
    });
    expect(completed).toEqual(original);
    expect(() => gerarProximaRodadaSuica(reopened)).toThrow(/Encerre/);
    const bye = reopened.tournamentMatches.find((match) => match.result?.kind === 'bye')!;
    expect(() =>
      registrarResultadoPartidaSuica(reopened, bye.id, {
        gameOutcomes: ['draw', 'draw', 'draw'],
      }),
    ).toThrow(/bye/);
  });

  it('registra antes/depois, recalcula pontos e só libera o avanço ao encerrar novamente', () => {
    const completed = close(active());
    let state = reabrirRodadaSuica(completed, 1, 'Vencedor incorreto', () => reopenTime);
    const target = state.tournamentMatches[0];
    state = registrarResultadoPartidaSuica(
      state,
      target.id,
      { gameOutcomes: ['player2-win', 'player2-win'] },
      () => correctionTime,
    );
    expect(
      calcularClassificacaoSuica(state).find((row) => row.playerId === target.player1Id)
        ?.points,
    ).toBe(0);
    expect(
      calcularClassificacaoSuica(state).find((row) => row.playerId === target.player2Id)
        ?.points,
    ).toBe(3);
    expect(state.auditLog?.at(-1)).toMatchObject({
      kind: 'match-corrected',
      roundRevision: 2,
      occurredAt: correctionTime,
      before: { revision: 1, result: { winnerId: target.player1Id } },
      after: { revision: 2, result: { winnerId: target.player2Id } },
    });
    state = finalizarRodadaSuica(state, () => finishTime);
    expect(state.status).toBe('rodada-suica-concluida');
    expect(state.swissRounds[0]).toMatchObject({ revision: 2, completedAt: finishTime });
    expect(
      state.auditLog?.filter((entry) => entry.kind === 'round-completed'),
    ).toHaveLength(2);
    const next = gerarProximaRodadaSuica(state);
    expect(next.auditLog).toEqual(state.auditLog);
    expect(next.tournamentMatches[0].result?.winnerId).toBe(target.player2Id);
  });

  it('exige motivo e rejeita reabertura em estado ou rodada inválida', () => {
    const started = active();
    const completed = close(started);
    expect(() => reabrirRodadaSuica(started, 1, 'Erro')).toThrow(
      /última rodada encerrada/,
    );
    expect(() => reabrirRodadaSuica(completed, 1, '  ')).toThrow(/justificativa/);
    expect(() => reabrirRodadaSuica(completed, 1, 'x'.repeat(501))).toThrow(/500/);
    expect(() => reabrirRodadaSuica(completed, 2, 'Erro')).toThrow(/não foi encontrada/);
    const reopened = reabrirRodadaSuica(completed, 1, 'Erro');
    expect(() => reabrirRodadaSuica(reopened, 1, 'Erro')).toThrow(
      /última rodada encerrada/,
    );
  });

  it('protege a rodada anterior desde a geração dos próximos pareamentos', () => {
    const next = gerarProximaRodadaSuica(close(active()));
    for (const state of [
      next,
      iniciarRodadaSuica(next),
      close(iniciarRodadaSuica(next)),
    ]) {
      const original = structuredClone(state);
      expect(() => reabrirRodadaSuica(state, 1, 'Erro')).toThrow(
        /posterior já foi gerada/,
      );
      expect(state).toEqual(original);
    }
  });

  it('permite revisar a última rodada do evento e voltar à conclusão do Suíço', () => {
    const completed = close(active(4, 1));
    expect(completed.status).toBe('suico-concluido');
    const reopened = reabrirRodadaSuica(completed, 1, 'Conferência final');
    expect(reopened.status).toBe('rodada-suica-revisao');
    const reclosed = finalizarRodadaSuica(reopened);
    expect(reclosed.status).toBe('suico-concluido');
    expect(() => gerarProximaRodadaSuica(reclosed)).toThrow(/concluídas/);
  });

  it('não altera revisão nem histórico ao confirmar o mesmo resultado', () => {
    const state = active();
    const target = state.tournamentMatches[0];
    const input = { gameOutcomes: ['player1-win', 'player1-win'] as const };
    const confirmed = registrarResultadoPartidaSuica(state, target.id, {
      gameOutcomes: [...input.gameOutcomes],
    });
    expect(
      registrarResultadoPartidaSuica(confirmed, target.id, {
        gameOutcomes: [...input.gameOutcomes],
      }),
    ).toBe(confirmed);
    expect(confirmed.auditLog).toHaveLength(1);
  });

  it('audita mudanças nos jogos mesmo quando o vencedor continua o mesmo', () => {
    const state = active();
    const match = state.tournamentMatches[0];
    const confirmed = registrarResultadoPartidaSuica(state, match.id, {
      gameOutcomes: ['player1-win', 'player1-win'],
    });
    const corrected = registrarResultadoPartidaSuica(confirmed, match.id, {
      gameOutcomes: ['player1-win', 'player2-win', 'player1-win'],
    });
    expect(corrected.tournamentMatches[0].revision).toBe(2);
    expect(corrected.auditLog?.at(-1)).toMatchObject({
      kind: 'match-corrected',
      before: { result: { gameOutcomes: ['player1-win', 'player1-win'] } },
      after: { result: { gameOutcomes: ['player1-win', 'player2-win', 'player1-win'] } },
    });
  });

  it('mantém snapshots isolados, sequência e horários sem alterar o estado anterior', () => {
    const state = active();
    const confirmed = registrarResultadoPartidaSuica(
      state,
      state.tournamentMatches[0].id,
      { gameOutcomes: ['player1-win', 'player1-win'] },
      () => firstTime,
    );
    const entry = confirmed.auditLog![0];
    expect(entry).toMatchObject({
      id: `${state.id}:audit:1`,
      sequence: 1,
      occurredAt: firstTime,
      kind: 'match-confirmed',
    });
    expect(state.auditLog).toEqual([]);
    const logSnapshot = structuredClone(entry);
    confirmed.tournamentMatches[0].result!.gameOutcomes[0] = 'draw';
    expect(entry).toEqual(logSnapshot);
    const completed = close(active());
    const reopened = reabrirRodadaSuica(completed, 1, 'Erro', () => reopenTime);
    reopened.swissRounds[0].matchIds.push('mutação externa');
    expect(reopened.auditLog?.at(-1)?.after).not.toHaveProperty(
      'matchIds',
      reopened.swissRounds[0].matchIds,
    );
    expect(completed.swissRounds[0].matchIds).not.toContain('mutação externa');
  });

  it('aceita evento anterior sem log e limpa histórico ao criar outro campeonato', () => {
    const completed = close(active());
    delete completed.auditLog;
    const reopened = reabrirRodadaSuica(completed, 1, 'Revisão de evento anterior');
    expect(reopened.auditLog?.[0]).toMatchObject({ sequence: 1, kind: 'round-reopened' });
    expect(reiniciarCampeonato(reopened).auditLog).toEqual([]);
  });

  it('rejeita rodadas inconsistentes e campeonato com campeão definido', () => {
    const completed = close(active());
    expect(() =>
      reabrirRodadaSuica({ ...completed, tournamentMatches: [] }, 1, 'Erro'),
    ).toThrow(/ausente/);
    expect(() =>
      reabrirRodadaSuica({ ...completed, championId: 'p1' }, 1, 'Erro'),
    ).toThrow(/campeão/);
    const inconsistent = { ...completed, status: 'rodada-suica-revisao' as const };
    expect(() =>
      registrarResultadoPartidaSuica(inconsistent, inconsistent.tournamentMatches[0].id, {
        gameOutcomes: ['draw', 'draw', 'draw'],
      }),
    ).toThrow(/rodada precisa estar aberta/);
  });
});
