import foodkeeperCsv from "./data/foodkeeper-ingredients.csv?raw";
import {
  matchFoodkeeper,
  parseFoodkeeperCsv,
  toConservacion,
  type Conservacion,
} from "./shelflife";

// Parsed once per process; the lookup below is memoized.
const ENTRIES = parseFoodkeeperCsv(foodkeeperCsv);

const memo = new Map<string, Conservacion | null>();
const MEMO_MAX = 256;

/**
 * USDA FoodKeeper shelf life for a product name, in Spanish,
 * from the vendored dataset (no network, no key). Returns
 * null when the table has nothing for it.
 */
export function conservacionDe(nombre: string): Conservacion | null {
  const key = nombre.toLocaleLowerCase("es");
  const hit = memo.get(key);
  if (hit !== undefined) return hit;

  const entry = matchFoodkeeper(ENTRIES, nombre);
  const value = entry ? toConservacion(entry) : null;

  memo.set(key, value);
  if (memo.size > MEMO_MAX) {
    const oldest = memo.keys().next().value;
    if (oldest !== undefined) memo.delete(oldest);
  }
  return value;
}
