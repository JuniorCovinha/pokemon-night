import { useState, type FormEvent } from 'react';
import { CheckCircle2, Search, Swords, X } from 'lucide-react';
import { getTypeColor } from '@/constants/pokemonTypes';
import { generateId } from '@/utils';
import { Button, Card, Input } from '@/components/ui';
import { PokemonDeckSearch } from './PokemonDeckSearch';
import type { Deck } from '@/types';
import type { PlayerDeckRegistration } from '@/services';

type RegistrationDraft = {
  id: string;
  name: string;
  deck?: Deck;
};

type ChampionshipRegistrationProps = {
  onStart: (registrations: PlayerDeckRegistration[]) => void;
};

const PLAYER_COUNTS = [2, 4, 8, 16] as const;

function createDraft(): RegistrationDraft {
  return { id: generateId('player'), name: '' };
}

function createDrafts(count: number): RegistrationDraft[] {
  return Array.from({ length: count }, createDraft);
}

export function ChampionshipRegistration({ onStart }: ChampionshipRegistrationProps) {
  const [drafts, setDrafts] = useState<RegistrationDraft[]>(() => createDrafts(4));
  const [choosingDeckFor, setChoosingDeckFor] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);

  function changePlayerCount(count: number) {
    setDrafts((current) => {
      if (count <= current.length) return current.slice(0, count);
      return [...current, ...createDrafts(count - current.length)];
    });
    setChoosingDeckFor(undefined);
    setFormError(null);
  }

  function updateName(playerId: string, name: string) {
    setDrafts((current) =>
      current.map((draft) => (draft.id === playerId ? { ...draft, name } : draft)),
    );
    setFormError(null);
  }

  function setDeck(playerId: string, deck: Deck) {
    setDrafts((current) =>
      current.map((draft) => (draft.id === playerId ? { ...draft, deck } : draft)),
    );
    setChoosingDeckFor(undefined);
    setFormError(null);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (drafts.some((draft) => draft.name.trim().length === 0)) {
      setFormError('Preencha o nome de todos os jogadores.');
      return;
    }

    if (drafts.some((draft) => !draft.deck)) {
      setFormError('Escolha o deck de todos os jogadores.');
      return;
    }

    const normalizedNames = drafts.map((draft) =>
      draft.name.trim().toLocaleLowerCase('pt-BR'),
    );
    if (new Set(normalizedNames).size !== normalizedNames.length) {
      setFormError('Use um nome diferente para cada jogador.');
      return;
    }

    onStart(
      drafts.map((draft) => ({
        player: { id: draft.id, name: draft.name.trim() },
        deck: draft.deck!,
      })),
    );
  }

  const activeDraft = drafts.find((draft) => draft.id === choosingDeckFor);

  return (
    <form onSubmit={submit} className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold uppercase tracking-wide text-ink-soft">
              Inscrições
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              Informe cada jogador e o Pokémon principal do deck que ele trouxe.
            </p>
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="font-display text-[10px] uppercase tracking-wide text-ink-soft">
              Jogadores
            </span>
            <select
              value={drafts.length}
              onChange={(event) => changePlayerCount(Number(event.target.value))}
              className="rounded-lg border-2 border-line bg-white px-3.5 py-2 font-sans text-sm text-ink outline-none transition-all focus:border-ink focus:shadow-[var(--shadow-pixel-sm)]"
            >
              {PLAYER_COUNTS.map((count) => (
                <option key={count} value={count}>
                  {count}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {drafts.map((draft, index) => (
            <Card key={draft.id} className="light-card flex flex-col gap-4 !p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-canvas font-display text-[10px]">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Input
                    label={`Jogador ${index + 1}`}
                    value={draft.name}
                    onChange={(event) => updateName(draft.id, event.target.value)}
                    placeholder="Nome do jogador"
                    autoComplete="off"
                  />
                </div>
              </div>

              {draft.deck ? (
                <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-alt p-2.5">
                  {draft.deck.miniatura || draft.deck.imagem ? (
                    <img
                      src={draft.deck.miniatura ?? draft.deck.imagem}
                      alt={draft.deck.nome}
                      className="h-14 w-14 shrink-0 rounded-lg object-contain"
                    />
                  ) : (
                    <span
                      className="h-10 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: getTypeColor(draft.deck.tipoPrincipal) }}
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">
                      {draft.deck.nome}
                    </p>
                    <p
                      className="truncate text-xs font-semibold"
                      style={{ color: getTypeColor(draft.deck.tipoPrincipal) }}
                    >
                      {draft.deck.tipoPrincipal ?? 'Tipo não informado'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setChoosingDeckFor(draft.id)}
                    className="rounded-full p-2 text-ink-soft transition-colors hover:bg-white hover:text-ink"
                    aria-label={`Alterar deck de ${draft.name || `jogador ${index + 1}`}`}
                  >
                    <Search size={15} />
                  </button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setChoosingDeckFor(draft.id)}
                  className="w-full"
                >
                  <Search size={14} />
                  Escolher deck
                </Button>
              )}
            </Card>
          ))}
        </div>
      </section>

      {activeDraft && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-ink-soft">
                Deck de {activeDraft.name.trim() || 'jogador sem nome'}
              </h3>
              <p className="mt-1 text-sm text-ink-soft">
                Escolha o Pokémon principal que representa este deck.
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setChoosingDeckFor(undefined)}
            >
              <X size={14} />
              Fechar
            </Button>
          </div>

          <PokemonDeckSearch onSelect={(deck) => setDeck(activeDraft.id, deck)} />
        </section>
      )}

      {formError && (
        <p
          role="alert"
          className="rounded-xl bg-danger-soft px-4 py-2.5 text-sm text-danger"
        >
          {formError}
        </p>
      )}

      <div className="flex flex-col items-end gap-2">
        <p className="flex items-center gap-1.5 text-xs text-ink-soft">
          <CheckCircle2 size={14} />
          Decks iguais são permitidos neste modo.
        </p>
        <Button type="submit">
          <Swords size={15} />
          Sortear confrontos
        </Button>
      </div>
    </form>
  );
}
