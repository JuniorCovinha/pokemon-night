import { describe, expect, it } from 'vitest';
import { criarTorneio, renomearJogador, desfazerVencedorDoTorneio } from './tournamentService';
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
    expect(() => renomearJogador(tournament, 'p1', '   ')).toThrow(/não pode ficar vazio/);
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
