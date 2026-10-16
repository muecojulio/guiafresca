import { createServerFn } from "@tanstack/react-start";
import { conservacionDe as buscarEnTabla } from "@/lib/shelflife-data";

export type { Conservacion } from "@/lib/shelflife";

function cleanProduct(raw: unknown): string {
  if (typeof raw !== "string") throw new Error("Escribe el nombre del producto.");
  const name = raw.trim().slice(0, 60);
  if (name.length < 2) throw new Error("Escribe al menos 2 letras.");
  if (!/^[\p{L}\p{N}\s.'&-]{2,60}$/u.test(name)) {
    throw new Error("Usa solo letras y números en la búsqueda.");
  }
  return name;
}

/**
 * USDA FoodKeeper shelf life for any store product, from the
 * vendored dataset copied out of github.com/jelera/food-shelflife-db
 * (MIT). No network, no key — answers even offline, which is
 * what makes it a good companion to Open Food Facts results
 * that have no guide ficha yet.
 */
export const conservacionDe = createServerFn({ method: "GET" })
  .validator(cleanProduct)
  .handler(async ({ data: name }) => buscarEnTabla(name));
