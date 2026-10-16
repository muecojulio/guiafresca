import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getGuide, searchGuides } from "@/lib/catalog";
import { buscarEnVivo, type LiveProduct } from "@/lib/products.functions";
import {
  conservacionDe,
  type Conservacion,
} from "@/lib/conservacion.functions";
import { Shell } from "@/components/shell";
import { GuideCard } from "@/components/ui";
import { usePrefs } from "@/lib/use-prefs";

export const Route = createFileRoute("/buscar")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q.slice(0, 60) : "",
  }),
  component: Buscar,
});

function Buscar() {
  const { q } = Route.useSearch();
  const prefs = usePrefs();
  const local = searchGuides(q);
  const [draft, setDraft] = useState(q);
  const [live, setLive] = useState<LiveProduct[]>([]);
  const [state, setState] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [note, setNote] = useState("");
  const [conservas, setConservas] = useState<Record<string, Conservacion | null>>({});

  // Productos de tienda sin ficha en la guía: USDA FoodKeeper,
  // datos locales sin red ni llave.
  useEffect(() => {
    const needs = live.filter((product) => !product.guideSlug).slice(0, 6);
    if (needs.length === 0) return;
    let cancel = false;
    Promise.all(
      needs.map((product) =>
        conservacionDe({ data: product.name }).catch(() => null),
      ),
    ).then((rows) => {
      if (cancel) return;
      setConservas((prev) => {
        const next = { ...prev };
        needs.forEach((product, i) => {
          next[product.code] = rows[i];
        });
        return next;
      });
    });
    return () => {
      cancel = true;
    };
  }, [live]);

  useEffect(() => {
    setDraft(q);
  }, [q]);

  useEffect(() => {
    if (q.trim().length < 2) {
      setLive([]);
      setState("idle");
      setNote("");
      return;
    }
    let cancel = false;
    setState("loading");
    buscarEnVivo({ data: q })
      .then((result) => {
        if (cancel) return;
        setLive(result.products);
        setState(result.ok ? "ok" : "error");
        setNote(result.ok ? (result.cached ? "Respuesta en caché de unos minutos." : "") : result.error ?? "");
      })
      .catch(() => {
        if (cancel) return;
        setState("error");
        setNote("No se pudo consultar en vivo. La guía de la casa sigue aquí.");
      });
    return () => {
      cancel = true;
    };
  }, [q]);

  return (
    <Shell>
      <header className="px-5 pt-8">
        <h1 className="font-display text-4xl">Buscar</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone">
          Primero la guía comprobada. Abajo, productos reales de Open Food Facts, sin registro.
        </p>
      </header>
      <form className="px-5 pt-5" action="/buscar" method="get">
        <input
          name="q"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Leche, crema, mango…"
          className="min-h-12 w-full rounded-full border border-line bg-card px-4 text-base outline-none"
        />
      </form>

      <section className="px-5 pt-6">
        <h2 className="text-xs tracking-[0.16em] text-stone uppercase">En la guía</h2>
        {local.length === 0 ? (
          <p className="mt-3 text-sm text-stone">Nada con ese nombre. Prueba “crema” o “cebolla”.</p>
        ) : (
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {local.map((item) => (
              <GuideCard key={item.slug} item={item} showEthylene={prefs.ethylene} />
            ))}
          </div>
        )}
      </section>

      <section className="px-5 pt-8">
        <h2 className="text-xs tracking-[0.16em] text-stone uppercase">En tienda, ahora</h2>
        {q.trim().length < 2 ? (
          <p className="mt-3 text-sm text-stone">Escribe al menos dos letras para consultar productos vivos.</p>
        ) : null}
        {state === "loading" ? <p className="mt-3 text-sm text-stone">Consultando Open Food Facts…</p> : null}
        {state === "error" ? <p className="mt-3 text-sm text-citrus">{note}</p> : null}
        {state === "ok" && note ? <p className="mt-3 text-sm text-stone">{note}</p> : null}
        <ul className="mt-3 space-y-3">
          {live.map((product) => {
            const guide = product.guideSlug ? getGuide(product.guideSlug) : undefined;
            const conserva = conservas[product.code];
            return (
              <li key={product.code} className="flex gap-3 rounded-card border border-line bg-card p-3">
                {product.image ? (
                  <img src={product.image} alt="" className="size-16 rounded-xl object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="size-16 rounded-xl bg-paper" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-base">{product.name}</p>
                  <p className="truncate text-sm text-stone">{product.brand || "Sin marca"}</p>
                  {guide ? (
                    <Link to="/guia/$slug" params={{ slug: guide.slug }} className="mt-1 inline-flex min-h-11 items-center text-sm text-leaf">
                      Cómo guardarlo: {guide.name}
                    </Link>
                  ) : (
                    <p className="mt-1 text-sm text-stone">Sin ficha en la guía. Si es perecedero, al refrigerador y fuera máximo 2 horas.</p>
                  )}
                  {conserva?.fridge ? (
                    <p className="mt-1 text-sm leading-relaxed text-leaf">
                      USDA: {conserva.fridge} en refrigerador
                      {conserva.freezer ? `, ${conserva.freezer} en congelador` : ""}.
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </Shell>
  );
}
