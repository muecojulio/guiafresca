import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { GUIDES, type GroupId, type HomePlace } from "@/lib/catalog";
import { Shell, Mark } from "@/components/shell";
import { GroupFilters, GuideCard, PlaceFilters, usePrefs } from "@/components/ui";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const navigate = useNavigate();
  const prefs = usePrefs();
  const [group, setGroup] = useState<GroupId | "todas">("todas");
  const [place, setPlace] = useState<HomePlace | "todas">("todas");
  const [q, setQ] = useState("");

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
