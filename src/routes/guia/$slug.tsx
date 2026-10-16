import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronLeft } from "lucide-react";
import { getGuide, PLACE_LABEL, SOURCES } from "@/lib/catalog";
import { nutricionDe, type Nutricion } from "@/lib/fruta.functions";
import { Shell } from "@/components/shell";
import { SaveButton, usePrefs, useSavedSet } from "@/components/ui";

export const Route = createFileRoute("/guia/$slug")({ component: Detail });

function Detail() {
  const { slug } = Route.useParams();
  const item = getGuide(slug);
  const saved = useSavedSet();
  const prefs = usePrefs();
  const [nutri, setNutri] = useState<Nutricion | null>(null);

  useEffect(() => {
    let cancel = false;
    setNutri(null);
    nutricionDe({ data: slug })
      .then((next) => {
        if (!cancel) setNutri(next);
      })
      .catch(() => {
        if (!cancel) setNutri(null);
      });
    return () => {
      cancel = true;
    };
  }, [slug]);

  if (!item) {
    return (
      <Shell>
        <div className="px-5 pt-10">
          <h1 className="font-display text-4xl">No está en la guía</h1>
          <Link to="/" className="mt-4 inline-flex min-h-11 items-center text-leaf">
            Volver
          </Link>
        </div>
      </Shell>
    );
  }

  const days = [
    { label: "Fuera", value: item.counter },
    { label: "Refrigerador", value: item.fridge },
    { label: "Ya abierto", value: item.opened },
  ];

  return (
    <Shell>
      <div className="px-5 pt-5">
        <Link to="/" className="tap inline-flex min-h-11 items-center gap-1 text-sm text-stone">
          <ChevronLeft className="size-4" aria-hidden="true" />
          Guía
        </Link>
      </div>
      {item.photo ? (
        <img
          src={item.photo}
          alt={item.name}
          className="mt-2 aspect-square w-full object-cover"
        />
      ) : null}
      <article className="space-y-8 px-5 pt-6">
        <header>
          <p className="text-xs tracking-[0.16em] text-citrus uppercase">{PLACE_LABEL[item.home]}</p>
          <h1 className="font-display mt-2 text-5xl leading-none">{item.name}</h1>
          <p className="mt-3 text-base leading-relaxed text-stone">{item.summary}</p>
          <p className="mt-3 text-base leading-relaxed">{item.detail}</p>
          <div className="mt-4">
            <SaveButton slug={item.slug} saved={saved.has(item.slug)} onToggle={saved.toggle} />
          </div>
        </header>

        {prefs.heat ? (
          <p className="rounded-card border border-line bg-card px-4 py-3 text-sm leading-relaxed">
            Con calor, cuenta la mitad del tiempo “fuera” y tira lácteos o fruta partida a la hora.
          </p>
        ) : null}

        <section className="grid gap-3">
          {days.map((day) => (
            <div key={day.label} className="rounded-card border border-line bg-card px-4 py-3">
              <p className="text-xs tracking-[0.14em] text-stone uppercase">{day.label}</p>
              <p className="mt-1 text-base leading-relaxed">{day.value}</p>
            </div>
          ))}
          <div className="rounded-card border border-line px-4 py-3">
            <p className="text-xs tracking-[0.14em] text-stone uppercase">Congelador</p>
            <p className="mt-1 text-base leading-relaxed">{item.freezer}</p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-3xl">Cómo se ve</h2>
          <ol className="mt-4 space-y-3">
            <Stage n="1" title="Todavía no" text={item.unripe} src={item.early} />
            <Stage n="2" title="Listo" text={item.ripe} src={item.photo} />
            <Stage n="3" title="Pasado" text={item.over} src={item.late} />
          </ol>
        </section>

        <section>
          <h2 className="font-display text-3xl">Para que dure</h2>
          <ul className="mt-4 space-y-3">
            {item.longer.map((tip) => (
              <li key={tip} className="border-l-2 border-leaf pl-3 text-base leading-relaxed">
                {tip}
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-3xl">Qué no hacer</h2>
          <ul className="mt-4 space-y-3">
            {item.avoid.map((tip) => (
              <li key={tip} className="text-base leading-relaxed text-stone">
                {tip}
              </li>
            ))}
          </ul>
          {prefs.ethylene && item.ethylene !== "neutro" ? (
            <p className="mt-4 text-sm leading-relaxed text-citrus">
              {item.ethylene === "emite"
                ? "Suelta etileno: apura a lo que tenga al lado, sobre todo hojas y hierbas."
                : "Le afecta el etileno: aléjalo de plátano, manzana, aguacate y jitomate."}
            </p>
          ) : null}
        </section>

        {nutri ? (
          <section>
            <h2 className="font-display text-3xl">Por 100 g</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone">
              {nutri.label === item.name ? nutri.label : `${nutri.label}, dentro de ${item.name}`}. Dato de
              Fruityvice, un API público sin llave. No cambia cómo se guarda.
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              <Nutri k="Energía" v={`${fmt(nutri.calories)} kcal`} />
              <Nutri k="Azúcar" v={`${fmt(nutri.sugar)} g`} />
              <Nutri k="Carbohidratos" v={`${fmt(nutri.carbohydrates)} g`} />
              <Nutri k="Proteína" v={`${fmt(nutri.protein)} g`} />
            </dl>
          </section>
        ) : null}

        <section>
          <h2 className="font-display text-3xl">De dónde sale</h2>
          <ul className="mt-4 space-y-3">
            {SOURCES.map((source) => (
              <li key={source.href}>
                <a href={source.href} className="text-leaf underline decoration-line underline-offset-4" rel="noreferrer" target="_blank">
                  {source.name}
                </a>
                <p className="mt-1 text-sm leading-relaxed text-stone">{source.note}</p>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm leading-relaxed text-stone">
            Los días son ventanas de hogar, no una fecha de fábrica. Si huele mal, tiene moho o pasó la regla de las dos horas, no se prueba.
          </p>
        </section>
      </article>
    </Shell>
  );
}

function fmt(value: number) {
  return value.toLocaleString("es-MX", { maximumFractionDigits: 1 });
}

function Nutri({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-card border border-line bg-card px-4 py-3">
      <dt className="text-xs tracking-[0.14em] text-stone uppercase">{k}</dt>
      <dd className="mt-1 text-base">{v}</dd>
    </div>
  );
}

function Stage({ n, title, text, src }: { n: string; title: string; text: string; src?: string }) {
  return (
    <li className="overflow-hidden rounded-card border border-line bg-card">
      {src ? <img src={src} alt={title} className="aspect-[4/3] w-full object-cover" /> : null}
      <span className="flex gap-3 px-4 py-3">
        <span className="font-display text-2xl text-citrus">{n}</span>
        <span>
          <span className="block text-base">{title}</span>
          <span className="mt-1 block text-sm leading-relaxed text-stone">{text}</span>
        </span>
      </span>
    </li>
  );
}
