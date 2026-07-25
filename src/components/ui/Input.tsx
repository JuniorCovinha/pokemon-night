import { useId, type InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
};

export function Input({ label, id, className = '', ...rest }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="font-display text-[10px] uppercase tracking-wide text-ink-soft"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          rounded-lg border-2 border-line bg-white px-3.5 py-2 font-sans text-sm text-ink
          outline-none transition-all duration-[var(--duration-fast)]
          placeholder:text-ink-soft/60
          focus:border-ink focus:shadow-[var(--shadow-pixel-sm)]
          ${className}
        `}
        {...rest}
      />
    </div>
  );
}
