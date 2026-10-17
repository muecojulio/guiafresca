import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  CircleSlash,
  Clock,
  FlaskConical,
  Leaf,
  Link2,
  Sparkles,
  Sprout,
} from "lucide-react";
import { getGuide, PLACE_LABEL, SOURCES, GROUPS } from "@/lib/catalog";
import { fmtRango, verificacionDe } from "@/lib/verificacion";
import { nutricionDe, type Nutricion } from "@/lib/fruta.functions";
import { Shell } from "@/components/shell";
import { ActionButton, SaveButton } from "@/components/actions";
import { CardRail, FreshnessMeter } from "@/components/cards";
import { Disclosure } from "@/components/accordion";
import { EmptyPlate } from "@/components/decor";
import { usePrefs } from "@/lib/use-prefs";
import { useReducedMotion } from "@/lib/use-media-query";
import { useSavedSet } from "@/lib/use-saved-set";

export const Route = createFileRoute("/guia/$slug")({ component: Detail });

function Detail() {
  const { slug } = Route.useParams();
  const item = getGuide(slug);
  const saved = useSavedSet();
  const prefs = usePrefs();
  const reduced = useReducedMotion();
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
        <div className="flex flex-col items-center gap-4 px-5 pt-10 text-center">
          <EmptyPlate className="size-40 text-leaf" />
          <h1 className="font-display text-4xl">No está en la guía</h1>
          <p className="max-w-sm text-sm leading-relaxed text-stone">
            Puede que el nombre haya cambiado. Vuelve a la guía y búscalo de nuevo.
          </p>
          <Link
            to="/"
            className="tap press inline-flex min-h-11 items-center rounded-full bg-ink px-5 text-sm text-paper"
          >
            Volver a la guía
          </Link>
        </div>
      </Shell>
    );
  }

  const verif = verificacionDe(item.slug);
  const groupLabel = GROUPS.find((group) => group.id === item.group)?.label ?? "";

  const stages = [
    { n: "1", title: "Todavía no", text: item.unripe, src: item.early, tone: "text-stone" },
    { n: "2", title: "Listo", text: item.ripe, src: item.photo, tone: "text-leaf" },
    { n: "3", title: "Pasado", text: item.over, src: item.late, tone: "text-berry" },
  ];

  return (
    <Shell>
      <div className="px-5 pt-5">
        <Link to="/" className="tap inline-flex min-h-11 items-center gap-1 text-sm text-stone">
          <ChevronLeft className="size-4" aria-hidden="true" />
          Guía
        </Link>
      </div>

      <header className="rise px-5 pt-2">
        <div className="relative overflow-hidden rounded-card border border-line">
          {item.photo ? (
            <img
              src={item.photo}
              alt={item.name}
              className="aspect-[4/3] w-full object-cover sm:aspect-[16/10]"
            />
          ) : (
            <div className="aspect-[4/3] w-full bg-paper-deep" />
          )}
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink/80 to-transparent" />
          <span className="absolute top-3 left-3 flex flex-wrap gap-2">
            <span className="sticker">{groupLabel}</span>
            {prefs.ethylene && item.ethylene !== "neutro" ? (
              <span className="sticker sticker--citrus">
                {item.ethylene === "emite" ? "Suelta etileno" : "Sensible al etileno"}
              </span>
            ) : null}
          </span>
          <span className="absolute bottom-3 left-3 right-3">
            <span className="block text-xs tracking-[0.14em] text-paper/85 uppercase">
              {PLACE_LABEL[item.home]}
            </span>
            <span className="font-display block text-4xl leading-tight text-paper sm:text-5xl">
              {item.name}
            </span>
          </span>
        </div>

        <p className="mt-4 text-base leading-relaxed">{item.summary}</p>
        <p className="mt-2 text-base leading-relaxed text-stone">{item.detail}</p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <SaveButton slug={item.slug} saved={saved.has(item.slug)} onToggle={saved.toggle} />
          {saved.has(item.slug) ? (
            <Link
              to="/guardados"
              className="tap inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm text-leaf"
            >
              Ver guardados
              <span aria-hidden="true">→</span>
            </Link>
          ) : null}
        </div>
      </header>

      {prefs.heat ? (
        <p className="mx-5 mt-5 rounded-card border border-citrus/40 bg-citrus-soft px-4 py-3 text-sm leading-relaxed">
          Con calor, cuenta la mitad del tiempo “fuera” y tira lácteos o fruta partida a la hora.
        </p>
      ) : null}

      <section className="px-5 pt-8" aria-labelledby="cuanto-dura">
        <h2 id="cuanto-dura" className="font-display text-3xl">
          Cuánto dura
        </h2>
        <p className="pt-2 pb-4 text-sm leading-relaxed text-stone">
          Las barras comparan las ventanas entre sí; la cifra de cada fila es la que manda.
        </p>
        <FreshnessMeter
          rows={[
            {
              key: "fuera",
              label: "Fuera del refrigerador",
              text: item.counter,
              accentVar: "var(--color-citrus)",
            },
            {
              key: "refri",
              label: "En refrigerador",
              text: item.fridge,
              accentVar: "var(--color-leaf)",
            },
            {
              key: "abierto",
              label: "Ya abierto",
              text: item.opened,
              accentVar: "var(--color-sun)",
            },
            {
              key: "congelador",
              label: "Congelador",
              text: item.freezer,
              accentVar: "var(--color-stone-soft)",
            },
          ]}
        />
      </section>

      <section className="pt-10" aria-labelledby="como-se-ve">
        <div className="px-5">
          <h2 id="como-se-ve" className="font-display text-3xl">
            Cómo se ve
          </h2>
          <p className="pt-2 text-sm leading-relaxed text-stone">
            Tres momentos con la misma fruta: antes, lista y pasada.
          </p>
        </div>
        <div className="pt-4">
          <CardRail label={`Etapas de ${item.name}`} count={stages.length} className="px-5">
            {stages.map((stage, index) => (
              <article
                key={stage.n}
                style={{ animationDelay: `${index * 70}ms` }}
                className="rise card w-[76%] max-w-[18rem] shrink-0 overflow-hidden sm:w-auto sm:max-w-none"
              >
                {stage.src ? (
                  <img
                    src={stage.src}
                    alt={stage.title}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover"
                  />
                ) : null}
                <div className="flex gap-3 p-4">
                  <span
                    className={`font-display text-3xl leading-none ${stage.tone}`}
                    aria-hidden="true"
                  >
                    {stage.n}
                  </span>
                  <div>
                    <h3 className="font-display text-xl">{stage.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-stone">{stage.text}</p>
                  </div>
                </div>
              </article>
            ))}
          </CardRail>
        </div>
      </section>

      <section className="px-5 pt-10" aria-labelledby="para-que-dure">
        <h2 id="para-que-dure" className="font-display text-3xl">
          Para que dure
        </h2>
        <ul className="mt-4 space-y-3">
          {item.longer.map((tip) => (
            <li key={tip} className="card flex gap-3 px-4 py-3 text-sm leading-relaxed">
              <Leaf className="mt-0.5 size-4 shrink-0 text-leaf" aria-hidden="true" />
              {tip}
            </li>
          ))}
        </ul>
      </section>

      <section className="px-5 pt-8" aria-labelledby="que-no-hacer">
        <h2 id="que-no-hacer" className="font-display text-3xl">
          Qué no hacer
        </h2>
        <ul className="mt-4 space-y-3">
          {item.avoid.map((tip) => (
            <li key={tip} className="flex gap-3 text-sm leading-relaxed text-stone">
              <CircleSlash className="mt-0.5 size-4 shrink-0 text-berry" aria-hidden="true" />
              {tip}
            </li>
          ))}
        </ul>
        {prefs.ethylene && item.ethylene !== "neutro" ? (
          <p className="mt-4 flex gap-2 rounded-card border border-citrus/40 bg-citrus-soft px-4 py-3 text-sm leading-relaxed">
            <Sparkles className="mt-0.5 size-4 shrink-0 text-citrus" aria-hidden="true" />
            {item.ethylene === "emite"
              ? "Suelta etileno: apura a lo que tenga al lado, sobre todo hojas y hierbas."
              : "Le afecta el etileno: aléjalo de plátano, manzana, aguacate y jitomate."}
          </p>
        ) : null}
      </section>

      {nutri ? (
        <section className="px-5 pt-10" aria-labelledby="por-100">
          <h2 id="por-100" className="font-display text-3xl">
            Por 100 g
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-stone">
            {nutri.label === item.name ? nutri.label : `${nutri.label}, dentro de ${item.name}`}.
            Dato de
            {nutri.source === "api"
              ? " Fruityvice, un API público sin llave."
              : " la copia local del dataset de Fruityvice, porque el API no respondió."}{" "}
            No cambia cómo se guarda.
          </p>
          <dl className="mt-4 grid grid-cols-2 gap-3">
            <Stat k="Energía" v={`${fmt(nutri.calories)} kcal`} accent="text-citrus" />
            <Stat k="Azúcar" v={`${fmt(nutri.sugar)} g`} accent="text-sun" />
            <Stat k="Carbohidratos" v={`${fmt(nutri.carbohydrates)} g`} accent="text-leaf" />
            <Stat k="Proteína" v={`${fmt(nutri.protein)} g`} accent="text-berry" />
          </dl>
        </section>
      ) : null}

      <section className="space-y-3 px-5 pt-10">
        {verif ? (
          <Disclosure
            label="Cómo se comprobó"
            hint={verif.tabla === "Criterio de la guía" ? "Criterio de la guía" : verif.tabla}
            icon={<FlaskConical className="size-4" aria-hidden="true" />}
          >
            <div className="space-y-2">
              <p className="text-sm leading-relaxed">
                {verif.tabla === "Criterio de la guía"
                  ? "Criterio de la guía. No hay una cifra comparable en las tablas consultadas."
                  : `Fuente: ${verif.tabla}${verif.fila ? `, fila “${verif.fila}”` : ""}.`}
              </p>
              {verif.refri ? (
                <p className="text-sm leading-relaxed text-stone">
                  Refrigerador: {fmtRango(verif.refri)}.
                </p>
              ) : null}
              {verif.fuera ? (
                <p className="text-sm leading-relaxed text-stone">
                  Fuera del refrigerador: {fmtRango(verif.fuera)}.
                </p>
              ) : null}
              {verif.excepcion ? (
                <p className="text-sm leading-relaxed text-stone">Excepción: {verif.excepcion}</p>
              ) : null}
              <p className="text-sm leading-relaxed text-stone">{verif.nota}</p>
            </div>
          </Disclosure>
        ) : null}

        <Disclosure
          label="De dónde sale"
          hint={`${SOURCES.length} fuentes públicas`}
          icon={<Link2 className="size-4" aria-hidden="true" />}
        >
          <ul className="space-y-3">
            {SOURCES.map((source) => (
              <li key={source.href}>
                <a
                  href={source.href}
                  className="text-sm text-leaf underline decoration-line underline-offset-4"
                  rel="noreferrer"
                  target="_blank"
                >
                  {source.name}
                </a>
                <p className="mt-1 text-sm leading-relaxed text-stone">{source.note}</p>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm leading-relaxed text-stone">
            Los días son ventanas de hogar, no una fecha de fábrica. Si huele mal, tiene moho o pasó
            la regla de las dos horas, no se prueba.
          </p>
        </Disclosure>
      </section>

      <section className="px-5 pt-8" aria-label="Guardar esta ficha">
        <div className="card flex flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-full bg-leaf-soft text-leaf-deep">
              <Clock className="size-5" aria-hidden="true" />
            </span>
            <p className="text-sm leading-relaxed text-stone">
              Guarda la ficha para verla sin buscar otra vez.
            </p>
          </div>
          <SaveButton slug={item.slug} saved={saved.has(item.slug)} onToggle={saved.toggle} />
        </div>
        <ActionButton
          className="mt-3"
          variant="outline"
          icon={Sprout}
          onClick={() => window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" })}
        >
          Volver arriba
        </ActionButton>
      </section>
    </Shell>
  );
}

function fmt(value: number) {
  return value.toLocaleString("es-MX", { maximumFractionDigits: 1 });
}

function Stat({ k, v, accent }: { k: string; v: string; accent: string }) {
  return (
    <div className="card rise px-4 py-3">
      <dt className="text-xs tracking-[0.14em] text-stone uppercase">{k}</dt>
      <dd className={`font-display mt-1 text-2xl ${accent}`}>{v}</dd>
    </div>
  );
}
