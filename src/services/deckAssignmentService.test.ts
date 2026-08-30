import { describe, expect, it } from 'vitest';
import { sortearDecks } from './deckAssignmentService';
import type { Deck, Player } from '@/types';

const players: Player[] = [
  { id: 'p1', name: 'João' },
  { id: 'p2', name: 'Pedro' },
  { id: 'p3', name: 'Lucas' },
  { id: 'p4', name: 'Rafael' },
];

const decks: Deck[] = [
  { id: 'd1', nome: 'Charizard ex' },
  { id: 'd2', nome: 'Lugia VSTAR' },
  { id: 'd3', nome: 'Miraidon ex' },
  { id: 'd4', nome: 'Lost Box' },
];

describe('sortearDecks', () => {
  it('atribui exatamente um deck para cada jogador', () => {
    const assignments = sortearDecks(players, decks);

    expect(assignments).toHaveLength(players.length);
    players.forEach((player) => {
      expect(assignments.filter((a) => a.playerId === player.id)).toHaveLength(1);
    });
  });

  it('nunca repete um deck entre jogadores diferentes', () => {
    const assignments = sortearDecks(players, decks);
    const deckIds = assignments.map((a) => a.deckId);

    expect(new Set(deckIds).size).toBe(deckIds.length);
  });

  it('escolhe apenas um deck por jogador quando existem 10 opções', () => {
    const dezDecks = Array.from({ length: 10 }, (_, index) => ({
      id: `deck-${index + 1}`,
      nome: `Deck ${index + 1}`,
    }));

    const assignments = sortearDecks(players, dezDecks);

    expect(assignments).toHaveLength(players.length);
    expect(new Set(assignments.map((item) => item.deckId)).size).toBe(players.length);
  });

  it('lança erro quando há menos decks do que jogadores', () => {
    expect(() => sortearDecks(players, decks.slice(0, 2))).toThrow(/Decks insuficientes/);
  });

  it('lança erro quando não há jogadores', () => {
    expect(() => sortearDecks([], decks)).toThrow(/ao menos um jogador/);
  });
});
