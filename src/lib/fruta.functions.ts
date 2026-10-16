import { createServerFn } from "@tanstack/react-start";
import fruityvice from "@/lib/data/fruityvice.json";
import { cacheKey, cached } from "@/lib/cache.server";

export type Nutricion = {
  label: string;
  calories: number;
  sugar: number;
  carbohydrates: number;
  protein: number;
  fat: number;
  source: "api" | "local";
};

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
  granada: { api: "pomegranate", label: "Granada" },
  higo: { api: "fig", label: "Higo" },
};

// Respaldo sin red: el dataset público de Fruityvice, copiado de
// github.com/alessandra-torelli/fruitpedia (ver src/lib/data/README.md).
// Cubre los 19 nombres api de FRUIT, así que la ficha de nutrición
// sigue disponible aunque Fruityvice esté caído.
type LocalNutrition = {
  carbohydrates: number;
  protein: number;
  fat: number;
  calories: number;
  sugar: number;
};
const LOCAL: Record<string, LocalNutrition> = Object.fromEntries(
  fruityvice.map((row) => [row.name.toLocaleLowerCase("en"), row.nutritions]),
);

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

type NutritionNumbers = {
  calories: number;
  sugar: number;
  carbohydrates: number;
  protein: number;
  fat: number;
};

async function fetchNutricion(api: string): Promise<NutritionNumbers | null> {
  const url = new URL(`https://www.fruityvice.com/api/fruit/${api}`);
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
  return { calories, sugar, carbohydrates, protein, fat };
}

export const nutricionDe = createServerFn({ method: "GET" })
  .validator((slug: unknown) => (typeof slug === "string" ? slug.slice(0, 40) : ""))
  .handler(async ({ data: slug }) => {
    const fruit = FRUIT[slug];
    if (!fruit) return null;

    const { value } = await cached(cacheKey("fruta", slug), TTL_MS, async () => {
      try {
        const live = await fetchNutricion(fruit.api);
        if (live) return { ...live, source: "api" as const, label: fruit.label };
      } catch {
        // Fruityvice caído o lento → respaldo local, más abajo.
      }
      const local = LOCAL[fruit.api];
      return local
        ? { ...local, source: "local" as const, label: fruit.label }
        : null;
    });
    return value;
  });
