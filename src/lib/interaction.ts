/**
 * Decisiones de interacción, sin DOM ni React.
 *
 * Aquí vive lo que se puede equivocar en un gesto: cuándo un arrastre es
 * horizontal y no vertical, cuánto hay que arrastrar para que un carril se
 * quede abierto, qué opción activa una tecla y cuándo una lista desborda.
 * Al estar aislado se prueba con `node --test` (ver `interaction.test.ts`)
 * en lugar de a ojo en un teléfono.
 */

export type Axis = "none" | "horizontal" | "vertical";

export type Point = {
  x: number;
  y: number;
  /** Marca de tiempo en ms (`event.timeStamp` o `performance.now()`). */
  t?: number;
};

export type GestureTuning = {
  /** El gesto es horizontal si `|dx|` supera este múltiplo de `|dy|`. */
  ratio: number;
  /** Movimiento mínimo (px) antes de fijar el eje. */
  minDistance: number;
  /** Fracción del panel de acciones a la que se abre o se cierra. */
  commitRatio: number;
  /** Distancia (px) que basta para fijar el estado en gestos lentos. */
  commitDistance: number;
  /** Velocidad (px/ms) que basta para decidir en un gesto rápido. */
  flickVelocity: number;
};

export const GESTURE: GestureTuning = {
  ratio: 1.2,
  minDistance: 12,
  commitRatio: 0.35,
  commitDistance: 28,
  flickVelocity: 0.4,
};

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

/**
 * Fija el eje del gesto. Devuelve `"none"` mientras el movimiento es menor al
 * umbral: así el navegador conserva el desplazamiento vertical de la página
 * hasta que el gesto demuestre ser claramente horizontal.
 */
export function decideAxis(
  dx: number,
  dy: number,
  tuning: Pick<GestureTuning, "ratio" | "minDistance"> = GESTURE,
): Axis {
  const distance = Math.hypot(dx, dy);
  if (distance < tuning.minDistance) return "none";
  if (Math.abs(dx) >= Math.abs(dy) * tuning.ratio) return "horizontal";
  if (Math.abs(dy) >= Math.abs(dx) * tuning.ratio) return "vertical";
  // Diagonal: decide el eje mayor sin robar el gesto a la página.
  return Math.abs(dy) > Math.abs(dx) ? "vertical" : "none";
}

export type PanDecision = {
  axis: Axis;
  dx: number;
  dy: number;
  distance: number;
  velocity: number;
};

/** Estado de un arrastre a partir del punto inicial y el actual. */
export function decidePan(
  start: Point,
  current: Point,
  tuning: GestureTuning = GESTURE,
): PanDecision {
  const dx = current.x - start.x;
  const dy = current.y - start.y;
  const elapsed = Math.max((current.t ?? 0) - (start.t ?? 0), 1);
  const velocity = (current.t ?? 0) > (start.t ?? 0) ? dx / elapsed : 0;
  return {
    axis: decideAxis(dx, dy, tuning),
    dx,
    dy,
    distance: Math.hypot(dx, dy),
    velocity,
  };
}

/**
 * Desplazamiento del panel de acciones: nunca pasa del ancho disponible, así
 * que arrastrar de más no descubre el fondo de la tarjeta.
 */
export function clampReveal(offset: number, width: number): number {
  return clamp(offset, 0, Math.max(width, 0));
}

/**
 * ¿Se queda abierto? Gana el gesto rápido (velocidad) o, si no, la distancia
 * recorrida contra `commitRatio` del ancho de acciones.
 */
export function shouldOpenReveal(
  offset: number,
  width: number,
  velocity = 0,
  tuning: GestureTuning = GESTURE,
): boolean {
  const limit = Math.max(width, 0);
  if (limit === 0) return false;
  if (Math.abs(velocity) >= tuning.flickVelocity) return velocity < 0;
  const travelled = Math.abs(offset);
  return travelled >= Math.max(tuning.commitDistance, limit * tuning.commitRatio);
}

/**
 * Cómo termina un arrastre sobre una tarjeta: cuánto queda revelado y si el
 * panel de acciones se queda abierto. Concentra la convención de signos
 * (velocidad negativa = hacia la izquierda = revelar) en un solo lugar.
 */
export function settleReveal(input: {
  base: number;
  dx: number;
  width: number;
  velocity: number;
  tuning?: GestureTuning;
}): { offset: number; open: boolean } {
  const dragged = clampReveal(input.base - input.dx, input.width);
  const open = shouldOpenReveal(dragged, input.width, input.velocity, input.tuning);
  return { offset: open ? Math.max(input.width, 0) : 0, open };
}

/**
 * Opción que activa una tecla dentro de una lista de pestañas, radios o
 * chips. Devuelve `null` cuando la tecla no pertenece al conjunto, para que
 * quien la reciba deje el evento seguir su camino.
 */
export function nextRovingIndex(
  key: string,
  current: number,
  count: number,
  orientation: "horizontal" | "vertical" | "both" = "horizontal",
): number | null {
  if (count <= 0) return null;
  const last = count - 1;
  switch (key) {
    case "ArrowRight":
      if (orientation === "vertical") return null;
      return current >= last ? 0 : current + 1;
    case "ArrowLeft":
      if (orientation === "vertical") return null;
      return current <= 0 ? last : current - 1;
    case "ArrowDown":
      if (orientation === "horizontal") return null;
      return current >= last ? 0 : current + 1;
    case "ArrowUp":
      if (orientation === "horizontal") return null;
      return current <= 0 ? last : current - 1;
    case "Home":
      return 0;
    case "End":
      return last;
    default:
      return null;
  }
}

/** Minúsculas y sin diacríticos: "Plátano" → "platano", "Jitomate" → "jitomate". */
export function foldText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}

/** Todas las palabras de la búsqueda deben aparecer en el texto. */
export function matchesQuery(haystack: string, query: string): boolean {
  const hay = foldText(haystack);
  const parts = foldText(query).split(/\s+/).filter(Boolean);
  if (parts.length === 0) return true;
  return parts.every((part) => hay.includes(part));
}

export type OverflowEdges = {
  hasOverflow: boolean;
  atStart: boolean;
  atEnd: boolean;
};

/**
 * Señales de desborde de un carril. `slack` absorbe el redondeo subpíxel para
 * no encender una sombra cuando en realidad no hay nada más que ver.
 */
export function overflowEdges(input: {
  scrollLeft: number;
  clientWidth: number;
  scrollWidth: number;
  slack?: number;
}): OverflowEdges {
  const slack = input.slack ?? 2;
  const hasOverflow = input.scrollWidth - input.clientWidth > slack;
  return {
    hasOverflow,
    atStart: !hasOverflow || input.scrollLeft <= slack,
    atEnd: !hasOverflow || input.scrollLeft + input.clientWidth >= input.scrollWidth - slack,
  };
}

/** Índice visible más cercano según el desplazamiento del carril. */
export function nearestItemIndex(scrollLeft: number, stride: number, count: number): number {
  if (stride <= 0 || count <= 0) return 0;
  return clamp(Math.round(scrollLeft / stride), 0, count - 1);
}

/** Desplazamiento que centra un elemento dentro del carril. */
export function centerScrollLeft(
  scrollLeft: number,
  containerWidth: number,
  itemStart: number,
  itemSize: number,
): number {
  const target = itemStart + itemSize / 2 - containerWidth / 2;
  return Math.max(target, 0);
}

const UNIT_DAYS: Record<string, number> = {
  hora: 1 / 24,
  horas: 1 / 24,
  dia: 1,
  dias: 1,
  semana: 7,
  semanas: 7,
  mes: 30,
  meses: 30,
  ano: 365,
  anos: 365,
};

/**
 * Días aproximados de una frase de la guía ("2 a 5 días", "Cerca de 10 días",
 * "2 a 3 meses", "hasta cerca de un año"). Sirve para dibujar el termómetro
 * de conservación; si no hay cifra reconocible devuelve `null` y el
 * termómetro no se pinta.
 */
const NUMBER_WORDS: Record<string, number> = {
  un: 1,
  una: 1,
  uno: 1,
  medio: 0.5,
  media: 0.5,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  quince: 15,
  veinte: 20,
};

const NUMBER =
  "(\\d+(?:[.,]\\d+)?|un|una|uno|medio|media|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|quince|veinte)";
const DURATION_RE = new RegExp(
  `${NUMBER}(?:\\s*(?:a|-|–|hasta)\\s*${NUMBER})?\\s*(horas?|dias?|semanas?|mes(?:es)?|anos?)`,
);

function readAmount(raw: string | undefined): number | null {
  if (!raw) return null;
  const digits = Number.parseFloat(raw.replace(",", "."));
  if (Number.isFinite(digits)) return digits;
  const word = NUMBER_WORDS[raw];
  return word === undefined ? null : word;
}

export function parseDurationDays(text: string): number | null {
  const match = DURATION_RE.exec(foldText(text));
  if (!match) return null;
  const first = readAmount(match[1]);
  const second = readAmount(match[2]);
  const unit = UNIT_DAYS[match[3]];
  if (first === null || unit === undefined) return null;
  const value = second !== null ? Math.max(first, second) : first;
  return Math.round(value * unit * 10) / 10;
}

/** Retardo de una entrada escalonada, con tope para no hacer esperar a nadie. */
export function staggerDelay(index: number, step = 45, max = 320): number {
  return Math.min(Math.max(index, 0) * step, max);
}
