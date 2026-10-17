import { useCallback, useEffect, useRef, useState } from "react";
import {
  centerScrollLeft,
  nearestItemIndex,
  overflowEdges,
  type OverflowEdges,
} from "@/lib/interaction";
import { useReducedMotion } from "@/lib/use-media-query";

export type OverflowRail<T extends HTMLElement = HTMLElement> = OverflowEdges & {
  ref: (node: T | null) => void;
  /** Ítem más cercano al borde izquierdo visible. */
  activeIndex: number;
  itemCount: number;
  scrollToIndex: (index: number, options?: { center?: boolean }) => void;
  nudge: (direction: -1 | 1) => void;
  measure: () => void;
};

/**
 * Carril horizontal: scroll nativo, señales de desborde reales y "centrar la
 * opción elegida". Nunca intercepta el gesto del navegador; solo observa.
 */
/**
 * Los ítems de un carril: los marcados con `data-rail-item` y, si no hay
 * ninguno, los hijos directos. La marca existe porque dentro del carril puede
 * vivir algo que no es un ítem (el indicador deslizante de las pestañas) y
 * contarlo desplazaría el centrado una posición.
 */
function railItems(node: HTMLElement): HTMLElement[] {
  const marked = node.querySelectorAll<HTMLElement>("[data-rail-item]");
  if (marked.length > 0) return Array.from(marked);
  return Array.from(node.children) as HTMLElement[];
}

export function useOverflowRail<T extends HTMLElement = HTMLElement>(
  itemCount = 0,
): OverflowRail<T> {
  const nodeRef = useRef<T | null>(null);
  const frameRef = useRef<number | null>(null);
  const reduced = useReducedMotion();
  const [edges, setEdges] = useState<OverflowEdges>({
    hasOverflow: false,
    atStart: true,
    atEnd: true,
  });
  const [activeIndex, setActiveIndex] = useState(0);

  const measure = useCallback(() => {
    const node = nodeRef.current;
    if (!node) return;
    const next = overflowEdges({
      scrollLeft: node.scrollLeft,
      clientWidth: node.clientWidth,
      scrollWidth: node.scrollWidth,
    });
    setEdges((prev) =>
      prev.hasOverflow === next.hasOverflow &&
      prev.atStart === next.atStart &&
      prev.atEnd === next.atEnd
        ? prev
        : next,
    );
    const first = railItems(node)[0];
    const stride = first ? first.offsetWidth + gapOf(node) : 0;
    setActiveIndex(nearestItemIndex(node.scrollLeft, stride, itemCount));
  }, [itemCount]);

  const schedule = useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null;
      measure();
    });
  }, [measure]);

  const ref = useCallback(
    (node: T | null) => {
      if (nodeRef.current === node) return;
      nodeRef.current?.removeEventListener("scroll", schedule);
      nodeRef.current = node;
      node?.addEventListener("scroll", schedule, { passive: true });
      if (node) schedule();
    },
    [schedule],
  );

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => schedule());
    observer.observe(node);
    for (const child of Array.from(node.children)) observer.observe(child);
    return () => observer.disconnect();
  }, [schedule, itemCount]);

  useEffect(() => {
    schedule();
    return () => {
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    };
  }, [schedule]);

  const scrollToIndex = useCallback<OverflowRail<T>["scrollToIndex"]>(
    (index, options) => {
      const node = nodeRef.current;
      if (!node) return;
      const child = railItems(node)[index];
      if (!child) return;
      const behavior: ScrollBehavior = reduced ? "auto" : "smooth";
      if (options?.center) {
        node.scrollTo({
          left: centerScrollLeft(
            node.scrollLeft,
            node.clientWidth,
            child.offsetLeft,
            child.offsetWidth,
          ),
          behavior,
        });
        return;
      }
      child.scrollIntoView({
        behavior,
        block: "nearest",
        inline: index === 0 ? "start" : "center",
      });
    },
    [reduced],
  );

  const nudge = useCallback<OverflowRail<T>["nudge"]>(
    (direction) => {
      const node = nodeRef.current;
      if (!node) return;
      const step = Math.max(node.clientWidth * 0.8, 160);
      node.scrollBy({ left: direction * step, behavior: reduced ? "auto" : "smooth" });
    },
    [reduced],
  );

  return { ref, ...edges, activeIndex, itemCount, scrollToIndex, nudge, measure };
}

function gapOf(node: HTMLElement): number {
  const gap = getComputedStyle(node).columnGap || getComputedStyle(node).gap || "0";
  const parsed = Number.parseFloat(gap);
  return Number.isFinite(parsed) ? parsed : 0;
}
