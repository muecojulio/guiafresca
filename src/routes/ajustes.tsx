import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ChevronRight, MapPin, Moon, ShieldCheck, Sprout, Sun, Wind } from "lucide-react";
import { Shell, PageHeader } from "@/components/shell";
import { ActionButton, SwitchRow } from "@/components/actions";
import { Disclosure } from "@/components/accordion";
import { SearchCombobox, type ComboOption } from "@/components/combobox";
import { miCiudad } from "@/lib/location.functions";
import { readCity, writeCity } from "@/lib/prefs";
import { usePrefs } from "@/lib/use-prefs";
import { announce } from "@/lib/announcer";
import { toast } from "@/lib/toasts";

export const Route = createFileRoute("/ajustes")({ component: Ajustes });

/** Ciudades sugeridas: la lista se filtra al escribir, sin red. */
const CIUDADES = [
  "Ciudad de México",
  "Guadalajara",
  "Monterrey",
  "Puebla",
  "Querétaro",
  "Mérida",
  "Cancún",
  "Tijuana",
  "León",
  "Toluca",
  "Aguascalientes",
  "Chihuahua",
  "Culiacán",
  "Hermosillo",
  "Morelia",
  "Oaxaca",
  "San Luis Potosí",
  "Tampico",
  "Veracruz",
  "Villahermosa",
  "Xalapa",
  "Zacatecas",
  "Tuxtla Gutiérrez",
  "La Paz",
  "Ensenada",
  "Torreón",
  "Durango",
  "Colima",
  "Campeche",
  "Pachuca",
];

function Ajustes() {
  const prefs = usePrefs();
  const [city, setCity] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState("");

  useEffect(() => {
    setCity(readCity());
  }, []);

  const options: ComboOption[] = CIUDADES.map((name) => ({ id: name, label: name }));

  async function detectarCiudad() {
    setDetectError("");
    try {
      const next = await miCiudad();
      setCity(next.city);
      announce(`Ciudad detectada: ${next.city}. Falta guardar.`);
    } catch {
      setDetectError("No pude detectar la ciudad. Escríbela a mano.");
      throw new Error("sin ciudad");
    }
  }

  return (
    <Shell>
      <PageHeader title="Ajustes" eyebrow="Se queda en este teléfono">
        Los interruptores y la ciudad viven en el navegador. La ciudad solo sirve para preguntar la
        temperatura.
      </PageHeader>

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

      <section className="px-5 pt-6" aria-labelledby="ciudad">
        <h2 id="ciudad" className="font-display text-2xl">
          Ciudad del clima
        </h2>
        <p className="pt-1 pb-3 text-sm leading-relaxed text-stone">
          Open-Meteo, sin llave. Escribe para filtrar; no usa tu ubicación exacta.
        </p>

        <SearchCombobox
          label="Ciudad del clima"
          inputId="ciudad"
          icon="map"
          placeholder="Puebla, Morelia, Mérida…"
          hint="Filtra la lista mientras escribes. Flechas para elegir, Enter para confirmar."
          value={city}
          onValueChange={setCity}
          options={options}
          onSelect={(option) => setCity(option.label)}
          freeTextTemplate={(query) => `Usar «${query}»`}
          emptyMessage="Sin ciudad en la lista. Puedes usar lo que escribiste."
        />

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <ActionButton
            variant="leaf"
            icon={Sprout}
            onClick={() => {
              writeCity(city);
              if (city.trim().length < 2) {
                toast("Escribe al menos dos letras para guardar la ciudad.");
                announce("Ciudad demasiado corta.");
                return;
              }
              toast(`Ciudad guardada: ${city.trim()}.`, { tone: "success" });
            }}
            successLabel="Guardada"
          >
            Guardar ciudad
          </ActionButton>
          <ActionButton
            status={detecting ? "loading" : "idle"}
            onAction={async () => {
              setDetecting(true);
              try {
                await detectarCiudad();
              } finally {
                setDetecting(false);
              }
            }}
            icon={MapPin}
            loadingLabel="Detectando…"
            successLabel="Listo"
            errorLabel="No se pudo"
          >
            Detectar ciudad
          </ActionButton>
        </div>
        {detectError ? (
          <p className="mt-2 text-sm text-berry" role="status">
            {detectError}
          </p>
        ) : null}
        <p className="mt-2 text-sm leading-relaxed text-stone">
          Detectar usa ipapi.co, un API público sin llave: solo la ciudad, nunca tu calle.
        </p>
      </section>

      <section className="space-y-3 px-5 pt-8">
        <Disclosure
          label="Qué se guarda en este teléfono"
          hint="Favoritos, noche, calor y ciudad"
          icon={<ShieldCheck className="size-4" aria-hidden="true" />}
        >
          <p className="text-sm leading-relaxed text-stone">
            Nada sale de tu navegador: no hay cuenta, ni perfil, ni copia en un servidor. Lo que
            guardas, el modo noche, el aviso de calor y la ciudad quedan en el almacenamiento local.
            Borrar los datos del sitio los borra.
          </p>
        </Disclosure>

        <Disclosure
          label="Cómo se calculan los días"
          hint="USDA, Virginia Tech y FDA"
          icon={<Wind className="size-4" aria-hidden="true" />}
        >
          <p className="text-sm leading-relaxed text-stone">
            Los tiempos son ventanas de hogar: USDA FoodKeeper, la tabla 348-960 de Virginia Tech y
            la zona de peligro de FDA (2 horas, 1 hora arriba de 32 °C). Cada ficha dice de dónde
            sale su cifra en “Cómo se comprobó”.
          </p>
        </Disclosure>
      </section>

      <nav className="px-5 pt-8" aria-label="Más información">
        <ul className="card divide-y divide-line overflow-hidden">
          <li>
            <Link
              to="/instalar"
              className="tap flex min-h-14 items-center justify-between gap-3 px-4 text-base"
            >
              <span className="flex items-center gap-3">
                <Moon className="size-4 text-stone" aria-hidden="true" />
                Instalar en el teléfono
              </span>
              <ChevronRight className="size-4 text-stone" aria-hidden="true" />
            </Link>
          </li>
          <li>
            <Link
              to="/privacidad"
              className="tap flex min-h-14 items-center justify-between gap-3 px-4 text-base"
            >
              <span className="flex items-center gap-3">
                <ShieldCheck className="size-4 text-stone" aria-hidden="true" />
                Privacidad
              </span>
              <ChevronRight className="size-4 text-stone" aria-hidden="true" />
            </Link>
          </li>
          <li className="px-4 py-4 text-sm leading-relaxed text-stone">
            <span className="flex items-start gap-2">
              <Sun className="mt-0.5 size-4 shrink-0 text-citrus" aria-hidden="true" />
              Los días salen de USDA FoodKeeper, la tabla de Virginia Tech y la zona de peligro de
              FDA. No es consejo médico.
            </span>
          </li>
        </ul>
      </nav>
    </Shell>
  );
}
