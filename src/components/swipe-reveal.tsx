import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { Ellipsis, Trash2 } from "lucide-react";
import { clampReveal, settleReveal } from "@/lib/interaction";
import { usePan } from "@/lib/use-pan";
import { useFinePointer } from "@/lib/use-media-query";

export type RevealAction = {
  id: string;
  label: string;
  icon?: typeof Trash2;
  onRun: () => void;
  tone?: "danger" | "neutral";
};

/**
 * Tarjeta que se desliza para revelar acciones.
 *
 * - El arrastre solo empieza si el gesto es claramente horizontal
 *   (`touch-action: pan-y`, así lo vertical sigue siendo de la página).
 * - Nunca arranca sobre un botón, enlace o campo anidado.
 * - Las acciones siempre tienen alternativa explícita: el botón "⋯" visible
 *   en táctil y las acciones a la vista en escritorio, donde el swipe no
 *   hace falta.
 * - Mientras están ocultas quedan fuera del orden de foco y de la lectura
 *   (`inert` + `aria-hidden`).
 */
export function SwipeReveal({
  children,
  actions,
  label,
  className = "",
}: {
  children: ReactNode;
  actions: RevealAction[];
  /** Nombre del elemento, para etiquetas accesibles. */
  label: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const [panelWidth, setPanelWidth] = useState(0);
  const baseRef = useRef(0);
  const actionsRef = useRef<HTMLDivElement | null>(null);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const desktop = useFinePointer();
  const uid = useId().replace(/[:]/g, "");
  const actionsId = `acciones-${uid}`;

  useEffect(() => {
    const node = actionsRef.current;
    if (!node) return;
    const measure = () => setPanelWidth(node.offsetWidth);
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [actions.length, desktop]);

  useEffect(() => {
    setRevealed(open ? panelWidth : 0);
  }, [open, panelWidth]);

  useEffect(() => {
    if (desktop) setOpen(false);
  }, [desktop]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node | null;
      if (
        target &&
        (actionsRef.current?.contains(target) || surfaceRef.current?.contains(target))
      ) {
        return;
      }
      close();
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, close]);

  const pan = usePan({
    disabled: desktop,
    onStart: () => {
      baseRef.current = open ? panelWidth : 0;
    },
    onMove: ({ dx }) => {
      const limit = Math.max(panelWidth, 1);
      baseRef.current = Math.min(Math.max(baseRef.current, 0), limit);
      setRevealed(clampReveal(baseRef.current - dx, panelWidth));
    },
    onEnd: ({ dx, velocity }) => {
      const settled = settleReveal({ base: baseRef.current, dx, width: panelWidth, velocity });
      setOpen(settled.open);
      // Siempre vuelve a un extremo: nunca se queda a medio abrir.
      setRevealed(settled.offset);
    },
  });

  return (
    <div
      className={`reveal ${className}`}
      data-open={open ? "true" : "false"}
      data-desktop={desktop ? "true" : "false"}
      style={desktop ? ({ "--reveal-width": `${panelWidth}px` } as CSSProperties) : undefined}
    >
      <div
        ref={actionsRef}
        id={actionsId}
        className="reveal__actions"
        inert={desktop ? undefined : !open}
        aria-hidden={desktop ? undefined : !open}
      >
        {actions.map((action) => {
          const Icon = action.icon ?? Trash2;
          return (
            <button
              key={action.id}
              type="button"
              onClick={() => {
                action.onRun();
                close();
              }}
              className={`tap press flex w-24 flex-col items-center justify-center gap-1 rounded-[calc(var(--radius-card)-0.25rem)] text-xs ${
                action.tone === "danger" ? "bg-berry-soft text-berry" : "bg-paper-deep text-ink"
              }`}
            >
              <Icon className="size-5" strokeWidth={1.8} aria-hidden="true" />
              {action.label}
            </button>
          );
        })}
      </div>

      <div
        ref={surfaceRef}
        data-dragging={pan.dragging ? "true" : "false"}
        data-has-toggle={desktop ? undefined : "true"}
        style={{ transform: `translateX(${-revealed}px)` }}
        className="reveal__surface touch-pan-y pl-0"
        {...pan.handlers}
      >
        {children}
        {!desktop ? (
          <button
            type="button"
            aria-label={`${open ? "Ocultar" : "Mostrar"} acciones de ${label}`}
            aria-expanded={open}
            aria-controls={actionsId}
            className="tap press absolute top-1/2 right-2 z-10 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-card text-ink"
            onClick={() => setOpen((current) => !current)}
          >
            <Ellipsis className="size-5" aria-hidden="true" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
