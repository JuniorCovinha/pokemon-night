import {
  APP_MODES,
  CHAMPIONSHIP_GUIDE,
  COMMON_GUIDE,
  DRAW_GUIDE,
  type AppMode,
  type GuideShortcut,
} from '@/constants/appGuide';

type AppGuideContentProps = {
  mode: AppMode;
  stage: string;
  shortcuts: GuideShortcut[];
  onNavigate: (targetId: string) => void;
};

export function AppGuideContent({
  mode,
  stage,
  shortcuts,
  onNavigate,
}: AppGuideContentProps) {
  const topics =
    mode === 'campeonato' ? CHAMPIONSHIP_GUIDE : mode === 'sorteio' ? DRAW_GUIDE : [];
  return (
    <div className="space-y-6 p-4 text-sm leading-relaxed text-ink-soft">
      <div className="rounded-lg border border-champion/30 bg-champion/10 p-3">
        <p className="font-semibold">Você está aqui</p>
        <p>
          {mode === 'home'
            ? 'Menu inicial'
            : APP_MODES.find((item) => item.id === mode)?.title}
        </p>
        <p className="mt-1">{stage}</p>
      </div>
      <nav aria-label="Atalhos desta tela" className="flex flex-col gap-1">
        <p className="mb-1 font-semibold">Ir para</p>
        {shortcuts.map(({ targetId, label }) => (
          <a
            key={targetId}
            href={`#${targetId}`}
            onClick={(event) => {
              event.preventDefault();
              onNavigate(targetId);
            }}
            className="rounded-lg px-3 py-2 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-champion"
          >
            {label} →
          </a>
        ))}
      </nav>
      <section aria-label="Entenda os modos" className="space-y-3">
        <h3 className="font-display text-[10px] uppercase">Entenda os modos</h3>
        {APP_MODES.map((item) => (
          <details
            key={item.id}
            className="rounded-lg border border-white/15 bg-white/5 p-3"
          >
            <summary className="cursor-pointer font-semibold">{item.title}</summary>
            <p className="mt-2">{item.description}</p>
          </details>
        ))}
      </section>
      <section aria-label="Ajuda e opções" className="space-y-3">
        <h3 className="font-display text-[10px] uppercase">Ajuda e opções</h3>
        {[...topics, ...COMMON_GUIDE].map((topic) => (
          <details
            key={topic.id}
            className="rounded-lg border border-white/15 bg-white/5 p-3"
          >
            <summary className="cursor-pointer font-semibold">{topic.title}</summary>
            <div className="mt-3 space-y-3">
              {topic.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </details>
        ))}
      </section>
    </div>
  );
}
