import { MAX_SWISS_PLAYERS } from '@/constants/tournament';

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
    if (!Number.isFinite(randomValue) || randomValue < 0 || randomValue >= 1) {
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

export type SwissPairingPlayer = {
  playerId: string;
  points: number;
  hadBye: boolean;
};

type PreviousPairing = { player1Id: string; player2Id?: string };

export const SWISS_PAIRING_RULES_VERSION = 'local-pairing-2026-09-v1';

/**
 * Política local: sem revanche; menor pontuação elegível para bye; depois menor
 * soma das diferenças de pontos. A ordem sorteada só decide entre soluções iguais.
 * Busca exata com memoização por subconjunto, limitada aos 16 jogadores do MVP.
 */
export function gerarPareamentosProximaRodada(
  players: readonly SwissPairingPlayer[],
  history: readonly PreviousPairing[],
  randomSource: RandomSource = Math.random,
): { pairings: SwissPairing[]; pairingOrder: string[] } {
  if (players.length < 2 || players.length > MAX_SWISS_PLAYERS) {
    throw new Error(
      `São necessários de 2 a ${MAX_SWISS_PLAYERS} jogadores ativos para parear.`,
    );
  }
  if (new Set(players.map((player) => player.playerId)).size !== players.length) {
    throw new Error('Os jogadores ativos precisam ter identificadores únicos.');
  }
  if (
    players.some(
      (player) =>
        !player.playerId || !Number.isFinite(player.points) || player.points < 0,
    )
  ) {
    throw new Error('Jogador ou pontuação inválida para o pareamento.');
  }

  const shuffled = shuffleWithSource(players, randomSource);
  const pairingOrder = shuffled.map((player) => player.playerId);
  const ordered = [...shuffled].sort((first, second) => second.points - first.points);
  const pastOpponents = new Map<string, Set<string>>();
  for (const { player1Id, player2Id } of history) {
    if (!player2Id) continue;
    if (!pastOpponents.has(player1Id)) pastOpponents.set(player1Id, new Set());
    if (!pastOpponents.has(player2Id)) pastOpponents.set(player2Id, new Set());
    pastOpponents.get(player1Id)!.add(player2Id);
    pastOpponents.get(player2Id)!.add(player1Id);
  }

  type Solution = { cost: number; pairs: [number, number][] };
  const cache = new Map<number, Solution | null>();
  function solve(mask: number): Solution | null {
    if (mask === 0) return { cost: 0, pairs: [] };
    if (cache.has(mask)) return cache.get(mask)!;
    let first = 0;
    while (!(mask & (1 << first))) first += 1;
    const remaining = mask & ~(1 << first);
    let best: Solution | null = null;
    for (let second = first + 1; second < ordered.length; second += 1) {
      if (!(remaining & (1 << second))) continue;
      if (pastOpponents.get(ordered[first].playerId)?.has(ordered[second].playerId))
        continue;
      const rest = solve(remaining & ~(1 << second));
      if (!rest) continue;
      const cost = rest.cost + Math.abs(ordered[first].points - ordered[second].points);
      if (!best || cost < best.cost) {
        best = { cost, pairs: [[first, second], ...rest.pairs] };
      }
    }
    cache.set(mask, best);
    return best;
  }

  const fullMask = (1 << ordered.length) - 1;
  let solution: Solution | null = null;
  let byeIndex: number | undefined;
  if (ordered.length % 2 === 0) {
    solution = solve(fullMask);
  } else {
    const candidates = ordered
      .map((player, index) => ({ ...player, index }))
      .filter((player) => !player.hadBye)
      .sort((first, second) => first.points - second.points);
    if (candidates.length === 0) {
      throw new Error(
        'Todos os jogadores ativos já receberam bye. Não é possível gerar a rodada sem repetir o bye.',
      );
    }
    for (const candidate of candidates) {
      if (byeIndex !== undefined && candidate.points > ordered[byeIndex].points) break;
      const candidateSolution = solve(fullMask & ~(1 << candidate.index));
      if (candidateSolution && (!solution || candidateSolution.cost < solution.cost)) {
        solution = candidateSolution;
        byeIndex = candidate.index;
      }
    }
  }
  if (!solution) {
    throw new Error(
      'Não há combinação possível sem repetir confrontos e preservando o limite de um bye por jogador. A rodada não foi criada.',
    );
  }
  const pairings: SwissPairing[] = solution.pairs.map(([first, second]) => ({
    player1Id: ordered[first].playerId,
    player2Id: ordered[second].playerId,
    isBye: false,
  }));
  if (byeIndex !== undefined)
    pairings.push({ player1Id: ordered[byeIndex].playerId, isBye: true });
  return { pairings, pairingOrder };
}
