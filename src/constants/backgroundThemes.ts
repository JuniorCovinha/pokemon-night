export type BackgroundTheme = 'fogo' | 'lutador' | 'sombrio' | 'gelo';

type BackgroundAssets = {
  transitionVideo: string;
  finalImage: string;
};

export const BASE_BACKGROUND_IMAGE = '/backgrounds/base-town.webp';

const CHAMPION_CARD_BACKGROUND_VIDEOS: Partial<Record<string, string>> = {
  Fogo: '/backgrounds/fogo-campeao-loop.mp4',
  Água: '/backgrounds/agua-campeao-loop.mp4',
  Elétrico: '/backgrounds/eletrico-campeao-loop.mp4',
  Grama: '/backgrounds/grama-campeao-loop.mp4',
  Psíquico: '/backgrounds/psiquico-campeao-loop.mp4',
};

export function getChampionCardBackgroundVideo(
  tipoPrincipal?: string,
): string | undefined {
  return tipoPrincipal ? CHAMPION_CARD_BACKGROUND_VIDEOS[tipoPrincipal] : undefined;
}

/**
 * Nem todo tipo precisa de um tema próprio — "Água" e "Metálico" usam o
 * mesmo conjunto visual ("gelo") até existirem assets dedicados para
 * cada um. Trocar isso no futuro é só reapontar aqui, sem mexer em
 * armazenamento de arquivo nem no componente que consome.
 */
const TYPE_TO_THEME: Partial<Record<string, BackgroundTheme>> = {
  Fogo: 'fogo',
  Lutador: 'lutador',
  Sombrio: 'sombrio',
  Água: 'gelo',
  Metálico: 'gelo',
  // Sem asset próprio ainda — usando o tema "lutador" emprestado.
  Dragão: 'lutador',
  Grama: 'lutador',
};

const THEME_ASSETS: Record<BackgroundTheme, BackgroundAssets> = {
  fogo: {
    transitionVideo: '/backgrounds/fogo-transicao.mp4',
    finalImage: '/backgrounds/fogo-final.webp',
  },
  lutador: {
    transitionVideo: '/backgrounds/lutador-transicao.mp4',
    finalImage: '/backgrounds/lutador-final.webp',
  },
  sombrio: {
    transitionVideo: '/backgrounds/sombrio-transicao.mp4',
    finalImage: '/backgrounds/sombrio-final.webp',
  },
  gelo: {
    transitionVideo: '/backgrounds/gelo-transicao.mp4',
    finalImage: '/backgrounds/gelo-final.webp',
  },
};

/**
 * Retorna undefined se o tipo não tiver tema mapeado — isso é esperado
 * (ex: um deck de tipo novo, sem asset ainda) e quem consome precisa
 * tratar esse caso com um fallback, não deixar quebrar.
 */
export function getBackgroundAssets(
  tipoPrincipal?: string,
): BackgroundAssets | undefined {
  const theme = tipoPrincipal ? TYPE_TO_THEME[tipoPrincipal] : undefined;
  return theme ? THEME_ASSETS[theme] : undefined;
}
