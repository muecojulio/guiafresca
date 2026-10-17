import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { announce, subscribeToAnnouncements } from "./announcer.ts";

// La región viva es la única vía de los mensajes de estado: si se rompe, la
// interfaz deja de explicarse en voz alta. npm test

describe("anuncios accesibles", () => {
  it("reparte el mensaje a quien escucha", () => {
    const received: string[] = [];
    const unsubscribe = subscribeToAnnouncements((message) => received.push(message));
    announce("Guardado en este teléfono.");
    announce("  ");
    unsubscribe();
    announce("Ya nadie escucha.");
    assert.deepEqual(received, ["Guardado en este teléfono."]);
  });

  it("soporta varios escuchas y los quita sin afectar a los demás", () => {
    const first: string[] = [];
    const second: string[] = [];
    const offFirst = subscribeToAnnouncements((message) => first.push(message));
    const offSecond = subscribeToAnnouncements((message) => second.push(message));
    announce("Tres resultados.");
    offFirst();
    announce("Filtro: Frutas.");
    offSecond();
    assert.deepEqual(first, ["Tres resultados."]);
    assert.deepEqual(second, ["Tres resultados.", "Filtro: Frutas."]);
  });
});
