import { Link, useRouterState } from "@tanstack/react-router";
import { Bookmark, Search, Settings, Sprout } from "lucide-react";
import type { ReactNode } from "react";

const TABS = [
  { to: "/", label: "Guía", icon: Sprout },
  { to: "/buscar", label: "Buscar", icon: Search },
  { to: "/guardados", label: "Guardados", icon: Bookmark },
  { to: "/ajustes", label: "Ajustes", icon: Settings },
] as const;

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (state) => state.location.pathname });

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="mx-auto min-h-screen w-full max-w-3xl pb-28">{children}</div>
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 backdrop-blur">
        <ul className="mx-auto grid max-w-3xl grid-cols-4">
          {TABS.map((tab) => {
            const active = tab.to === "/" ? path === "/" : path.startsWith(tab.to);
            const Icon = tab.icon;
            return (
              <li key={tab.to}>
                <Link
                  to={tab.to}
                  className={`tap flex min-h-14 flex-col items-center justify-center gap-1 text-xs ${
                    active ? "text-leaf" : "text-stone"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
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
