import { ArrowLeft, Shuffle, Swords, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '@/hooks/useTournament';
import { useChampionReveal } from '@/hooks/useChampionReveal';
import {
  PlayerCard,
  DeckGrid,
  TournamentBracket,
  ChampionCard,
  ChampionBackdrop,
  DeckSelection,
} from '@/components';
import { Button } from '@/components/ui';
import { MAX_DRAW_DECKS } from '@/constants/tournament';

export function HomePage() {
  const navigate = useNavigate();
  const {
    tournament,
    champion,
    error,
    definirDecks,
    sortearDecks,
    gerarChave,
    registrarVencedor,
    desfazerVencedor,
    renomearJogador,
    reiniciar,
  } = useTournament();

  const { phase, handleTransitionEnded } = useChampionReveal(tournament.championId);

  const decksJaSorteados = tournament.status !== 'registrando-jogadores';
  const chaveGerada = Boolean(tournament.bracket);
  const quantidadeDeDecksCorreta =
    tournament.decks.length >= tournament.players.length &&
    tournament.decks.length <= MAX_DRAW_DECKS;

  function deckDoJogador(playerId: string) {
    const assignment = tournament.assignments.find((a) => a.playerId === playerId);
    return tournament.decks.find((d) => d.id === assignment?.deckId);
  }

  function deckAtribuido(deckId: string) {
    return tournament.assignments.some((a) => a.deckId === deckId);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-10 px-6 py-14">
      <ChampionBackdrop
        deckType={champion?.deck.tipoPrincipal}
        phase={phase}
        onTransitionEnded={handleTransitionEnded}
      />

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-[9px] uppercase tracking-widest text-brand">
            Modo sorteio de decks
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold text-ink">Pokémon Night</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            <ArrowLeft size={14} />
            Modos
          </Button>
          <Button variant="secondary" size="sm" onClick={reiniciar}>
            <RotateCcw size={14} />
            Novo Campeonato
          </Button>
        </div>
      </header>

      {error && (
        <p className="rounded-xl bg-brand-soft px-4 py-2.5 text-sm text-brand">{error}</p>
      )}

      {phase === 'revealed' && champion && <ChampionCard champion={champion} />}

      {tournament.status === 'registrando-jogadores' && (
        <DeckSelection
          selectedDecks={tournament.decks}
          requiredDeckCount={tournament.players.length}
          maximumDeckCount={MAX_DRAW_DECKS}
          onChange={definirDecks}
        />
      )}

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-soft">
            Jogadores
          </h2>
          <Button
            size="sm"
            onClick={sortearDecks}
            disabled={
              tournament.status !== 'registrando-jogadores' || !quantidadeDeDecksCorreta
            }
          >
            <Shuffle size={14} />
            Sortear Decks
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {tournament.players.map((player) => (
            <PlayerCard
              key={player.id}
              player={player}
              deck={deckDoJogador(player.id)}
              editable={tournament.status === 'registrando-jogadores'}
              onRename={(novoNome) => renomearJogador(player.id, novoNome)}
            />
          ))}
        </div>
      </section>

      {decksJaSorteados && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-soft">
              Decks Sorteados
            </h2>
            <Button
              size="sm"
              onClick={gerarChave}
              disabled={tournament.status !== 'decks-sorteados'}
            >
              <Swords size={14} />
              Sortear Confrontos
            </Button>
          </div>

          <DeckGrid decks={tournament.decks.filter((deck) => deckAtribuido(deck.id))} />
        </section>
      )}

      {chaveGerada && tournament.bracket && (
        <section className="flex flex-col gap-4">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wide text-ink-soft">
            Campeonato
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
    </main>
  );
}
