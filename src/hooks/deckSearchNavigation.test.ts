import { describe, expect, it, vi } from 'vitest';
import { focusDeckSelectionTarget } from './deckSearchNavigation';

describe('navegação da escolha de deck', () => {
  it('rola até o painel completo, mas deixa o campo pronto para digitar', () => {
    const calls: string[] = [];
    const panel = { focus: vi.fn(), scrollIntoView: vi.fn(() => calls.push('scroll')) };
    const input = { focus: vi.fn(() => calls.push('focus')) };

    focusDeckSelectionTarget(panel, input, false);

    expect(input.focus).toHaveBeenCalledWith({ preventScroll: true });
    expect(panel.focus).not.toHaveBeenCalled();
    expect(panel.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
    expect(calls).toEqual(['focus', 'scroll']);
  });

  it.each([
    [false, 'smooth'],
    [true, 'auto'],
  ] as const)(
    'devolve foco ao card selecionado, respeitando movimento reduzido=%s',
    (reducedMotion, behavior) => {
      const card = { focus: vi.fn(), scrollIntoView: vi.fn() };
      focusDeckSelectionTarget(card, card, reducedMotion);
      expect(card.focus).toHaveBeenCalledExactlyOnceWith({ preventScroll: true });
      expect(card.scrollIntoView).toHaveBeenCalledExactlyOnceWith({
        behavior,
        block: 'start',
      });
    },
  );
});
