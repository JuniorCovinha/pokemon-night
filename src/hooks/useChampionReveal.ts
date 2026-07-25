import { useEffect, useRef, useState } from 'react';

export type ChampionRevealPhase = 'idle' | 'transitioning' | 'revealed';

function prefereMovimentoReduzido(): boolean {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Controla só o TEMPO da revelação do campeão — não sabe nada sobre
 * vídeo, imagem ou tipo. Quando `championId` passa de indefinido para
 * definido, entra em "transitioning" (aguardando o vídeo de fundo
 * terminar); `handleTransitionEnded` avança pra "revealed", que é
 * quando o `ChampionCard` deve aparecer.
 *
 * Se o campeão for desfeito (ex: `desfazerVencedor` em cascata), volta
 * pra "idle" automaticamente. Respeita `prefers-reduced-motion`: pula
 * direto pro fundo final, sem esperar a animação.
 */
export function useChampionReveal(championId: string | undefined) {
  const [phase, setPhase] = useState<ChampionRevealPhase>('idle');
  const ultimoChampionId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (championId && championId !== ultimoChampionId.current) {
      ultimoChampionId.current = championId;
      setPhase(prefereMovimentoReduzido() ? 'revealed' : 'transitioning');
    } else if (!championId) {
      ultimoChampionId.current = undefined;
    }
  }, [championId]);

  function handleTransitionEnded() {
    setPhase('revealed');
  }

  // Sem campeão, a fase é sempre "idle" — não precisa de setState pra
  // isso, é só uma derivação direta do valor recebido.
  return { phase: championId ? phase : 'idle', handleTransitionEnded };
}
