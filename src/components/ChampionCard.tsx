import { Trophy } from 'lucide-react';
import { getChampionCardBackgroundVideo } from '@/constants/backgroundThemes';
import { DEFAULT_TYPE_COLOR, getTypeColor } from '@/constants/pokemonTypes';
import { StarBorder } from './effects';
import { DeckPokemonImage } from './DeckPokemonImage';
import { hasDeckPokemonImage } from './deckMedia';
import type { Champion } from '@/types';

type ChampionCardProps = {
  champion: Champion;
};

export function ChampionCard({ champion }: ChampionCardProps) {
  const backgroundVideo = getChampionCardBackgroundVideo(champion.deck.tipoPrincipal);
  const typeColor = getTypeColor(champion.deck.tipoPrincipal);
  const starBorderColor = typeColor === DEFAULT_TYPE_COLOR ? '#ffcb05' : typeColor;

  return (
    <StarBorder color={starBorderColor}>
      <div
        className={`light-card pixel-corners animate-slide-in-card relative overflow-hidden p-8 text-center shadow-[var(--shadow-pixel-champion)] ${
          backgroundVideo ? 'bg-ink' : 'bg-champion-soft'
        }`}
      >
        {backgroundVideo && (
          <>
            <video
              src={backgroundVideo}
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full object-cover"
            />
            <div className="pointer-events-none absolute inset-0 bg-black/25" />
          </>
        )}

        <div className="relative z-10">
          <PixelBurst />

          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border-2 border-champion bg-white text-champion">
            <Trophy size={24} />
          </div>

          <p
            className={`font-display text-[10px] uppercase tracking-wide ${
              backgroundVideo ? '!text-white drop-shadow-md' : 'text-ink-soft'
            }`}
          >
            Campeão da noite
          </p>

          {hasDeckPokemonImage(champion.deck) && (
            <DeckPokemonImage
              deck={champion.deck}
              variant="animated"
              alt={`Pokémon principal do deck campeão ${champion.deck.nome}`}
              className="mx-auto mt-5 max-h-72 w-full max-w-sm object-contain drop-shadow-[0_12px_12px_rgba(28,26,23,0.45)] sm:max-h-80"
            />
          )}

          <h2
            className={`mt-2 break-words font-display text-lg sm:text-xl ${
              backgroundVideo ? '!text-white drop-shadow-md' : 'text-ink'
            }`}
          >
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
      </div>
    </StarBorder>
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
