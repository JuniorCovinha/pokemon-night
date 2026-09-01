import { CheckCircle2, Clock3, ListChecks, Shuffle, Trophy, Users } from 'lucide-react';
import { Button, Card } from '@/components/ui';
import type { TournamentConfig } from '@/types';

type TournamentSetupSummaryProps = {
  config: TournamentConfig;
  playerCount: number;
  onGenerateFirstRound: () => void;
};

const TCG_FORMAT_LABELS = {
  casual: 'Casual',
  standard: 'Padrão',
  expanded: 'Expandido',
} as const;

const MATCH_FORMAT_LABELS = {
  'best-of-one': 'Melhor de 1',
  'best-of-three': 'Melhor de 3',
} as const;

export function TournamentSetupSummary({
  config,
  playerCount,
  onGenerateFirstRound,
}: TournamentSetupSummaryProps) {
  const hasTopCut = config.structure === 'swiss-top-cut';

  return (
    <section className="flex flex-col gap-5">
      <Card className="light-card !p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-success">
              <CheckCircle2 size={18} />
              Inscrições confirmadas
            </p>
            <h2 className="mt-3 font-display text-xl font-bold text-ink">
              {config.name}
            </h2>
            <p className="mt-2 max-w-xl text-sm text-ink-soft">
              O evento está configurado e pronto para receber o pareamento da primeira
              rodada Suíça.
            </p>
          </div>

          <span className="rounded-full border border-line bg-surface-alt px-3 py-1.5 font-display text-[10px] uppercase tracking-wide text-ink">
            {TCG_FORMAT_LABELS[config.tcgFormat]}
          </span>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-xl bg-surface-alt p-4">
            <dt className="flex items-center gap-2 text-xs text-ink-soft">
              <Users size={15} /> Jogadores
            </dt>
            <dd className="mt-2 font-display text-lg text-ink">{playerCount}</dd>
          </div>
          <div className="rounded-xl bg-surface-alt p-4">
            <dt className="flex items-center gap-2 text-xs text-ink-soft">
              <ListChecks size={15} /> Rodadas
            </dt>
            <dd className="mt-2 font-display text-lg text-ink">
              {config.swissRoundCount}
            </dd>
          </div>
          <div className="rounded-xl bg-surface-alt p-4">
            <dt className="flex items-center gap-2 text-xs text-ink-soft">
              <Clock3 size={15} /> Partidas
            </dt>
            <dd className="mt-2 text-sm font-semibold text-ink">
              {MATCH_FORMAT_LABELS[config.matchFormat]} · {config.roundDurationMinutes}{' '}
              min
            </dd>
          </div>
          <div className="rounded-xl bg-surface-alt p-4">
            <dt className="flex items-center gap-2 text-xs text-ink-soft">
              <Trophy size={15} /> Fase final
            </dt>
            <dd className="mt-2 text-sm font-semibold text-ink">
              {hasTopCut ? 'Top 4' : 'Sem Top Cut'}
            </dd>
          </div>
        </dl>
      </Card>

      <div className="flex flex-col items-start justify-between gap-3 rounded-xl border border-brand/30 bg-brand-soft px-4 py-3 sm:flex-row sm:items-center">
        <p className="text-sm text-brand">
          O sorteio criará as mesas e concederá um bye automaticamente se necessário.
        </p>
        <Button type="button" onClick={onGenerateFirstRound} className="shrink-0">
          <Shuffle size={15} />
          Gerar primeira rodada
        </Button>
      </div>
    </section>
  );
}
