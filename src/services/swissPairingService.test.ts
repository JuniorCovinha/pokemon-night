import { describe, expect, it } from 'vitest';
import { gerarPareamentosPrimeiraRodada } from './swissPairingService';

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
