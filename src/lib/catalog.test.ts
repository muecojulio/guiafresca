import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { GUIDES } from "./catalog.ts";
import { parseFoodkeeperCsv, type FoodkeeperEntry, type Shelf } from "./shelflife.ts";
import { VERIFICACION, fmtRango, rangoEnDias, type Rango } from "./verificacion.ts";

// Validación de la guía: cada producto debe tener lo mínimo, sus
// imágenes, una fuente, y cada cifra de días debe coincidir con la
// fuente y aparecer en el texto que ve la persona.
// Corre con: npm run check:guia

const ROOT = join(import.meta.dirname, "..", "..");
const CSV = readFileSync(join(ROOT, "src/lib/data/foodkeeper-ingredients.csv"), "utf8");
const USDA = parseFoodkeeperCsv(CSV);

/** Clave de fila como se escribe en verificacion.ts: "Nombre [subtítulo]". */
function claveUsda(e: FoodkeeperEntry): string {
  return e.subtitle ? `${e.name} [${e.subtitle}]` : e.name;
}

function filaUsda(clave: string): FoodkeeperEntry | undefined {
  return USDA.find((e) => claveUsda(e) === clave);
}

function sameShelf(shelf: Shelf | null, rango: Rango): boolean {
  if (!shelf) return false;
  const { min, max } = rangoEnDias(rango);
  return shelf.minDays === min && shelf.maxDays === max;
}

describe("guía: campos e imágenes", () => {
  for (const g of GUIDES) {
    it(`${g.slug} tiene texto completo e imágenes`, () => {
      const textos: [string, string][] = [
        ["summary", g.summary],
        ["counter", g.counter],
        ["fridge", g.fridge],
        ["opened", g.opened],
        ["freezer", g.freezer],
        ["unripe", g.unripe],
        ["ripe", g.ripe],
        ["over", g.over],
      ];
      for (const [campo, valor] of textos) {
        assert.ok(valor && valor.trim().length > 0, `falta ${campo}`);
      }
      assert.ok(g.longer.length > 0, "falta 'Para que dure'");
      assert.ok(g.avoid.length > 0, "falta 'Qué no hacer'");
      for (const ruta of [g.photo, g.early, g.late]) {
        assert.ok(ruta, "falta una de las tres fotos");
        assert.ok(existsSync(join(ROOT, "public", ruta)), `no existe public${ruta}`);
      }
    });
  }
});

describe("guía: fuentes", () => {
  it("cada producto tiene una fuente y ninguna sobra", () => {
    const slugs = new Set(GUIDES.map((g) => g.slug));
    for (const slug of slugs) {
      assert.ok(VERIFICACION[slug], `${slug} no tiene fuente en verificacion.ts`);
    }
    for (const slug of Object.keys(VERIFICACION)) {
      assert.ok(slugs.has(slug), `${slug} tiene fuente pero no está en la guía`);
    }
  });

  it("toda fuente tiene nota", () => {
    for (const [slug, v] of Object.entries(VERIFICACION)) {
      assert.ok(v.nota.trim().length > 0, `${slug}: falta nota`);
    }
  });

  it("sin cifra, la fuente es criterio; con cifra, la tabla no es criterio", () => {
    for (const [slug, v] of Object.entries(VERIFICACION)) {
      const conCifra = Boolean(v.refri || v.fuera);
      if (v.tabla === "Criterio de la guía") {
        assert.equal(conCifra, false, `${slug}: criterio no puede llevar cifras`);
      } else {
        assert.ok(v.tabla, `${slug}: falta tabla`);
      }
    }
  });
});

describe("guía: cifras contra la tabla USDA FoodKeeper", () => {
  for (const [slug, v] of Object.entries(VERIFICACION)) {
    if (v.tabla !== "USDA FoodKeeper") continue;
    it(`${slug} coincide con la fila "${v.fila}"`, () => {
      assert.ok(v.fila, `${slug}: falta fila`);
      const fila = filaUsda(v.fila);
      assert.ok(fila, `${slug}: la fila "${v.fila}" no existe en el CSV`);

      if (fila.fridge) {
        if (v.refri) {
          assert.ok(sameShelf(fila.fridge, v.refri), `${slug}: refri no coincide con USDA`);
        } else {
          assert.ok(v.excepcion, `${slug}: USDA da refrigerador y la guía no; falta excepcion`);
        }
      } else {
        assert.equal(v.refri, undefined, `${slug}: la fila no tiene refrigerador`);
      }

      if (fila.pantry) {
        if (v.fuera) {
          assert.ok(sameShelf(fila.pantry, v.fuera), `${slug}: fuera no coincide con USDA`);
        } else {
          assert.ok(v.excepcion, `${slug}: USDA da despensa y la guía no; falta excepcion`);
        }
      } else {
        assert.equal(v.fuera, undefined, `${slug}: la fila no tiene despensa`);
      }
    });
  }
});

describe("guía: el texto muestra la misma cifra que la fuente", () => {
  for (const g of GUIDES) {
    const v = VERIFICACION[g.slug];
    if (!v) continue;
    if (v.refri) {
      it(`${g.slug}: refrigerador dice "${fmtRango(v.refri)}"`, () => {
        assert.ok(
          g.fridge.includes(fmtRango(v.refri as Rango)),
          `el texto "${g.fridge}" no incluye "${fmtRango(v.refri as Rango)}"`,
        );
      });
    }
    if (v.fuera) {
      it(`${g.slug}: fuera dice "${fmtRango(v.fuera)}"`, () => {
        assert.ok(
          g.counter.includes(fmtRango(v.fuera as Rango)),
          `el texto "${g.counter}" no incluye "${fmtRango(v.fuera as Rango)}"`,
        );
      });
    }
  }
});

describe("resumen de la guía", () => {
  it("cuenta cuántas cifras están comprobadas", () => {
    const porTabla: Record<string, number> = {};
    for (const v of Object.values(VERIFICACION)) {
      porTabla[v.tabla] = (porTabla[v.tabla] ?? 0) + 1;
    }
    const conExcepcion = Object.values(VERIFICACION).filter((v) => v.excepcion).length;
    console.log(`Productos: ${GUIDES.length}`);
    console.log(`Fuentes: ${JSON.stringify(porTabla)}`);
    console.log(`Con excepción documentada: ${conExcepcion}`);
    assert.equal(Object.keys(VERIFICACION).length, GUIDES.length);
  });
});
