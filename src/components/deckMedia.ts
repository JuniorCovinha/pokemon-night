import type { Deck } from '@/types';

export function hasDeckPokemonImage(deck?: Deck): boolean {
  return Boolean(
    deck?.imagemAnimada || deck?.imagemSprite || deck?.miniatura || deck?.imagem,
  );
}
