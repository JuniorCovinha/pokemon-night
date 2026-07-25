import { useEffect } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

type ToastVariant = 'success' | 'danger' | 'info';

type ToastProps = {
  message: string;
  variant?: ToastVariant;
  onClose: () => void;
  /** Tempo até fechar sozinho, em ms. Passe `null` para não fechar sozinho. */
  autoCloseAfter?: number | null;
};

const VARIANT_CONFIG: Record<ToastVariant, { icon: typeof Info; classes: string }> = {
  success: { icon: CheckCircle2, classes: 'bg-success-soft text-success' },
  danger: { icon: XCircle, classes: 'bg-danger-soft text-danger' },
  info: { icon: Info, classes: 'bg-surface-alt text-ink-soft' },
};

/**
 * Renderizado solto (não gerencia posicionamento de múltiplos toasts
 * empilhados) — para isso, um `ToastProvider` seria o próximo passo
 * natural, quando houver mais de um ponto da app disparando toasts.
 */
export function Toast({ message, variant = 'info', onClose, autoCloseAfter = 4000 }: ToastProps) {
  useEffect(() => {
    if (autoCloseAfter === null) return;
    const timer = setTimeout(onClose, autoCloseAfter);
    return () => clearTimeout(timer);
  }, [autoCloseAfter, onClose]);

  const { icon: Icon, classes } = VARIANT_CONFIG[variant];

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
      <div
        role="status"
        className={`
          animate-slide-in-card flex items-center gap-2.5 rounded-lg px-4 py-3
          font-sans text-sm shadow-[var(--shadow-pixel-sm)]
          ${classes}
        `}
      >
        <Icon size={16} className="shrink-0" />
        <span>{message}</span>
        <button
          onClick={onClose}
          aria-label="Fechar notificação"
          className="ml-1 shrink-0 rounded-full p-0.5 opacity-70 transition-opacity hover:opacity-100"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
