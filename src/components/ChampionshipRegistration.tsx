import { useState, type FormEvent } from 'react';
import { CheckCircle2, Plus, Search, Settings2, Trash2, Users, X } from 'lucide-react';
import { getTypeColor } from '@/constants/pokemonTypes';
import { MAX_SWISS_PLAYERS, MIN_SWISS_PLAYERS } from '@/constants/tournament';
import { criarConfiguracaoSuicaPadrao, recomendarRodadasSuicas } from '@/services';
import { generateId } from '@/utils';
import { Button, Card, Input } from '@/components/ui';
import { DeckPokemonImage } from './DeckPokemonImage';
import { hasDeckPokemonImage } from './deckMedia';
import { PokemonDeckSearch } from './PokemonDeckSearch';
import type { Deck, MatchFormat, TcgFormat, TournamentConfig } from '@/types';
import type { SwissTournamentSetup } from '@/services';

type RegistrationDraft = {
  id: string;
  name: string;
  deck?: Deck;
};

type ChampionshipRegistrationProps = {
  onConfirm: (setup: SwissTournamentSetup) => void;
};

function createDraft(): RegistrationDraft {
  return { id: generateId('player'), name: '' };
}

function createDrafts(count: number): RegistrationDraft[] {
  return Array.from({ length: count }, createDraft);
}

export function ChampionshipRegistration({ onConfirm }: ChampionshipRegistrationProps) {
  const [drafts, setDrafts] = useState<RegistrationDraft[]>(() =>
    createDrafts(MIN_SWISS_PLAYERS),
  );
  const [config, setConfig] = useState<TournamentConfig>(() =>
    criarConfiguracaoSuicaPadrao(MIN_SWISS_PLAYERS),
  );
  const [choosingDeckFor, setChoosingDeckFor] = useState<string>();
  const [formError, setFormError] = useState<string | null>(null);

  function updateRecommendedRounds(playerCount: number) {
    setConfig((current) => ({
      ...current,
      swissRoundCount: recomendarRodadasSuicas(playerCount),
    }));
  }

  function addPlayer() {
    if (drafts.length >= MAX_SWISS_PLAYERS) return;

    const nextCount = drafts.length + 1;
    setDrafts((current) => [...current, createDraft()]);
    updateRecommendedRounds(nextCount);
    setFormError(null);
  }

  function removePlayer(playerId: string) {
    if (drafts.length <= MIN_SWISS_PLAYERS) return;

    const nextCount = drafts.length - 1;
    setDrafts((current) => current.filter((draft) => draft.id !== playerId));
    updateRecommendedRounds(nextCount);
    if (choosingDeckFor === playerId) setChoosingDeckFor(undefined);
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

  function updateConfig<Key extends keyof TournamentConfig>(
    key: Key,
    value: TournamentConfig[Key],
  ) {
    setConfig((current) => ({ ...current, [key]: value }));
    setFormError(null);
  }

  function toggleTopCut(enabled: boolean) {
    setConfig((current) => ({
      ...current,
      structure: enabled ? 'swiss-top-cut' : 'swiss',
      topCutSize: enabled ? 4 : undefined,
    }));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!config.name.trim()) {
      setFormError('Informe um nome para o campeonato.');
      return;
    }

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

    onConfirm({
      config,
      registrations: drafts.map((draft) => ({
        player: { id: draft.id, name: draft.name.trim() },
        deck: draft.deck!,
      })),
    });
  }

  const activeDraft = drafts.find((draft) => draft.id === choosingDeckFor);

  return (
    <form onSubmit={submit} className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div>
          <p className="flex items-center gap-2 font-display text-[10px] uppercase tracking-widest text-brand">
            <Settings2 size={14} />
            Etapa 1 de 2
          </p>
          <h2 className="mt-2 font-display text-lg font-semibold uppercase tracking-wide text-ink-soft">
            Configuração do torneio
          </h2>
          <p className="mt-1 text-sm text-ink-soft">
            Estes dados ficam bloqueados quando as inscrições forem confirmadas.
          </p>
        </div>

        <Card className="light-card grid grid-cols-1 gap-5 !p-5 sm:grid-cols-2">
          <Input
            label="Nome do evento"
            value={config.name}
            onChange={(event) => updateConfig('name', event.target.value)}
            placeholder="Ex.: Liga de sábado"
            className="text-ink"
          />

          <label className="flex flex-col gap-1.5">
            <span className="font-display text-[10px] uppercase tracking-wide text-ink-soft">
              Formato do TCG
            </span>
            <select
              value={config.tcgFormat}
              onChange={(event) =>
                updateConfig('tcgFormat', event.target.value as TcgFormat)
              }
              className="rounded-lg border-2 border-line bg-white px-3.5 py-2 font-sans text-sm text-ink outline-none transition-all focus:border-ink focus:shadow-[var(--shadow-pixel-sm)]"
            >
              <option value="casual">Casual</option>
              <option value="standard">Padrão</option>
              <option value="expanded">Expandido</option>
            </select>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-display text-[10px] uppercase tracking-wide text-ink-soft">
              Formato das partidas
            </span>
            <select
              value={config.matchFormat}
              onChange={(event) =>
                updateConfig('matchFormat', event.target.value as MatchFormat)
              }
              className="rounded-lg border-2 border-line bg-white px-3.5 py-2 font-sans text-sm text-ink outline-none transition-all focus:border-ink focus:shadow-[var(--shadow-pixel-sm)]"
            >
              <option value="best-of-three">Melhor de 3</option>
              <option value="best-of-one">Melhor de 1</option>
            </select>
          </label>

          <Input
            label="Duração da rodada (minutos)"
            type="number"
            min={10}
            max={180}
            value={config.roundDurationMinutes}
            onChange={(event) =>
              updateConfig('roundDurationMinutes', Number(event.target.value))
            }
            className="text-ink"
          />

          <Input
            label="Rodadas Suíças"
            type="number"
            min={1}
            max={8}
            value={config.swissRoundCount}
            onChange={(event) =>
              updateConfig('swissRoundCount', Number(event.target.value))
            }
            className="text-ink"
          />

          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-line bg-surface-alt px-4 py-3 text-ink">
            <input
              type="checkbox"
              checked={config.structure === 'swiss-top-cut'}
              onChange={(event) => toggleTopCut(event.target.checked)}
              className="h-4 w-4 accent-[var(--color-brand)]"
            />
            <span>
              <span className="block text-sm font-semibold">Top 4 após o Suíço</span>
              <span className="block text-xs text-ink-soft">1º × 4º e 2º × 3º</span>
            </span>
          </label>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 font-display text-[10px] uppercase tracking-widest text-brand">
              <Users size={14} />
              Etapa 2 de 2
            </p>
            <h2 className="mt-2 font-display text-lg font-semibold uppercase tracking-wide text-ink-soft">
              Inscrições
            </h2>
            <p className="mt-1 text-sm text-ink-soft">
              De 4 a 16 jogadores. Quantidades ímpares serão aceitas com bye.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-display text-xs text-brand">
              {drafts.length}/{MAX_SWISS_PLAYERS}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={addPlayer}
              disabled={drafts.length >= MAX_SWISS_PLAYERS}
            >
              <Plus size={14} />
              Adicionar jogador
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {drafts.map((draft, index) => (
            <Card key={draft.id} className="light-card flex flex-col gap-4 !p-5">
              <div className="flex items-start gap-3">
                <span className="mt-5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-canvas font-display text-[10px] text-ink">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <Input
                    label={`Jogador ${index + 1}`}
                    value={draft.name}
                    onChange={(event) => updateName(draft.id, event.target.value)}
                    placeholder="Nome do jogador"
                    autoComplete="off"
                    className="text-ink"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removePlayer(draft.id)}
                  disabled={drafts.length <= MIN_SWISS_PLAYERS}
                  className="mt-5 rounded-full p-2 text-ink-soft transition-colors hover:bg-danger-soft hover:text-danger disabled:cursor-not-allowed disabled:opacity-25"
                  aria-label={`Remover jogador ${index + 1}`}
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {draft.deck ? (
                <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-alt p-2.5">
                  {hasDeckPokemonImage(draft.deck) ? (
                    <DeckPokemonImage
                      deck={draft.deck}
                      variant="sprite"
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
          <CheckCircle2 size={15} />
          Confirmar inscrições
        </Button>
      </div>
    </form>
  );
}
