import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/shell";
import { SwitchRow, usePrefs } from "@/components/ui";

export const Route = createFileRoute("/ajustes")({ component: Ajustes });

function Ajustes() {
  const prefs = usePrefs();

  return (
    <Shell>
      <header className="px-5 pt-8">
        <h1 className="font-display text-4xl">Ajustes</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone">Todo se queda en este aparato.</p>
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
