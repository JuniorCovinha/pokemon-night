import { useState, type KeyboardEvent } from 'react';
import { Pencil, Check } from 'lucide-react';
import { getTypeColor } from '@/constants/pokemonTypes';
import { Card } from '@/components/ui';
import type { Deck, Player } from '@/types';

type PlayerCardProps = {
  player: Player;
  deck?: Deck;
  editable?: boolean;
  onRename?: (novoNome: string) => void;
};

export function PlayerCard({
  player,
  deck,
  editable = false,
  onRename,
}: PlayerCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [rascunho, setRascunho] = useState(player.name);

  function confirmarEdicao() {
    setIsEditing(false);
    if (rascunho.trim().length > 0 && rascunho !== player.name) {
      onRename?.(rascunho);
    } else {
      setRascunho(player.name);
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') confirmarEdicao();
    if (event.key === 'Escape') {
      setRascunho(player.name);
      setIsEditing(false);
    }
  }

  return (
    <Card className="light-card flex items-center gap-3 !p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-canvas font-display text-xs text-ink">
        {player.name.charAt(0).toUpperCase()}
      </div>

      <div className="min-w-0 flex-1">
        {isEditing ? (
          <input
            autoFocus
            value={rascunho}
            onChange={(event) => setRascunho(event.target.value)}
            onBlur={confirmarEdicao}
            onKeyDown={handleKeyDown}
            className="w-full rounded-md border-2 border-line px-1.5 py-0.5 font-sans text-sm outline-none focus:border-ink focus:shadow-[var(--shadow-pixel-sm)]"
          />
        ) : (
          <p className="truncate font-sans text-sm font-medium text-ink">{player.name}</p>
        )}

        {deck && (
          <div className="mt-0.5 flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: getTypeColor(deck.tipoPrincipal) }}
            />
            <span className="truncate font-sans text-xs text-ink-soft">{deck.nome}</span>
          </div>
        )}
      </div>

      {editable && (
        <button
          onClick={() => (isEditing ? confirmarEdicao() : setIsEditing(true))}
          aria-label={isEditing ? 'Confirmar nome' : 'Editar nome'}
          className="shrink-0 rounded-full p-1.5 text-ink-soft transition-colors hover:bg-black/5 hover:text-ink"
        >
          {isEditing ? <Check size={15} /> : <Pencil size={15} />}
        </button>
      )}
    </Card>
  );
}
