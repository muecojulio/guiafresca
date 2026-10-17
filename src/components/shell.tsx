import { Link, useRouterState } from "@tanstack/react-router";
import { Bookmark, Search, Settings, Sprout } from "lucide-react";
import type { ReactNode } from "react";
import { LiveRegion, MarketBackdrop } from "@/components/decor";
import { Toaster } from "@/components/toaster";
import { useSavedSet } from "@/lib/use-saved-set";

const TABS = [
  { to: "/", label: "Guía", icon: Sprout },
  { to: "/buscar", label: "Buscar", icon: Search },
  { to: "/guardados", label: "Guardados", icon: Bookmark },
  { to: "/ajustes", label: "Ajustes", icon: Settings },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.pathname });
  const saved = useSavedSet();
  const activeIndex = Math.max(
    TABS.findIndex((tab) => (tab.to === "/" ? path === "/" : path.startsWith(tab.to))),
    0,
  );

  return (
    <div className="min-h-screen bg-paper text-ink">
      <MarketBackdrop />
      <LiveRegion />
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        Saltar al contenido
      </a>
      <div id="contenido" className="mx-auto min-h-screen w-full max-w-3xl pb-32">
        {children}
      </div>

      <nav
        aria-label="Secciones de la guía"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/92 backdrop-blur-md"
        style={{ paddingBottom: "max(0.25rem, env(safe-area-inset-bottom))" }}
      >
        <div className="relative mx-auto grid max-w-3xl grid-cols-4">
          <span
            aria-hidden="true"
            className="glider glider--nav top-1.5 bottom-1.5 left-0 w-1/4"
            style={{ transform: `translateX(${activeIndex * 100}%)` }}
          />
          {TABS.map((tab, index) => {
            const active = index === activeIndex;
            const Icon = tab.icon;
            const badge = tab.to === "/guardados" ? saved.ids.length : 0;
            return (
              <Link
                key={tab.to}
                to={tab.to}
                aria-current={active ? "page" : undefined}
                className={`tap relative z-[1] flex min-h-16 flex-col items-center justify-center gap-1 text-xs ${
                  active ? "text-leaf-deep" : "text-stone"
                }`}
              >
                <span className="relative">
                  <Icon
                    className={`size-5 transition-transform duration-300 ${
                      active ? "scale-110" : "scale-100"
                    }`}
                    strokeWidth={active ? 2.2 : 1.7}
                    aria-hidden="true"
                  />
                  {badge > 0 ? (
                    <span className="absolute -top-1.5 -right-2 grid min-w-4 place-items-center rounded-full bg-citrus px-1 text-[0.6rem] leading-4 text-paper">
                      {badge > 9 ? "9+" : badge}
                      <span className="sr-only"> fichas guardadas</span>
                    </span>
                  ) : null}
                </span>
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <Toaster />
    </div>
  );
}

export function Mark() {
  return (
    <span className="relative block h-8 w-10" aria-hidden="true">
      <span className="absolute top-4 right-0 left-0 h-px bg-ink" />
      <span className="absolute top-1 left-3 size-4 rounded-full bg-citrus" />
      <span className="absolute top-2 left-4 size-2 rounded-full bg-leaf" />
    </span>
  );
}

/** Encabezado de página con marca, título y texto de entrada. */
export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="rise px-5 pt-8">
      {eyebrow ? <p className="text-xs tracking-[0.18em] text-stone uppercase">{eyebrow}</p> : null}
      <h1 className="font-display mt-2 text-4xl leading-none sm:text-5xl">{title}</h1>
      {children ? (
        <div className="mt-3 max-w-sm text-base leading-relaxed text-stone">{children}</div>
      ) : null}
    </header>
  );
}
