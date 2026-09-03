import { useEffect, useRef } from 'react';
import { ArrowLeft, Shuffle, Swords, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTournament } from '@/hooks/useTournament';
import {
  PlayerCard,
  BrandTitle,
  DeckGrid,
  TournamentBracket,
  ChampionCard,
  NeutralBackdrop,
  DeckSelection,
} from '@/components';
import { Button } from '@/components/ui';
import { MAX_DRAW_DECKS } from '@/constants/tournament';
import { bracketWasJustCreated, focusAndScrollToBracket } from '@/hooks/bracketScroll';

export function HomePage() {
  const navigate = useNavigate();
  const championAnnouncementRef = useRef<HTMLElement>(null);
  const bracketSectionRef = useRef<HTMLElement>(null);
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
  const previousChampionId = useRef(tournament.championId);
  const previouslyHadBracket = useRef(Boolean(tournament.bracket));

  const decksJaSorteados = tournament.status !== 'registrando-jogadores';
  const chaveGerada = Boolean(tournament.bracket);
  const quantidadeDeDecksCorreta =
    tournament.decks.length >= tournament.players.length &&
    tournament.decks.length <= MAX_DRAW_DECKS;

  useEffect(() => {
    const championId = tournament.championId;
    const championWasJustDecided =
      Boolean(championId) && championId !== previousChampionId.current;

    previousChampionId.current = championId;
    if (!championWasJustDecided) return;

    championAnnouncementRef.current?.focus({ preventScroll: true });
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  }, [tournament.championId]);

  useEffect(() => {
    const hasBracket = Boolean(tournament.bracket);
    const bracketHasJustBeenCreated = bracketWasJustCreated(
      previouslyHadBracket.current,
      hasBracket,
    );

    previouslyHadBracket.current = hasBracket;
    if (!bracketHasJustBeenCreated) return;

    const bracketSection = bracketSectionRef.current;
    if (!bracketSection) return;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    focusAndScrollToBracket(bracketSection, reduceMotion);
  }, [tournament.bracket]);

  function deckDoJogador(playerId: string) {
    const assignment = tournament.assignments.find((a) => a.playerId === playerId);
    return tournament.decks.find((d) => d.id === assignment?.deckId);
  }

  function deckAtribuido(deckId: string) {
    return tournament.assignments.some((a) => a.deckId === deckId);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-10 px-6 py-14">
      <NeutralBackdrop />

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-[9px] uppercase tracking-widest text-brand">
            Modo sorteio de decks
          </p>
          <BrandTitle className="mt-2 text-2xl" />
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

      {champion && (
        <section
          ref={championAnnouncementRef}
          tabIndex={-1}
          aria-label={`Campeão da noite: ${champion.player.name}`}
        >
          <ChampionCard champion={champion} />
        </section>
      )}

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

          <DeckGrid
            decks={tournament.decks.filter((deck) => deckAtribuido(deck.id))}
            revealed={decksJaSorteados}
          />
        </section>
      )}

      {chaveGerada && tournament.bracket && (
        <section
          ref={bracketSectionRef}
          tabIndex={-1}
          aria-label="Chave dos confrontos sorteados"
          className="scroll-mt-6 flex flex-col gap-4 outline-none focus-visible:ring-2 focus-visible:ring-champion focus-visible:ring-offset-4"
        >
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
