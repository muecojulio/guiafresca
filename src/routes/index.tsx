import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Sparkles, Sprout, Sun } from "lucide-react";
import { GUIDES, GROUPS, type GroupId, type HomePlace } from "@/lib/catalog";
import { climaDe, type Clima } from "@/lib/clima.functions";
import { miCiudad } from "@/lib/location.functions";
import { readCity, writeCity } from "@/lib/prefs";
import { Mark, Shell } from "@/components/shell";
import { ActionButton } from "@/components/actions";
import { ChipRail } from "@/components/chips";
import { GuideCollection } from "@/components/cards";
import { SearchCombobox, type ComboOption } from "@/components/combobox";
import { SwipeTabs } from "@/components/tabs";
import { ProduceMarquee, WeatherGlyph } from "@/components/decor";
import { announce } from "@/lib/announcer";
import { usePrefs } from "@/lib/use-prefs";

export const Route = createFileRoute("/")({ component: Home });

const PLACE_TABS: { id: HomePlace | "todas"; label: string }[] = [
  { id: "todas", label: "Todo" },
  { id: "refrigerador", label: "Dentro del frío" },
  { id: "fuera", label: "Fuera del frío" },
  { id: "madura-fuera", label: "Madura fuera" },
];

/** Primeras fichas de la guía: las que abren el paseo. */
const DESTACADAS = GUIDES.slice(0, 8);

/** Todos los consejos de "Para que dure", con la ficha de donde salen. */
const CONSEJOS = GUIDES.flatMap((item) => item.longer.map((text) => ({ text, item })));

function Home() {
  const navigate = useNavigate();
  const prefs = usePrefs();
  const [place, setPlace] = useState<HomePlace | "todas">("todas");
  const [group, setGroup] = useState<GroupId | "todas">("todas");
  const [q, setQ] = useState("");
  const [clima, setClima] = useState<Clima | null>(null);
  const [climaListo, setClimaListo] = useState(false);
  const [locError, setLocError] = useState("");

  useEffect(() => {
    let cancel = false;
    climaDe({ data: readCity() })
      .then((next) => {
        if (!cancel) setClima(next);
      })
      .catch(() => {
        if (!cancel) setClima(null);
      })
      .finally(() => {
        if (!cancel) setClimaListo(true);
      });
    return () => {
      cancel = true;
    };
  }, []);

  async function usarMiUbicacion() {
    setLocError("");
    try {
      const next = await miCiudad();
      writeCity(next.city);
      const climaNext = await climaDe({ data: next.city });
      setClima(climaNext);
      announce(`Clima de ${climaNext.city}: ${Math.round(climaNext.temp)} grados.`);
    } catch {
      setLocError("No pude detectar la ciudad. Escríbela en Ajustes.");
      throw new Error("sin ubicación");
    }
  }

  const items = useMemo(
    () =>
      GUIDES.filter((item) => (group === "todas" ? true : item.group === group)).filter((item) =>
        place === "todas" ? true : item.home === place,
      ),
    [group, place],
  );

  const searchOptions: ComboOption[] = useMemo(
    () =>
      GUIDES.map((item) => ({
        id: item.slug,
        label: item.name,
        hint: item.aka.length > 0 ? item.aka[0] : undefined,
        group: GROUPS.find((entry) => entry.id === item.group)?.label,
      })),
    [],
  );

  // El consejo de hoy se elige después de montar: el HTML del servidor y el
  // del cliente tienen que coincidir.
  const [tipIndex, setTipIndex] = useState(0);
  useEffect(() => {
    setTipIndex(new Date().getDate() % Math.max(CONSEJOS.length, 1));
  }, []);

  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    announce(
      `${items.length} ${items.length === 1 ? "ficha" : "fichas"}${
        place === "todas" && group === "todas" ? " en la guía" : " con ese filtro"
      }.`,
    );
  }, [items.length, place, group]);

  const consejo = CONSEJOS[tipIndex % CONSEJOS.length];

  const groupChips = [
    { id: "todas" as const, label: "Todo" },
    ...GROUPS.map((entry) => ({
      id: entry.id,
      label: entry.label,
      icon: <Sprout className="size-3.5" aria-hidden="true" />,
    })),
  ];

  return (
    <Shell>
      <header className="rise relative px-5 pt-8">
        <Mark />
        <div className="mt-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.18em] text-stone uppercase">Mercado en casa</p>
            <h1 className="font-display mt-2 flex items-baseline gap-2 text-5xl leading-none sm:text-6xl">
              Guía Fresca
              <span
                className="pulse-soft inline-block size-3 rounded-full bg-citrus align-super"
                aria-hidden="true"
              />
            </h1>
          </div>
          <span
            className="tilt-right float-slow grid shrink-0 place-items-center rounded-full border border-line bg-card px-3 py-2 text-center shadow-card sm:px-4 sm:py-3"
            aria-hidden="true"
          >
            <span className="font-display text-xl leading-none text-leaf sm:text-2xl">
              {GUIDES.length}
            </span>
            <span className="text-[0.6rem] tracking-[0.14em] text-stone uppercase sm:text-[0.65rem]">
              fichas
            </span>
          </span>
        </div>

        <p className="mt-3 max-w-md text-base leading-relaxed text-stone">
          Qué va dentro del refrigerador, qué se queda fuera, cuántos días dura y cómo se ve cuando
          ya se puede comer.
        </p>

        <ul className="mt-4 flex flex-wrap gap-2">
          <li className="sticker sticker--leaf">
            <Sprout className="size-3.5" aria-hidden="true" />
            Fuentes USDA y FDA
          </li>
          <li className="sticker">Sin cuenta ni registro</li>
          <li className="sticker sticker--citrus">
            <Sparkles className="size-3.5" aria-hidden="true" />
            {GUIDES.length} fichas con foto
          </li>
        </ul>

        <div className="rise rise-2 mt-6">
          <ProduceMarquee labels={GUIDES.slice(0, 16).map((item) => item.name)} />
        </div>
      </header>

      <section className="rise rise-2 px-5 pt-6" aria-label="Buscar en la guía">
        <SearchCombobox
          label="Buscar en la guía"
          inputId="buscar-guia"
          placeholder="Plátano, leche, cilantro…"
          hint="Escribe y elige con las flechas. Enter abre la ficha."
          value={q}
          onValueChange={setQ}
          options={searchOptions}
          onSelect={(option) => {
            announce(`Abriendo ${option.label}`);
            navigate({ to: "/guia/$slug", params: { slug: option.id } });
          }}
          onSubmit={(query) => navigate({ to: "/buscar", search: { q: query.trim() } })}
          footer={(query, close) => (
            <button
              type="button"
              className="tap press flex min-h-11 w-full items-center justify-between gap-2 rounded-full px-4 text-sm text-leaf-deep"
              onClick={() => {
                close();
                navigate({ to: "/buscar", search: { q: query.trim() } });
              }}
            >
              {query.trim().length >= 2
                ? `Ver todos los resultados de «${query.trim()}»`
                : "Ver la guía completa"}
              <span aria-hidden="true">→</span>
            </button>
          )}
        />
      </section>

      <section className="rise rise-3 px-5 pt-5" aria-label="Clima de la ciudad">
        <div className="card relative overflow-hidden px-4 py-4">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-10 -right-6 size-32 rounded-full bg-sun-soft opacity-70 blur-2xl"
          />
          {clima ? (
            <div className="relative flex items-center gap-4">
              <WeatherGlyph
                hot={clima.hot}
                veryHot={clima.veryHot}
                className={`size-14 shrink-0 ${clima.veryHot ? "text-berry" : "text-sun"}`}
              />
              <div className="min-w-0 flex-1">
                <p className="text-xs tracking-[0.14em] text-stone uppercase">Ahora mismo</p>
                <p className="font-display text-3xl leading-tight">
                  {clima.temp.toLocaleString("es-MX")} °C
                  <span className="ml-2 text-base text-stone">{clima.city}</span>
                </p>
                <p className="mt-1 text-sm leading-relaxed text-stone">
                  {clima.veryHot
                    ? "Hace mucho calor: lácteos y fruta partida, fuera, se tiran a la hora."
                    : clima.hot
                      ? "Hace calor: conviene acortar lo que se queda fuera."
                      : "No hace falta acortar los tiempos de fuera."}
                </p>
              </div>
            </div>
          ) : (
            <div className="relative flex items-center gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-paper-deep text-stone">
                <MapPin className="size-6" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs tracking-[0.14em] text-stone uppercase">Clima local</p>
                <p className="text-sm leading-relaxed text-stone">
                  {climaListo
                    ? "No pude consultar la temperatura. La guía funciona igual."
                    : "Consultando la temperatura de tu ciudad…"}
                </p>
              </div>
              {!climaListo ? <span className="skeleton size-14 rounded-full" /> : null}
            </div>
          )}

          <div className="relative mt-4 flex flex-wrap items-center gap-3">
            <ActionButton
              onAction={usarMiUbicacion}
              icon={MapPin}
              variant="outline"
              loadingLabel="Detectando…"
              successLabel="Ciudad lista"
              errorLabel="No se pudo"
            >
              Usar mi ubicación
            </ActionButton>
            {clima?.hot && !prefs.heat ? (
              <ActionButton variant="solid" icon={Sun} onClick={() => prefs.setHeat(true)}>
                Activar aviso de calor
              </ActionButton>
            ) : null}
          </div>
          {locError ? (
            <p className="relative mt-2 text-sm text-citrus" role="status">
              {locError}
            </p>
          ) : null}
        </div>
      </section>

      {prefs.heat ? (
        <p className="rise mx-5 mt-4 rounded-card border border-citrus/40 bg-citrus-soft px-4 py-3 text-sm leading-relaxed text-ink">
          Hace calor: lo que dice “fuera” se acorta, y cualquier lácteo o fruta partida se tira a la
          hora, no a las dos.
        </p>
      ) : null}

      <section className="pt-8" aria-labelledby="destacadas">
        <div className="flex items-end justify-between gap-4 px-5">
          <h2 id="destacadas" className="font-display text-3xl">
            Para empezar
          </h2>
          <p className="text-xs tracking-[0.14em] text-stone uppercase">Con 3 fotos</p>
        </div>
        <p className="px-5 pt-2 text-sm leading-relaxed text-stone">
          Fichas completas: cómo se ven antes, listas y pasadas.
        </p>
        <div className="pt-4">
          <GuideCollection
            items={DESTACADAS}
            showEthylene={prefs.ethylene}
            label="Fichas destacadas"
          />
        </div>
      </section>

      <section className="pt-10" aria-labelledby="toda-la-guia">
        <div className="px-5">
          <h2 id="toda-la-guia" className="font-display text-3xl">
            Toda la guía
          </h2>
          <p className="pt-2 text-sm leading-relaxed text-stone">
            Filtra por tipo y por dónde se guarda. El carril se desliza; nada se activa sin querer.
          </p>
        </div>

        <div className="pt-4">
          <ChipRail
            className="px-5"
            label="Tipo de producto"
            options={groupChips}
            value={group}
            onChange={setGroup}
          />
        </div>

        <SwipeTabs
          className="pt-4"
          idBase="donde"
          label="Dónde se guarda"
          items={PLACE_TABS}
          value={place}
          onChange={(id) => setPlace(id as HomePlace | "todas")}
          renderPanel={() => (
            <div>
              <p className="flex items-center gap-2 px-5 pt-4 text-sm text-stone">
                <span className="sticker sticker--leaf">
                  {items.length} {items.length === 1 ? "ficha" : "fichas"}
                </span>
                {group !== "todas"
                  ? `de ${GROUPS.find((entry) => entry.id === group)?.label.toLocaleLowerCase("es")}`
                  : "en total"}
              </p>
              {items.length === 0 ? (
                <p className="px-5 pt-4 text-sm leading-relaxed text-stone">
                  No hay fichas con esos dos filtros. Prueba otra combinación.
                </p>
              ) : (
                <div className="pt-4">
                  <GuideCollection
                    items={items}
                    showEthylene={prefs.ethylene}
                    label="Fichas filtradas"
                  />
                </div>
              )}
            </div>
          )}
        />
      </section>

      <section className="px-5 pt-10" aria-label="Consejo del día">
        <div className="card relative overflow-hidden px-4 py-4">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-8 -left-6 size-28 rounded-full bg-leaf-soft opacity-70 blur-2xl"
          />
          <div className="relative flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-leaf-soft text-leaf-deep">
              <Sprout className="size-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs tracking-[0.14em] text-stone uppercase">Consejo del día</p>
              <p className="mt-1 text-sm leading-relaxed text-ink">{consejo.text}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <Link
                  to="/guia/$slug"
                  params={{ slug: consejo.item.slug }}
                  className="tap inline-flex min-h-11 items-center gap-1 text-sm text-leaf"
                >
                  Ver {consejo.item.name}
                  <span aria-hidden="true">→</span>
                </Link>
                <button
                  type="button"
                  className="tap press inline-flex min-h-11 items-center rounded-full border border-line bg-paper px-4 text-sm"
                  onClick={() => {
                    setTipIndex((current) => (current + 7) % CONSEJOS.length);
                    announce("Otro consejo.");
                  }}
                >
                  Otro consejo
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-5 pt-10 pb-4" aria-label="Cómo se calculan los días">
        <div className="card flex gap-3 px-4 py-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-leaf-soft text-leaf-deep">
            <Sprout className="size-5" aria-hidden="true" />
          </span>
          <p className="text-sm leading-relaxed text-stone">
            Los días salen de USDA FoodKeeper, la tabla de Virginia Tech y la zona de peligro de
            FDA. Cada ficha muestra su fuente en “Cómo se comprobó”. No es consejo médico: ante
            moho, olor raro o tiempo de más, se tira.
          </p>
        </div>
      </section>
    </Shell>
  );
}
