import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  GESTURE,
  centerScrollLeft,
  clampReveal,
  decideAxis,
  decidePan,
  foldText,
  matchesQuery,
  nearestItemIndex,
  nextRovingIndex,
  overflowEdges,
  parseDurationDays,
  settleReveal,
  shouldOpenReveal,
  staggerDelay,
} from "./interaction.ts";

// Comprobaciones de las decisiones de gesto, teclado y desborde.
// Corren sin navegador: npm test

describe("gesto: bloqueo de eje", () => {
  it("no decide nada mientras el movimiento es mínimo", () => {
    assert.equal(decideAxis(4, 3), "none");
    assert.equal(decideAxis(-8, 6), "none");
  });

  it("es horizontal cuando el lado supera 1.2 veces el vertical", () => {
    assert.equal(decideAxis(40, 10), "horizontal");
    assert.equal(decideAxis(-40, 10), "horizontal");
  });

  it("es vertical cuando el desplazamiento vertical domina", () => {
    assert.equal(decideAxis(4, 40), "vertical");
    assert.equal(decideAxis(20, 24), "vertical");
  });

  it("deja en paz el gesto diagonal ambiguo", () => {
    // 30 contra 30 no es claramente nada: la página conserva el scroll.
    assert.equal(decideAxis(30, 30), "none");
  });

  it("respeta el umbral configurado", () => {
    assert.equal(decideAxis(20, 4, { ratio: 1.2, minDistance: 30 }), "none");
    assert.equal(decideAxis(30, 4, { ratio: 1.2, minDistance: 30 }), "horizontal");
  });
});

describe("gesto: velocidad y eje del arrastre", () => {
  it("calcula la velocidad del tramo", () => {
    const decision = decidePan({ x: 100, y: 40, t: 0 }, { x: 60, y: 42, t: 100 });
    assert.equal(decision.axis, "horizontal");
    assert.equal(decision.dx, -40);
    assert.equal(Math.round(decision.velocity * 100) / 100, -0.4);
  });

  it("no inventa velocidad si no hay marcas de tiempo", () => {
    const decision = decidePan({ x: 0, y: 0 }, { x: 40, y: 0 });
    assert.equal(decision.velocity, 0);
  });
});

describe("swipe para revelar acciones", () => {
  const width = 88;

  it("nunca pasa del ancho del panel de acciones", () => {
    assert.equal(clampReveal(400, width), width);
    assert.equal(clampReveal(-30, width), 0);
    assert.equal(clampReveal(40, width), 40);
  });

  it("un toque corto no abre nada", () => {
    assert.equal(shouldOpenReveal(12, width, 0), false);
    assert.equal(shouldOpenReveal(25, width, -0.05), false);
  });

  it("arrastrar más de un tercio del panel abre", () => {
    assert.equal(shouldOpenReveal(40, width, 0), true);
  });

  it("un gesto rápido decide aunque sea corto", () => {
    // Deslizar a la izquierda (velocidad negativa) abre.
    assert.equal(shouldOpenReveal(18, width, -GESTURE.flickVelocity), true);
    // Deslizar a la derecha cierra.
    assert.equal(shouldOpenReveal(60, width, GESTURE.flickVelocity), false);
  });

  it("sin panel de acciones no hay nada que abrir", () => {
    assert.equal(shouldOpenReveal(50, 0, -1), false);
  });
});

describe("fin del arrastre: nunca se queda a medio abrir", () => {
  const width = 88;

  it("arrastrar a la izquierda abre el panel completo", () => {
    const settled = settleReveal({ base: 0, dx: -70, width, velocity: -0.2 });
    assert.deepEqual(settled, { offset: width, open: true });
  });

  it("un gesto rápido hacia la izquierda abre aunque sea corto", () => {
    assert.equal(settleReveal({ base: 0, dx: -20, width, velocity: -0.8 }).open, true);
  });

  it("desde abierto, arrastrar a la derecha cierra", () => {
    const settled = settleReveal({ base: width, dx: 70, width, velocity: 0.2 });
    assert.deepEqual(settled, { offset: 0, open: false });
  });

  it("un gesto rápido hacia la derecha cierra", () => {
    assert.equal(settleReveal({ base: width, dx: 12, width, velocity: 0.9 }).open, false);
  });

  it("un arrastre corto y lento vuelve al extremo", () => {
    assert.deepEqual(settleReveal({ base: 0, dx: -25, width, velocity: -0.05 }), {
      offset: 0,
      open: false,
    });
    assert.deepEqual(settleReveal({ base: width, dx: 25, width, velocity: 0.05 }), {
      offset: width,
      open: true,
    });
  });

  it("sin panel de acciones siempre queda cerrado", () => {
    assert.deepEqual(settleReveal({ base: 0, dx: -60, width: 0, velocity: -1 }), {
      offset: 0,
      open: false,
    });
  });
});

describe("teclado de pestañas, radios y chips", () => {
  it("mueve y da la vuelta en horizontal", () => {
    assert.equal(nextRovingIndex("ArrowRight", 0, 4), 1);
    assert.equal(nextRovingIndex("ArrowRight", 3, 4), 0);
    assert.equal(nextRovingIndex("ArrowLeft", 0, 4), 3);
  });

  it("ignora el eje que no le toca", () => {
    assert.equal(nextRovingIndex("ArrowDown", 1, 4, "horizontal"), null);
    assert.equal(nextRovingIndex("ArrowRight", 1, 4, "vertical"), null);
  });

  it("Inicio y Fin van a los extremos", () => {
    assert.equal(nextRovingIndex("Home", 2, 5), 0);
    assert.equal(nextRovingIndex("End", 2, 5), 4);
  });

  it("devuelve null con teclas ajenas y listas vacías", () => {
    assert.equal(nextRovingIndex("Enter", 1, 4), null);
    assert.equal(nextRovingIndex("Tab", 1, 4), null);
    assert.equal(nextRovingIndex("ArrowRight", 0, 0), null);
  });
});

describe("búsqueda sin diacríticos", () => {
  it("pliega mayúsculas y acentos", () => {
    assert.equal(foldText("Plátano"), "platano");
    assert.equal(foldText("  JITOMATE "), "jitomate");
    assert.equal(foldText("León"), "leon");
  });

  it("encuentra escribiendo sin acentos ni mayúsculas", () => {
    assert.equal(matchesQuery("Plátano", "platano"), true);
    assert.equal(matchesQuery("Plátano banano", "PLATANO ban"), true);
    assert.equal(matchesQuery("Jitomate", "jitomate rojo"), false);
    assert.equal(matchesQuery("Leche entera", ""), true);
  });
});

describe("señales de desborde del carril", () => {
  it("sin contenido fuera de vista no enciende nada", () => {
    const edges = overflowEdges({ scrollLeft: 0, clientWidth: 320, scrollWidth: 320 });
    assert.deepEqual(edges, { hasOverflow: false, atStart: true, atEnd: true });
  });

  it("en el inicio solo hay contenido a la derecha", () => {
    const edges = overflowEdges({ scrollLeft: 0, clientWidth: 320, scrollWidth: 900 });
    assert.equal(edges.hasOverflow, true);
    assert.equal(edges.atStart, true);
    assert.equal(edges.atEnd, false);
  });

  it("en el final solo hay contenido a la izquierda", () => {
    const edges = overflowEdges({ scrollLeft: 580, clientWidth: 320, scrollWidth: 900 });
    assert.equal(edges.atStart, false);
    assert.equal(edges.atEnd, true);
  });

  it("en medio se ven las dos señales", () => {
    const edges = overflowEdges({ scrollLeft: 300, clientWidth: 320, scrollWidth: 900 });
    assert.equal(edges.atStart, false);
    assert.equal(edges.atEnd, false);
  });

  it("absorbe el redondeo subpíxel", () => {
    const edges = overflowEdges({ scrollLeft: 1, clientWidth: 320, scrollWidth: 321 });
    assert.equal(edges.hasOverflow, false);
    assert.equal(edges.atEnd, true);
  });
});

describe("carril: ítem activo y centrado", () => {
  it("calcula el índice más cercano", () => {
    assert.equal(nearestItemIndex(0, 200, 5), 0);
    assert.equal(nearestItemIndex(390, 200, 5), 2);
    assert.equal(nearestItemIndex(9999, 200, 5), 4);
  });

  it("no divide entre cero", () => {
    assert.equal(nearestItemIndex(120, 0, 5), 0);
    assert.equal(nearestItemIndex(120, 200, 0), 0);
  });

  it("centra el ítem elegido sin pasarse del inicio", () => {
    assert.equal(centerScrollLeft(0, 320, 400, 200), 340);
    assert.equal(centerScrollLeft(0, 320, 0, 200), 0);
  });
});

describe("días de conservación", () => {
  it("lee rangos y toma la cifra mayor", () => {
    assert.equal(parseDurationDays("2 a 5 días, según el calor."), 5);
    assert.equal(parseDurationDays("10 a 21 días."), 21);
    assert.equal(parseDurationDays("1 a 3 semanas en lugar fresco."), 21);
  });

  it("entiende semanas, meses y años", () => {
    assert.equal(parseDurationDays("Maduro, 7 días."), 7);
    assert.equal(parseDurationDays("Pulpa en trozos, 2 a 3 meses."), 90);
    assert.equal(parseDurationDays("Enteras: hasta cerca de un año."), 365);
  });

  it("también lee cifras escritas con palabras", () => {
    assert.equal(parseDurationDays("En gajos: dos meses."), 60);
    assert.equal(parseDurationDays("Medio mes, tapado."), 15);
  });

  it("una hora cuenta como fracción de día", () => {
    assert.equal(parseDurationDays("Lácteos, 1 hora fuera."), 0);
    assert.ok((parseDurationDays("2 horas fuera") ?? 0) < 1);
  });

  it("devuelve null cuando no hay cifra comparable", () => {
    assert.equal(parseDurationDays("Hasta que amarillee."), null);
    assert.equal(parseDurationDays("Solo el día de compra."), null);
    assert.equal(parseDurationDays("El jugo sí; el fruto entero no queda bien."), null);
  });
});

describe("entrada escalonada", () => {
  it("crece por índice y se detiene en el tope", () => {
    assert.equal(staggerDelay(0), 0);
    assert.equal(staggerDelay(2, 45, 320), 90);
    assert.equal(staggerDelay(50, 45, 320), 320);
  });
});
