import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";
import { Shell } from "@/components/shell";

export const Route = createFileRoute("/privacidad")({ component: Privacidad });

function Privacidad() {
  return (
    <Shell>
      <div className="px-5 pt-5">
        <Link to="/ajustes" className="tap inline-flex min-h-11 items-center gap-1 text-sm text-stone">
          <ChevronLeft className="size-4" aria-hidden="true" />
          Ajustes
        </Link>
        <h1 className="font-display mt-4 text-4xl">Privacidad</h1>
      </div>
      <div className="space-y-4 px-5 pt-6 text-base leading-relaxed">
        <p>Guía Fresca no pide cuenta, no pide correo y no crea un perfil tuyo.</p>
        <p>
          Lo que guardas, el modo noche y el aviso de calor viven en este teléfono, en el almacenamiento local del
          navegador. Borrar los datos del sitio los borra. No salen a una base de datos.
        </p>
        <p>
          Si buscas un producto de tienda, el servidor de la app envía solo esas palabras a Open Food Facts
          (openfoodfacts.net), un proyecto público de alimentos que no exige llave ni registro. No se manda tu
          nombre. La foto del producto, si aparece, la pide tu teléfono a images.openfoodfacts.net.
        </p>
        <p>
          Esa consulta se recuerda unos minutos en la memoria del servidor para no repetirla. No se escribe en disco
          ni se asocia a una persona.
        </p>
        <p>
          No hay anuncios, no hay píxeles de seguimiento y no se venden datos. Los enlaces de fuentes (USDA, FDA,
          universidad) solo se abren si tú los tocas.
        </p>
        <p className="text-sm text-stone">
          Esta guía no sustituye la etiqueta del fabricante ni un criterio de inocuidad ante duda. Ante moho, olor
          raro o tiempo de más, se tira.
        </p>
      </div>
    </Shell>
  );
}
