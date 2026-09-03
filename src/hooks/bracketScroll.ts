/** Evita repetir a rolagem quando apenas os resultados da chave mudam. */
export function bracketWasJustCreated(hadBracket: boolean, hasBracket: boolean): boolean {
  return !hadBracket && hasBracket;
}

type BracketScrollTarget = Pick<HTMLElement, 'focus' | 'scrollIntoView'>;

/** Move foco e viewport juntos para anunciar a chave que acabou de surgir. */
export function focusAndScrollToBracket(
  target: BracketScrollTarget,
  reduceMotion: boolean,
): void {
  target.focus({ preventScroll: true });
  target.scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
    block: 'start',
  });
}
