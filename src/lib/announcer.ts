import { useEffect, useState } from "react";

/**
 * Anuncios para tecnologías de asistencia (una sola región viva en la app).
 *
 * Los estados que ya se ven —"Guardado", "Quitado", "3 resultados"— también
 * se oyen: `announce()` los empuja a `<LiveRegion />`, montado una vez en el
 * armazón. Es un módulo sin React para poder probarlo y para que cualquier
 * componente lo use sin pasar props.
 */
type Listener = (message: string) => void;

const listeners = new Set<Listener>();

export function announce(message: string) {
  const text = message.trim();
  if (!text) return;
  for (const listener of listeners) listener(text);
}

export function subscribeToAnnouncements(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Último mensaje, con clave para repetir el mismo texto dos veces. */
export function useAnnouncement(): { message: string; key: number } {
  const [entry, setEntry] = useState<{ message: string; key: number }>({ message: "", key: 0 });

  useEffect(() => {
    let localKey = 0;
    return subscribeToAnnouncements((message) => {
      localKey += 1;
      setEntry({ message, key: localKey });
    });
  }, []);

  return entry;
}
