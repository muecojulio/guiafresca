import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/shell";
import { SwitchRow, usePrefs } from "@/components/ui";
import { readCity, writeCity } from "@/lib/prefs";

export const Route = createFileRoute("/ajustes")({ component: Ajustes });

function Ajustes() {
  const prefs = usePrefs();
  const [city, setCity] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setCity(readCity());
  }, []);

  return (
    <Shell>
      <header className="px-5 pt-8">
        <h1 className="font-display text-4xl">Ajustes</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone">
          Los interruptores se quedan en este aparato. La ciudad solo sirve para preguntar la temperatura.
        </p>
      </header>
      <div className="space-y-3 px-5 pt-6">
        <SwitchRow
          on={prefs.night}
          onChange={prefs.setNight}
          label="Papel de noche"
          hint="El mismo verde y el mismo cítrico, sobre tinta."
        />
        <SwitchRow
          on={prefs.heat}
          onChange={prefs.setHeat}
          label="Hace calor"
          hint="Aprieta los tiempos fuera del refrigerador. Úsalo arriba de 25 °C."
        />
        <SwitchRow
          on={prefs.ethylene}
          onChange={prefs.setEthylene}
          label="Avisos de etileno"
          hint="Muestra qué fruta apura a la de al lado."
        />
        <form
          className="rounded-card border border-line bg-card px-4 py-3"
          onSubmit={(event) => {
            event.preventDefault();
            writeCity(city);
            setSaved(true);
          }}
        >
          <label className="block text-base" htmlFor="ciudad">
            Ciudad del clima
          </label>
          <p className="mt-1 text-sm leading-relaxed text-stone">Open-Meteo, sin llave. No usa tu ubicación exacta.</p>
          <input
            id="ciudad"
            value={city}
            onChange={(event) => {
              setCity(event.target.value);
              setSaved(false);
            }}
            className="mt-3 min-h-12 w-full rounded-full border border-line bg-paper px-4 text-base outline-none"
          />
          <button type="submit" className="tap mt-3 inline-flex min-h-11 items-center text-sm text-leaf">
            {saved ? "Ciudad guardada" : "Guardar ciudad"}
          </button>
        </form>
      </div>
      <ul className="mt-8 px-5">
        <li>
          <Link to="/instalar" className="flex min-h-12 items-center border-t border-line text-base">
            Instalar en el teléfono
          </Link>
        </li>
        <li>
          <Link to="/privacidad" className="flex min-h-12 items-center border-t border-line text-base">
            Privacidad
          </Link>
        </li>
        <li className="border-t border-line py-4 text-sm leading-relaxed text-stone">
          Los días salen de USDA FoodKeeper, la tabla de Virginia Tech y la zona de peligro de FDA. No es consejo médico.
        </li>
      </ul>
    </Shell>
  );
}
