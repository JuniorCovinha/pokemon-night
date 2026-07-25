import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-brand text-white shadow-[var(--shadow-pixel-md)]',
  secondary: 'bg-white text-ink border-2 border-ink shadow-[var(--shadow-pixel-md)]',
  danger: 'bg-danger text-white shadow-[var(--shadow-pixel-md)]',
  ghost: 'bg-transparent text-ink-soft hover:text-ink hover:bg-black/5',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-1.5 text-xs',
  md: 'px-5 py-2.5 text-sm',
};

/**
 * Botões "primary"/"secondary"/"danger" simulam um botão físico sendo
 * pressionado: no hover, "levantam" (sombra some, translada pra cima);
 * no clique, "afundam" na superfície (translada pro canto da sombra,
 * sombra desaparece). O "ghost" fica de fora dessa mecânica — é usado
 * para ações discretas, não para ações-âncora da tela.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  const temRelevo = variant !== 'ghost';

  return (
    <button
      disabled={disabled}
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg font-sans font-semibold
        transition-all duration-[var(--duration-fast)] ease-[var(--ease-retro)]
        disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none
        ${temRelevo ? 'hover:-translate-y-0.5 active:translate-y-0.5 active:shadow-none' : ''}
        ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}
      `}
      {...rest}
    >
      {children}
    </button>
  );
}
