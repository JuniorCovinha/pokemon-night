import { describe, expect, it } from 'vitest';
import {
  sortearConfrontos,
  gerarBracket,
  registrarVencedor,
  desfazerVencedor,
  obterCampeaoId,
} from './bracketService';
import type { Player } from '@/types';

const players: Player[] = [
  { id: 'p1', name: 'João' },
  { id: 'p2', name: 'Pedro' },
  { id: 'p3', name: 'Lucas' },
  { id: 'p4', name: 'Rafael' },
];

describe('sortearConfrontos', () => {
  it('lança erro quando a quantidade de jogadores não é potência de 2', () => {
    expect(() => sortearConfrontos(players.slice(0, 3))).toThrow(/potência de 2/);
  });

  it('retorna todos os jogadores, apenas em outra ordem possível', () => {
    const resultado = sortearConfrontos(players);
    expect(resultado.map((p) => p.id).sort()).toEqual(players.map((p) => p.id).sort());
  });
});

describe('gerarBracket', () => {
  it('gera o número correto de rodadas para 4 jogadores (semifinal + final)', () => {
    const bracket = gerarBracket(players);
    expect(bracket.rounds).toHaveLength(2);
    expect(bracket.rounds[0].matches).toHaveLength(2);
    expect(bracket.rounds[1].matches).toHaveLength(1);
  });

  it('nomeia as rodadas corretamente', () => {
    const bracket = gerarBracket(players);
    expect(bracket.rounds[0].name).toBe('Semifinal');
    expect(bracket.rounds[1].name).toBe('Final');
  });

  it('preenche os jogadores apenas na primeira rodada', () => {
    const bracket = gerarBracket(players);
    expect(bracket.rounds[1].matches[0].player1Id).toBeUndefined();
    expect(bracket.rounds[1].matches[0].player2Id).toBeUndefined();
  });

  it('inclui todos os jogadores exatamente uma vez na primeira rodada', () => {
    const bracket = gerarBracket(players);
    const idsNaPrimeiraRodada = bracket.rounds[0].matches.flatMap((m) => [
      m.player1Id,
      m.player2Id,
    ]);
    expect(idsNaPrimeiraRodada.sort()).toEqual(players.map((p) => p.id).sort());
  });
});

describe('registrarVencedor', () => {
  it('propaga o vencedor da semifinal 1 para o slot 1 da final', () => {
    const bracket = gerarBracket(players);
    const semifinal1 = bracket.rounds[0].matches[0];

    const atualizado = registrarVencedor(bracket, semifinal1.id, semifinal1.player1Id!);

    expect(atualizado.rounds[1].matches[0].player1Id).toBe(semifinal1.player1Id);
  });

  it('propaga o vencedor da semifinal 2 para o slot 2 da final', () => {
    const bracket = gerarBracket(players);
    const semifinal2 = bracket.rounds[0].matches[1];

    const atualizado = registrarVencedor(bracket, semifinal2.id, semifinal2.player2Id!);

    expect(atualizado.rounds[1].matches[0].player2Id).toBe(semifinal2.player2Id);
  });

  it('define o campeão quando a final é registrada', () => {
    let bracket = gerarBracket(players);
    const semifinal1 = bracket.rounds[0].matches[0];
    const semifinal2 = bracket.rounds[0].matches[1];

    bracket = registrarVencedor(bracket, semifinal1.id, semifinal1.player1Id!);
    bracket = registrarVencedor(bracket, semifinal2.id, semifinal2.player1Id!);

    const final = bracket.rounds[1].matches[0];
    bracket = registrarVencedor(bracket, final.id, final.player1Id!);

    expect(obterCampeaoId(bracket)).toBe(final.player1Id);
  });

  it('lança erro ao tentar registrar vencedor antes dos dois jogadores estarem definidos', () => {
    const bracket = gerarBracket(players);
    const final = bracket.rounds[1].matches[0];

    expect(() => registrarVencedor(bracket, final.id, players[0].id)).toThrow(
      /dois jogadores/,
    );
  });

  it('lança erro se o vencedor informado não for um dos jogadores da partida', () => {
    const bracket = gerarBracket(players);
    const semifinal1 = bracket.rounds[0].matches[0];

    expect(() => registrarVencedor(bracket, semifinal1.id, 'jogador-inexistente')).toThrow(
      /precisa ser um dos jogadores/,
    );
  });

  it('não muta o bracket original (imutabilidade)', () => {
    const bracket = gerarBracket(players);
    const semifinal1 = bracket.rounds[0].matches[0];

    registrarVencedor(bracket, semifinal1.id, semifinal1.player1Id!);

    expect(bracket.rounds[0].matches[0].winnerId).toBeUndefined();
  });
});

describe('desfazerVencedor', () => {
  it('limpa o vencedor da partida e a vaga que ele ocupava na próxima rodada', () => {
    const bracket = gerarBracket(players);
    const semifinal1 = bracket.rounds[0].matches[0];

    const comVencedor = registrarVencedor(bracket, semifinal1.id, semifinal1.player1Id!);
    const desfeito = desfazerVencedor(comVencedor, semifinal1.id);

    expect(desfeito.rounds[0].matches[0].winnerId).toBeUndefined();
    expect(desfeito.rounds[1].matches[0].player1Id).toBeUndefined();
  });

  it('em cascata, desfaz também a final se ela já dependia deste resultado', () => {
    let bracket = gerarBracket(players);
    const semifinal1 = bracket.rounds[0].matches[0];
    const semifinal2 = bracket.rounds[0].matches[1];

    bracket = registrarVencedor(bracket, semifinal1.id, semifinal1.player1Id!);
    bracket = registrarVencedor(bracket, semifinal2.id, semifinal2.player1Id!);

    const final = bracket.rounds[1].matches[0];
    bracket = registrarVencedor(bracket, final.id, final.player1Id!);
    expect(obterCampeaoId(bracket)).toBeDefined();

    const desfeito = desfazerVencedor(bracket, semifinal1.id);

    expect(desfeito.rounds[0].matches[0].winnerId).toBeUndefined();
    expect(desfeito.rounds[1].matches[0].winnerId).toBeUndefined();
    expect(desfeito.rounds[1].matches[0].player1Id).toBeUndefined();
    expect(obterCampeaoId(desfeito)).toBeUndefined();
  });

  it('lança erro ao tentar desfazer uma partida sem vencedor', () => {
    const bracket = gerarBracket(players);
    const semifinal1 = bracket.rounds[0].matches[0];

    expect(() => desfazerVencedor(bracket, semifinal1.id)).toThrow(/não tem um vencedor/);
  });

  it('lança erro para partida inexistente', () => {
    const bracket = gerarBracket(players);

    expect(() => desfazerVencedor(bracket, 'match-inexistente')).toThrow(/não encontrada/);
  });
});
