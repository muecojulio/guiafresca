import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Store, TriangleAlert } from "lucide-react";
import { getGuide, searchGuides } from "@/lib/catalog";
import { buscarEnVivo, type LiveProduct } from "@/lib/products.functions";
import { conservacionDe, type Conservacion } from "@/lib/conservacion.functions";
import { Shell, PageHeader } from "@/components/shell";
import { ActionButton } from "@/components/actions";
import { EmptyState, GuideCollection, ProductRow } from "@/components/cards";
import { announce } from "@/lib/announcer";
import { useOverflowRail } from "@/lib/use-overflow-rail";
import { usePrefs } from "@/lib/use-prefs";

export const Route = createFileRoute("/buscar")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q.slice(0, 60) : "",
  }),
  component: Buscar,
});

const ATAJOS = ["crema", "jitomate", "cilantro", "aguacate", "leche", "plátano"];

function Buscar() {
  const { q: initialQuery } = Route.useSearch();
  const navigate = useNavigate();
  const prefs = usePrefs();
  const [draft, setDraft] = useState(initialQuery);
  const [live, setLive] = useState<LiveProduct[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [note, setNote] = useState("");
  const [conservas, setConservas] = useState<Record<string, Conservacion | null>>({});
  const shortcuts = useOverflowRail<HTMLDivElement>(ATAJOS.length);
  const announcedRef = useRef("");

  const local = useMemo(() => searchGuides(draft).slice(0, 24), [draft]);

  useEffect(() => {
    setDraft(initialQuery);
  }, [initialQuery]);

  // Productos de tienda sin ficha en la guía: USDA FoodKeeper,
  // datos locales sin red ni llave.
  useEffect(() => {
    const needs = live.filter((product) => !product.guideSlug).slice(0, 6);
    if (needs.length === 0) return;
    let cancel = false;
    Promise.all(
      needs.map((product) => conservacionDe({ data: product.name }).catch(() => null)),
    ).then((rows) => {
      if (cancel) return;
      setConservas((prev) => {
        const next = { ...prev };
        needs.forEach((product, index) => {
          next[product.code] = rows[index];
        });
        return next;
      });
    });
    return () => {
      cancel = true;
    };
  }, [live]);

  // Consulta en vivo, con un respiro de 550 ms después de la última tecla.
  useEffect(() => {
    const query = draft.trim();
    if (query.length < 2) {
      setLive([]);
      setState("idle");
      setNote("");
      return;
    }
    let cancel = false;
    const timer = window.setTimeout(() => {
      setState("loading");
      buscarEnVivo({ data: query })
        .then((result) => {
          if (cancel) return;
          setLive(result.products);
          setState(result.ok ? "ok" : "error");
          setNote(
            result.ok
              ? result.cached
                ? "Respuesta en caché de unos minutos."
                : ""
              : (result.error ?? ""),
          );
        })
        .catch(() => {
          if (cancel) return;
          setState("error");
          setNote("No se pudo consultar en vivo. La guía de la casa sigue aquí.");
        });
    }, 550);
    return () => {
      cancel = true;
      window.clearTimeout(timer);
    };
  }, [draft]);

  useEffect(() => {
    const query = draft.trim();
    if (query.length < 2) return;
    const signature = `${query}:${local.length}:${state}`;
    if (announcedRef.current === signature) return;
    announcedRef.current = signature;
    announce(
      `${local.length} ${local.length === 1 ? "ficha" : "fichas"} en la guía para «${query}».` +
        (state === "loading" ? " Consultando tienda…" : ""),
    );
  }, [draft, local.length, state]);

  return (
    <Shell>
      <PageHeader title="Buscar" eyebrow="Guía de casa y tienda">
        Primero la guía comprobada. Abajo, productos reales de Open Food Facts, sin registro.
      </PageHeader>

      <form
        className="px-5 pt-5"
        onSubmit={(event) => {
          event.preventDefault();
          const query = draft.trim();
          announce(`Buscando ${query || "toda la guía"}.`);
          navigate({ to: "/buscar", search: { q: query } });
        }}
      >
        <label className="relative block">
          <span className="sr-only">Buscar productos y fichas</span>
          <Search
            className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-stone"
            aria-hidden="true"
          />
          <input
            name="q"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Leche, crema, mango…"
            autoComplete="off"
            spellCheck={false}
            className="field min-h-12 w-full rounded-full border border-line bg-card pr-4 pl-11 text-base text-ink outline-none placeholder:text-stone"
          />
        </label>

        <div
          className="rail-frame"
          data-overflow-start={!shortcuts.atStart}
          data-overflow-end={!shortcuts.atEnd}
        >
          <div
            ref={shortcuts.ref}
            role="group"
            aria-label="Búsquedas frecuentes"
            className="rail -mx-5 mt-3 px-5"
          >
            {ATAJOS.map((shortcut) => (
              <button
                key={shortcut}
                type="button"
                data-rail-item=""
                onClick={() => {
                  setDraft(shortcut);
                  navigate({ to: "/buscar", search: { q: shortcut } });
                }}
                className="tap press min-h-11 shrink-0 rounded-full border border-line bg-card px-4 text-sm text-ink"
              >
                {shortcut}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <ActionButton type="submit" variant="solid" icon={Search}>
            Buscar
          </ActionButton>
          {draft ? (
            <button
              type="button"
              onClick={() => {
                setDraft("");
                navigate({ to: "/buscar", search: { q: "" } });
              }}
              className="tap inline-flex min-h-11 items-center rounded-full px-3 text-sm text-stone underline decoration-line underline-offset-4"
            >
              Limpiar
            </button>
          ) : null}
        </div>
      </form>

      <section className="pt-8" aria-labelledby="en-la-guia">
        <div className="flex items-end justify-between gap-3 px-5">
          <h2 id="en-la-guia" className="font-display text-3xl">
            En la guía
          </h2>
          <span className="sticker sticker--leaf">
            {local.length} {local.length === 1 ? "ficha" : "fichas"}
          </span>
        </div>

        {local.length === 0 ? (
          <EmptyState
            title="Nada con ese nombre"
            action={
              <button
                type="button"
                onClick={() => setDraft("")}
                className="tap press inline-flex min-h-11 items-center rounded-full border border-line bg-card px-5 text-sm"
              >
                Ver toda la guía
              </button>
            }
          >
            Prueba con “crema”, “cebolla” o revisa la sección de tienda más abajo.
          </EmptyState>
        ) : (
          <div className="pt-4">
            <GuideCollection
              items={local}
              showEthylene={prefs.ethylene}
              label="Fichas encontradas"
              maxForCarousel={6}
            />
          </div>
        )}
      </section>

      <section className="pt-10" aria-labelledby="en-tienda">
        <div className="flex items-center justify-between gap-3 px-5">
          <h2 id="en-tienda" className="font-display text-3xl">
            En tienda, ahora
          </h2>
          <span className="sticker">
            <Store className="size-3.5" aria-hidden="true" />
            Open Food Facts
          </span>
        </div>

        {draft.trim().length < 2 ? (
          <p className="px-5 pt-3 text-sm leading-relaxed text-stone">
            Escribe al menos dos letras para consultar productos vivos.
          </p>
        ) : null}
        {state === "error" ? (
          <p className="mx-5 mt-3 flex items-start gap-2 rounded-card border border-berry/40 bg-berry-soft px-4 py-3 text-sm leading-relaxed text-ink">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-berry" aria-hidden="true" />
            {note}
          </p>
        ) : null}
        {state === "ok" && note ? <p className="px-5 pt-3 text-sm text-stone">{note}</p> : null}

        {state === "loading" ? (
          <ul className="space-y-3 px-5 pt-3" aria-busy="true" aria-live="polite">
            {[0, 1, 2].map((row) => (
              <li key={row} className="card flex gap-3 p-3">
                <span className="skeleton size-20 shrink-0 rounded-xl" />
                <span className="flex-1 space-y-2 pt-1">
                  <span className="skeleton block h-4 w-2/3" />
                  <span className="skeleton block h-3 w-1/3" />
                  <span className="skeleton block h-3 w-1/2" />
                </span>
              </li>
            ))}
            <li className="sr-only">Consultando Open Food Facts…</li>
          </ul>
        ) : null}

        <ul className="mt-3 space-y-3 px-5">
          {state !== "loading"
            ? live.map((product) => {
                const guide = product.guideSlug ? getGuide(product.guideSlug) : undefined;
                const conserva = conservas[product.code];
                return (
                  <ProductRow
                    key={product.code}
                    name={product.name}
                    brand={product.brand}
                    image={product.image}
                    badge={
                      guide ? (
                        <span className="sticker sticker--leaf shrink-0">En la guía</span>
                      ) : (
                        <span className="sticker shrink-0">Sin ficha</span>
                      )
                    }
                  >
                    {guide ? (
                      <Link
                        to="/guia/$slug"
                        params={{ slug: guide.slug }}
                        className="tap mt-1 inline-flex min-h-11 items-center text-sm text-leaf"
                      >
                        Cómo guardarlo: {guide.name}
                      </Link>
                    ) : (
                      <p className="mt-1 text-sm text-stone">
                        {conserva?.fridge
                          ? "Sin ficha propia: mira la tabla USDA de abajo."
                          : "Sin ficha en la guía. Si es perecedero, al refrigerador y fuera máximo 2 horas."}
                      </p>
                    )}
                    {conserva?.fridge ? (
                      <p className="mt-1 text-sm leading-relaxed text-leaf">
                        USDA: {conserva.fridge} en refrigerador
                        {conserva.freezer ? `, ${conserva.freezer} en congelador` : ""}.
                      </p>
                    ) : null}
                  </ProductRow>
                );
              })
            : null}
        </ul>

        {state === "ok" && live.length === 0 ? (
          <p className="px-5 pt-3 text-sm leading-relaxed text-stone">
            Sin productos de tienda con ese nombre. La guía de casa sigue arriba.
          </p>
        ) : null}
      </section>
    </Shell>
  );
}
