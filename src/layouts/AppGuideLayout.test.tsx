import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { HomePage } from '@/pages/HomePage';
import { ChampionshipPage } from '@/pages/ChampionshipPage';
import { ModeSelectionPage } from '@/pages/ModeSelectionPage';
import { useTournament } from '@/hooks/useTournament';
import { APP_MODES, getGuideContext, type AppMode } from '@/constants/appGuide';
import {
  criarTorneio,
  obterCampeao,
  calcularClassificacaoSuica,
  sortearDecksDoTorneio,
  gerarChaveDoTorneio,
  registrarVencedorDoTorneio,
  configurarCampeonatoSuico,
  criarConfiguracaoSuicaPadrao,
  gerarPrimeiraRodadaSuica,
  iniciarRodadaSuica,
  registrarResultadoPartidaSuica,
  finalizarRodadaSuica,
  gerarProximaRodadaSuica,
} from '@/services';
import type { Tournament } from '@/types';

vi.mock('@/hooks/useTournament', () => ({ useTournament: vi.fn() }));

const players = Array.from({ length: 4 }, (_, i) => ({
  id: `p${i}`,
  name: `Jogador ${i}`,
}));
const decks = players.map((_, i) => ({ id: `d${i}`, nome: 'Pikachu' }));

function render(mode: AppMode, tournament = criarTorneio(players, decks)) {
  vi.mocked(useTournament).mockReturnValue({
    tournament,
    champion: obterCampeao(tournament),
    standings: calcularClassificacaoSuica(tournament),
    error: null,
    definirDecks: vi.fn(),
    sortearDecks: vi.fn(),
    gerarChave: vi.fn(),
    iniciarCampeonatoComDecks: vi.fn(),
    configurarCampeonatoSuico: vi.fn(),
    gerarPrimeiraRodadaSuica: vi.fn(),
    gerarProximaRodadaSuica: vi.fn(),
    iniciarRodadaSuica: vi.fn(),
    registrarResultadoSuico: vi.fn(),
    finalizarRodadaSuica: vi.fn(),
    reabrirRodadaSuica: vi.fn(),
    registrarVencedor: vi.fn(),
    desfazerVencedor: vi.fn(),
    renomearJogador: vi.fn(),
    reiniciar: vi.fn(),
  });
  const html = renderToStaticMarkup(
    <MemoryRouter>
      {mode === 'home' ? (
        <ModeSelectionPage />
      ) : mode === 'sorteio' ? (
        <HomePage />
      ) : (
        <ChampionshipPage />
      )}
    </MemoryRouter>,
  );
  const context = getGuideContext(mode, tournament);
  for (const { targetId } of context.shortcuts) {
    expect(html).toContain(`href="#${targetId}"`);
    expect(html.split(`id="${targetId}"`)).toHaveLength(2);
    expect(html).toMatch(new RegExp(`id="${targetId}"[^>]*tabindex="-1"`));
  }
  return { html, targets: context.shortcuts.map((item) => item.targetId) };
}

function configured() {
  return configurarCampeonatoSuico(criarTorneio([], []), {
    config: criarConfiguracaoSuicaPadrao(4),
    registrations: players.map((player, i) => ({ player, deck: decks[i] })),
  });
}

function complete(tournament: Tournament) {
  let state = iniciarRodadaSuica(tournament);
  for (const match of state.tournamentMatches.filter(
    (item) => item.roundNumber === state.swissRounds.at(-1)!.number,
  )) {
    state = registrarResultadoPartidaSuica(state, match.id, {
      gameOutcomes: ['player1-win', 'player1-win'],
    });
  }
  return finalizarRodadaSuica(state);
}

describe('guia lateral contextual', () => {
  it('usa as mesmas descrições na entrada e no guia, sem criar outra seleção de rotas', () => {
    const { html, targets } = render('home');
    expect(targets).toEqual(['mode-selection']);
    for (const mode of APP_MODES) {
      expect(html.split(mode.description)).toHaveLength(4);
      expect(html.split(`href="${mode.path}"`)).toHaveLength(2);
    }
  });

  it('apresenta atalhos só para configuração e inscrições antes da confirmação', () => {
    expect(render('campeonato').targets).toEqual([
      'championship-settings',
      'championship-registrations',
    ]);
    expect(render('campeonato', configured()).targets).toEqual([
      'championship-setup',
      'championship-players',
    ]);
  });

  it('disponibiliza classificação apenas após iniciar a primeira rodada', () => {
    const paired = gerarPrimeiraRodadaSuica(configured());
    expect(render('campeonato', paired).targets).not.toContain('swiss-standings-heading');
    expect(render('campeonato', paired).targets).toContain('championship-players');
    const started = render('campeonato', iniciarRodadaSuica(paired));
    expect(started.targets).toContain('swiss-standings-heading');
    expect(started.targets).not.toContain('championship-players');
  });

  it('inclui auditoria e rodadas anteriores somente quando existem', () => {
    const closed = complete(gerarPrimeiraRodadaSuica(configured()));
    const { targets } = render('campeonato', closed);
    expect(targets).toContain('championship-audit');
    expect(targets).not.toContain('championship-history');
    const next = render('campeonato', gerarProximaRodadaSuica(closed));
    expect(next.targets).toContain('championship-history');
    expect(next.targets).toContain('swiss-standings-heading');
  });

  it('acompanha seleção, distribuição e chave do Sorteio sem expor opções suíças', () => {
    const initial = criarTorneio(players, decks);
    expect(render('sorteio', initial).targets).toEqual([
      'draw-deck-selection',
      'draw-players',
    ]);
    const drawn = sortearDecksDoTorneio(initial);
    expect(render('sorteio', drawn).targets).toEqual(['draw-players', 'draw-results']);
    const { html, targets } = render('sorteio', gerarChaveDoTorneio(drawn));
    expect(targets).toEqual(['draw-players', 'draw-results', 'draw-bracket']);
    expect(html).not.toContain('Configuração do campeonato');
  });

  it('oferece o atalho do campeão somente depois da decisão da final', () => {
    let state = gerarChaveDoTorneio(sortearDecksDoTorneio(criarTorneio(players, decks)));
    for (const round of state.bracket!.rounds) {
      for (const match of round.matches) {
        const current = state
          .bracket!.rounds.flatMap((item) => item.matches)
          .find((item) => item.id === match.id)!;
        state = registrarVencedorDoTorneio(state, match.id, current.player1Id!);
      }
    }
    expect(render('sorteio', state).targets).toContain('draw-champion');
  });

  it('explica limitações atuais de Top Cut, salvamento e regras locais', () => {
    const { html } = render('campeonato');
    expect(html).toContain('geração dessa fase ainda não estão disponíveis');
    expect(html).toContain('Salvamento e exportação ainda não estão disponíveis');
    expect(html).toContain('Não substitui o TOM');
  });

  it('explica a pesquisa de Pokémon sem expor detalhes técnicos dos serviços', () => {
    const { html } = render('home');
    expect(html).toContain('O app busca pelas cartas');
    expect(html).toContain('se esse serviço estiver indisponível, busca pelo Pokémon');
    expect(html).not.toContain('TCGdex');
    expect(html).not.toContain('PokéAPI');
  });

  it('renderiza o painel móvel inicialmente fechado e com identificação acessível', () => {
    const { html } = render('home');
    const dialog = html.match(/<dialog[^>]*>/)?.[0];
    expect(dialog).toContain('aria-labelledby=');
    expect(dialog).not.toMatch(/\sopen(?:=|\s|>)/);
    expect(html).toContain('aria-label="Fechar menu"');
    expect(html).toContain('aria-label="Expandir guia lateral"');
  });

  it('sobrepõe o guia no desktop sem deslocar o conteúdo principal', () => {
    const { html } = render('home');
    expect(html).not.toContain('lg:pl-80');
    expect(html).not.toContain('lg:pl-16');
    expect(html).toContain('fixed left-0 z-40');
    expect(html).toContain('top-4 ml-4 h-12 w-12');
    expect(html).toContain('aria-expanded="false"');
  });
});
