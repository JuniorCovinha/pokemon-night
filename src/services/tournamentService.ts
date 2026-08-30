import { generateId, isPowerOfTwo } from '@/utils';
import { MAX_DRAW_DECKS } from '@/constants/tournament';
import { sortearDecks } from './deckAssignmentService';
import {
  sortearConfrontos,
  gerarBracket,
  registrarVencedor,
  desfazerVencedor,
  obterCampeaoId,
} from './bracketService';
import type { Champion, Deck, Player, Tournament } from '@/types';

export type PlayerDeckRegistration = {
  player: Player;
  deck: Deck;
};

/**
 * Cria um campeonato novo, no estado inicial (só com jogadores e decks
 * disponíveis, nada sorteado ainda).
 */
export function criarTorneio(
  players: readonly Player[],
  decks: readonly Deck[],
): Tournament {
  return {
    id: generateId('tournament'),
    status: 'registrando-jogadores',
    players: [...players],
    decks: [...decks],
    assignments: [],
    createdAt: new Date().toISOString(),
  };
}

/**
 * Define o conjunto de decks que participará do sorteio.
 * Só pode ser alterado antes do início do campeonato.
 */
export function definirDecksDoTorneio(
  tournament: Tournament,
  decks: readonly Deck[],
): Tournament {
  if (tournament.status !== 'registrando-jogadores') {
    throw new Error('Os decks só podem ser alterados antes do sorteio.');
  }

  if (decks.length > MAX_DRAW_DECKS) {
    throw new Error(`O modo Sorteio aceita no máximo ${MAX_DRAW_DECKS} decks.`);
  }

  const ids = decks.map((deck) => deck.id);
  if (new Set(ids).size !== ids.length) {
    throw new Error('Não é possível selecionar o mesmo deck mais de uma vez.');
  }

  return {
    ...tournament,
    decks: [...decks],
    assignments: [],
  };
}

/**
 * Configura um campeonato em que cada jogador já entra com seu próprio deck.
 * Decks repetidos são válidos; apenas jogadores e vínculos precisam ser únicos.
 */
export function configurarCampeonatoComDecksDefinidos(
  tournament: Tournament,
  registrations: readonly PlayerDeckRegistration[],
): Tournament {
  if (tournament.status !== 'registrando-jogadores') {
    throw new Error('As inscrições só podem ser alteradas antes do campeonato.');
  }

  if (registrations.length < 2 || !isPowerOfTwo(registrations.length)) {
    throw new Error('O campeonato precisa ter 2, 4, 8 ou 16 jogadores.');
  }

  const players = registrations.map(({ player }) => ({
    ...player,
    name: player.name.trim(),
  }));

  if (players.some((player) => player.name.length === 0)) {
    throw new Error('Todos os jogadores precisam ter um nome.');
  }

  const playerIds = players.map((player) => player.id);
  if (new Set(playerIds).size !== playerIds.length) {
    throw new Error('Cada jogador precisa ter um identificador único.');
  }

  const normalizedNames = players.map((player) => player.name.toLocaleLowerCase('pt-BR'));
  if (new Set(normalizedNames).size !== normalizedNames.length) {
    throw new Error('Os jogadores precisam ter nomes diferentes.');
  }

  if (registrations.some(({ deck }) => !deck.id || !deck.nome.trim())) {
    throw new Error('Todos os jogadores precisam ter um deck definido.');
  }

  const decks = Array.from(
    new Map(registrations.map(({ deck }) => [deck.id, deck])).values(),
  );
  const assignments = registrations.map(({ player, deck }) => ({
    playerId: player.id,
    deckId: deck.id,
  }));

  return {
    ...tournament,
    players,
    decks,
    assignments,
    status: 'decks-sorteados',
  };
}

/** Configura as inscrições e sorteia os confrontos em uma única transição. */
export function iniciarCampeonatoComDecksDefinidos(
  tournament: Tournament,
  registrations: readonly PlayerDeckRegistration[],
): Tournament {
  return gerarChaveDoTorneio(
    configurarCampeonatoComDecksDefinidos(tournament, registrations),
  );
}

/**
 * Sorteia os decks dos jogadores e avança o status do campeonato.
 */
export function sortearDecksDoTorneio(tournament: Tournament): Tournament {
  const assignments = sortearDecks(tournament.players, tournament.decks);

  return {
    ...tournament,
    assignments,
    status: 'decks-sorteados',
  };
}

/**
 * Sorteia os confrontos e gera a chave completa. Só pode ser chamado
 * depois dos decks sorteados — impede pular etapas do fluxo.
 */
export function gerarChaveDoTorneio(tournament: Tournament): Tournament {
  if (tournament.status !== 'decks-sorteados') {
    throw new Error('É preciso sortear os decks antes de gerar a chave.');
  }

  const jogadoresSorteados = sortearConfrontos(tournament.players);
  const bracket = gerarBracket(jogadoresSorteados);

  return {
    ...tournament,
    bracket,
    status: 'chave-gerada',
  };
}

/**
 * Registra o vencedor de uma partida, avança a chave e detecta
 * automaticamente se o campeonato acabou.
 */
export function registrarVencedorDoTorneio(
  tournament: Tournament,
  matchId: string,
  winnerId: string,
): Tournament {
  if (!tournament.bracket) {
    throw new Error('A chave ainda não foi gerada.');
  }

  const bracket = registrarVencedor(tournament.bracket, matchId, winnerId);
  const championId = obterCampeaoId(bracket);

  return {
    ...tournament,
    bracket,
    championId,
    status: championId ? 'finalizado' : 'em-andamento',
  };
}

/**
 * Desfaz o vencedor de uma partida (clicar de novo no nome escolhido).
 * Recalcula o campeão e o status do campeonato a partir do bracket
 * resultante — se a cascata desfizer a final também, o campeonato deixa
 * de estar "finalizado" automaticamente.
 */
export function desfazerVencedorDoTorneio(
  tournament: Tournament,
  matchId: string,
): Tournament {
  if (!tournament.bracket) {
    throw new Error('A chave ainda não foi gerada.');
  }

  const bracket = desfazerVencedor(tournament.bracket, matchId);
  const championId = obterCampeaoId(bracket);

  return {
    ...tournament,
    bracket,
    championId,
    status: championId ? 'finalizado' : 'em-andamento',
  };
}

/**
 * Monta a representação "pronta para exibir" do campeão, juntando o
 * jogador com o deck que ele usou. Retorna undefined se ainda não há
 * campeão definido.
 */
export function obterCampeao(tournament: Tournament): Champion | undefined {
  if (!tournament.championId) {
    return undefined;
  }

  const player = tournament.players.find((p) => p.id === tournament.championId);
  const assignment = tournament.assignments.find(
    (a) => a.playerId === tournament.championId,
  );
  const deck = tournament.decks.find((d) => d.id === assignment?.deckId);

  if (!player || !deck) {
    return undefined;
  }

  return { player, deck };
}

/**
 * Renomeia um jogador. Validação simples: nome não pode ficar vazio
 * (o cadastro de jogadores nunca deve ter um jogador sem nome).
 */
export function renomearJogador(
  tournament: Tournament,
  playerId: string,
  novoNome: string,
): Tournament {
  const nomeTratado = novoNome.trim();

  if (nomeTratado.length === 0) {
    throw new Error('O nome do jogador não pode ficar vazio.');
  }

  return {
    ...tournament,
    players: tournament.players.map((player) =>
      player.id === playerId ? { ...player, name: nomeTratado } : player,
    ),
  };
}

/**
 * Reinicia o campeonato do zero, mantendo os mesmos jogadores e decks
 * disponíveis (útil para "Novo Campeonato" sem precisar recadastrar tudo).
 */
export function reiniciarCampeonato(tournament: Tournament): Tournament {
  return criarTorneio(tournament.players, tournament.decks);
}
