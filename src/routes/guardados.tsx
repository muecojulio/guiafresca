import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Snowflake, Sun, ThermometerSun, Trash2 } from "lucide-react";
import { getGuide, PLACE_LABEL, type HomePlace } from "@/lib/catalog";
import { Shell, PageHeader } from "@/components/shell";
import { EmptyState } from "@/components/cards";
import { SwipeReveal } from "@/components/swipe-reveal";
import { usePrefs } from "@/lib/use-prefs";
import { useSavedSet } from "@/lib/use-saved-set";
import { toast } from "@/lib/toasts";

export const Route = createFileRoute("/guardados")({ component: Guardados });

const HOME_ICON: Record<HomePlace, typeof Snowflake> = {
  refrigerador: Snowflake,
  fuera: Sun,
  "madura-fuera": ThermometerSun,
};

function Guardados() {
  const saved = useSavedSet();
  const prefs = usePrefs();
  const items = saved.ids.map((slug) => getGuide(slug)).filter((item) => item !== undefined);

  function quitar(slug: string, name: string) {
    saved.toggle(slug);
    toast(`${name} salió de guardados.`, {
      action: { label: "Deshacer", run: () => saved.toggle(slug) },
    });
  }

  function vaciar() {
    const ids = [...saved.ids];
    ids.forEach((slug) => saved.toggle(slug));
    toast(`Se quitaron ${ids.length} fichas.`, {
      action: {
        label: "Deshacer",
        run: () => ids.forEach((slug) => saved.toggle(slug)),
      },
    });
  }

  return (
    <Shell>
      <PageHeader title="Guardados" eyebrow="Solo en este teléfono">
        Quedan en el almacenamiento del navegador. No hay cuenta ni copia en un servidor.
      </PageHeader>

      {items.length === 0 ? (
        <EmptyState
          title="Todavía no guardas nada"
          action={
            <Link
              to="/"
              className="tap press inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm text-paper"
            >
              Ver la guía
            </Link>
          }
        >
          Abre una fruta o una verdura y toca Guardar. La ficha queda aquí, con su foto y sus días.
        </EmptyState>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 px-5 pt-5">
            <p className="text-sm text-stone">
              {items.length} {items.length === 1 ? "ficha" : "fichas"} · desliza una tarjeta o usa
              el botón de acciones
            </p>
            <button
              type="button"
              onClick={vaciar}
              className="tap press inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-line bg-card px-4 text-sm text-berry"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Vaciar
            </button>
          </div>

          <ul className="space-y-3 px-5 pt-4">
            {items.map((item, index) => {
              const HomeIcon = HOME_ICON[item.home];
              return (
                <li key={item.slug}>
                  <SwipeReveal
                    label={item.name}
                    actions={[
                      {
                        id: `quitar-${item.slug}`,
                        label: "Quitar",
                        icon: Trash2,
                        tone: "danger",
                        onRun: () => quitar(item.slug, item.name),
                      },
                    ]}
                  >
                    <div
                      className="rise card flex items-center gap-3 border-0 p-3 shadow-none"
                      style={{ animationDelay: `${Math.min(index * 40, 240)}ms` }}
                    >
                      {item.photo ? (
                        <img
                          src={item.photo}
                          alt=""
                          loading="lazy"
                          className="size-16 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <span className="size-16 shrink-0 rounded-xl bg-paper-deep" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-xl leading-tight">{item.name}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-sm text-stone">
                          <HomeIcon className="size-3.5" aria-hidden="true" />
                          {PLACE_LABEL[item.home].split(",")[0]}
                        </p>
                        {prefs.ethylene && item.ethylene !== "neutro" ? (
                          <p className="mt-0.5 text-xs text-citrus">
                            {item.ethylene === "emite" ? "Suelta etileno" : "Sensible al etileno"}
                          </p>
                        ) : null}
                      </div>
                      <Link
                        to="/guia/$slug"
                        params={{ slug: item.slug }}
                        className="tap press inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-sm text-leaf"
                      >
                        Ver ficha
                        <ArrowUpRight className="size-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </SwipeReveal>
                </li>
              );
            })}
          </ul>

          <p className="px-5 pt-6 text-sm leading-relaxed text-stone">
            En el teléfono, la tarjeta se desliza hacia la izquierda para revelar “Quitar”. En
            pantalla grande, el botón aparece a la vista sin deslizar nada.
          </p>
        </>
      )}
    </Shell>
  );
}
