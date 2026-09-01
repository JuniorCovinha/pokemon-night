import type {
  MatchFormat,
  Tournament,
  TournamentGameOutcome,
  TournamentMatchResult,
} from '@/types';

export type SwissMatchResultInput = {
  gameOutcomes: TournamentGameOutcome[];
};

export type GameResultAnalysis =
  | { status: 'empty' | 'incomplete' }
  | { status: 'win'; winnerSide: 'player1' | 'player2' }
  | { status: 'draw' };

/**
 * Interpreta os resultados individuais sem depender dos IDs dos jogadores.
 * O serviço de registro continua sendo a fonte de verdade para validar a partida.
 */
export function analisarResultadoDosJogos(
  matchFormat: MatchFormat,
  gameOutcomes: TournamentGameOutcome[],
): GameResultAnalysis {
  const maximumGames = matchFormat === 'best-of-one' ? 1 : 3;
  const winsNeeded = matchFormat === 'best-of-one' ? 1 : 2;

  if (gameOutcomes.length > maximumGames) {
    throw new Error(`Esta partida permite no máximo ${maximumGames} jogo(s).`);
  }

  let player1Wins = 0;
  let player2Wins = 0;

  for (const [index, outcome] of gameOutcomes.entries()) {
    if (outcome === 'player1-win') player1Wins += 1;
    if (outcome === 'player2-win') player2Wins += 1;

    const matchWasDecided = player1Wins === winsNeeded || player2Wins === winsNeeded;
    if (matchWasDecided && index < gameOutcomes.length - 1) {
      throw new Error('Há jogos registrados depois de o confronto já estar decidido.');
    }
  }

  if (player1Wins === winsNeeded) {
    return { status: 'win', winnerSide: 'player1' };
  }

  if (player2Wins === winsNeeded) {
    return { status: 'win', winnerSide: 'player2' };
  }

  if (gameOutcomes.length === maximumGames) {
    return { status: 'draw' };
  }

  return { status: gameOutcomes.length === 0 ? 'empty' : 'incomplete' };
}

function criarResultado(
  tournament: Tournament,
  player1Id: string,
  player2Id: string,
  input: SwissMatchResultInput,
): TournamentMatchResult {
  if (!tournament.config) {
    throw new Error('A configuração do campeonato não foi encontrada.');
  }

  const analysis = analisarResultadoDosJogos(
    tournament.config.matchFormat,
    input.gameOutcomes,
  );

  if (analysis.status === 'empty' || analysis.status === 'incomplete') {
    throw new Error('O resultado está incompleto. Registre todos os jogos necessários.');
  }

  if (analysis.status === 'win') {
    return {
      kind: 'win',
      winnerId: analysis.winnerSide === 'player1' ? player1Id : player2Id,
      gameOutcomes: [...input.gameOutcomes],
    };
  }

  return { kind: 'draw', gameOutcomes: [...input.gameOutcomes] };
}

/** Registra ou corrige o resultado de uma mesa durante a rodada ou sua revisão. */
export function registrarResultadoPartidaSuica(
  tournament: Tournament,
  matchId: string,
  input: SwissMatchResultInput,
): Tournament {
  if (
    tournament.status !== 'rodada-suica-ativa' &&
    tournament.status !== 'rodada-suica-revisao'
  ) {
    throw new Error(
      'Os resultados só podem ser registrados durante a rodada ou revisão.',
    );
  }

  const currentRound = tournament.swissRounds.at(-1);
  const match = tournament.tournamentMatches.find((item) => item.id === matchId);

  if (!currentRound || !match || !currentRound.matchIds.includes(matchId)) {
    throw new Error('A partida não pertence à rodada Suíça atual.');
  }

  if (!match.player2Id || match.result?.kind === 'bye') {
    throw new Error('O resultado de um bye é confirmado automaticamente.');
  }

  const result = criarResultado(tournament, match.player1Id, match.player2Id, input);
  const isCorrection = Boolean(match.result);
  const matches = tournament.tournamentMatches.map((item) =>
    item.id === matchId
      ? {
          ...item,
          status: isCorrection ? ('corrected' as const) : ('confirmed' as const),
          result,
          revision: isCorrection ? item.revision + 1 : item.revision,
        }
      : item,
  );
  const roundMatches = matches.filter((item) => currentRound.matchIds.includes(item.id));
  const allConfirmed = roundMatches.every(
    (item) => item.status === 'confirmed' || item.status === 'corrected',
  );

  return {
    ...tournament,
    status: allConfirmed ? 'rodada-suica-revisao' : 'rodada-suica-ativa',
    tournamentMatches: matches,
    swissRounds: tournament.swissRounds.map((round) =>
      round.number === currentRound.number
        ? { ...round, status: allConfirmed ? 'awaiting-results' : 'active' }
        : round,
    ),
  };
}
