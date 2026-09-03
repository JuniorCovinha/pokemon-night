import { ArrowLeft, RotateCcw } from 'lucide-react';
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

export function ChampionshipPage() {
  const navigate = useNavigate();
  const {
    tournament,
    champion,
    error,
    configurarCampeonatoSuico,
    gerarPrimeiraRodadaSuica,
    iniciarRodadaSuica,
    registrarResultadoSuico,
    finalizarRodadaSuica,
    registrarVencedor,
    desfazerVencedor,
    reiniciar,
  } = useTournament();
  const registrationOpen = tournament.status === 'registrando-jogadores';
  const swissSetupReady =
    tournament.status === 'inscricoes-confirmadas' && Boolean(tournament.config);
  const currentSwissRound = tournament.swissRounds.at(-1);
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
        <p className="rounded-xl bg-danger-soft px-4 py-2.5 text-sm text-danger">
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
            <SwissRoundPanel
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
          )}

          <section className="flex flex-col gap-4">
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
  );
}
