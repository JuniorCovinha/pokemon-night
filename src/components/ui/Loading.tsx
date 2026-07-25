type LoadingProps = {
  label?: string;
};

export function Loading({ label = 'Carregando...' }: LoadingProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-sm text-ink-soft">
      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-soft/30 border-t-ink-soft" />
      {label}
    </div>
  );
}
