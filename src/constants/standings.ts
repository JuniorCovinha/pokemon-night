import type { StandingsRules } from '@/types';

/**
 * Política local v1. Referência histórica: Play! Pokémon Handbook (06/10/2023),
 * 4.4.2–4.4.3.2. Não representa certificação das regras oficiais vigentes.
 * O manual atual foi consultado em 06/09/2026, mas seu PDF bloqueou o acesso.
 * Empates restantes compartilham colocação; não há seed aleatória ou Top Cut aqui.
 */
export const LOCAL_STANDINGS_RULES: Readonly<StandingsRules> = Object.freeze({
  version: 'local-standings-2026-09-v1',
  winPoints: 3,
  drawPoints: 1,
  lossPoints: 0,
  minimumWinRate: 0.25,
  droppedMaximumWinRate: 0.75,
});
