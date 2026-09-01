import { generateId } from '@/utils';
import { gerarPareamentosPrimeiraRodada, type RandomSource } from './swissPairingService';
import type { Tournament, TournamentMatch } from '@/types';

export type IdFactory = (prefix: string) => string;
export type Clock = () => string;

/** Gera e bloqueia os pareamentos da primeira rodada Suíça. */
export function gerarPrimeiraRodadaSuica(
  tournament: Tournament,
  randomSource: RandomSource = Math.random,
  idFactory: IdFactory = generateId,
): Tournament {
  if (tournament.status !== 'inscricoes-confirmadas') {
    throw new Error('Confirme as inscrições antes de gerar a primeira rodada.');
  }

  if (!tournament.config) {
    throw new Error('A configuração do campeonato Suíço não foi encontrada.');
  }

  if (tournament.swissRounds.length > 0 || tournament.tournamentMatches.length > 0) {
    throw new Error('A primeira rodada já foi gerada.');
  }

  const activePlayerIds = tournament.entries
    .filter((entry) => entry.status === 'checked-in' && entry.activeFromRound <= 1)
    .map((entry) => entry.playerId);
  const pairings = gerarPareamentosPrimeiraRodada(activePlayerIds, randomSource);
  let nextTableNumber = 1;

  const matches: TournamentMatch[] = pairings.map((pairing) => {
    const baseMatch = {
      id: idFactory('swiss-match'),
      roundNumber: 1,
      player1Id: pairing.player1Id,
      revision: 1,
    };

    if (pairing.isBye) {
      return {
        ...baseMatch,
        status: 'confirmed',
        result: {
          kind: 'bye',
          winnerId: pairing.player1Id,
          gameOutcomes: [],
        },
      };
    }

    const match: TournamentMatch = {
      ...baseMatch,
      tableNumber: nextTableNumber,
      player2Id: pairing.player2Id,
      status: 'paired',
    };
    nextTableNumber += 1;
    return match;
  });

  return {
    ...tournament,
    status: 'rodada-suica-pareada',
    tournamentMatches: matches,
    swissRounds: [
      {
        number: 1,
        status: 'paired',
        matchIds: matches.map((match) => match.id),
        revision: 1,
      },
    ],
  };
}

/** Inicia a rodada pareada e libera as mesas normais para receber resultados. */
export function iniciarRodadaSuica(
  tournament: Tournament,
  clock: Clock = () => new Date().toISOString(),
): Tournament {
  if (tournament.status !== 'rodada-suica-pareada') {
    throw new Error('A rodada precisa estar pareada antes de ser iniciada.');
  }

  const currentRound = tournament.swissRounds.at(-1);
  if (!currentRound || currentRound.status !== 'paired') {
    throw new Error('Não há uma rodada Suíça pareada para iniciar.');
  }

  const startedAt = clock();
  const roundMatchIds = new Set(currentRound.matchIds);

  return {
    ...tournament,
    status: 'rodada-suica-ativa',
    swissRounds: tournament.swissRounds.map((round) =>
      round.number === currentRound.number
        ? { ...round, status: 'active', startedAt }
        : round,
    ),
    tournamentMatches: tournament.tournamentMatches.map((match) =>
      roundMatchIds.has(match.id) && match.status === 'paired'
        ? { ...match, status: 'active' }
        : match,
    ),
  };
}

/** Fecha a revisão somente quando todos os resultados da rodada estão confirmados. */
export function finalizarRodadaSuica(
  tournament: Tournament,
  clock: Clock = () => new Date().toISOString(),
): Tournament {
  if (tournament.status !== 'rodada-suica-revisao') {
    throw new Error('A rodada precisa estar em revisão antes de ser encerrada.');
  }

  const currentRound = tournament.swissRounds.at(-1);
  if (!currentRound || currentRound.status !== 'awaiting-results') {
    throw new Error('Não há uma rodada Suíça pronta para encerramento.');
  }

  const matches = tournament.tournamentMatches.filter((match) =>
    currentRound.matchIds.includes(match.id),
  );
  const allConfirmed = matches.every(
    (match) => match.status === 'confirmed' || match.status === 'corrected',
  );

  if (!allConfirmed) {
    throw new Error('Confirme o resultado de todas as mesas antes de encerrar a rodada.');
  }

  const completedAt = clock();

  return {
    ...tournament,
    status: 'rodada-suica-concluida',
    swissRounds: tournament.swissRounds.map((round) =>
      round.number === currentRound.number
        ? { ...round, status: 'completed', completedAt }
        : round,
    ),
  };
}
