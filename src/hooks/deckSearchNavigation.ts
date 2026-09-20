type DeckNavigationTarget = Pick<HTMLElement, 'focus' | 'scrollIntoView'>;

/** Foca o campo da busca (ou o card de retorno) sem disparar duas rolagens. */
export function focusDeckSelectionTarget(
  container: DeckNavigationTarget,
  focusTarget: Pick<HTMLElement, 'focus'>,
  reduceMotion: boolean,
): void {
  focusTarget.focus({ preventScroll: true });
  container.scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
    block: 'start',
  });
}
