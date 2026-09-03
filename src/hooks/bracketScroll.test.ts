import { describe, expect, it, vi } from 'vitest';
import { bracketWasJustCreated, focusAndScrollToBracket } from './bracketScroll';

describe('bracketWasJustCreated', () => {
  it('aciona somente na transição de uma tela sem chave para uma tela com chave', () => {
    expect(bracketWasJustCreated(false, true)).toBe(true);
    expect(bracketWasJustCreated(false, false)).toBe(false);
    expect(bracketWasJustCreated(true, true)).toBe(false);
    expect(bracketWasJustCreated(true, false)).toBe(false);
  });

  it.each([
    [false, 'smooth'],
    [true, 'auto'],
  ] as const)(
    'foca a chave sem rolar duas vezes e usa movimento reduzido=%s',
    (reduceMotion, behavior) => {
      const target = {
        focus: vi.fn(),
        scrollIntoView: vi.fn(),
      };

      focusAndScrollToBracket(target, reduceMotion);

      expect(target.focus).toHaveBeenCalledOnce();
      expect(target.focus).toHaveBeenCalledWith({ preventScroll: true });
      expect(target.scrollIntoView).toHaveBeenCalledOnce();
      expect(target.scrollIntoView).toHaveBeenCalledWith({
        behavior,
        block: 'start',
      });
    },
  );
});
