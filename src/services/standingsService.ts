import { LOCAL_STANDINGS_RULES } from '@/constants/standings';
import type { Standing, Tournament } from '@/types';

const EPSILON = 1e-10;

function compareStandings(first: Standing, second: Standing): number {
  const differences = [
    second.points - first.points,
    (second.opponentWinRate ?? 0) - (first.opponentWinRate ?? 0),
    (second.opponentsOpponentWinRate ?? 0) - (first.opponentsOpponentWinRate ?? 0),
  ];
  return differences.find((difference) => Math.abs(difference) > EPSILON) ?? 0;
}

function average(values: number[]): number | null {
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null;
}

/**
 * Classificação parcial por pontos, Op Win % e Op Op Win %. Usa apenas resultados
 * confirmados/corrigidos de rodadas iniciadas; não conta o bye antes do início.
 * Empate dá pontos, mas não é vitória no percentual. Bye não entra no numerador,
 * denominador nem na lista de adversários dos desempates.
 */
export function calcularClassificacaoSuica(tournament: Tournament): Standing[] {
  if (!tournament.config || tournament.config.structure === 'single-elimination')
    return [];
  const rules = tournament.config.standingsRules ?? LOCAL_STANDINGS_RULES;
  const records = new Map(
    tournament.entries.map((entry) => [
      entry.playerId,
      {
        entry,
        opponents: [] as string[],
        standing: {
          playerId: entry.playerId,
          position: 0,
          tied: false,
          played: 0,
          wins: 0,
          draws: 0,
          losses: 0,
          byes: 0,
          points: 0,
          opponentWinRate: null,
          opponentsOpponentWinRate: null,
        } as Standing,
      },
    ]),
  );
  const matchesById = new Map(
    tournament.tournamentMatches.map((match) => [match.id, match]),
  );
  const countedMatches = new Set<string>();

  for (const round of tournament.swissRounds) {
    if (round.status === 'paired') continue;
    const roundPlayers = new Set<string>();
    for (const matchId of round.matchIds) {
      const match = matchesById.get(matchId);
      if (!match || match.roundNumber !== round.number) {
        throw new Error('A rodada contém uma partida inválida para a classificação.');
      }
      if (match.status !== 'confirmed' && match.status !== 'corrected') continue;
      const { result } = match;
      if (!result) throw new Error('Uma partida confirmada está sem resultado.');
      if (countedMatches.has(matchId))
        throw new Error('Partida duplicada na classificação.');
      countedMatches.add(matchId);
      const playerIds = [match.player1Id, ...(match.player2Id ? [match.player2Id] : [])];
      for (const id of playerIds) {
        if (!records.has(id) || roundPlayers.has(id)) {
          throw new Error('Jogador inválido ou repetido na rodada.');
        }
        roundPlayers.add(id);
      }
      const first = records.get(match.player1Id)!;
      if (result.kind === 'bye') {
        if (match.player2Id || result.winnerId !== match.player1Id) {
          throw new Error('O bye precisa ter apenas seu jogador vencedor.');
        }
        first.standing.played += 1;
        first.standing.wins += 1;
        first.standing.byes += 1;
        first.standing.points += rules.winPoints;
        continue;
      }
      const second = match.player2Id ? records.get(match.player2Id) : undefined;
      if (!second) throw new Error('Uma partida normal precisa de dois jogadores.');
      first.opponents.push(second.entry.playerId);
      second.opponents.push(first.entry.playerId);
      first.standing.played += 1;
      second.standing.played += 1;
      switch (result.kind) {
        case 'draw':
          for (const { standing } of [first, second]) {
            standing.draws += 1;
            standing.points += rules.drawPoints;
          }
          break;
        case 'double-loss':
          for (const { standing } of [first, second]) {
            standing.losses += 1;
            standing.points += rules.lossPoints;
          }
          break;
        case 'win':
        case 'administrative-win': {
          if (!result.winnerId || !playerIds.includes(result.winnerId)) {
            throw new Error('O vencedor precisa pertencer à partida.');
          }
          const winner = result.winnerId === first.entry.playerId ? first : second;
          const loser = winner === first ? second : first;
          winner.standing.wins += 1;
          winner.standing.points += rules.winPoints;
          loser.standing.losses += 1;
          loser.standing.points += rules.lossPoints;
          break;
        }
      }
    }
  }

  const winRates = new Map(
    [...records].map(([id, { standing, entry }]) => {
      const played = standing.played - standing.byes;
      const rawRate = played ? (standing.wins - standing.byes) / played : 0;
      const maximum = entry.status === 'checked-in' ? 1 : rules.droppedMaximumWinRate;
      return [id, Math.max(rules.minimumWinRate, Math.min(maximum, rawRate))];
    }),
  );
  for (const { standing, opponents } of records.values()) {
    standing.opponentWinRate = average(opponents.map((id) => winRates.get(id)!));
  }
  for (const { standing, opponents } of records.values()) {
    standing.opponentsOpponentWinRate = average(
      opponents.map(
        (id) => records.get(id)!.standing.opponentWinRate ?? rules.minimumWinRate,
      ),
    );
  }

  // A ordem da inscrição é só visual dentro de um empate, nunca um desempate.
  const standings = [...records.values()]
    .map(({ standing }) => standing)
    .sort(compareStandings);
  for (let index = 0; index < standings.length; index += 1) {
    const row = standings[index];
    const previous = standings[index - 1];
    const next = standings[index + 1];
    const tiedWithPrevious = Boolean(previous && compareStandings(previous, row) === 0);
    row.position = tiedWithPrevious ? previous.position : index + 1;
    row.tied = tiedWithPrevious || Boolean(next && compareStandings(row, next) === 0);
  }
  return standings;
}
