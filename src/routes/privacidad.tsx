import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft, Cloud, ShieldCheck, Smartphone, TriangleAlert, Utensils } from "lucide-react";
import { Shell, PageHeader } from "@/components/shell";
import { Disclosure } from "@/components/accordion";

export const Route = createFileRoute("/privacidad")({ component: Privacidad });

function Privacidad() {
  return (
    <Shell>
      <div className="px-5 pt-5">
        <Link
          to="/ajustes"
          className="tap inline-flex min-h-11 items-center gap-1 text-sm text-stone"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Ajustes
        </Link>
      </div>

      <PageHeader title="Privacidad" eyebrow="Sin cuentas ni rastreo">
        Guía Fresca no pide cuenta, no pide correo y no crea un perfil tuyo.
      </PageHeader>

      <div className="space-y-3 px-5 pt-6">
        <Disclosure
          label="Lo que se queda en tu teléfono"
          hint="Favoritos, noche, calor y ciudad"
          defaultOpen
          icon={<Smartphone className="size-4" aria-hidden="true" />}
        >
          <p className="text-sm leading-relaxed text-stone">
            Lo que guardas, el modo noche y el aviso de calor viven en este teléfono, en el
            almacenamiento local del navegador. Borrar los datos del sitio los borra. No salen a una
            base de datos.
          </p>
        </Disclosure>

        <Disclosure
          label="Lo que viaja a otros servicios"
          hint="Open Food Facts, Open-Meteo, Fruityvice"
          icon={<Cloud className="size-4" aria-hidden="true" />}
        >
          <div className="space-y-3 text-sm leading-relaxed text-stone">
            <p>
              Si buscas un producto de tienda, el servidor de la app envía solo esas palabras a Open
              Food Facts (openfoodfacts.net), un proyecto público de alimentos que no exige llave ni
              registro. No se manda tu nombre. La foto del producto, si aparece, la pide tu teléfono
              a images.openfoodfacts.net.
            </p>
            <p>
              En el inicio, esa misma vía pregunta la temperatura de la ciudad que escribiste a
              Open-Meteo (open-meteo.com), también sin llave. Se manda el nombre de la ciudad, no tu
              calle ni tu GPS. En una ficha de fruta, se pide el nombre de esa fruta a Fruityvice
              (fruityvice.com) para mostrar calorías por 100 g.
            </p>
            <p>
              Esa consulta se recuerda unos minutos para no repetirla. No se escribe en disco ni se
              asocia a una persona.
            </p>
          </div>
        </Disclosure>

        <Disclosure
          label="Sin anuncios ni seguimiento"
          hint="Nada de píxeles, nada de venta de datos"
          icon={<ShieldCheck className="size-4" aria-hidden="true" />}
        >
          <p className="text-sm leading-relaxed text-stone">
            No hay anuncios, no hay píxeles de seguimiento y no se venden datos. Los enlaces de
            fuentes (USDA, FDA, universidad) solo se abren si tú los tocas. El código público de
            esas APIs está en GitHub: open-meteo/open-meteo y fruityvice/fruityvice-api.
          </p>
        </Disclosure>

        <Disclosure
          label="Límites de la guía"
          hint="No sustituye la etiqueta ni un criterio médico"
          icon={<Utensils className="size-4" aria-hidden="true" />}
        >
          <div className="space-y-3 text-sm leading-relaxed text-stone">
            <p>
              Los días son ventanas de hogar basadas en tablas públicas de conservación, no una
              fecha de fábrica. La etiqueta del fabricante manda cuando existe.
            </p>
            <p className="flex items-start gap-2">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-berry" aria-hidden="true" />
              Ante moho, olor raro o tiempo de más, se tira. No es consejo médico ni de inocuidad.
            </p>
          </div>
        </Disclosure>
      </div>
    </Shell>
  );
}
