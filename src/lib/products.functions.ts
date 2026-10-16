import { createServerFn } from "@tanstack/react-start";
import { matchGuideSlug } from "@/lib/catalog";

export type LiveProduct = {
  code: string;
  name: string;
  brand: string;
  image: string | null;
  guideSlug: string | null;
};

type CacheEntry = { at: number; products: LiveProduct[] };

const cache = new Map<string, CacheEntry>();
const TTL_MS = 10 * 60 * 1000;
const ENDPOINTS = [
  "https://world.openfoodfacts.net/api/v2/search",
  "https://world.openfoodfacts.org/api/v2/search",
];
const IMAGE_HOSTS = new Set(["images.openfoodfacts.net", "images.openfoodfacts.org"]);

function cleanQuery(raw: unknown): string {
  if (typeof raw !== "string") throw new Error("Escribe el nombre del producto.");
  const query = raw.trim().slice(0, 60);
  if (query.length < 2) throw new Error("Escribe al menos 2 letras.");
  if (!/^[\p{L}\p{N}\s.'-]{2,60}$/u.test(query)) {
    throw new Error("Usa solo letras y números en la búsqueda.");
  }
  return query;
}

function safeImage(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("https://")) return null;
  try {
    const url = new URL(value);
    if (!IMAGE_HOSTS.has(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export const buscarEnVivo = createServerFn({ method: "GET" })
  .validator(cleanQuery)
  .handler(async ({ data: query }) => {
    const key = query.toLocaleLowerCase("es");
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) {
      return { products: hit.products, cached: true as const, ok: true as const };
    }

    let lastError = "La consulta en vivo no respondió.";
    for (const endpoint of ENDPOINTS) {
      const url = new URL(endpoint);
      url.searchParams.set("search_terms", query);
      url.searchParams.set("page_size", "8");
      url.searchParams.set(
        "fields",
        "code,product_name,brands,image_front_small_url,categories_tags",
      );
      try {
        const response = await fetch(url, {
          headers: {
            Accept: "application/json",
            "User-Agent": "GuiaFresca/1.0 (guia de conservacion en el hogar)",
          },
          signal: AbortSignal.timeout(8000),
          redirect: "error",
        });
        if (!response.ok) {
          lastError = `Open Food Facts respondió ${response.status}.`;
          continue;
        }
        const body = (await response.json()) as {
          products?: Array<Record<string, unknown>>;
        };
        const products: LiveProduct[] = (body.products ?? [])
          .map((product) => {
            const name = typeof product.product_name === "string" ? product.product_name.trim() : "";
            const code = typeof product.code === "string" ? product.code : "";
            if (!name || !code) return null;
            const brand = typeof product.brands === "string" ? product.brands.split(",")[0]?.trim() ?? "" : "";
            const categories = Array.isArray(product.categories_tags)
              ? product.categories_tags.filter((tag) => typeof tag === "string").join(" ")
              : "";
            return {
              code,
              name: name.slice(0, 120),
              brand: brand.slice(0, 80),
              image: safeImage(product.image_front_small_url),
              guideSlug: matchGuideSlug(`${name} ${brand} ${categories}`),
            };
          })
          .filter((item): item is LiveProduct => item !== null);

        cache.set(key, { at: Date.now(), products });
        if (cache.size > 80) {
          const oldest = cache.keys().next().value;
          if (oldest) cache.delete(oldest);
        }
        return { products, cached: false as const, ok: true as const };
      } catch {
        lastError = "No hubo respuesta a tiempo de Open Food Facts.";
      }
    }

    return { products: [] as LiveProduct[], cached: false as const, ok: false as const, error: lastError };
  });
