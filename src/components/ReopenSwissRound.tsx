import { useId, useRef, useState, type FormEvent } from 'react';
import { RotateCcw } from 'lucide-react';
import { Button } from './ui';

type ReopenSwissRoundProps = {
  roundNumber: number;
  onReopen: (roundNumber: number, reason: string) => void;
};

export function ReopenSwissRound({ roundNumber, onReopen }: ReopenSwissRoundProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const reasonId = useId();
  const toggleRef = useRef<HTMLButtonElement>(null);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (reason.trim()) onReopen(roundNumber, reason.trim());
  }

  return (
    <div className="light-card rounded-xl border border-line bg-white p-4 text-ink">
      <button
        type="button"
        ref={toggleRef}
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={open ? `${reasonId}-form` : undefined}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-brand"
      >
        <RotateCcw size={15} />
        Reabrir rodada {roundNumber} para correção
      </button>
      {open && (
        <form
          id={`${reasonId}-form`}
          onSubmit={submit}
          className="mt-4 flex flex-col gap-3"
        >
          <p className="text-sm">
            Os confrontos e resultados serão mantidos. Corrija as mesas necessárias e
            encerre a rodada novamente antes de continuar. A justificativa e as alterações
            ficarão no histórico deste evento.
          </p>
          <label htmlFor={reasonId} className="text-sm font-semibold">
            Justificativa da reabertura
          </label>
          <textarea
            id={reasonId}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            required
            maxLength={500}
            rows={3}
            autoFocus
            placeholder="Ex.: o vencedor da mesa 2 foi registrado incorretamente."
            className="w-full resize-y rounded-lg border-2 border-line bg-white px-3 py-2 text-sm text-ink focus:border-ink focus:outline-none"
          />
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => {
                setOpen(false);
                toggleRef.current?.focus({ preventScroll: true });
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={!reason.trim()}>
              Confirmar reabertura
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
