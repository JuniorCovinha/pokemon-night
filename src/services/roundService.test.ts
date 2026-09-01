import { describe, expect, it } from 'vitest';
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

function createConfiguredTournament(count: number) {
  return configurarCampeonatoSuico(criarTorneio([], []), {
    config: criarConfiguracaoSuicaPadrao(count),
    registrations: Array.from({ length: count }, (_, index) => ({
      player: { id: `p${index + 1}`, name: `Jogador ${index + 1}` },
      deck: { id: `d${index + 1}`, nome: `Deck ${index + 1}` },
    })),
  });
}

function incrementalIdFactory() {
  let index = 0;
  return (prefix: string) => `${prefix}-${++index}`;
}

describe('gerarPrimeiraRodadaSuica', () => {
  it('gera mesas numeradas para uma quantidade par', () => {
    const tournament = createConfiguredTournament(4);
    const updated = gerarPrimeiraRodadaSuica(tournament, () => 0, incrementalIdFactory());

    expect(updated.status).toBe('rodada-suica-pareada');
    expect(updated.swissRounds).toEqual([
      {
        number: 1,
        status: 'paired',
        matchIds: ['swiss-match-1', 'swiss-match-2'],
        revision: 1,
      },
    ]);
    expect(updated.tournamentMatches.map((match) => match.tableNumber)).toEqual([1, 2]);
    expect(updated.tournamentMatches.every((match) => match.status === 'paired')).toBe(
      true,
    );
    expect(tournament.swissRounds).toHaveLength(0);
  });

  it('confirma o bye sem criar adversário fictício', () => {
    const updated = gerarPrimeiraRodadaSuica(
      createConfiguredTournament(5),
      () => 0,
      incrementalIdFactory(),
    );
    const bye = updated.tournamentMatches.find((match) => match.result?.kind === 'bye');

    expect(updated.tournamentMatches).toHaveLength(3);
    expect(bye).toMatchObject({
      status: 'confirmed',
      result: {
        kind: 'bye',
        winnerId: expect.any(String),
        gameOutcomes: [],
      },
    });
    expect(bye).not.toHaveProperty('tableNumber');
    expect(bye).not.toHaveProperty('player2Id');
  });

  it('não permite gerar a rodada antes da confirmação das inscrições', () => {
    expect(() => gerarPrimeiraRodadaSuica(criarTorneio([], []))).toThrow(
      /Confirme as inscrições/,
    );
  });

  it('não permite gerar novamente a primeira rodada', () => {
    const generated = gerarPrimeiraRodadaSuica(
      createConfiguredTournament(4),
      () => 0,
      incrementalIdFactory(),
    );

    expect(() =>
      gerarPrimeiraRodadaSuica(
        { ...generated, status: 'inscricoes-confirmadas' },
        () => 0,
        incrementalIdFactory(),
      ),
    ).toThrow(/já foi gerada/);
  });
});

describe('ciclo da rodada Suíça', () => {
  it('inicia somente as mesas jogáveis e preserva o bye confirmado', () => {
    const paired = gerarPrimeiraRodadaSuica(
      createConfiguredTournament(5),
      () => 0,
      incrementalIdFactory(),
    );
    const started = iniciarRodadaSuica(paired, () => '2026-08-31T20:00:00.000Z');
    const bye = started.tournamentMatches.find((match) => match.result?.kind === 'bye');
    const normalMatches = started.tournamentMatches.filter(
      (match) => match.result?.kind !== 'bye',
    );

    expect(started.status).toBe('rodada-suica-ativa');
    expect(started.swissRounds[0]).toMatchObject({
      status: 'active',
      startedAt: '2026-08-31T20:00:00.000Z',
    });
    expect(normalMatches.every((match) => match.status === 'active')).toBe(true);
    expect(bye?.status).toBe('confirmed');
  });

  it('encerra uma rodada revisada e registra o horário', () => {
    let tournament = iniciarRodadaSuica(
      gerarPrimeiraRodadaSuica(
        createConfiguredTournament(4),
        () => 0,
        incrementalIdFactory(),
      ),
    );

    for (const match of tournament.tournamentMatches) {
      tournament = registrarResultadoPartidaSuica(tournament, match.id, {
        gameOutcomes: ['player1-win', 'player1-win'],
      });
    }

    const completed = finalizarRodadaSuica(tournament, () => '2026-08-31T21:00:00.000Z');

    expect(completed.status).toBe('rodada-suica-concluida');
    expect(completed.swissRounds[0]).toMatchObject({
      status: 'completed',
      completedAt: '2026-08-31T21:00:00.000Z',
    });
  });

  it('bloqueia início e encerramento fora da ordem', () => {
    const configured = createConfiguredTournament(4);
    const paired = gerarPrimeiraRodadaSuica(configured, () => 0, incrementalIdFactory());

    expect(() => iniciarRodadaSuica(configured)).toThrow(/precisa estar pareada/);
    expect(() => finalizarRodadaSuica(paired)).toThrow(/precisa estar em revisão/);
  });
});
