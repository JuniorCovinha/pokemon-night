import { renderToStaticMarkup } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { ChampionshipPage } from './ChampionshipPage';
import { useTournament } from '@/hooks/useTournament';
import {
  calcularClassificacaoSuica,
  configurarCampeonatoSuico,
  criarConfiguracaoSuicaPadrao,
  criarTorneio,
  gerarPrimeiraRodadaSuica,
  gerarProximaRodadaSuica,
  iniciarRodadaSuica,
  registrarResultadoPartidaSuica,
  finalizarRodadaSuica,
  reabrirRodadaSuica,
} from '@/services';
import type { Tournament } from '@/types';

vi.mock('@/hooks/useTournament', () => ({ useTournament: vi.fn() }));

function configured(rounds = 3) {
  return configurarCampeonatoSuico(criarTorneio([], []), {
    config: { ...criarConfiguracaoSuicaPadrao(4), swissRoundCount: rounds },
    registrations: Array.from({ length: 4 }, (_, index) => ({
      player: { id: `p${index}`, name: `Jogador ${index}` },
      deck: { id: `d${index}`, nome: 'Pikachu' },
    })),
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

function render(tournament: Tournament) {
  vi.mocked(useTournament).mockReturnValue({
    tournament,
    champion: undefined,
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
  return renderToStaticMarkup(
    <MemoryRouter>
      <ChampionshipPage />
    </MemoryRouter>,
  );
}

describe('continuação do Campeonato', () => {
  it('oferece a próxima rodada somente após encerrar a atual', () => {
    const paired = gerarPrimeiraRodadaSuica(configured());
    expect(render(paired)).toContain('Inscritos');
    expect(render(paired)).not.toContain('Gerar rodada 2');
    const activeHtml = render(iniciarRodadaSuica(paired));
    expect(activeHtml).not.toContain('Gerar rodada 2');
    expect(activeHtml).not.toContain('id="championship-players"');
    expect(render(complete(paired))).toContain('Gerar rodada 2');
  });

  it('mantém a classificação anterior e histórico ao apresentar os novos confrontos', () => {
    const state = gerarProximaRodadaSuica(
      complete(gerarPrimeiraRodadaSuica(configured())),
    );
    const html = render(state);
    expect(html).toContain('Confrontos da rodada 2');
    expect(html).toContain('Rodada 2 de 3');
    expect(html).toContain('Após a rodada 1');
    expect(html).toContain('Histórico de rodadas');
    expect(html).toContain('Rodada 1 — encerrada');
    expect(html).not.toContain('Confirmar correção');
  });

  it('mostra conclusão do Suíço sem botão de rodada extra nem campeão arbitrário', () => {
    const state = complete(gerarPrimeiraRodadaSuica(configured(1)));
    const html = render(state);
    expect(html).toContain('Fase Suíça concluída');
    expect(html).not.toContain('Gerar rodada 2');
    expect(html).not.toContain('Campeão da noite');
  });

  it('oferece reabertura só na última rodada encerrada e identifica as anteriores protegidas', () => {
    const closed = complete(gerarPrimeiraRodadaSuica(configured()));
    expect(render(closed)).toContain('Reabrir rodada 1 para correção');
    const next = gerarProximaRodadaSuica(closed);
    const html = render(next);
    expect(html).not.toContain('Reabrir rodada 1 para correção');
    expect(html).toContain('Rodada protegida');
    expect(render(complete(next))).toContain('Reabrir rodada 2 para correção');
  });

  it('exibe motivo da reabertura e correção antes/depois enquanto bloqueia a próxima rodada', () => {
    const closed = complete(gerarPrimeiraRodadaSuica(configured()));
    let reopened = reabrirRodadaSuica(closed, 1, 'Vencedor digitado incorretamente');
    reopened = registrarResultadoPartidaSuica(
      reopened,
      reopened.tournamentMatches[0].id,
      { gameOutcomes: ['player2-win', 'player2-win'] },
    );
    const html = render(reopened);
    expect(html).toContain('Rodada reaberta para correção');
    expect(html).toContain('Histórico de alterações');
    expect(html).toContain('Justificativa: Vencedor digitado incorretamente');
    expect(html).toContain('Resultado corrigido');
    expect(html).toContain('Antes: Vitória');
    expect(html).toContain('Depois: Vitória');
    expect(html).not.toContain('Gerar rodada 2');
    expect(html).toContain('Confirmar correção');
  });

  it('permite reabrir a rodada final e retira temporariamente o aviso de Suíço concluído', () => {
    const completed = complete(gerarPrimeiraRodadaSuica(configured(1)));
    expect(render(completed)).toContain('Reabrir rodada 1 para correção');
    const reopened = reabrirRodadaSuica(completed, 1, 'Revisar resultado final');
    expect(render(reopened)).not.toContain('Fase Suíça concluída');
    expect(render(finalizarRodadaSuica(reopened))).toContain('Fase Suíça concluída');
  });
});
