import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { nextRovingIndex } from "@/lib/interaction";
import { useOverflowRail } from "@/lib/use-overflow-rail";
import { usePan } from "@/lib/use-pan";
import { useReducedMotion } from "@/lib/use-media-query";
import { announce } from "@/lib/announcer";

export type TabItem = {
  id: string;
  label: string;
};

/** Gesto mínimo (px) para cambiar de panel; el gesto rápido decide antes. */
const SWIPE_COMMIT_PX = 52;

type SwipeTabsProps = {
  items: TabItem[];
  value: string;
  onChange: (id: string) => void;
  /** Nombre del conjunto, por ejemplo "Dónde se guarda". */
  label: string;
  /** Identificador base para `id` / `aria-controls`. */
  idBase: string;
  renderPanel: (id: string) => ReactNode;
  className?: string;
};

/**
 * Pestañas de verdad: semántica `tablist` / `tab` / `tabpanel`, teclado
 * completo (flechas, Inicio, Fin), indicador que se desliza hacia la opción
 * activa, carril desplazable con señales de desborde y cambio de panel por
 * gesto horizontal en táctil.
 *
 * El gesto nunca arranca sobre un control (lo decide `usePan`) y no se lleva
 * por delante el desplazamiento vertical: el panel declara `touch-action:
 * pan-y`, así que lo vertical sigue siendo del navegador.
 */
export function SwipeTabs({
  items,
  value,
  onChange,
  label,
  idBase,
  renderPanel,
  className = "",
}: SwipeTabsProps) {
  const rail = useOverflowRail<HTMLDivElement>(items.length);
  const { scrollToIndex } = rail;
  const reduced = useReducedMotion();
  const fallbackId = useId();
  const base = `${idBase}${fallbackId.replace(/[:]/g, "")}`;
  const index = Math.max(
    items.findIndex((item) => item.id === value),
    0,
  );
  const prevIndexRef = useRef(index);
  const [direction, setDirection] = useState<"forward" | "back">("forward");
  const [pill, setPill] = useState({ left: 0, width: 0, ready: false });
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const panelRef = useRef<HTMLDivElement | null>(null);

  const measurePill = useCallback(() => {
    const node = buttonsRef.current[index];
    if (!node) return;
    setPill((prev) =>
      prev.left === node.offsetLeft && prev.width === node.offsetWidth && prev.ready
        ? prev
        : { left: node.offsetLeft, width: node.offsetWidth, ready: true },
    );
  }, [index]);

  useEffect(() => {
    measurePill();
    if (typeof ResizeObserver === "undefined") return;
    const node = buttonsRef.current[index];
    const observer = new ResizeObserver(() => measurePill());
    if (node) observer.observe(node);
    return () => observer.disconnect();
  }, [index, measurePill]);

  useEffect(() => {
    if (prevIndexRef.current === index) return;
    setDirection(index > prevIndexRef.current ? "forward" : "back");
    prevIndexRef.current = index;
    const item = items[index];
    if (item) announce(`${label}: ${item.label}`);
  }, [index, items, label]);

  // Solo al cambiar de pestaña: el carril no debe moverse cuando el visitante
  // lo desplaza a mano, por eso la dependencia es únicamente el índice.
  useEffect(() => {
    scrollToIndex(index, { center: true });
  }, [index, scrollToIndex]);

  const setPanelX = useCallback((offset: number | null) => {
    const node = panelRef.current;
    if (!node) return;
    if (offset === null) {
      node.style.transition = "";
      node.style.transform = "";
      return;
    }
    node.style.transition = "none";
    node.style.transform = `translateX(${offset}px)`;
  }, []);

  const select = useCallback(
    (nextIndex: number) => {
      const item = items[nextIndex];
      if (!item || nextIndex === index) return;
      onChange(item.id);
    },
    [index, items, onChange],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const next = nextRovingIndex(event.key, index, items.length, "horizontal");
    if (next === null || next === index) return;
    event.preventDefault();
    select(next);
    window.requestAnimationFrame(() => buttonsRef.current[next]?.focus());
  };

  const pan = usePan({
    disabled: reduced,
    onMove: ({ dx }) => {
      const atEdge = (index === 0 && dx > 0) || (index === items.length - 1 && dx < 0);
      setPanelX(atEdge ? dx * 0.28 : dx);
    },
    onEnd: ({ dx, velocity }) => {
      setPanelX(null);
      const fast = Math.abs(velocity) >= 0.5;
      const travelled = Math.abs(dx) >= SWIPE_COMMIT_PX;
      if (!fast && !travelled) return;
      if (dx < 0) select(Math.min(index + 1, items.length - 1));
      else select(Math.max(index - 1, 0));
    },
  });

  const activeItem = items[index];

  return (
    <div className={className}>
      <div
        className="rail-frame"
        data-overflow-start={!rail.atStart}
        data-overflow-end={!rail.atEnd}
      >
        <div
          ref={rail.ref}
          role="tablist"
          aria-label={label}
          aria-orientation="horizontal"
          onKeyDown={onKeyDown}
          className="rail -mx-5 px-5"
        >
          {pill.ready ? (
            <span
              aria-hidden="true"
              className="glider rounded-full bg-ink"
              style={{ width: pill.width, transform: `translateX(${pill.left}px)` }}
            />
          ) : null}
          {items.map((item, itemIndex) => {
            const active = itemIndex === index;
            return (
              <button
                key={item.id}
                ref={(node) => {
                  buttonsRef.current[itemIndex] = node;
                }}
                id={`${base}-tab-${item.id}`}
                role="tab"
                data-rail-item=""
                type="button"
                aria-selected={active}
                aria-controls={active ? `${base}-panel` : undefined}
                tabIndex={active ? 0 : -1}
                onClick={() => select(itemIndex)}
                className={`tap press relative z-[1] min-h-11 shrink-0 rounded-full px-4 text-sm whitespace-nowrap ${
                  active ? "font-medium text-paper" : "border border-line bg-card text-ink"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <p className="rail-hint mt-3 flex items-center gap-2 text-xs text-stone sm:hidden">
        <span aria-hidden="true">↔</span>
        {rail.hasOverflow
          ? "Desliza el carril o el contenido para cambiar de sección."
          : "Desliza el contenido o usa las flechas del teclado."}
      </p>

      <div
        id={`${base}-panel`}
        role="tabpanel"
        aria-labelledby={`${base}-tab-${activeItem?.id ?? ""}`}
        tabIndex={0}
        className="touch-pan-y"
        onPointerDown={pan.handlers.onPointerDown}
        onPointerMove={pan.handlers.onPointerMove}
        onPointerUp={pan.handlers.onPointerUp}
        onPointerCancel={pan.handlers.onPointerCancel}
        onClickCapture={pan.handlers.onClickCapture}
        onDragStart={pan.handlers.onDragStart}
      >
        <div ref={panelRef}>
          <div
            key={activeItem?.id}
            className={`panel-enter ${direction === "back" ? "panel-enter--back" : ""}`}
          >
            {renderPanel(value)}
          </div>
        </div>
      </div>
    </div>
  );
}
