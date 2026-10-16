import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  fmtShelf,
  matchFoodkeeper,
  parseFoodkeeperCsv,
  toConservacion,
} from "./shelflife.ts";

// Encabezado real del CSV de FoodKeeper; las filas se construyen
// alineadas a él para que el test no dependa de contar comas.
const HEADER_CELLS = [
  "Category_ID",
  "Name",
  "Name_subtitle",
  "Keywords",
  "Pantry_Min",
  "Pantry_Max",
  "Pantry_Metric",
  "Pantry_tips",
  "DOP_Pantry_Min",
  "DOP_Pantry_Max",
  "DOP_Pantry_Metric",
  "DOP_Pantry_tips",
  "Pantry_After_Opening_Min",
  "Pantry_After_Opening_Max",
  "Pantry_After_Opening_Metric",
  "Refrigerate_Min",
  "Refrigerate_Max",
  "Refrigerate_Metric",
  "Refrigerate_tips",
  "DOP_Refrigerate_Min",
  "DOP_Refrigerate_Max",
  "DOP_Refrigerate_Metric",
  "DOP_Refrigerate_tips",
  "Refrigerate_After_Opening_Min",
  "Refrigerate_After_Opening_Max",
  "Refrigerate_After_Opening_Metric",
  "Refrigerate_After_Thawing_Min",
  "Refrigerate_After_Thawing_Max",
  "Refrigerate_After_Thawing_Metric",
  "Freeze_Min",
  "Freeze_Max",
  "Freeze_Metric",
  "Freeze_Tips",
  "DOP_Freeze_Min",
  "DOP_Freeze_Max",
  "DOP_Freeze_Metric",
  "DOP_Freeze_Tips",
];

function makeRow(vals: Record<string, string>): string {
  return HEADER_CELLS.map((name) => {
    const v = vals[name] ?? "";
    return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  }).join(",");
}

const SAMPLE = [
  HEADER_CELLS.join(","),
  makeRow({
    Category_ID: "7",
    Name: "Butter",
    Keywords: "Butter",
    Refrigerate_Min: "1",
    Refrigerate_Max: "2",
    Refrigerate_Metric: "Weeks",
    Freeze_Min: "6",
    Freeze_Max: "9",
    Freeze_Metric: "Months",
  }),
  makeRow({
    Category_ID: "7",
    Name: "Milk",
    Name_subtitle: "whole, reduced fat",
    Keywords: "Milk,whole,reduced fat",
    Refrigerate_Min: "7",
    Refrigerate_Max: "7",
    Refrigerate_Metric: "Days",
    Refrigerate_tips: "Keep in the coldest part.",
    Freeze_Min: "1",
    Freeze_Max: "1",
    Freeze_Metric: "Months",
  }),
  makeRow({
    Category_ID: "7",
    Name: "Cheese",
    Name_subtitle: "hard such as cheddar",
    Keywords: "Cheese,cheddar",
    Refrigerate_Min: "6",
    Refrigerate_Max: "6",
    Refrigerate_Metric: "Months",
    Freeze_Min: "6",
    Freeze_Max: "6",
    Freeze_Metric: "Months",
  }),
].join("\n");

describe("parseFoodkeeperCsv", () => {
  it("descomenta comas dentro de comillas y parsea rangos", () => {
    const entries = parseFoodkeeperCsv(SAMPLE);
    assert.equal(entries.length, 3);
    assert.equal(entries[0].name, "Butter");
    assert.equal(entries[1].name, "Milk");
    assert.equal(entries[1].subtitle, "whole, reduced fat");
    assert.deepEqual(entries[1].keywords, ["milk", "whole", "reduced fat"]);
    assert.deepEqual(entries[1].fridge, { minDays: 7, maxDays: 7 });
    assert.deepEqual(entries[0].fridge, { minDays: 7, maxDays: 14 });
    assert.deepEqual(entries[0].freezer, { minDays: 180, maxDays: 270 });
    assert.equal(entries[0].pantry, null);
  });
});

describe("matchFoodkeeper", () => {
  const entries = parseFoodkeeperCsv(SAMPLE);

  it("encuentra por nombre, subtítulo o palabra clave", () => {
    assert.equal(matchFoodkeeper(entries, "mantequilla")?.name, "Butter");
    assert.equal(matchFoodkeeper(entries, "leche")?.name, "Milk");
    assert.equal(matchFoodkeeper(entries, "cheddar")?.name, "Cheese");
    assert.equal(matchFoodkeeper(entries, "queso duro cheddar")?.name, "Cheese");
  });

  it("traduce del glosario e ignora stopwords", () => {
    assert.equal(matchFoodkeeper(entries, "leche entera")?.name, "Milk");
    assert.equal(matchFoodkeeper(entries, "de la leche")?.name, "Milk");
  });

  it("prefiere la entrada genérica sobre la variedad o la compuesta", () => {
    // "Soy milk" también contiene milk, pero "Milk" explica
    // mejor el nombre; "Fruit pies (…peach…)" no es durazno.
    assert.equal(matchFoodkeeper(entries, "leche")?.name, "Milk");
    assert.notEqual(matchFoodkeeper(entries, "mantequilla")?.name, "Soy milk");
    const pies = parseFoodkeeperCsv(
      [HEADER_CELLS.join(","), makeRow({
        Category_ID: "31",
        Name: "Fruit pies",
        Name_subtitle: "apple, peach",
        Keywords: "Fruit pies,apple,peach",
        Freeze_Min: "8",
        Freeze_Max: "8",
        Freeze_Metric: "Months",
      })].join("\n"),
    );
    assert.equal(matchFoodkeeper(pies, "durazno"), null);
    assert.equal(matchFoodkeeper(pies, "pastel de durazno")?.name, "Fruit pies");
  });

  it("devuelve null sin coincidencia y con consulta vacía", () => {
    assert.equal(matchFoodkeeper(entries, "platano"), null);
    assert.equal(matchFoodkeeper(entries, "   "), null);
  });
});

describe("fmtShelf", () => {
  it("formatea días, semanas y meses con plural", () => {
    assert.equal(fmtShelf({ minDays: 7, maxDays: 7 }), "7 días");
    assert.equal(fmtShelf({ minDays: 7, maxDays: 14 }), "7 a 14 días");
    assert.equal(fmtShelf({ minDays: 14, maxDays: 14 }), "2 semanas");
    assert.equal(fmtShelf({ minDays: 30, maxDays: 30 }), "1 mes");
    assert.equal(fmtShelf({ minDays: 180, maxDays: 270 }), "6 a 9 meses");
    assert.equal(fmtShelf(null), null);
  });
});

describe("toConservacion", () => {
  it("compone el nombre con subtítulo y traduce todo", () => {
    const entry = matchFoodkeeper(parseFoodkeeperCsv(SAMPLE), "leche");
    const c = toConservacion(entry!);
    assert.equal(c.name, "Milk (whole, reduced fat)");
    assert.equal(c.fridge, "7 días");
    assert.equal(c.freezer, "1 mes");
    assert.equal(c.pantry, null);
  });
});
