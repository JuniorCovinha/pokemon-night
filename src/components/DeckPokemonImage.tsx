import type { ImgHTMLAttributes, SyntheticEvent } from 'react';
import type { Deck } from '@/types';

export type DeckPokemonImageVariant = 'artwork' | 'sprite' | 'animated';

type DeckPokemonImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt'> & {
  deck: Deck;
  alt?: string;
  variant?: DeckPokemonImageVariant;
};

type ImageCandidate = {
  src: string;
  pixelated: boolean;
};

function createCandidate(
  src: string | undefined,
  pixelated: boolean,
): ImageCandidate | undefined {
  return src ? { src, pixelated } : undefined;
}

function getCandidates(deck: Deck, variant: DeckPokemonImageVariant): ImageCandidate[] {
  const artwork = createCandidate(deck.imagem, false);
  const thumbnail = createCandidate(deck.miniatura, false);
  const sprite = createCandidate(deck.imagemSprite, true);
  const animated = createCandidate(deck.imagemAnimada, true);
  const ordered =
    variant === 'animated'
      ? [animated, artwork, thumbnail, sprite]
      : variant === 'sprite'
        ? [sprite, thumbnail, artwork]
        : [artwork, thumbnail, sprite];

  return ordered.filter(
    (candidate, index, candidates): candidate is ImageCandidate =>
      Boolean(candidate) &&
      candidates.findIndex((item) => item?.src === candidate?.src) === index,
  );
}

/** Exibe a mídia adequada ao contexto e percorre os fallbacks em caso de falha. */
export function DeckPokemonImage({
  deck,
  alt = `Pokémon principal do deck ${deck.nome}`,
  variant = 'artwork',
  className = '',
  onError,
  style,
  ...props
}: DeckPokemonImageProps) {
  const candidates = getCandidates(deck, variant);
  const firstCandidate = candidates[0];

  if (!firstCandidate) return null;

  function handleError(event: SyntheticEvent<HTMLImageElement>) {
    const image = event.currentTarget;
    const currentIndex = Number(image.dataset.sourceIndex ?? 0);
    const nextIndex = currentIndex + 1;
    const nextCandidate = candidates[nextIndex];

    if (nextCandidate) {
      image.dataset.sourceIndex = String(nextIndex);
      image.style.imageRendering = nextCandidate.pixelated ? 'pixelated' : 'auto';
      image.src = nextCandidate.src;
      return;
    }

    onError?.(event);
  }

  return (
    <img
      {...props}
      src={firstCandidate.src}
      alt={alt}
      data-source-index="0"
      onError={handleError}
      className={className}
      style={{
        ...style,
        imageRendering: firstCandidate.pixelated ? 'pixelated' : style?.imageRendering,
      }}
    />
  );
}
