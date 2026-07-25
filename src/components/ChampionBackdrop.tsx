import { useEffect } from 'react';
import { BASE_BACKGROUND_IMAGE, getBackgroundAssets } from '@/constants/backgroundThemes';
import { getTypeColor } from '@/constants/pokemonTypes';
import type { ChampionRevealPhase } from '@/hooks/useChampionReveal';

type ChampionBackdropProps = {
  /** Tipo principal do deck do campeão — undefined enquanto não há campeão. */
  deckType?: string;
  phase: ChampionRevealPhase;
  onTransitionEnded: () => void;
};

/**
 * Três estados visuais: "idle" (cidade calma, fundo padrão), "transitioning"
 * (vídeo de transformação do tipo vencedor tocando uma vez, sem loop) e
 * "revealed" (fundo final daquele tipo, parado).
 *
 * Se o tipo vencedor não tiver asset mapeado (tipo novo, futuro), cai de
 * volta na cidade base com uma leve tinta na cor do tipo — nunca quebra
 * por falta de asset.
 */
export function ChampionBackdrop({ deckType, phase, onTransitionEnded }: ChampionBackdropProps) {
  const assets = getBackgroundAssets(deckType);
  const semAssetParaOTipo = phase !== 'idle' && !assets;

  // Sem vídeo pra esperar (tipo sem asset) — revela na hora, não trava
  // a UI esperando algo que nunca vai tocar.
  useEffect(() => {
    if (phase === 'transitioning' && !assets) {
      onTransitionEnded();
    }
  }, [phase, assets, onTransitionEnded]);

  const mostrarVideo = phase === 'transitioning' && Boolean(assets);
  const imagemAtual =
    phase === 'revealed' && assets ? assets.finalImage : BASE_BACKGROUND_IMAGE;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-canvas" aria-hidden="true">
      {mostrarVideo && assets ? (
        <video
          key={assets.transitionVideo}
          src={assets.transitionVideo}
          autoPlay
          muted
          playsInline
          preload="auto"
          onEnded={onTransitionEnded}
          className="animate-backdrop-fade h-full w-full object-cover"
        />
      ) : (
        <img
          key={imagemAtual}
          src={imagemAtual}
          alt=""
          className="animate-backdrop-fade h-full w-full object-cover"
        />
      )}

      {/* Tinta leve na cor do tipo, só quando não há asset dedicado. */}
      {semAssetParaOTipo && deckType && (
        <div
          className="absolute inset-0"
          style={{ backgroundColor: `${getTypeColor(deckType)}40` }}
        />
      )}

      {/* Véu sutil pra o conteúdo em cima continuar legível. */}
      <div className="absolute inset-0 bg-canvas/25" />
    </div>
  );
}
