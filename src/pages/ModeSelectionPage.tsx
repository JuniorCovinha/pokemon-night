import { Link } from 'react-router-dom';
import { Shuffle, Swords } from 'lucide-react';
import { Card } from '@/components/ui';

const MODES = [
  {
    path: '/campeonato',
    title: 'Campeonato',
    description:
      'Cada jogador se inscreve com o próprio deck. O app sorteia somente os confrontos.',
    action: 'Inscrever jogadores',
    icon: Swords,
  },
  {
    path: '/sorteio',
    title: 'Sorteio de decks',
    description:
      'Escolha vários decks e distribua um deles aleatoriamente para cada jogador.',
    action: 'Escolher decks',
    icon: Shuffle,
  },
] as const;

export function ModeSelectionPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center gap-10 px-6 py-14">
      <header className="text-center">
        <p className="font-display text-[10px] uppercase tracking-[0.24em] text-brand">
          Pokémon Night
        </p>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink sm:text-3xl">
          Escolha o modo
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-menu-muted sm:text-base">
          Defina como os jogadores e decks entrarão no campeonato.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {MODES.map(({ path, title, description, action, icon: Icon }) => (
          <Link key={path} to={path} className="group outline-none">
            <Card
              interactive
              variant="pixel"
              className="flex h-full flex-col gap-5 !p-6 group-focus-visible:ring-2 group-focus-visible:ring-brand group-focus-visible:ring-offset-4"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl border-2 border-ink bg-canvas text-brand shadow-[var(--shadow-pixel-sm)]">
                <Icon size={24} />
              </span>

              <div className="flex-1">
                <h2 className="font-display text-sm font-semibold text-ink">{title}</h2>
                <p className="mt-3 text-sm leading-relaxed text-menu-muted">
                  {description}
                </p>
              </div>

              <span className="text-sm font-semibold text-brand transition-transform group-hover:translate-x-1">
                {action} →
              </span>
            </Card>
          </Link>
        ))}
      </section>
    </main>
  );
}
