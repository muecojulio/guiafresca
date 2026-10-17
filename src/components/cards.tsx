import { Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Milk, Snowflake, Sun, ThermometerSun } from "lucide-react";
import { GROUPS, PLACE_LABEL, type Guide, type GroupId, type HomePlace } from "@/lib/catalog";
import { useEffect, useState, type ReactNode } from "react";
import { parseDurationDays, staggerDelay } from "@/lib/interaction";
import { useOverflowRail } from "@/lib/use-overflow-rail";
import { useWideScreen } from "@/lib/use-media-query";
import { EmptyPlate } from "@/components/decor";

const GROUP_LABEL = Object.fromEntries(GROUPS.map((group) => [group.id, group.label])) as Record<
  GroupId,
  string
>;

const HOME_ICON: Record<HomePlace, typeof Snowflake> = {
  refrigerador: Snowflake,
  fuera: Sun,
  "madura-fuera": ThermometerSun,
};

const HOME_TONE: Record<HomePlace, string> = {
  refrigerador: "sticker--leaf",
  fuera: "sticker--citrus",
  "madura-fuera": "sticker--citrus",
};

/**
 * Tarjeta de ficha. La entrada es escalonada, el mouse levanta la tarjeta y
 * la foto lleva un velo para que el nombre se lea sobre cualquier imagen.
 * Cuando vive dentro de un carrusel, la tarjeta en pantalla se marca con
 * borde y una etiqueta, no solo con color.
 */
export function GuideCard({
  item,
  showEthylene,
  index = 0,
  active = false,
}: {
  item: Guide;
  showEthylene: boolean;
  index?: number;
  active?: boolean;
}) {
  const HomeIcon = HOME_ICON[item.home];
  const dayCount = parseDurationDays(item.fridge);

  return (
    <Link
      to="/guia/$slug"
      params={{ slug: item.slug }}
      data-active={active ? "true" : "false"}
      style={{ animationDelay: `${staggerDelay(index)}ms` }}
      className={`card lift rise sheen group relative block overflow-hidden ${
        active ? "card--chosen" : ""
      }`}
    >
      <span className="relative block overflow-hidden">
        {item.photo ? (
          <img
            src={item.photo}
            alt=""
            loading={index < 3 ? "eager" : "lazy"}
            className="aspect-[4/3] w-full object-cover transition-transform duration-[600ms] ease-out group-hover:scale-[1.04]"
          />
        ) : (
          <span className="flex aspect-[4/3] items-end bg-paper-deep p-4">
            <span className="font-display text-3xl text-leaf">{item.name.slice(0, 1)}</span>
          </span>
        )}
        <span className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink/70 to-transparent" />
        <span className="absolute top-3 left-3 rounded-full bg-card/90 px-3 py-1 text-[0.7rem] tracking-wide text-ink uppercase backdrop-blur">
          {GROUP_LABEL[item.group]}
        </span>
        {active ? (
          <span className="sticker sticker--leaf absolute top-3 right-3">En pantalla</span>
        ) : null}
        <span className={`absolute bottom-3 left-3 ${HOME_TONE[item.home]} sticker`}>
          <HomeIcon className="size-3.5" aria-hidden="true" />
          {PLACE_LABEL[item.home].split(",")[0]}
        </span>
        {dayCount !== null ? (
          <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-full bg-card/90 px-3 py-1 text-xs text-ink backdrop-blur">
            <Clock className="size-3.5 text-leaf" aria-hidden="true" />
            {dayCount === 1 ? "1 día" : `${Math.round(dayCount)} días`}
            <span className="sr-only">en refrigerador</span>
          </span>
        ) : null}
      </span>

      <span className="block space-y-2 p-4">
        <span className="flex items-start justify-between gap-3">
          <span className="font-display text-2xl leading-none">{item.name}</span>
          <ArrowRight
            className="mt-1 size-4 shrink-0 text-stone transition-transform duration-300 group-hover:translate-x-1"
            aria-hidden="true"
          />
        </span>
        <span className="block text-sm leading-relaxed text-stone">{item.summary}</span>
        {showEthylene && item.ethylene !== "neutro" ? (
          <span
            className={`inline-flex items-center gap-1.5 text-xs ${
              item.ethylene === "emite" ? "text-citrus" : "text-leaf"
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                item.ethylene === "emite" ? "bg-citrus" : "bg-leaf"
              }`}
              aria-hidden="true"
            />
            {item.ethylene === "emite" ? "Suelta etileno" : "Sensible al etileno"}
          </span>
        ) : null}
      </span>
    </Link>
  );
}

/**
 * Carrusel en móvil y cuadrícula en pantallas grandes. Muestra parte de la
 * siguiente tarjeta, se detiene con imán suave, informa si hay contenido
 * fuera de vista y deja centrar la tarjeta elegida.
 */
export function CardRail({
  label,
  count,
  children,
  hint = "Desliza para ver el resto",
  className = "",
  onActiveChange,
}: {
  label: string;
  count: number;
  children: ReactNode;
  hint?: string;
  className?: string;
  /** Avisa qué tarjeta está en pantalla, para marcarla sin depender del color. */
  onActiveChange?: (index: number) => void;
}) {
  const rail = useOverflowRail<HTMLDivElement>(count);
  const { activeIndex } = rail;

  useEffect(() => {
    onActiveChange?.(activeIndex);
  }, [activeIndex, onActiveChange]);

  return (
    <div
      className={`rail-frame ${className}`}
      data-overflow-start={!rail.atStart}
      data-overflow-end={!rail.atEnd}
    >
      <div
        ref={rail.ref}
        role="group"
        aria-label={label}
        tabIndex={0}
        className="rail rail--to-grid -mx-5 px-5"
        onKeyDown={(event) => {
          if (event.key === "ArrowRight") {
            event.preventDefault();
            rail.nudge(1);
          }
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            rail.nudge(-1);
          }
        }}
      >
        {children}
      </div>

      {count > 1 ? (
        <div className="mt-3 flex items-center justify-between gap-3 sm:hidden">
          <p className="rail-hint text-xs text-stone">{rail.hasOverflow ? hint : ""}</p>
          <span className="rail-dots" aria-hidden="true">
            {Array.from({ length: count }).map((_, dotIndex) => (
              <span key={dotIndex} className="rail-dot" data-on={dotIndex === rail.activeIndex} />
            ))}
          </span>
        </div>
      ) : null}
      {count > 1 ? (
        <div className="mt-3 hidden gap-2 sm:flex">
          <button
            type="button"
            onClick={() => rail.nudge(-1)}
            disabled={!rail.hasOverflow || rail.atStart}
            className="tap press min-h-11 rounded-full border border-line bg-card px-4 text-sm disabled:opacity-45"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={() => rail.nudge(1)}
            disabled={!rail.hasOverflow || rail.atEnd}
            className="tap press min-h-11 rounded-full border border-line bg-card px-4 text-sm disabled:opacity-45"
          >
            Siguiente
          </button>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Termómetro de conservación: barras comparables entre "fuera",
 * "refrigerador" y "congelador". La cifra visible manda; la barra solo
 * acompaña.
 */
export function FreshnessMeter({
  rows,
}: {
  rows: { key: string; label: string; text: string; accentVar: string }[];
}) {
  const parsed = rows.map((row) => ({ ...row, days: parseDurationDays(row.text) }));
  const max = Math.max(...parsed.map((row) => row.days ?? 0), 1);

  return (
    <dl className="grid gap-3">
      {parsed.map((row, index) => {
        const ratio = row.days === null ? 0.06 : Math.max(row.days / max, 0.06);
        return (
          <div key={row.key} className="card px-4 py-3">
            <dt className="flex items-baseline justify-between gap-3">
              <span className="text-xs tracking-[0.14em] text-stone uppercase">{row.label}</span>
              {row.days !== null ? (
                <span className="text-sm text-ink">
                  {row.days < 1
                    ? "menos de 1 día"
                    : row.days === 1
                      ? "1 día"
                      : `${Math.round(row.days)} días`}
                </span>
              ) : null}
            </dt>
            <dd className="mt-2 space-y-2">
              <span className="bar block" aria-hidden="true">
                <span
                  className="bar__fill block"
                  style={{
                    width: `${Math.round(ratio * 100)}%`,
                    background: row.accentVar,
                    animationDelay: `${index * 90}ms`,
                  }}
                />
              </span>
              <span className="block text-sm leading-relaxed text-ink">{row.text}</span>
            </dd>
          </div>
        );
      })}
    </dl>
  );
}

/**
 * Colección de fichas: carrusel con parte de la siguiente tarjeta cuando de
 * verdad ayuda a comparar (pocas fichas y pantalla angosta) y cuadrícula en
 * el resto de los casos. Nunca genera desplazamiento horizontal de página.
 */
export function GuideCollection({
  items,
  showEthylene,
  label,
  maxForCarousel = 12,
}: {
  items: Guide[];
  showEthylene: boolean;
  label: string;
  maxForCarousel?: number;
}) {
  const wide = useWideScreen();
  const carousel = !wide && items.length > 1 && items.length <= maxForCarousel;
  const [onScreen, setOnScreen] = useState(0);

  if (carousel) {
    return (
      <CardRail label={label} count={items.length} className="px-5" onActiveChange={setOnScreen}>
        {items.map((item, index) => (
          <div key={item.slug} className="w-[78%] max-w-[19rem] shrink-0 sm:w-auto sm:max-w-none">
            <GuideCard
              item={item}
              showEthylene={showEthylene}
              index={index}
              active={index === onScreen}
            />
          </div>
        ))}
      </CardRail>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 px-5 pt-4 sm:gap-4 lg:grid-cols-3">
      {items.map((item, index) => (
        <li key={item.slug}>
          <GuideCard item={item} showEthylene={showEthylene} index={index} />
        </li>
      ))}
    </ul>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-4 px-5 py-8 text-center">
      <EmptyPlate className="size-40 text-leaf" />
      <h2 className="font-display text-2xl">{title}</h2>
      {children ? <p className="max-w-sm text-sm leading-relaxed text-stone">{children}</p> : null}
      {action}
    </div>
  );
}

/** Fila de resultado de tienda: foto, marca, estado y qué hacer con ella. */
export function ProductRow({
  name,
  brand,
  image,
  badge,
  children,
}: {
  name: string;
  brand: string;
  image: string | null;
  badge?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <li className="card lift flex gap-3 p-3">
      {image ? (
        <img
          src={image}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="size-20 shrink-0 rounded-xl object-cover"
        />
      ) : (
        <span className="grid size-20 shrink-0 place-items-center rounded-xl bg-paper-deep text-stone">
          <Milk className="size-6" aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-base">{name}</p>
          {badge}
        </div>
        <p className="truncate text-sm text-stone">{brand || "Sin marca"}</p>
        {children}
      </div>
    </li>
  );
}
