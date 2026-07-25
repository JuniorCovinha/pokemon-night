import { Trophy } from 'lucide-react';
import { getTypeColor } from '@/constants/pokemonTypes';
import type { Champion } from '@/types';

type ChampionCardProps = {
  champion: Champion;
};

export function ChampionCard({ champion }: ChampionCardProps) {
  return (
    <div className="pixel-corners animate-slide-in-card animate-champion-glow relative bg-champion-soft p-8 text-center shadow-[var(--shadow-pixel-champion)]">
      <PixelBurst />

      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-champion bg-white text-champion">
        <Trophy size={24} />
      </div>

      <p className="font-display text-[10px] uppercase tracking-wide text-ink-soft">
        Campeão da noite
      </p>
      <h2 className="mt-2 break-words font-display text-lg text-ink sm:text-xl">
        {champion.player.name}
      </h2>

      <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 font-sans text-sm text-ink-soft">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: getTypeColor(champion.deck.tipoPrincipal) }}
        />
        {champion.deck.nome}
      </div>
    </div>
  );
}

/** Pequenos "pixels" surgindo ao redor do troféu, só neste momento de celebração. */
function PixelBurst() {
  const posicoes = [
    { top: '15%', left: '20%', delay: '0ms' },
    { top: '25%', left: '78%', delay: '120ms' },
    { top: '65%', left: '12%', delay: '240ms' },
    { top: '70%', left: '85%', delay: '80ms' },
  ];

  return (
    <>
      {posicoes.map((pos, index) => (
        <span
          key={index}
          className="animate-pixel-pop absolute h-2 w-2 bg-champion"
          style={{ top: pos.top, left: pos.left, animationDelay: pos.delay }}
        />
      ))}
    </>
  );
}
