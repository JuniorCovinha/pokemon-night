export type RandomSource = () => number;

export type SwissPairing = {
  player1Id: string;
  player2Id?: string;
  isBye: boolean;
};

function shuffleWithSource<T>(items: readonly T[], randomSource: RandomSource): T[] {
  const shuffled = [...items];

  for (let index = shuffled.length - 1; index > 0; index--) {
    const randomValue = randomSource();
    if (randomValue < 0 || randomValue >= 1) {
      throw new Error('A fonte de aleatoriedade precisa retornar valores entre 0 e 1.');
    }

    const targetIndex = Math.floor(randomValue * (index + 1));
    [shuffled[index], shuffled[targetIndex]] = [shuffled[targetIndex], shuffled[index]];
  }

  return shuffled;
}

/**
 * Primeira rodada: ordem aleatória, sem histórico anterior para considerar.
 * Em quantidade ímpar, o último jogador sorteado recebe o bye.
 */
export function gerarPareamentosPrimeiraRodada(
  playerIds: readonly string[],
  randomSource: RandomSource = Math.random,
): SwissPairing[] {
  if (playerIds.length < 2) {
    throw new Error('São necessários pelo menos dois jogadores ativos para parear.');
  }

  if (new Set(playerIds).size !== playerIds.length) {
    throw new Error('Os jogadores ativos precisam ter identificadores únicos.');
  }

  const shuffledIds = shuffleWithSource(playerIds, randomSource);
  const hasBye = shuffledIds.length % 2 !== 0;
  const byePlayerId = hasBye ? shuffledIds.at(-1) : undefined;
  const pairedIds = hasBye ? shuffledIds.slice(0, -1) : shuffledIds;
  const pairings: SwissPairing[] = [];

  for (let index = 0; index < pairedIds.length; index += 2) {
    pairings.push({
      player1Id: pairedIds[index],
      player2Id: pairedIds[index + 1],
      isBye: false,
    });
  }

  if (byePlayerId) {
    pairings.push({ player1Id: byePlayerId, isBye: true });
  }

  return pairings;
}
