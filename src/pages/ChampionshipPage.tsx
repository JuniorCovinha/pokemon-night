import { ArrowLeft, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  ChampionBackdrop,
  ChampionCard,
  ChampionshipRegistration,
  PlayerCard,
  TournamentBracket,
} from '@/components';
import { Button } from '@/components/ui';
import { useChampionReveal } from '@/hooks/useChampionReveal';
import { useTournament } from '@/hooks/useTournament';

export function ChampionshipPage() {
  const navigate = useNavigate();
  const {
    tournament,
    champion,
    error,
    iniciarCampeonatoComDecks,
    registrarVencedor,
    desfazerVencedor,
    reiniciar,
  } = useTournament();
  const { phase, handleTransitionEnded } = useChampionReveal(tournament.championId);
  const registrationOpen = tournament.status === 'registrando-jogadores';

  function deckForPlayer(playerId: string) {
    const assignment = tournament.assignments.find((item) => item.playerId === playerId);
    return tournament.decks.find((deck) => deck.id === assignment?.deckId);
  }

  return (
    <main className="championship-mode mx-auto flex min-h-screen max-w-5xl flex-col gap-12 px-6 py-16 sm:px-8">
      <ChampionBackdrop
        deckType={champion?.deck.tipoPrincipal}
        phase={phase}
        onTransitionEnded={handleTransitionEnded}
      />

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-[9px] uppercase tracking-widest text-brand">
            Modo campeonato
          </p>
          <h1 className="mt-2 font-display text-3xl font-bold text-ink">Pokémon Night</h1>
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

      {phase === 'revealed' && champion && <ChampionCard champion={champion} />}

      {registrationOpen ? (
        <ChampionshipRegistration onStart={iniciarCampeonatoComDecks} />
      ) : (
        <>
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
