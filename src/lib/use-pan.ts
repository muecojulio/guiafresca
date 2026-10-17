import { useCallback, useEffect, useRef, useState } from "react";
import { GESTURE, decidePan, type Axis, type GestureTuning, type Point } from "@/lib/interaction";

/**
 * Arrastre con bloqueo de eje sobre Pointer Events.
 *
 * Reglas que se sostienen solas:
 * - No arranca sobre botones, enlaces, campos, selectores ni controles
 *   anidados (ni sobre lo que marque `data-swipe-ignore`).
 * - Antes de fijar el eje no toca nada: el desplazamiento vertical de la
 *   página sigue siendo del navegador.
 * - Al soltar después de un arrastre horizontal, el clic siguiente se anula
 *   para que soltar no abra la ficha ni active un control por accidente.
 */
export type PanInfo = {
  dx: number;
  dy: number;
  axis: Axis;
  /** px por ms del último tramo del gesto. */
  velocity: number;
};

export type PanHandlers = {
  onPointerDown: (event: React.PointerEvent) => void;
  onPointerMove: (event: React.PointerEvent) => void;
  onPointerUp: (event: React.PointerEvent) => void;
  onPointerCancel: (event: React.PointerEvent) => void;
  /** En fase de captura: anula el clic que sigue a un arrastre. */
  onClickCapture: (event: React.MouseEvent) => void;
  /** Sin imágenes ni enlaces arrastrables mientras hay un gesto en curso. */
  onDragStart: (event: React.DragEvent) => void;
};

const IGNORE_SELECTOR = [
  "a",
  "button",
  "input",
  "textarea",
  "select",
  "label",
  "summary",
  "video",
  "audio",
  "[role='tab']",
  "[role='option']",
  "[role='switch']",
  "[role='slider']",
  "[role='radio']",
  "[contenteditable='true']",
  "[data-swipe-ignore]",
  ".leaflet-container",
].join(",");

export function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;
  return target.closest(IGNORE_SELECTOR) !== null;
}

type Options = {
  onStart?: (info: PanInfo) => void;
  onMove?: (info: PanInfo) => void;
  onEnd?: (info: PanInfo) => void;
  /** Desactiva el gesto (por ejemplo, en escritorio donde ya hay botones). */
  disabled?: boolean;
  tuning?: Partial<GestureTuning>;
};

type ActivePan = {
  id: number;
  start: Point;
  axis: Axis;
  last: Point;
  moved: boolean;
};

export function usePan({ onStart, onMove, onEnd, disabled = false, tuning }: Options) {
  const activeRef = useRef<ActivePan | null>(null);
  const velocityRef = useRef(0);
  const suppressRef = useRef(false);
  const [dragging, setDragging] = useState(false);

  const merged = tuning ? { ...GESTURE, ...tuning } : GESTURE;
  const handlersRef = useRef({ onStart, onMove, onEnd, merged });
  handlersRef.current = { onStart, onMove, onEnd, merged };

  const end = useCallback((canceled: boolean) => {
    const state = activeRef.current;
    activeRef.current = null;
    if (!state) return;
    setDragging(false);
    if (state.axis !== "horizontal") return;
    if (!canceled) {
      suppressRef.current = true;
      window.setTimeout(() => {
        suppressRef.current = false;
      }, 400);
    }
    handlersRef.current.onEnd?.({
      dx: state.last.x - state.start.x,
      dy: state.last.y - state.start.y,
      axis: "horizontal",
      velocity: canceled ? 0 : velocityRef.current,
    });
  }, []);

  useEffect(() => {
    if (disabled) return;
    const onUp = () => end(false);
    const onCancel = () => end(true);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    return () => {
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
    };
  }, [disabled, end]);

  const onPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (disabled) return;
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (isInteractiveTarget(event.target)) return;
      const point: Point = { x: event.clientX, y: event.clientY, t: event.timeStamp };
      activeRef.current = {
        id: event.pointerId,
        start: point,
        axis: "none",
        last: point,
        moved: false,
      };
      velocityRef.current = 0;
    },
    [disabled],
  );

  const onPointerMove = useCallback((event: React.PointerEvent) => {
    const state = activeRef.current;
    if (!state || state.id !== event.pointerId) return;
    const current: Point = { x: event.clientX, y: event.clientY, t: event.timeStamp };
    const decision = decidePan(state.start, current, handlersRef.current.merged);
    if (decision.axis === "none") return;

    if (state.axis === "none") {
      state.axis = decision.axis;
      // El punto de referencia pasa a ser donde se fijó el eje: el
      // desplazamiento empieza limpio y el gesto se siente inmediato.
      state.start = current;
      state.last = current;
      if (decision.axis === "horizontal") {
        setDragging(true);
        handlersRef.current.onStart?.({ dx: 0, dy: 0, axis: "horizontal", velocity: 0 });
      }
      return;
    }
    if (state.axis !== "horizontal") return;

    state.moved = true;
    state.last = current;
    velocityRef.current = velocityRef.current * 0.6 + decision.velocity * 0.4;
    handlersRef.current.onMove?.({
      dx: current.x - state.start.x,
      dy: current.y - state.start.y,
      axis: "horizontal",
      velocity: velocityRef.current,
    });
  }, []);

  const onClickCapture = useCallback((event: React.MouseEvent) => {
    if (!suppressRef.current) return;
    suppressRef.current = false;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const onDragStart = useCallback((event: React.DragEvent) => {
    if (activeRef.current) event.preventDefault();
  }, []);

  return {
    dragging,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: () => end(false),
      onPointerCancel: () => end(true),
      onClickCapture,
      onDragStart,
    } satisfies PanHandlers,
  };
}
