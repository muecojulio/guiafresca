import { createServerFn } from "@tanstack/react-start";

export type Nutricion = {
  label: string;
  calories: number;
  sugar: number;
  carbohydrates: number;
  protein: number;
  fat: number;
};

type CacheEntry = { at: number; value: Nutricion };
const cache = new Map<string, CacheEntry>();
const TTL_MS = 24 * 60 * 60 * 1000;

// Nombres públicos de https://github.com/fruityvice/fruityvice-api (sin llave).
// Los campos son los de nutritions, por 100 g.
const FRUIT: Record<string, { api: string; label: string }> = {
  platano: { api: "banana", label: "Plátano" },
  aguacate: { api: "avocado", label: "Aguacate" },
  jitomate: { api: "tomato", label: "Jitomate" },
  mango: { api: "mango", label: "Mango" },
  durazno: { api: "peach", label: "Durazno" },
  fresa: { api: "strawberry", label: "Fresa" },
  manzana: { api: "apple", label: "Manzana" },
  citricos: { api: "orange", label: "Naranja" },
  uva: { api: "grape", label: "Uva" },
  sandia: { api: "watermelon", label: "Sandía" },
  pina: { api: "pineapple", label: "Piña" },
  melon: { api: "melon", label: "Melón" },
  papaya: { api: "papaya", label: "Papaya" },
  pera: { api: "pear", label: "Pera" },
  guayaba: { api: "guava", label: "Guayaba" },
  kiwi: { api: "kiwi", label: "Kiwi" },
  arandano: { api: "blueberry", label: "Arándano" },
};

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export const nutricionDe = createServerFn({ method: "GET" })
  .validator((slug: unknown) => (typeof slug === "string" ? slug.slice(0, 40) : ""))
  .handler(async ({ data: slug }) => {
    const fruit = FRUIT[slug];
    if (!fruit) return null;
    const hit = cache.get(slug);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.value;

    const url = new URL(`https://www.fruityvice.com/api/fruit/${fruit.api}`);
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "GuiaFresca/1.0 (guia de conservacion en el hogar)" },
      signal: AbortSignal.timeout(8000),
      redirect: "error",
    });
    if (!response.ok) return null;
    const body = (await response.json()) as { nutritions?: Record<string, unknown> };
    const n = body.nutritions ?? {};
    const calories = num(n.calories);
    const sugar = num(n.sugar);
    const carbohydrates = num(n.carbohydrates);
    const protein = num(n.protein);
    const fat = num(n.fat);
    if (calories === null || sugar === null || carbohydrates === null || protein === null || fat === null) {
      return null;
    }
    const value: Nutricion = { label: fruit.label, calories, sugar, carbohydrates, protein, fat };
    cache.set(slug, { at: Date.now(), value });
    return value;
  });
