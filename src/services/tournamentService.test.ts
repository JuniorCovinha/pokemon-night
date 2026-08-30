import { describe, expect, it } from 'vitest';
import {
  criarTorneio,
  definirDecksDoTorneio,
  configurarCampeonatoComDecksDefinidos,
  iniciarCampeonatoComDecksDefinidos,
  renomearJogador,
  desfazerVencedorDoTorneio,
} from './tournamentService';
import { sortearConfrontos, gerarBracket, registrarVencedor } from './bracketService';
import type { Deck, Player } from '@/types';

const players: Player[] = [
  { id: 'p1', name: 'João' },
  { id: 'p2', name: 'Pedro' },
];

const decks: Deck[] = [
  { id: 'd1', nome: 'Charizard ex' },
  { id: 'd2', nome: 'Lugia VSTAR' },
];

describe('definirDecksDoTorneio', () => {
  it('substitui os decks disponíveis antes do sorteio', () => {
    const tournament = criarTorneio(players, []);
    const atualizado = definirDecksDoTorneio(tournament, decks);

    expect(atualizado.decks).toEqual(decks);
    expect(atualizado.status).toBe('registrando-jogadores');
  });

  it('não permite alterar os decks depois do sorteio', () => {
    const tournament = {
      ...criarTorneio(players, decks),
      status: 'decks-sorteados' as const,
    };

    expect(() => definirDecksDoTorneio(tournament, decks)).toThrow(/antes do sorteio/);
  });

  it('limita o catálogo do modo Sorteio a 10 decks', () => {
    const muitosDecks = Array.from({ length: 11 }, (_, index) => ({
      id: `d${index + 1}`,
      nome: `Deck ${index + 1}`,
    }));

    expect(() => definirDecksDoTorneio(criarTorneio(players, []), muitosDecks)).toThrow(
      /no máximo 10 decks/,
    );
  });
});

describe('campeonato com decks predefinidos', () => {
  it('mantém cada jogador vinculado ao deck informado', () => {
    const tournament = criarTorneio([], []);
    const atualizado = configurarCampeonatoComDecksDefinidos(tournament, [
      { player: players[0], deck: decks[0] },
      { player: players[1], deck: decks[1] },
    ]);

    expect(atualizado.status).toBe('decks-sorteados');
    expect(atualizado.assignments).toEqual([
      { playerId: 'p1', deckId: 'd1' },
      { playerId: 'p2', deckId: 'd2' },
    ]);
  });

  it('permite que jogadores diferentes usem o mesmo deck', () => {
    const atualizado = configurarCampeonatoComDecksDefinidos(criarTorneio([], []), [
      { player: players[0], deck: decks[0] },
      { player: players[1], deck: decks[0] },
    ]);

    expect(atualizado.decks).toEqual([decks[0]]);
    expect(atualizado.assignments.map((item) => item.deckId)).toEqual(['d1', 'd1']);
  });

  it('configura as inscrições e sorteia os confrontos', () => {
    const iniciado = iniciarCampeonatoComDecksDefinidos(criarTorneio([], []), [
      { player: players[0], deck: decks[0] },
      { player: players[1], deck: decks[1] },
    ]);

    expect(iniciado.status).toBe('chave-gerada');
    expect(iniciado.bracket?.rounds).toHaveLength(1);
    expect(iniciado.bracket?.rounds[0].matches[0]).toMatchObject({
      player1Id: expect.any(String),
      player2Id: expect.any(String),
    });
  });

  it('rejeita quantidades que não formam uma chave completa', () => {
    const terceiroJogador = { id: 'p3', name: 'Lucas' };

    expect(() =>
      configurarCampeonatoComDecksDefinidos(criarTorneio([], []), [
        { player: players[0], deck: decks[0] },
        { player: players[1], deck: decks[1] },
        { player: terceiroJogador, deck: decks[0] },
      ]),
    ).toThrow(/2, 4, 8 ou 16/);
  });
});

describe('renomearJogador', () => {
  it('atualiza o nome do jogador correto, sem afetar os demais', () => {
    const tournament = criarTorneio(players, decks);
    const atualizado = renomearJogador(tournament, 'p1', 'João Pedro');

    expect(atualizado.players.find((p) => p.id === 'p1')?.name).toBe('João Pedro');
    expect(atualizado.players.find((p) => p.id === 'p2')?.name).toBe('Pedro');
  });

  it('remove espaços em branco nas extremidades', () => {
    const tournament = criarTorneio(players, decks);
    const atualizado = renomearJogador(tournament, 'p1', '  Zé  ');

    expect(atualizado.players.find((p) => p.id === 'p1')?.name).toBe('Zé');
  });

  it('lança erro se o novo nome ficar vazio', () => {
    const tournament = criarTorneio(players, decks);
    expect(() => renomearJogador(tournament, 'p1', '   ')).toThrow(
      /não pode ficar vazio/,
    );
  });
});

describe('desfazerVencedorDoTorneio', () => {
  it('volta o status de finalizado para em-andamento ao desfazer a final', () => {
    let tournament = criarTorneio(players, decks);
    tournament = { ...tournament, bracket: gerarBracket(sortearConfrontos(players)) };

    const final = tournament.bracket!.rounds[0].matches[0];
    tournament = {
      ...tournament,
      bracket: registrarVencedor(tournament.bracket!, final.id, final.player1Id!),
      championId: final.player1Id,
      status: 'finalizado',
    };

    const desfeito = desfazerVencedorDoTorneio(tournament, final.id);

    expect(desfeito.status).toBe('em-andamento');
    expect(desfeito.championId).toBeUndefined();
  });
});
