/**
 * Pure logic over the vendored USDA FoodKeeper ingredient table
 * (src/lib/data/foodkeeper-ingredients.csv, copied from the
 * public MIT repo github.com/jelera/food-shelflife-db — the same
 * FSIS dataset the app already cites).
 *
 * Kept free of file imports so it runs under plain `node --test`;
 * shelflife-data.ts feeds it the CSV text.
 */

export type FoodkeeperEntry = {
  name: string;
  subtitle: string;
  keywords: string[];
  pantry: Shelf | null;
  fridge: Shelf | null;
  freezer: Shelf | null;
  tips: string;
};

/** The dump fills DOP_* ("date of purchase") columns for
 * most rows, so each shelf falls back to them. */
function shelfOr(
  min: string,
  max: string,
  metric: string,
  dopMin: string,
  dopMax: string,
  dopMetric: string,
): Shelf | null {
  return shelf(min, max, metric) ?? shelf(dopMin, dopMax, dopMetric);
}

export type Shelf = { minDays: number; maxDays: number };

export type Conservacion = {
  name: string;
  pantry: string | null;
  fridge: string | null;
  freezer: string | null;
  tips: string;
};

const METRIC_DAYS: Record<string, number> = {
  days: 1,
  weeks: 7,
  months: 30,
};

/** RFC-4180-ish CSV: quoted fields, "" escapes, commas inside quotes. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (ch !== "\r") {
      field += ch;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function toDays(raw: string, metric: string): number | null {
  const n = Number.parseInt(raw, 10);
  const factor = METRIC_DAYS[metric.toLocaleLowerCase("en")];
  if (!Number.isFinite(n) || n <= 0 || factor === undefined) return null;
  return n * factor;
}

function shelf(
  min: string,
  max: string,
  metric: string,
): Shelf | null {
  const lo = toDays(min, metric);
  const hi = toDays(max, metric);
  if (lo !== null && hi !== null) return { minDays: lo, maxDays: hi };
  const one = lo ?? hi;
  if (one === null) return null;
  return { minDays: one, maxDays: one };
}

export function parseFoodkeeperCsv(text: string): FoodkeeperEntry[] {
  const rows = parseCsv(text);
  const header = rows.shift() ?? [];
  const at = (name: string): number => header.indexOf(name);

  const cName = at("Name");
  const cSubtitle = at("Name_subtitle");
  const cKeywords = at("Keywords");
  const cPantryMin = at("Pantry_Min");
  const cPantryMax = at("Pantry_Max");
  const cPantryMetric = at("Pantry_Metric");
  const cDopPantryMin = at("DOP_Pantry_Min");
  const cDopPantryMax = at("DOP_Pantry_Max");
  const cDopPantryMetric = at("DOP_Pantry_Metric");
  const cFridgeMin = at("Refrigerate_Min");
  const cFridgeMax = at("Refrigerate_Max");
  const cFridgeMetric = at("Refrigerate_Metric");
  const cFridgeTips = at("Refrigerate_tips");
  const cDopFridgeMin = at("DOP_Refrigerate_Min");
  const cDopFridgeMax = at("DOP_Refrigerate_Max");
  const cDopFridgeMetric = at("DOP_Refrigerate_Metric");
  const cDopFridgeTips = at("DOP_Refrigerate_tips");
  const cFreezeMin = at("Freeze_Min");
  const cFreezeMax = at("Freeze_Max");
  const cFreezeMetric = at("Freeze_Metric");
  const cFreezeTips = at("Freeze_Tips");
  const cDopFreezeMin = at("DOP_Freeze_Min");
  const cDopFreezeMax = at("DOP_Freeze_Max");
  const cDopFreezeMetric = at("DOP_Freeze_Metric");
  const cDopFreezeTips = at("DOP_Freeze_Tips");

  if (cName === -1 || cFridgeMin === -1 || cFreezeMin === -1) return [];

  const cell = (row: string[], idx: number): string =>
    idx === -1 ? "" : (row[idx] ?? "").trim();

  return rows.map((row) => {
    const subtitle = cell(row, cSubtitle);
    return {
      name: cell(row, cName),
      subtitle,
      keywords: cell(row, cKeywords)
        .split(",")
        .map((k) => k.trim().toLocaleLowerCase("en"))
        .filter(Boolean),
      pantry: shelfOr(
        cell(row, cPantryMin),
        cell(row, cPantryMax),
        cell(row, cPantryMetric),
        cell(row, cDopPantryMin),
        cell(row, cDopPantryMax),
        cell(row, cDopPantryMetric),
      ),
      fridge: shelfOr(
        cell(row, cFridgeMin),
        cell(row, cFridgeMax),
        cell(row, cFridgeMetric),
        cell(row, cDopFridgeMin),
        cell(row, cDopFridgeMax),
        cell(row, cDopFridgeMetric),
      ),
      freezer: shelfOr(
        cell(row, cFreezeMin),
        cell(row, cFreezeMax),
        cell(row, cFreezeMetric),
        cell(row, cDopFreezeMin),
        cell(row, cDopFreezeMax),
        cell(row, cDopFreezeMetric),
      ),
      tips: [
        cell(row, cFridgeTips),
        cell(row, cDopFridgeTips),
        cell(row, cFreezeTips),
        cell(row, cDopFreezeTips),
      ]
        .filter(Boolean)
        .join(" "),
    };
  });
}

function tokens(text: string): string[] {
  return text
    .toLocaleLowerCase("es")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .split(/[^a-z0-9]+/u)
    .filter(Boolean);
}

/**
 * Grocery glossary ES → EN so a Spanish product name
 * ("leche", "jitomate") matches the English FoodKeeper
 * table. Common Mexican spellings included.
 */
const ES_EN: Record<string, string[]> = {
  aguacate: ["avocado"],
  ajo: ["garlic"],
  agria: ["sour"],
  arandano: ["blueberry"],
  arroz: ["rice"],
  azucar: ["sugar"],
  banano: ["banana"],
  brocoli: ["broccoli"],
  calabacita: ["squash", "zucchini"],
  calabaza: ["squash", "pumpkin"],
  camote: ["sweet", "potato"],
  cebolla: ["onion"],
  cereza: ["cherry"],
  champinon: ["mushroom"],
  chile: ["chili", "pepper"],
  chila: ["chili"],
  ciruela: ["plum"],
  cocido: ["cooked"],
  crudo: ["raw"],
  chayote: ["chayote", "squash"],
  chocolate: ["chocolate"],
  cilantro: ["cilantro"],
  crema: ["cream"],
  duro: ["hard"],
  durazno: ["peach"],
  melocoton: ["peach"],
  blando: ["soft"],
  suave: ["soft"],
  elote: ["corn"],
  entera: ["whole"],
  epazote: ["epazote"],
  espinaca: ["spinach"],
  fresa: ["strawberry"],
  fresco: ["fresh", "soft"],
  frijol: ["bean"],
  frijoles: ["bean", "beans"],
  guayaba: ["guava"],
  harina: ["flour"],
  huevo: ["egg"],
  huevos: ["egg"],
  jitomate: ["tomato"],
  leche: ["milk"],
  limon: ["lime", "lemon"],
  manzana: ["apple"],
  mantequilla: ["butter"],
  mango: ["mango"],
  melon: ["melon"],
  miel: ["honey"],
  naranja: ["orange"],
  nopal: ["cactus", "nopales"],
  pimiento: ["pepper"],
  pimienta: ["pepper"],
  pepino: ["cucumber"],
  pastel: ["pie", "pies"],
  pan: ["bread"],
  papaya: ["papaya"],
  papa: ["potato"],
  pera: ["pear"],
  pina: ["pineapple"],
  platano: ["banana"],
  queso: ["cheese"],
  sandia: ["watermelon"],
  tuna: ["tuna", "prickly"],
  uva: ["grape"],
  vainilla: ["vanilla"],
  verde: ["green"],
  jocoque: ["yogurt"],
  yogur: ["yogurt"],
  verdura: ["vegetable"],
  zanahoria: ["carrot"],
};

/**
 * Best USDA match for a product name: every query token must
 * appear in the entry (name, subtitle or keywords), either
 * directly or through the ES→EN glossary. Ranked by
 * specificity — the entry with the fewest tokens of its own,
 * then by table order.
 */
const STOPWORDS = new Set([
  "al", "con", "de", "del", "el", "en", "la", "las", "los", "para", "sin", "y",
]);

/** English noise words that never explain a name token. */
const EN_NOISE = new Set([
  "a", "an", "and", "as", "for", "in", "of", "on", "or", "such", "the", "with",
]);

/** English plural forms of a token ("berry" → berries). */
function plurals(token: string): string[] {
  const forms = [token, `${token}s`, `${token}es`];
  if (/[^aeiou]y$/.test(token)) forms.push(`${token.slice(0, -1)}ies`);
  return forms;
}

/** English plural-aware token equality ("egg" ~ "eggs"). */
function tokenHit(wanted: string, hay: string): boolean {
  return plurals(wanted).includes(hay) || plurals(hay).includes(wanted);
}

/**
 * Best USDA match for a product name: every query token must
 * appear in the entry (name, subtitle or keywords), either
 * directly or through the ES→EN glossary. Ranked by how much
 * of the entry's NAME the query leaves unexplained — "leche"
 * must land on Milk, not Soy milk — then by table order.
 */
export function matchFoodkeeper(
  entries: FoodkeeperEntry[],
  query: string,
): FoodkeeperEntry | null {
  const wanted = tokens(query).filter((token) => !STOPWORDS.has(token));
  if (wanted.length === 0) return null;

  // Every way a query token can be spelled in the English table.
  const allForms = wanted.flatMap((token) => [token, ...(ES_EN[token] ?? [])]);

  let best: FoodkeeperEntry | null = null;
  let bestUnexplained = Number.POSITIVE_INFINITY;
  let bestCovered = -1;
  let bestHasFridge = false;
  for (const entry of entries) {
    const nameTokens = tokens(entry.name);
    const significant = nameTokens.filter((token) => !EN_NOISE.has(token));
    const haystack = new Set([
      ...nameTokens,
      ...tokens(entry.subtitle),
      ...entry.keywords,
    ]);
    // Each query token matches through ANY of its spellings.
    const matches = wanted.every((token) => {
      const forms = [token, ...(ES_EN[token] ?? [])];
      return forms.some((form) =>
        [...haystack].some((hay) => tokenHit(form, hay)),
      );
    });
    if (!matches) continue;
    // The query must explain the entry's name: "leche"
    // must not land on "Fruit pies (apple, peach, …)".
    // One stray token is fine — "cheddar" landing on
    // "Cheese (hard such as cheddar)" is a good answer.
    const covered = significant.filter((token) =>
      allForms.some((form) => tokenHit(form, token)),
    ).length;
    const unexplained = significant.length - covered;
    // A keyword-only hit on a multi-token name is the
    // wrong row ("durazno" ≠ "Fruit pies (apple, peach…)"),
    // and so is a name the query barely explains.
    if (covered === 0 && unexplained > 1) continue;
    if (unexplained > 2 && unexplained / significant.length > 0.5) {
      continue;
    }
    const better =
      unexplained < bestUnexplained ||
      (unexplained === bestUnexplained && covered > bestCovered) ||
      (unexplained === bestUnexplained &&
        covered === bestCovered &&
        entry.fridge !== null &&
        !bestHasFridge);
    if (better) {
      best = entry;
      bestUnexplained = unexplained;
      bestCovered = covered;
      bestHasFridge = entry.fridge !== null;
    }
  }
  return best;
}

function fmtDays(days: number): { n: number; unit: string } {
  if (days % 30 === 0 && days >= 30) {
    return { n: days / 30, unit: days === 30 ? "mes" : "meses" };
  }
  if (days % 7 === 0 && days >= 14) {
    return { n: days / 7, unit: days === 7 ? "semana" : "semanas" };
  }
  return { n: days, unit: days === 1 ? "día" : "días" };
}

export function fmtShelf(shelf: Shelf | null): string | null {
  if (!shelf) return null;
  const lo = fmtDays(shelf.minDays);
  const hi = fmtDays(shelf.maxDays);
  if (lo.unit === hi.unit) {
    return lo.n === hi.n ? `${lo.n} ${lo.unit}` : `${lo.n} a ${hi.n} ${lo.unit}`;
  }
  return `${shelf.minDays} a ${shelf.maxDays} días`;
}

export function toConservacion(entry: FoodkeeperEntry): Conservacion {
  const name = entry.subtitle ? `${entry.name} (${entry.subtitle})` : entry.name;
  return {
    name,
    pantry: fmtShelf(entry.pantry),
    fridge: fmtShelf(entry.fridge),
    freezer: fmtShelf(entry.freezer),
    tips: entry.tips,
  };
}
