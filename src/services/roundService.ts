import { generateId } from '@/utils';
import {
  gerarPareamentosPrimeiraRodada,
  gerarPareamentosProximaRodada,
  SWISS_PAIRING_RULES_VERSION,
  type RandomSource,
  type SwissPairing,
} from './swissPairingService';
import { calcularClassificacaoSuica } from './standingsService';
import { acrescentarAuditoria } from './tournamentAuditService';
import type { SwissRound, Tournament, TournamentMatch } from '@/types';

export type IdFactory = (prefix: string) => string;
export type Clock = () => string;

function criarPartidasSuicas(
  pairings: SwissPairing[],
  roundNumber: number,
  idFactory: IdFactory,
  existingMatches: readonly TournamentMatch[] = [],
): TournamentMatch[] {
  const ids = new Set(existingMatches.map((match) => match.id));
  let nextTableNumber = 1;
  return pairings.map((pairing) => {
    const id = idFactory('swiss-match');
    if (!id || ids.has(id))
      throw new Error('Cada partida precisa de um identificador único.');
    ids.add(id);
    const baseMatch = { id, roundNumber, player1Id: pairing.player1Id, revision: 1 };
    if (pairing.isBye)
      return {
        ...baseMatch,
        status: 'confirmed',
        result: { kind: 'bye', winnerId: pairing.player1Id, gameOutcomes: [] },
      };
    return {
      ...baseMatch,
      tableNumber: nextTableNumber++,
      player2Id: pairing.player2Id,
      status: 'paired',
    };
  });
}

/** Não aceita fechar ou avançar uma rodada com partidas ausentes/duplicadas. */
function obterPartidasDaRodada(
  tournament: Tournament,
  round: SwissRound,
): TournamentMatch[] {
  if (!round.matchIds.length || new Set(round.matchIds).size !== round.matchIds.length) {
    throw new Error('A rodada possui uma lista de partidas inválida.');
  }
  return round.matchIds.map((id) => {
    const matches = tournament.tournamentMatches.filter((match) => match.id === id);
    if (matches.length !== 1 || matches[0].roundNumber !== round.number) {
      throw new Error('Uma partida da rodada está ausente ou inválida.');
    }
    return matches[0];
  });
}

function resultadoConfirmado(match: TournamentMatch): boolean {
  return Boolean(
    match.result && (match.status === 'confirmed' || match.status === 'corrected'),
  );
}

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
  const matches = criarPartidasSuicas(pairings, 1, idFactory);

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

/** Acrescenta a rodada seguinte sem alterar pareamentos ou resultados anteriores. */
export function gerarProximaRodadaSuica(
  tournament: Tournament,
  randomSource: RandomSource = Math.random,
  idFactory: IdFactory = generateId,
): Tournament {
  if (tournament.status === 'suico-concluido') {
    throw new Error('Todas as rodadas Suíças configuradas já foram concluídas.');
  }
  if (tournament.status !== 'rodada-suica-concluida') {
    throw new Error('Encerre a rodada atual antes de gerar a próxima.');
  }
  const { config } = tournament;
  if (!config || config.structure === 'single-elimination') {
    throw new Error('A configuração do campeonato Suíço não foi encontrada.');
  }
  const currentRound = tournament.swissRounds.at(-1);
  if (!currentRound) throw new Error('Gere a primeira rodada antes de continuar.');
  const nextRoundNumber = currentRound.number + 1;
  if (nextRoundNumber > config.swissRoundCount) {
    throw new Error('Todas as rodadas Suíças configuradas já foram concluídas.');
  }
  const history = tournament.swissRounds.flatMap((round, index) => {
    if (round.number !== index + 1 || round.status !== 'completed') {
      throw new Error(
        'Todas as rodadas anteriores precisam estar encerradas e em sequência.',
      );
    }
    const matches = obterPartidasDaRodada(tournament, round);
    if (!matches.every(resultadoConfirmado)) {
      throw new Error('Há resultados pendentes nas rodadas anteriores.');
    }
    return matches;
  });
  const standings = new Map(
    calcularClassificacaoSuica(tournament).map((row) => [row.playerId, row]),
  );
  const players = tournament.entries
    .filter(
      (entry) =>
        entry.status === 'checked-in' && entry.activeFromRound <= nextRoundNumber,
    )
    .map((entry) => ({
      playerId: entry.playerId,
      points: standings.get(entry.playerId)!.points,
      hadBye: standings.get(entry.playerId)!.byes > 0,
    }));
  const { pairings, pairingOrder } = gerarPareamentosProximaRodada(
    players,
    history,
    randomSource,
  );
  const matches = criarPartidasSuicas(
    pairings,
    nextRoundNumber,
    idFactory,
    tournament.tournamentMatches,
  );
  return {
    ...tournament,
    status: 'rodada-suica-pareada',
    tournamentMatches: [...tournament.tournamentMatches, ...matches],
    swissRounds: [
      ...tournament.swissRounds,
      {
        number: nextRoundNumber,
        status: 'paired',
        revision: 1,
        matchIds: matches.map((match) => match.id),
        pairingOrder,
        pairingRulesVersion: SWISS_PAIRING_RULES_VERSION,
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

  const matches = obterPartidasDaRodada(tournament, currentRound);
  const allConfirmed = matches.every(resultadoConfirmado);

  if (!allConfirmed) {
    throw new Error('Confirme o resultado de todas as mesas antes de encerrar a rodada.');
  }

  const completedAt = clock();
  if (!tournament.config)
    throw new Error('A configuração do campeonato não foi encontrada.');
  const swissComplete = currentRound.number >= tournament.config.swissRoundCount;
  const completedRound: SwissRound = {
    ...currentRound,
    status: 'completed',
    completedAt,
  };

  return {
    ...tournament,
    status: swissComplete ? 'suico-concluido' : 'rodada-suica-concluida',
    auditLog: acrescentarAuditoria(
      tournament,
      currentRound.number,
      {
        kind: 'round-completed',
        before: currentRound,
        after: completedRound,
      },
      completedAt,
    ),
    swissRounds: tournament.swissRounds.map((round) =>
      round.number === currentRound.number ? completedRound : round,
    ),
  };
}

/** Reabre apenas a última rodada: resultados nunca são invalidados silenciosamente. */
export function reabrirRodadaSuica(
  tournament: Tournament,
  roundNumber: number,
  reason: string,
  clock: Clock = () => new Date().toISOString(),
): Tournament {
  const normalizedReason = reason.trim();
  if (!normalizedReason || normalizedReason.length > 500) {
    throw new Error(
      'Informe uma justificativa de até 500 caracteres para reabrir a rodada.',
    );
  }
  if (!tournament.config || tournament.config.structure === 'single-elimination') {
    throw new Error('A reabertura só está disponível no campeonato Suíço.');
  }
  const round = tournament.swissRounds.find((item) => item.number === roundNumber);
  if (!round) throw new Error('A rodada informada não foi encontrada.');
  if (tournament.swissRounds.some((item) => item.number > roundNumber)) {
    throw new Error('Esta rodada está protegida: uma rodada posterior já foi gerada.');
  }
  if (tournament.bracket || tournament.championId) {
    throw new Error('Não é possível reabrir o Suíço após definir a chave ou o campeão.');
  }
  if (
    tournament.swissRounds.at(-1)?.number !== roundNumber ||
    round.status !== 'completed' ||
    (tournament.status !== 'rodada-suica-concluida' &&
      tournament.status !== 'suico-concluido')
  ) {
    throw new Error('Somente a última rodada encerrada pode ser reaberta.');
  }
  const matches = obterPartidasDaRodada(tournament, round);
  if (!matches.every(resultadoConfirmado)) {
    throw new Error(
      'A rodada encerrada contém resultados pendentes e não pode ser reaberta.',
    );
  }
  const reopened: SwissRound = {
    ...structuredClone(round),
    status: 'awaiting-results',
    revision: round.revision + 1,
  };
  delete reopened.completedAt;
  return {
    ...tournament,
    status: 'rodada-suica-revisao',
    swissRounds: tournament.swissRounds.map((item) =>
      item.number === roundNumber ? reopened : item,
    ),
    auditLog: acrescentarAuditoria(
      tournament,
      roundNumber,
      {
        kind: 'round-reopened',
        reason: normalizedReason,
        before: round,
        after: reopened,
      },
      clock(),
    ),
  };
}
