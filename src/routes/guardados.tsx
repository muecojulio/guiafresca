import { createFileRoute } from "@tanstack/react-router";
import { getGuide } from "@/lib/catalog";
import { Shell } from "@/components/shell";
import { GuideCard, usePrefs, useSavedSet } from "@/components/ui";

export const Route = createFileRoute("/guardados")({ component: Guardados });

function Guardados() {
  const saved = useSavedSet();
  const prefs = usePrefs();
  const items = saved.ids.map((slug) => getGuide(slug)).filter((item) => item !== undefined);

  return (
    <Shell>
      <header className="px-5 pt-8">
        <h1 className="font-display text-4xl">Guardados</h1>
        <p className="mt-2 text-sm leading-relaxed text-stone">
          Quedan solo en este teléfono. No hay cuenta ni copia en un servidor.
        </p>
      </header>
      {items.length === 0 ? (
        <p className="px-5 pt-8 text-base leading-relaxed text-stone">
          Todavía no guardas nada. Abre una fruta y toca Guardar.
        </p>
      ) : (
        <section className="grid grid-cols-1 gap-4 px-5 pt-6 sm:grid-cols-2">
          {items.map((item) => (
            <GuideCard key={item.slug} item={item} showEthylene={prefs.ethylene} />
          ))}
        </section>
      )}
    </Shell>
  );
}
