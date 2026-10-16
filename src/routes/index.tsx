import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { GUIDES, type GroupId, type HomePlace } from "@/lib/catalog";
import { climaDe, type Clima } from "@/lib/clima.functions";
import { readCity } from "@/lib/prefs";
import { Shell, Mark } from "@/components/shell";
import { GroupFilters, GuideCard, PlaceFilters, usePrefs } from "@/components/ui";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const navigate = useNavigate();
  const prefs = usePrefs();
  const [group, setGroup] = useState<GroupId | "todas">("todas");
  const [place, setPlace] = useState<HomePlace | "todas">("todas");
  const [q, setQ] = useState("");
  const [clima, setClima] = useState<Clima | null>(null);

  useEffect(() => {
    let cancel = false;
    climaDe({ data: readCity() })
      .then((next) => {
        if (!cancel) setClima(next);
      })
      .catch(() => {
        if (!cancel) setClima(null);
      });
    return () => {
      cancel = true;
    };
  }, []);

  const items = useMemo(
    () =>
      GUIDES.filter((item) => (group === "todas" ? true : item.group === group)).filter((item) =>
        place === "todas" ? true : item.home === place,
      ),
    [group, place],
  );

  return (
    <Shell>
      <header className="rise px-5 pt-8">
        <Mark />
        <p className="mt-6 text-xs tracking-[0.18em] text-stone uppercase">Mercado en casa</p>
        <h1 className="font-display mt-2 text-5xl leading-none">Guía Fresca</h1>
        <p className="mt-3 max-w-sm text-base leading-relaxed text-stone">
          Qué va dentro del refrigerador, qué se queda fuera, cuántos días dura y cómo se ve cuando ya se puede comer.
        </p>
        {clima ? (
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-stone">
            Ahora en {clima.city}: {clima.temp.toLocaleString("es-MX")} °C, vía Open-Meteo.
            {clima.veryHot
              ? " Hace mucho calor: lácteos y fruta partida, fuera, se tiran a la hora."
              : clima.hot
                ? " Hace calor: conviene acortar lo que se queda fuera."
                : " No hace falta acortar los tiempos de fuera."}
          </p>
        ) : null}
        {clima?.hot && !prefs.heat ? (
          <button
            type="button"
            className="tap mt-3 inline-flex min-h-11 items-center rounded-full bg-ink px-4 text-sm text-paper"
            onClick={() => prefs.setHeat(true)}
          >
            Activar aviso de calor
          </button>
        ) : null}
      </header>

      <form
        className="rise rise-2 px-5 pt-6"
        onSubmit={(event) => {
          event.preventDefault();
          const query = q.trim();
          navigate({ to: "/buscar", search: { q: query } });
        }}
      >
        <label className="relative block">
          <span className="sr-only">Buscar en la guía</span>
          <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-stone" aria-hidden="true" />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Plátano, leche, cilantro…"
            className="min-h-12 w-full rounded-full border border-line bg-card pr-4 pl-11 text-base text-ink outline-none placeholder:text-stone"
          />
        </label>
      </form>

      <div className="rise rise-3 space-y-3 px-5 pt-5">
        <GroupFilters value={group} onChange={setGroup} />
        <PlaceFilters value={place} onChange={setPlace} />
      </div>

      {prefs.heat ? (
        <p className="mx-5 mt-4 rounded-card border border-line bg-card px-4 py-3 text-sm leading-relaxed text-ink">
          Hace calor: lo que dice “fuera” se acorta, y cualquier lácteo o fruta partida se tira a la hora, no a las dos.
        </p>
      ) : null}

      <section className="grid grid-cols-1 gap-4 px-5 pt-5 sm:grid-cols-2">
        {items.map((item) => (
          <GuideCard key={item.slug} item={item} showEthylene={prefs.ethylene} />
        ))}
      </section>
    </Shell>
  );
}
