import { useEffect, useState } from "react";
import { readSaved, toggleSaved } from "@/lib/prefs";

/**
 * Slugs the visitor has saved, read from `localStorage` and kept in sync across
 * components and tabs through the `guiafresca-saved` / `storage` events.
 *
 * Lives outside `@/components/ui` so that file keeps exporting components only
 * and stays eligible for React fast refresh.
 */
export function useSavedSet() {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    const sync = () => setIds(readSaved());
    sync();
    window.addEventListener("guiafresca-saved", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("guiafresca-saved", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return {
    ids,
    has: (slug: string) => ids.includes(slug),
    toggle: (slug: string) => setIds(toggleSaved(slug)),
  };
}
