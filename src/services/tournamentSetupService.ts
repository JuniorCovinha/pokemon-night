import {
  DEFAULT_ROUND_DURATION_MINUTES,
  LOCAL_TOURNAMENT_RULES_VERSION,
  MAX_SWISS_PLAYERS,
  MIN_SWISS_PLAYERS,
} from '@/constants/tournament';
import type { Tournament, TournamentConfig } from '@/types';
import type { PlayerDeckRegistration } from './tournamentService';

export type SwissTournamentSetup = {
  config: TournamentConfig;
  registrations: readonly PlayerDeckRegistration[];
};

/** Retorna o padrão local recomendado para campeonatos de até 16 jogadores. */
export function recomendarRodadasSuicas(playerCount: number): number {
  if (playerCount < MIN_SWISS_PLAYERS || playerCount > MAX_SWISS_PLAYERS) {
    throw new Error(
      `O campeonato Suíço aceita entre ${MIN_SWISS_PLAYERS} e ${MAX_SWISS_PLAYERS} jogadores.`,
    );
  }

  return playerCount <= 8 ? 3 : 4;
}

export function criarConfiguracaoSuicaPadrao(playerCount: number): TournamentConfig {
  return {
    name: 'Campeonato Pokémon Night',
    gameType: 'tcg',
    structure: 'swiss',
    tcgFormat: 'casual',
    matchFormat: 'best-of-three',
    roundDurationMinutes: DEFAULT_ROUND_DURATION_MINUTES,
    swissRoundCount: recomendarRodadasSuicas(playerCount),
    rulesVersion: LOCAL_TOURNAMENT_RULES_VERSION,
  };
}

function validarConfigSuica(config: TournamentConfig): TournamentConfig {
  const name = config.name.trim();

  if (!name) throw new Error('Informe um nome para o campeonato.');

  if (config.structure !== 'swiss' && config.structure !== 'swiss-top-cut') {
    throw new Error('A configuração precisa usar uma estrutura Suíça.');
  }

  if (
    !Number.isInteger(config.swissRoundCount) ||
    config.swissRoundCount < 1 ||
    config.swissRoundCount > 8
  ) {
    throw new Error('A quantidade de rodadas Suíças precisa estar entre 1 e 8.');
  }

  if (
    !Number.isInteger(config.roundDurationMinutes) ||
    config.roundDurationMinutes < 10 ||
    config.roundDurationMinutes > 180
  ) {
    throw new Error('A duração de cada rodada precisa estar entre 10 e 180 minutos.');
  }

  return {
    ...config,
    name,
    topCutSize: config.structure === 'swiss-top-cut' ? 4 : undefined,
  };
}

function normalizarInscricoes(
  registrations: readonly PlayerDeckRegistration[],
): PlayerDeckRegistration[] {
  if (
    registrations.length < MIN_SWISS_PLAYERS ||
    registrations.length > MAX_SWISS_PLAYERS
  ) {
    throw new Error(
      `O campeonato Suíço aceita entre ${MIN_SWISS_PLAYERS} e ${MAX_SWISS_PLAYERS} jogadores.`,
    );
  }

  const normalized = registrations.map(({ player, deck }) => ({
    player: { ...player, name: player.name.trim() },
    deck: { ...deck, nome: deck.nome.trim() },
  }));

  if (normalized.some(({ player }) => !player.name)) {
    throw new Error('Todos os jogadores precisam ter um nome.');
  }

  const playerIds = normalized.map(({ player }) => player.id);
  if (new Set(playerIds).size !== playerIds.length) {
    throw new Error('Cada jogador precisa ter um identificador único.');
  }

  const normalizedNames = normalized.map(({ player }) =>
    player.name.toLocaleLowerCase('pt-BR'),
  );
  if (new Set(normalizedNames).size !== normalizedNames.length) {
    throw new Error('Os jogadores precisam ter nomes diferentes.');
  }

  if (normalized.some(({ deck }) => !deck.id || !deck.nome)) {
    throw new Error('Todos os jogadores precisam ter um deck definido.');
  }

  return normalized;
}

/** Confirma configuração e inscrições sem gerar os pareamentos Suíços. */
export function configurarCampeonatoSuico(
  tournament: Tournament,
  setup: SwissTournamentSetup,
): Tournament {
  if (tournament.status !== 'registrando-jogadores') {
    throw new Error('As inscrições só podem ser alteradas antes do campeonato.');
  }

  const config = validarConfigSuica(setup.config);
  const registrations = normalizarInscricoes(setup.registrations);
  const players = registrations.map(({ player }) => player);
  const decks = Array.from(
    new Map(registrations.map(({ deck }) => [deck.id, deck])).values(),
  );
  const assignments = registrations.map(({ player, deck }) => ({
    playerId: player.id,
    deckId: deck.id,
  }));
  const deckRegistrations = registrations.map(({ player, deck }) => ({
    id: `deck-registration-${player.id}`,
    playerId: player.id,
    deckId: deck.id,
  }));
  const entries = deckRegistrations.map((registration) => ({
    playerId: registration.playerId,
    deckRegistrationId: registration.id,
    status: 'checked-in' as const,
    activeFromRound: 1,
  }));

  return {
    ...tournament,
    status: 'inscricoes-confirmadas',
    config,
    players,
    decks,
    assignments,
    entries,
    deckRegistrations,
    bracket: undefined,
    championId: undefined,
  };
}
