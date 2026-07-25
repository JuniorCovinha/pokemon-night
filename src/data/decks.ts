import type { Deck } from '@/types';

/**
 * Decks disponíveis para sorteio.
 *
 * Como há mais decks (11) do que jogadores (4), o sorteio escolhe 4 deles
 * aleatoriamente a cada campeonato — os outros ficam de fora daquela
 * rodada (ver `sortearDecks` em `services/deckAssignmentService.ts`).
 */
export const decks: Deck[] = [
  {
    id: 'deck-sharpedo-ex',
    nome: 'Sharpedo ex',
    tipoPrincipal: 'Sombrio',
    arquetipo: 'Combo',
  },
  {
    id: 'deck-lucario-ex',
    nome: 'Lucario ex',
    tipoPrincipal: 'Lutador',
    arquetipo: 'Agressivo',
  },
  {
    id: 'deck-ceruledge-ex',
    nome: 'Ceruledge ex',
    tipoPrincipal: 'Fogo',
    arquetipo: 'Combo',
  },
  {
    id: 'deck-empoleon-ex',
    nome: 'Empoleon ex',
    tipoPrincipal: 'Metálico',
    arquetipo: 'Tank',
  },
  {
    id: 'deck-abomasnow-ex',
    nome: 'Abomasnow ex',
    tipoPrincipal: 'Água',
    arquetipo: 'Agressivo',
  },
  {
    id: 'deck-garchomp-ex',
    nome: 'Garchomp ex',
    tipoPrincipal: 'Lutador',
    arquetipo: 'Agressivo',
  },
  {
    id: 'deck-dragapult-dusk',
    nome: 'Dragapult Dusk',
    tipoPrincipal: 'Dragão',
    arquetipo: 'Ataque',
  },
  {
    id: 'deck-dragapult-m',
    nome: 'Dragapult M',
    tipoPrincipal: 'Dragão',
    arquetipo: 'Ataque',
  },
  {
    id: 'deck-hydrapple',
    nome: 'Hydrapple',
    tipoPrincipal: 'Grama',
    arquetipo: 'Combo',
  },
  {
    id: 'deck-grimmsnarl',
    nome: 'Grimmsnarl',
    // "Escuridão" é o mesmo tipo que já cadastramos como "Sombrio"
    // (Sharpedo ex) — mantendo o mesmo nome pra não duplicar cor/tema.
    tipoPrincipal: 'Sombrio',
    arquetipo: 'Ataque',
  },
  {
    id: 'deck-mega-excadrill',
    nome: 'Mega Excadrill',
    tipoPrincipal: 'Metálico',
    arquetipo: 'Tank',
  },
];
