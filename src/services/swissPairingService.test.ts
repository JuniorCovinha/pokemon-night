import { describe, expect, it } from 'vitest';
import {
  gerarPareamentosPrimeiraRodada,
  gerarPareamentosProximaRodada,
  type SwissPairingPlayer,
} from './swissPairingService';

function sequenceRandom(values: number[]) {
  let index = 0;
  return () => values[index++ % values.length];
}

describe('gerarPareamentosPrimeiraRodada', () => {
  it('forma mesas sem repetir jogadores quando a quantidade é par', () => {
    const pairings = gerarPareamentosPrimeiraRodada(
      ['p1', 'p2', 'p3', 'p4'],
      sequenceRandom([0.1, 0.7, 0.4]),
    );
    const pairedPlayers = pairings.flatMap((pairing) => [
      pairing.player1Id,
      pairing.player2Id,
    ]);

    expect(pairings).toHaveLength(2);
    expect(pairings.every((pairing) => !pairing.isBye)).toBe(true);
    expect(new Set(pairedPlayers)).toEqual(new Set(['p1', 'p2', 'p3', 'p4']));
  });

  it('cria exatamente um bye para uma quantidade ímpar', () => {
    const pairings = gerarPareamentosPrimeiraRodada(
      ['p1', 'p2', 'p3', 'p4', 'p5'],
      sequenceRandom([0.2, 0.8, 0.3, 0.6]),
    );
    const bye = pairings.filter((pairing) => pairing.isBye);
    const allPlayers = pairings.flatMap((pairing) =>
      pairing.player2Id ? [pairing.player1Id, pairing.player2Id] : [pairing.player1Id],
    );

    expect(pairings).toHaveLength(3);
    expect(bye).toHaveLength(1);
    expect(bye[0].player2Id).toBeUndefined();
    expect(new Set(allPlayers)).toEqual(new Set(['p1', 'p2', 'p3', 'p4', 'p5']));
  });

  it('produz o mesmo resultado quando recebe a mesma sequência aleatória', () => {
    const ids = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
    const values = [0.9, 0.1, 0.6, 0.3, 0.8];

    expect(gerarPareamentosPrimeiraRodada(ids, sequenceRandom(values))).toEqual(
      gerarPareamentosPrimeiraRodada(ids, sequenceRandom(values)),
    );
  });

  it('rejeita jogadores repetidos e fontes aleatórias inválidas', () => {
    expect(() => gerarPareamentosPrimeiraRodada(['p1', 'p1'], () => 0.5)).toThrow(
      /identificadores únicos/,
    );
    expect(() => gerarPareamentosPrimeiraRodada(['p1', 'p2'], () => 1)).toThrow(
      /entre 0 e 1/,
    );
  });
});

function candidates(points: number[]): SwissPairingPlayer[] {
  return points.map((score, index) => ({
    playerId: `p${index + 1}`,
    points: score,
    hadBye: false,
  }));
}

function pairKey(first: string, second: string) {
  return [first, second].sort().join('/');
}

describe('pareamentos das próximas rodadas', () => {
  it('aproxima pontuações iguais e não usa a colocação como seed eliminatória', () => {
    const players = candidates([6, 3, 6, 3, 0, 0]);
    const result = gerarPareamentosProximaRodada(players, [], () => 0.999);
    expect(
      result.pairings.map((pair) => pairKey(pair.player1Id, pair.player2Id!)),
    ).toEqual(['p1/p3', 'p2/p4', 'p5/p6']);
    expect(players.map((player) => player.points)).toEqual([6, 3, 6, 3, 0, 0]);
  });

  it('volta atrás quando a primeira escolha deixaria os últimos jogadores sem oponente', () => {
    const history = [
      { player1Id: 'p1', player2Id: 'p4' },
      { player1Id: 'p3', player2Id: 'p2' },
      { player1Id: 'p3', player2Id: 'p4' },
    ];
    const { pairings } = gerarPareamentosProximaRodada(
      candidates([0, 0, 0, 0]),
      history,
      () => 0.999,
    );
    expect(pairings.map((pair) => pairKey(pair.player1Id, pair.player2Id!))).toEqual([
      'p1/p3',
      'p2/p4',
    ]);
  });

  it('sorteia apenas entre soluções equivalentes e registra uma ordem reproduzível', () => {
    const players = candidates([3, 3, 3, 3, 0, 0, 0, 0]);
    const values = [0.5, 0.2, 0.8, 0.1];
    const first = gerarPareamentosProximaRodada(players, [], sequenceRandom(values));
    const second = gerarPareamentosProximaRodada(players, [], sequenceRandom(values));
    expect(first).toEqual(second);
    expect(new Set(first.pairingOrder)).toEqual(
      new Set(players.map((player) => player.playerId)),
    );
  });

  it('dá bye ao menor pontuador elegível e nunca a quem já recebeu', () => {
    const players = candidates([6, 3, 1, 0, 0]);
    players[3].hadBye = true;
    const { pairings } = gerarPareamentosProximaRodada(players, [], () => 0.999);
    expect(pairings.filter((pair) => pair.isBye)).toEqual([
      { player1Id: 'p5', isBye: true },
    ]);
    expect(
      pairings
        .flatMap((pair) =>
          pair.player2Id ? [pair.player1Id, pair.player2Id] : [pair.player1Id],
        )
        .sort(),
    ).toEqual(['p1', 'p2', 'p3', 'p4', 'p5']);
  });

  it('considera outro beneficiário do bye quando o menor pontuador impede o pareamento completo', () => {
    const history = ['p2', 'p3', 'p4'].map((id) => ({ player1Id: 'p1', player2Id: id }));
    const { pairings } = gerarPareamentosProximaRodada(
      candidates([3, 3, 3, 1, 0]),
      history,
      () => 0.999,
    );
    expect(pairings.find((pair) => pair.isBye)?.player1Id).toBe('p4');
    expect(
      pairings.some((pair) => pairKey(pair.player1Id, pair.player2Id ?? '') === 'p1/p5'),
    ).toBe(true);
  });

  it('não repete confrontos nem byes quando não existe solução', () => {
    const players = candidates([3, 3, 0, 0]);
    const history = players.flatMap((first, index) =>
      players
        .slice(index + 1)
        .map((second) => ({ player1Id: first.playerId, player2Id: second.playerId })),
    );
    expect(() => gerarPareamentosProximaRodada(players, history)).toThrow(
      /Não há combinação/,
    );
    expect(() =>
      gerarPareamentosProximaRodada(
        candidates([0, 0, 0]).map((player) => ({ ...player, hadBye: true })),
        [],
      ),
    ).toThrow(/Todos.*bye/);
  });

  it('valida tamanho, IDs, pontos e fonte aleatória antes de parear', () => {
    expect(() => gerarPareamentosProximaRodada(candidates([0]), [])).toThrow(/ativos/);
    expect(() =>
      gerarPareamentosProximaRodada(candidates(Array(17).fill(0)), []),
    ).toThrow(/ativos/);
    expect(() =>
      gerarPareamentosProximaRodada([candidates([0])[0], candidates([0])[0]], []),
    ).toThrow(/únicos/);
    expect(() => gerarPareamentosProximaRodada(candidates([0, NaN]), [])).toThrow(
      /pontuação/,
    );
    expect(() =>
      gerarPareamentosProximaRodada(candidates([0, 0]), [], () => NaN),
    ).toThrow(/entre 0 e 1/);
  });
});
