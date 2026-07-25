/**
 * Tamanhos de campeonato suportados. A v1 usa apenas 4, mas o resto da
 * arquitetura (bracket, sorteio) já é genérico o suficiente para os demais.
 */
export const SUPPORTED_BRACKET_SIZES = [4, 8, 16] as const;

export const DEFAULT_BRACKET_SIZE = 4;

export const ROUND_NAMES_BY_MATCHES_REMAINING: Record<number, string> = {
  1: 'Final',
  2: 'Semifinal',
  4: 'Quartas de Final',
  8: 'Oitavas de Final',
};
