import { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  ChampionCard,
  BrandTitle,
  ChampionshipRegistration,
  NeutralBackdrop,
  PlayerCard,
  TournamentBracket,
  TournamentSetupSummary,
  SwissRoundPanel,
} from '@/components';
import { Button } from '@/components/ui';
import { useTournament } from '@/hooks/useTournament';
import { SwissStandingsPanel } from '@/components/SwissStandingsPanel';
import { ReopenSwissRound } from '@/components/ReopenSwissRound';
import { TournamentAuditLog } from '@/components/TournamentAuditLog';
import { AppGuideLayout } from '@/layouts/AppGuideLayout';

export function ChampionshipPage() {
  const navigate = useNavigate();
  const {
    tournament,
    champion,
    standings,
    error,
    configurarCampeonatoSuico,
    gerarPrimeiraRodadaSuica,
    gerarProximaRodadaSuica,
    iniciarRodadaSuica,
    registrarResultadoSuico,
    finalizarRodadaSuica,
    reabrirRodadaSuica,
    registrarVencedor,
    desfazerVencedor,
    reiniciar,
  } = useTournament();
  const registrationOpen = tournament.status === 'registrando-jogadores';
  const swissSetupReady =
    tournament.status === 'inscricoes-confirmadas' && Boolean(tournament.config);
  const currentSwissRound = tournament.swissRounds.at(-1);
  const championshipStarted = tournament.swissRounds.some(
    (round) => round.status !== 'paired' || Boolean(round.startedAt),
  );
  const currentRoundNumber = currentSwissRound?.number;
  const currentRoundRevision = currentSwissRound?.revision;
  const roundPanelRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLParagraphElement>(null);
  const standingsRound =
    currentSwissRound?.status === 'paired'
      ? tournament.swissRounds.at(-2)
      : currentSwissRound;
  const pastRounds = tournament.swissRounds.filter(
    (round) => round.number !== currentRoundNumber && round.status === 'completed',
  );

  useEffect(() => {
    const target = roundPanelRef.current;
    if (!currentRoundNumber || !target) return;
    target.focus({ preventScroll: true });
    target.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
      block: 'start',
    });
  }, [currentRoundNumber, currentRoundRevision]);

  useEffect(() => {
    if (!error || !errorRef.current) return;
    errorRef.current.focus({ preventScroll: true });
    errorRef.current.scrollIntoView({ block: 'center', behavior: 'auto' });
  }, [error]);
  const currentSwissMatches = currentSwissRound
    ? tournament.tournamentMatches.filter((match) =>
        currentSwissRound.matchIds.includes(match.id),
      )
    : [];

  function deckForPlayer(playerId: string) {
    const assignment = tournament.assignments.find((item) => item.playerId === playerId);
    return tournament.decks.find((deck) => deck.id === assignment?.deckId);
  }

  return (
    <AppGuideLayout mode="campeonato" tournament={tournament}>
      <main className="championship-mode mx-auto flex min-h-screen max-w-5xl flex-col gap-12 px-6 py-16 sm:px-8">
        <NeutralBackdrop />

        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-display text-[9px] uppercase tracking-widest text-brand">
              Modo campeonato
            </p>
            <BrandTitle className="mt-2 text-3xl" />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft size={14} />
              Modos
            </Button>
            {!registrationOpen && (
              <Button variant="secondary" size="sm" onClick={reiniciar}>
                <RotateCcw size={14} />
                Novo campeonato
              </Button>
            )}
          </div>
        </header>

        {error && (
          <p
            ref={errorRef}
            role="alert"
            tabIndex={-1}
            className="rounded-xl bg-danger-soft px-4 py-2.5 text-sm text-danger"
          >
            {error}
          </p>
        )}

        {champion && <ChampionCard champion={champion} />}

        {registrationOpen ? (
          <ChampionshipRegistration onConfirm={configurarCampeonatoSuico} />
        ) : (
          <>
            {swissSetupReady && tournament.config && (
              <TournamentSetupSummary
                config={tournament.config}
                playerCount={tournament.players.length}
                onGenerateFirstRound={gerarPrimeiraRodadaSuica}
              />
            )}

            {currentSwissRound && (
              <div
                ref={roundPanelRef}
                id="championship-round"
                data-guide-section
                tabIndex={-1}
                aria-label={`Confrontos da rodada ${currentSwissRound.number}`}
                className="scroll-mt-6 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
              >
                <p className="mb-3 text-sm text-ink-soft">
                  Rodada {currentSwissRound.number} de{' '}
                  {tournament.config?.swissRoundCount}
                </p>
                <SwissRoundPanel
                  key={`${currentSwissRound.number}-${currentSwissRound.revision}`}
                  round={currentSwissRound}
                  matches={currentSwissMatches}
                  players={tournament.players}
                  decks={tournament.decks}
                  assignments={tournament.assignments}
                  matchFormat={tournament.config?.matchFormat ?? 'best-of-three'}
                  onStartRound={iniciarRodadaSuica}
                  onSubmitResult={registrarResultadoSuico}
                  onFinishRound={finalizarRodadaSuica}
                />
              </div>
            )}

            {currentSwissRound?.status === 'completed' &&
              !tournament.bracket &&
              !tournament.championId && (
                <ReopenSwissRound
                  key={`${currentSwissRound.number}-${currentSwissRound.revision}`}
                  roundNumber={currentSwissRound.number}
                  onReopen={reabrirRodadaSuica}
                />
              )}

            {standingsRound && (
              <SwissStandingsPanel
                standings={standings}
                round={standingsRound}
                players={tournament.players}
                decks={tournament.decks}
                assignments={tournament.assignments}
              />
            )}

            {tournament.status === 'rodada-suica-concluida' && currentSwissRound && (
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="max-w-xl text-sm text-ink-soft">
                  Rodada encerrada. Os próximos confrontos usarão os pontos acumulados,
                  sem repetir adversários ou o jogador que recebeu bye.
                </p>
                <Button type="button" onClick={gerarProximaRodadaSuica}>
                  <ArrowRight size={16} />
                  Gerar rodada {currentSwissRound.number + 1}
                </Button>
              </div>
            )}

            {tournament.status === 'suico-concluido' && (
              <div
                role="status"
                className="light-card rounded-xl border border-success/30 bg-success-soft px-5 py-4 text-ink"
              >
                <h2 className="font-display text-sm">Fase Suíça concluída</h2>
                <p className="mt-2 text-sm">
                  Todas as {tournament.config?.swissRoundCount} rodadas foram encerradas.
                  {tournament.config?.structure === 'swiss-top-cut'
                    ? ' Confira a classificação; as vagas do Top 4 ainda precisam ser confirmadas.'
                    : ' Confira a classificação e os resultados de cada rodada.'}
                </p>
              </div>
            )}

            {pastRounds.length > 0 && (
              <section
                id="championship-history"
                tabIndex={-1}
                data-guide-section
                aria-label="Histórico de rodadas"
                className="flex flex-col gap-4"
              >
                <h2 className="font-display text-base uppercase tracking-wide text-ink-soft">
                  Rodadas anteriores
                </h2>
                {pastRounds.map((round) => (
                  <details
                    key={round.number}
                    className="rounded-xl border border-white/20 bg-black/20 p-4"
                  >
                    <summary className="cursor-pointer text-sm font-semibold text-ink-soft">
                      Rodada {round.number} — encerrada
                    </summary>
                    <div className="mt-4">
                      <p className="mb-3 text-sm text-ink-soft">
                        Rodada protegida: já existem pareamentos de uma rodada posterior.
                      </p>
                      <SwissRoundPanel
                        round={round}
                        matches={tournament.tournamentMatches.filter((match) =>
                          round.matchIds.includes(match.id),
                        )}
                        players={tournament.players}
                        decks={tournament.decks}
                        assignments={tournament.assignments}
                        matchFormat={tournament.config?.matchFormat ?? 'best-of-three'}
                        onStartRound={iniciarRodadaSuica}
                        onSubmitResult={registrarResultadoSuico}
                        onFinishRound={finalizarRodadaSuica}
                      />
                    </div>
                  </details>
                ))}
              </section>
            )}

            <TournamentAuditLog
              entries={tournament.auditLog ?? []}
              players={tournament.players}
            />

            {!championshipStarted && (
              <section
                id="championship-players"
                tabIndex={-1}
                data-guide-section
                className="flex flex-col gap-4"
              >
                <h2 className="font-display text-base font-semibold uppercase tracking-wide text-ink-soft">
                  Inscritos
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {tournament.players.map((player) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      deck={deckForPlayer(player.id)}
                    />
                  ))}
                </div>
              </section>
            )}

            {tournament.bracket && (
              <section className="flex flex-col gap-4">
                <h2 className="font-display text-base font-semibold uppercase tracking-wide text-ink-soft">
                  Confrontos
                </h2>
                <TournamentBracket
                  bracket={tournament.bracket}
                  players={tournament.players}
                  decks={tournament.decks}
                  assignments={tournament.assignments}
                  onSelectWinner={registrarVencedor}
                  podeDesfazer={tournament.status !== 'finalizado'}
                  onUndoWinner={desfazerVencedor}
                />
              </section>
            )}
          </>
        )}
      </main>
    </AppGuideLayout>
  );
}
