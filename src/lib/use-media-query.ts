import { useEffect, useState } from "react";

/**
 * Consulta de medios reactiva, segura para SSR: en el servidor vale `initial`
 * y el primer efecto del cliente la corrige.
 */
export function useMediaQuery(query: string, initial = false): boolean {
  const [matches, setMatches] = useState(initial);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const list = window.matchMedia(query);
    const sync = () => setMatches(list.matches);
    sync();
    list.addEventListener("change", sync);
    return () => list.removeEventListener("change", sync);
  }, [query]);

  return matches;
}

/** Movimiento reducido: apaga desplazamientos, rebotes y desplazamientos suaves. */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}

/** Apunta a mouse o lápiz: en táctil no hay hover, así que no se promete. */
export function useFinePointer(): boolean {
  return useMediaQuery("(hover: hover) and (pointer: fine)");
}

/** Pantalla ancha: los carruseles ya no ayudan y pasan a cuadrícula. */
export function useWideScreen(): boolean {
  return useMediaQuery("(min-width: 40rem)");
}
