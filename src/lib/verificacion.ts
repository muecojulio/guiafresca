/**
 * De dónde sale cada cifra de conservación de la guía.
 *
 * Reglas (las comprueba src/lib/catalog.test.ts):
 * - tabla "USDA FoodKeeper": `fila` debe existir en
 *   src/lib/data/foodkeeper-ingredients.csv y los rangos `refri` /
 *   `fuera` deben ser EXACTAMENTE los de esa fila. Si la fila tiene
 *   refrigerador o despensa y la guía no lo usa, hay que dar `excepcion`.
 * - tabla "Virginia Tech 348-960" o "SDSU Extension": la cifra se leyó de
 *   la publicación; `nota` explica cualquier advertencia de lectura.
 * - "Criterio de la guía": no hay cifra comparable en las tablas
 *   consultadas. Se muestra como criterio, no como dato comprobado.
 * - El texto de la guía (`fridge` / `counter`) debe contener el rango
 *   escrito con `fmtRango`, para que la ficha y los datos no se separen.
 */

export type Unidad = "días" | "semanas" | "meses";

export type Rango = { min: number; max: number; unidad: Unidad };

export type Tabla =
  | "USDA FoodKeeper"
  | "Virginia Tech 348-960"
  | "SDSU Extension"
  | "Criterio de la guía";

export type Verificacion = {
  tabla: Tabla;
  /** Fila exacta: "Nombre" o "Nombre [subtítulo]" en la tabla. */
  fila?: string;
  refri?: Rango;
  fuera?: Rango;
  /** Por qué la guía no sigue la cifra de la tabla. */
  excepcion?: string;
  nota: string;
};

const SINGULAR: Record<Unidad, string> = {
  días: "día",
  semanas: "semana",
  meses: "mes",
};

const DIAS_POR: Record<Unidad, number> = { días: 1, semanas: 7, meses: 30 };

/** Texto del rango como aparece en la guía: "3 a 4 días", "1 mes", "2 semanas". */
export function fmtRango(r: Rango): string {
  const unit = (n: number) => (n === 1 ? SINGULAR[r.unidad] : r.unidad);
  return r.min === r.max
    ? `${r.min} ${unit(r.min)}`
    : `${r.min} a ${r.max} ${r.unidad}`;
}

/** Rango en días, para compararlo con la tabla USDA. */
export function rangoEnDias(r: Rango): { min: number; max: number } {
  const f = DIAS_POR[r.unidad];
  return { min: r.min * f, max: r.max * f };
}

const d = (min: number, max = min): Rango => ({ min, max, unidad: "días" });
const s = (min: number, max = min): Rango => ({ min, max, unidad: "semanas" });
const m = (min: number, max = min): Rango => ({ min, max, unidad: "meses" });

const USDA = "USDA FoodKeeper" as const;
const VT = "Virginia Tech 348-960" as const;
const CRITERIO = "Criterio de la guía" as const;
const SIN_CIFRA =
  "Las tablas USDA y Virginia Tech consultadas no traen una cifra comparable para este producto.";

export const VERIFICACION: Record<string, Verificacion> = {
  platano: { tabla: USDA, fila: "Bananas", refri: d(3), nota: "Madura en la mesa; sin cifra de despensa en la tabla." },
  aguacate: { tabla: USDA, fila: "Avocados", refri: d(3, 4), nota: "Sin cifra de despensa: madura en la mesa." },
  jitomate: {
    tabla: CRITERIO,
    nota: `${SIN_CIFRA} Las filas de jitomate de la publicación Virginia Tech no se pudieron leer sin ambigüedad.`,
  },
  mango: {
    tabla: USDA,
    fila: "Papaya, mango, feijoa, passionfruit, casaha melon",
    refri: d(7),
    fuera: d(3, 5),
    nota: "La tabla agrupa mango con papaya, feijoa y otras frutas.",
  },
  durazno: {
    tabla: USDA,
    fila: "Peaches, nectarines, plums, pears, sapote",
    refri: d(3, 5),
    nota: "Durazno, nectarina, ciruela y pera comparten fila. El chabacano (2 a 5 días) viene de la fila Apricots.",
  },
  fresa: { tabla: USDA, fila: "Strawberries", refri: d(2, 3), nota: "Sin cifra de despensa: se come el día de compra." },
  manzana: {
    tabla: USDA,
    fila: "Apples",
    refri: s(4, 6),
    fuera: s(3),
    nota: "La tabla da 21 días en despensa y 28 a 42 en refrigerador.",
  },
  citricos: {
    tabla: USDA,
    fila: "Citrus fruit [lemon, lime, orange, grapefruit, tangerines, clementines]",
    refri: d(10, 21),
    fuera: d(10),
    nota: "Una sola fila para limón, lima, naranja, toronja y mandarina.",
  },
  uva: { tabla: USDA, fila: "Grapes", refri: d(7), fuera: d(1), nota: "Uva lavada: la fila no distingue; la guía pide no lavarla antes." },
  sandia: {
    tabla: USDA,
    fila: "Watermelon",
    refri: d(3, 4),
    fuera: d(1, 2),
    nota: "La tabla no distingue entera de partida.",
  },
  pina: { tabla: USDA, fila: "Pineapple", refri: d(5, 7), nota: "Sin cifra de despensa en la tabla." },
  melon: { tabla: USDA, fila: "Melons", refri: s(2), nota: "La partida (2 a 4 días) es criterio de la guía." },
  papaya: {
    tabla: USDA,
    fila: "Papaya, mango, feijoa, passionfruit, casaha melon",
    refri: d(7),
    fuera: d(3, 5),
    nota: "Misma fila que el mango.",
  },
  pera: {
    tabla: USDA,
    fila: "Peaches, nectarines, plums, pears, sapote",
    refri: d(3, 5),
    nota: "Misma fila que el durazno.",
  },
  guayaba: { tabla: CRITERIO, nota: SIN_CIFRA },
  kiwi: { tabla: USDA, fila: "Kiwi fruit", refri: d(3, 6), nota: "Sin cifra de despensa en la tabla." },
  arandano: {
    tabla: USDA,
    fila: "Blueberries",
    refri: s(1, 2),
    nota: "Zarzamora y frambuesa (2 a 3 días) no tienen fila propia verificada aquí.",
  },
  "fruta-partida": { tabla: CRITERIO, nota: SIN_CIFRA },
  lechuga: {
    tabla: USDA,
    fila: "Lettuce [iceberg, romaine]",
    refri: d(7, 14),
    nota: "La fila de lechuga de hoja (leaf) da 3 a 7 días; la guía usa la de romana/iceberg.",
  },
  espinaca: {
    tabla: USDA,
    fila: "Lettuce [leaf, spinach]",
    refri: d(3, 7),
    nota: "Misma fila de hojas verdes; la cifra de espinaca sale de ahí.",
  },
  cilantro: {
    tabla: USDA,
    fila: "Cilantro",
    refri: d(14, 21),
    fuera: undefined,
    excepcion:
      "La tabla da 7 a 14 días en despensa para cilantro. La guía no lo deja en la mesa porque se marchita en horas con calor.",
    nota: "La cifra de refrigerador de la tabla es más larga que la práctica común. Se sigue la tabla; si la quieres más corta, debe citarse otra fuente.",
  },
  cebolla: {
    tabla: USDA,
    fila: "Onions [yellow, white, red, etc.]",
    fuera: m(1),
    excepcion:
      "La tabla da 2 meses en refrigerador. La guía no la recomienda: la humedad la ablanda y su olor pasa a otros alimentos.",
    nota: "La cifra de despensa es 30 días.",
  },
  ajo: {
    tabla: USDA,
    fila: "Garlic",
    fuera: d(30),
    excepcion:
      "La tabla da de 3 a 14 días en refrigerador. La guía lo deja fuera: la humedad hace que la cabeza brote y se ablande.",
    nota: "Cifra de despensa de la fila Garlic (30 días).",
  },
  papa: {
    tabla: USDA,
    fila: "Potatoes",
    fuera: d(30, 60),
    excepcion:
      "La tabla da 7 a 14 días en refrigerador. La guía no la recomienda: el frío convierte el almidón en azúcar y, al freír, sube la acrilamida.",
    nota: "Cifra de despensa de la fila Potatoes.",
  },
  camote: {
    tabla: VT,
    fila: "Sweet potatoes",
    fuera: s(2, 3),
    nota: "Fila de la publicación Virginia Tech con formato dañado; la cifra de despensa es la de su columna.",
  },
  zanahoria: { tabla: USDA, fila: "Carrots, parsnips", refri: s(2, 3), nota: "Sin cifra de despensa en la tabla." },
  pepino: { tabla: USDA, fila: "Cucumbers", refri: d(4, 6), nota: "Sin cifra de despensa en la tabla." },
  pimiento: {
    tabla: USDA,
    fila: "Peppers",
    refri: d(4, 14),
    nota: "La tabla no distingue chile de pimiento. La cifra de despensa de Virginia Tech no es confiable en la copia consultada, así que no se usa.",
  },
  chile: {
    tabla: USDA,
    fila: "Peppers",
    refri: d(4, 14),
    nota: "Misma fila que el pimiento.",
  },
  brocoli: {
    tabla: USDA,
    fila: "Broccoli and broccoli raab (rapini)",
    refri: d(3, 5),
    nota: "La coliflor (3 a 5 días) viene de la publicación Virginia Tech.",
  },
  champinon: { tabla: USDA, fila: "Mushrooms", refri: d(3, 7), nota: "Sin cifra de despensa en la tabla." },
  elote: {
    tabla: VT,
    fila: "Corn (on the cob)",
    refri: d(1, 2),
    nota: "Elote con hojas, en refrigerador. Sin cifra de despensa.",
  },
  calabacita: {
    tabla: USDA,
    fila: "Squash [summer and zucchini]",
    refri: d(4, 5),
    fuera: d(1, 5),
    nota: "Calabacita y calabacín son la misma fila.",
  },
  jengibre: { tabla: CRITERIO, nota: SIN_CIFRA },
  "verdura-cocida": { tabla: CRITERIO, nota: "Cifra de la guía para comida cocida; no es una fila de tabla." },
  leche: {
    tabla: CRITERIO,
    nota: "La tabla da 'hasta la fecha del envase' para leche fresca. Los 7 días tras abrir son criterio de la guía.",
  },
  crema: {
    tabla: VT,
    fila: "Cream, heavy",
    refri: d(10),
    nota: "La cifra es de crema para batir. La ácida o mexicana usa la fecha del envase.",
  },
  yogur: { tabla: VT, fila: "Yogurt", refri: s(1, 2), nota: "Cerrado; después de abrirlo, la guía usa 7 días (criterio)." },
  "queso-fresco": {
    tabla: CRITERIO,
    nota: "La publicación Virginia Tech da 1 a 2 semanas para quesos blandos cerrados. La guía es más conservadora; esa cifra no está verificada para queso fresco.",
  },
  "queso-maduro": {
    tabla: CRITERIO,
    nota: "La fila de queso duro de la publicación Virginia Tech tiene formato dañado; no se usó.",
  },
  mantequilla: {
    tabla: VT,
    fila: "Butter",
    refri: m(1, 2),
    fuera: d(1, 2),
    nota: "Fuera: solo si está salada y sin calor.",
  },
  huevo: {
    tabla: USDA,
    fila: "Eggs [in shell]",
    refri: s(3, 5),
    nota: "Huevo de tienda, ya refrigerado. Sin cifra de despensa en la tabla.",
  },
  nopal: { tabla: CRITERIO, nota: SIN_CIFRA },
  "tomate-verde": {
    tabla: "SDSU Extension",
    refri: s(1, 2),
    nota: "Tomate verde con cáscara, en bolsa de papel, en una sola capa.",
  },
  epazote: { tabla: CRITERIO, nota: SIN_CIFRA },
  chayote: { tabla: CRITERIO, nota: SIN_CIFRA },
  ejote: {
    tabla: VT,
    fila: "Snap beans",
    refri: d(3, 5),
    nota: "Mismo dato que la fila Green beans de la publicación Virginia Tech.",
  },
  "flor-calabaza": { tabla: CRITERIO, nota: SIN_CIFRA },
  calabaza: {
    tabla: USDA,
    fila: "Pumpkins",
    fuera: m(2, 3),
    excepcion:
      "La tabla da 90 a 150 días para calabaza entera en refrigerador. La guía dice que la entera no lo necesita; la cifra de trozos es criterio.",
    nota: "Cifra de despensa de la fila Pumpkins (60 a 90 días).",
  },
  rabano: { tabla: USDA, fila: "Radishes", refri: d(10, 14), nota: "Sin cifra de despensa en la tabla." },
  tuna: { tabla: CRITERIO, nota: SIN_CIFRA },
  guanabana: { tabla: CRITERIO, nota: SIN_CIFRA },
  mamey: { tabla: CRITERIO, nota: SIN_CIFRA },
  tamarindo: { tabla: CRITERIO, nota: SIN_CIFRA },
  granada: {
    tabla: USDA,
    fila: "Pomegranate",
    refri: d(30, 90),
    fuera: d(2, 5),
    nota: "Entera. Los granos sueltos (unos 5 días) son criterio de la guía.",
  },
  higo: { tabla: CRITERIO, nota: SIN_CIFRA },
  salsa: { tabla: CRITERIO, nota: SIN_CIFRA },
  frijoles: { tabla: CRITERIO, nota: SIN_CIFRA },
  tortilla: { tabla: CRITERIO, nota: SIN_CIFRA },
  masa: { tabla: CRITERIO, nota: SIN_CIFRA },
  "chile-seco": { tabla: CRITERIO, nota: SIN_CIFRA },
  jocoque: { tabla: CRITERIO, nota: SIN_CIFRA },
};

export function verificacionDe(slug: string): Verificacion | undefined {
  return VERIFICACION[slug];
}
