import { shuffle, generateId, isPowerOfTwo } from '@/utils';
import { ROUND_NAMES_BY_MATCHES_REMAINING } from '@/constants/tournament';
import type { Bracket, Match, Player, Round } from '@/types';

function nomeDaRodada(quantidadeDeMatches: number): string {
  return ROUND_NAMES_BY_MATCHES_REMAINING[quantidadeDeMatches] ?? 'Rodada';
}

/**
 * Sorteia a ordem dos confrontos embaralhando os jogadores.
 * Separado de `gerarBracket` para deixar explícito que o embaralhamento
 * é a fonte da aleatoriedade — nunca há posições fixas.
 */
export function sortearConfrontos(players: readonly Player[]): Player[] {
  if (!isPowerOfTwo(players.length)) {
    throw new Error(
      `A chave exige uma quantidade de jogadores em potência de 2 (2, 4, 8, 16...). Recebido: ${players.length}.`,
    );
  }

  return shuffle(players);
}

/**
 * Gera a chave completa do campeonato a partir de jogadores já sorteados.
 *
 * Diferente de gerar só a primeira rodada, aqui TODAS as rodadas futuras já
 * nascem criadas (com as vagas de jogador vazias). Isso é o que permite
 * "preencher a próxima fase" de forma genérica quando um vencedor é
 * registrado — não importa se são 4, 8 ou 16 jogadores, a estrutura de
 * propagação é sempre a mesma.
 */
export function gerarBracket(jogadoresSorteados: readonly Player[]): Bracket {
  if (!isPowerOfTwo(jogadoresSorteados.length)) {
    throw new Error(
      `A chave exige uma quantidade de jogadores em potência de 2. Recebido: ${jogadoresSorteados.length}.`,
    );
  }

  const totalDeRodadas = Math.log2(jogadoresSorteados.length);
  const rounds: Round[] = [];

  for (let roundIndex = 0; roundIndex < totalDeRodadas; roundIndex++) {
    const quantidadeDeMatches = jogadoresSorteados.length / 2 ** (roundIndex + 1);

    const matches: Match[] = Array.from({ length: quantidadeDeMatches }, (_, matchIndex) => {
      const ehPrimeiraRodada = roundIndex === 0;

      return {
        id: generateId('match'),
        roundIndex,
        matchIndex,
        player1Id: ehPrimeiraRodada
          ? jogadoresSorteados[matchIndex * 2].id
          : undefined,
        player2Id: ehPrimeiraRodada
          ? jogadoresSorteados[matchIndex * 2 + 1].id
          : undefined,
      };
    });

    rounds.push({
      index: roundIndex,
      name: nomeDaRodada(quantidadeDeMatches),
      matches,
    });
  }

  return { rounds };
}

/**
 * Propaga o vencedor de uma partida para a vaga correspondente na
 * próxima rodada. Se a partida for a final, não há próxima rodada
 * e a chave é devolvida sem alteração adicional.
 */
function avancarFase(bracket: Bracket, matchFinalizado: Match): Bracket {
  const proximaRoundIndex = matchFinalizado.roundIndex + 1;
  const proximaRound = bracket.rounds[proximaRoundIndex];

  if (!proximaRound) {
    return bracket;
  }

  const proximoMatchIndex = Math.floor(matchFinalizado.matchIndex / 2);
  const ehSlotPar = matchFinalizado.matchIndex % 2 === 0;

  const rounds = bracket.rounds.map((round) => {
    if (round.index !== proximaRoundIndex) {
      return round;
    }

    const matches = round.matches.map((match) => {
      if (match.matchIndex !== proximoMatchIndex) {
        return match;
      }

      return ehSlotPar
        ? { ...match, player1Id: matchFinalizado.winnerId }
        : { ...match, player2Id: matchFinalizado.winnerId };
    });

    return { ...round, matches };
  });

  return { rounds };
}

/**
 * Registra o vencedor de uma partida e avança a chave automaticamente.
 *
 * Impede estados inválidos:
 * - a partida precisa existir;
 * - a partida precisa ter os dois jogadores definidos;
 * - o vencedor precisa ser um dos dois jogadores daquela partida.
 */
export function registrarVencedor(
  bracket: Bracket,
  matchId: string,
  winnerId: string,
): Bracket {
  const matchAtual = bracket.rounds
    .flatMap((round) => round.matches)
    .find((match) => match.id === matchId);

  if (!matchAtual) {
    throw new Error(`Partida "${matchId}" não encontrada na chave.`);
  }

  if (!matchAtual.player1Id || !matchAtual.player2Id) {
    throw new Error('Não é possível registrar um vencedor antes dos dois jogadores estarem definidos.');
  }

  if (winnerId !== matchAtual.player1Id && winnerId !== matchAtual.player2Id) {
    throw new Error('O vencedor precisa ser um dos jogadores da partida.');
  }

  const matchFinalizado: Match = { ...matchAtual, winnerId };

  const roundsComVencedorRegistrado = bracket.rounds.map((round) => {
    if (round.index !== matchFinalizado.roundIndex) {
      return round;
    }

    const matches = round.matches.map((match) =>
      match.id === matchId ? matchFinalizado : match,
    );

    return { ...round, matches };
  });

  return avancarFase({ rounds: roundsComVencedorRegistrado }, matchFinalizado);
}

/**
 * Retorna o id do jogador campeão, se a final já tiver sido decidida.
 */
export function obterCampeaoId(bracket: Bracket): string | undefined {
  const ultimaRound = bracket.rounds.at(-1);
  return ultimaRound?.matches[0]?.winnerId;
}

function encontrarMatch(bracket: Bracket, matchId: string): Match | undefined {
  return bracket.rounds.flatMap((round) => round.matches).find((m) => m.id === matchId);
}

/**
 * Desfaz o vencedor de uma partida, clicando de novo no nome escolhido.
 *
 * Se esse vencedor já tiver avançado e decidido a partida seguinte (ex:
 * desfazer uma semifinal depois da final já ter sido jogada), a função
 * desfaz em cascata a partida seguinte primeiro — nunca deixa a chave
 * num estado inconsistente (um jogador que "nunca venceu" aparecendo
 * como vencedor de uma fase posterior).
 */
export function desfazerVencedor(bracket: Bracket, matchId: string): Bracket {
  const match = encontrarMatch(bracket, matchId);

  if (!match) {
    throw new Error(`Partida "${matchId}" não encontrada na chave.`);
  }

  if (!match.winnerId) {
    throw new Error('Esta partida ainda não tem um vencedor definido para desfazer.');
  }

  const proximaRoundIndex = match.roundIndex + 1;
  const proximoMatchIndex = Math.floor(match.matchIndex / 2);
  const ehSlotPar = match.matchIndex % 2 === 0;
  const proximoMatch = bracket.rounds[proximaRoundIndex]?.matches.find(
    (m) => m.matchIndex === proximoMatchIndex,
  );

  let bracketAtualizado = bracket;

  // Cascata: se a partida seguinte já foi decidida com base neste
  // resultado, desfaz ela também antes de mexer neste.
  if (proximoMatch?.winnerId) {
    bracketAtualizado = desfazerVencedor(bracketAtualizado, proximoMatch.id);
  }

  if (proximoMatch) {
    bracketAtualizado = {
      rounds: bracketAtualizado.rounds.map((round) => {
        if (round.index !== proximaRoundIndex) return round;

        return {
          ...round,
          matches: round.matches.map((m) =>
            m.matchIndex === proximoMatchIndex
              ? { ...m, [ehSlotPar ? 'player1Id' : 'player2Id']: undefined }
              : m,
          ),
        };
      }),
    };
  }

  return {
    rounds: bracketAtualizado.rounds.map((round) => {
      if (round.index !== match.roundIndex) return round;

      return {
        ...round,
        matches: round.matches.map((m) =>
          m.id === matchId ? { ...m, winnerId: undefined } : m,
        ),
      };
    }),
  };
}
