import type { Match } from './match';

/**
 * Uma fase da chave (ex: quartas, semifinal, final).
 *
 * `name` é gerado dinamicamente a partir da quantidade de rounds
 * (ver `utils/bracket.ts`), nunca fixado como "Semifinal"/"Final" no tipo.
 * Isso é o que permite suportar 4, 8, 16... jogadores sem reescrever
 * a modelagem (v6 do roadmap).
 */
export type Round = {
  index: number;
  name: string;
  matches: Match[];
};
