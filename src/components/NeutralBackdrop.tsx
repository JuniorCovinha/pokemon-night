import { BASE_BACKGROUND_IMAGE } from '@/constants/backgroundThemes';
import { TownAmbientLayer } from './TownAmbientLayer';

/** Fundo neutro reutilizável para telas que não dependem do campeão. */
export function NeutralBackdrop() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-canvas" aria-hidden="true">
      <img
        src={BASE_BACKGROUND_IMAGE}
        alt=""
        className="animate-backdrop-fade h-full w-full object-cover"
      />
      <TownAmbientLayer />
      <div className="absolute inset-0 bg-black/35" />
    </div>
  );
}
