import { describe, expect, it } from 'vitest';
import {
  criarTorneio,
  definirDecksDoTorneio,
  configurarCampeonatoComDecksDefinidos,
  iniciarCampeonatoComDecksDefinidos,
  renomearJogador,
  desfazerVencedorDoTorneio,
} from './tournamentService';
import {
  configurarCampeonatoSuico,
  criarConfiguracaoSuicaPadrao,
  recomendarRodadasSuicas,
} from './tournamentSetupService';
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

function createRegistrations(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    player: { id: `player-${index + 1}`, name: `Jogador ${index + 1}` },
    deck: { id: `deck-${index + 1}`, nome: `Deck ${index + 1}` },
  }));
}

describe('configuração do campeonato Suíço', () => {
  it.each([
    [4, 3],
    [5, 3],
    [8, 3],
    [9, 4],
    [16, 4],
  ])('para %i jogadores recomenda %i rodadas', (playerCount, expectedRounds) => {
    expect(recomendarRodadasSuicas(playerCount)).toBe(expectedRounds);
  });

  it.each([5, 7, 9])('aceita %i jogadores sem gerar chave eliminatória', (count) => {
    const atualizado = configurarCampeonatoSuico(criarTorneio([], []), {
      config: criarConfiguracaoSuicaPadrao(count),
      registrations: createRegistrations(count),
    });

    expect(atualizado.status).toBe('inscricoes-confirmadas');
    expect(atualizado.players).toHaveLength(count);
    expect(atualizado.entries).toHaveLength(count);
    expect(atualizado.deckRegistrations).toHaveLength(count);
    expect(atualizado.bracket).toBeUndefined();
  });

  it.each([3, 17])('rejeita %i jogadores fora do limite local', (count) => {
    expect(() =>
      configurarCampeonatoSuico(criarTorneio([], []), {
        config: {
          ...criarConfiguracaoSuicaPadrao(4),
          swissRoundCount: 3,
        },
        registrations: createRegistrations(count),
      }),
    ).toThrow(/entre 4 e 16 jogadores/);
  });

  it('normaliza o nome do evento e registra Top 4', () => {
    const registrations = createRegistrations(4);
    const atualizado = configurarCampeonatoSuico(criarTorneio([], []), {
      config: {
        ...criarConfiguracaoSuicaPadrao(4),
        name: '  Liga de sábado  ',
        structure: 'swiss-top-cut',
        topCutSize: 4,
      },
      registrations,
    });

    expect(atualizado.config).toMatchObject({
      name: 'Liga de sábado',
      structure: 'swiss-top-cut',
      topCutSize: 4,
    });
    expect(atualizado.assignments[0]).toEqual({
      playerId: registrations[0].player.id,
      deckId: registrations[0].deck.id,
    });
  });

  it('rejeita nomes repetidos e decks ausentes', () => {
    const repeatedNames = createRegistrations(4).map((registration) => ({
      ...registration,
      player: { ...registration.player, name: 'Mesmo nome' },
    }));
    const missingDeck = createRegistrations(4);
    missingDeck[0] = { ...missingDeck[0], deck: { id: '', nome: '' } };

    expect(() =>
      configurarCampeonatoSuico(criarTorneio([], []), {
        config: criarConfiguracaoSuicaPadrao(4),
        registrations: repeatedNames,
      }),
    ).toThrow(/nomes diferentes/);

    expect(() =>
      configurarCampeonatoSuico(criarTorneio([], []), {
        config: criarConfiguracaoSuicaPadrao(4),
        registrations: missingDeck,
      }),
    ).toThrow(/deck definido/);
  });
});

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
