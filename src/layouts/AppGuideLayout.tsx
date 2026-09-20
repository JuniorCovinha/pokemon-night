import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { BookOpen, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { BrandTitle } from '@/components/BrandTitle';
import { AppGuideContent } from '@/components/AppGuideContent';
import { getGuideContext, type AppMode } from '@/constants/appGuide';
import type { Tournament } from '@/types';
import '@/styles/appGuide.css';

type AppGuideLayoutProps = {
  mode: AppMode;
  tournament?: Tournament;
  children: ReactNode;
};

function goToSection(targetId: string): boolean {
  const target = document.getElementById(targetId);
  if (!target) return false;
  if (target instanceof HTMLDetailsElement) target.open = true;
  target.focus({ preventScroll: true });
  target.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth',
    block: 'start',
  });
  return true;
}

export function AppGuideLayout({ mode, tournament, children }: AppGuideLayoutProps) {
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const desktopButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const pendingSection = useRef<string | null>(null);
  const id = useId();
  const { stage, shortcuts } = getGuideContext(mode, tournament);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!mobileOpen || !dialog) return;
    dialog.showModal();
    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
  }, [mobileOpen]);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => {
      if (media.matches) dialogRef.current?.close();
    };
    media.addEventListener('change', closeOnDesktop);
    return () => media.removeEventListener('change', closeOnDesktop);
  }, []);

  function finishMobileClose() {
    setMobileOpen(false);
    const target = pendingSection.current;
    pendingSection.current = null;
    window.requestAnimationFrame(() => {
      if (!target || !goToSection(target)) {
        const trigger = window.matchMedia('(min-width: 1024px)').matches
          ? desktopButtonRef.current
          : mobileButtonRef.current;
        trigger?.focus({ preventScroll: true });
      }
    });
  }

  function navigateMobile(targetId: string) {
    pendingSection.current = targetId;
    dialogRef.current?.close();
  }

  return (
    <div className="pt-14 lg:pt-0">
      <aside
        aria-label="Guia do Pokémon Night"
        className={`fixed left-0 z-40 hidden flex-col border-ink bg-[#211e28] text-ink-soft lg:flex ${
          desktopOpen
            ? 'inset-y-0 w-80 border-r-2 shadow-[8px_0_24px_rgb(0_0_0/0.32)]'
            : 'top-4 ml-4 h-12 w-12 rounded-xl border-2 shadow-[var(--shadow-pixel-sm)]'
        }`}
      >
        <div
          className={`flex shrink-0 items-center ${
            desktopOpen
              ? 'min-h-16 gap-3 border-b border-white/15 p-3'
              : 'h-full justify-center'
          }`}
        >
          <button
            ref={desktopButtonRef}
            type="button"
            onClick={() => setDesktopOpen((current) => !current)}
            aria-label={desktopOpen ? 'Recolher guia lateral' : 'Expandir guia lateral'}
            aria-expanded={desktopOpen}
            aria-controls={`${id}-desktop`}
            className="rounded-lg p-2 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-champion"
          >
            {desktopOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
          </button>
          {desktopOpen && <BrandTitle as="p" className="text-[9px]" />}
        </div>
        <div
          id={`${id}-desktop`}
          hidden={!desktopOpen}
          className="app-guide-scrollbar min-h-0 overflow-y-auto overscroll-contain"
        >
          <AppGuideContent
            mode={mode}
            stage={stage}
            shortcuts={shortcuts}
            onNavigate={goToSection}
          />
        </div>
      </aside>

      <div className="fixed inset-x-0 top-0 z-40 flex h-14 items-center justify-between border-b-2 border-ink bg-[#211e28] px-4 text-ink-soft lg:hidden">
        <button
          type="button"
          ref={mobileButtonRef}
          onClick={() => setMobileOpen(true)}
          aria-expanded={mobileOpen}
          aria-controls={`${id}-mobile`}
          aria-haspopup="dialog"
          className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-champion"
        >
          <BookOpen size={18} /> Menu e ajuda
        </button>
        <BrandTitle as="p" className="text-[8px]" />
      </div>

      <dialog
        id={`${id}-mobile`}
        ref={dialogRef}
        aria-labelledby={`${id}-title`}
        className="app-guide-drawer"
        onClose={finishMobileClose}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
      >
        <div className="flex h-full flex-col">
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-white/15 p-4">
            <h2 id={`${id}-title`} className="font-display text-xs">
              Menu e ajuda
            </h2>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Fechar menu"
              className="rounded-lg p-2 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-champion"
            >
              <X size={20} />
            </button>
          </div>
          <div className="app-guide-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <AppGuideContent
              mode={mode}
              stage={stage}
              shortcuts={shortcuts}
              onNavigate={navigateMobile}
            />
          </div>
        </div>
      </dialog>
      {children}
    </div>
  );
}
