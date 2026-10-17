import { announce } from "@/lib/announcer";

/**
 * Avisos breves con opción de deshacer, fuera de React para poder llamarlos
 * desde cualquier componente (`toast(...)`) sin repartir props ni contexto.
 * El armazón los pinta una sola vez.
 */
export type ToastTone = "info" | "success" | "error";

export type ToastAction = {
  label: string;
  run: () => void;
};

export type Toast = {
  id: number;
  message: string;
  tone: ToastTone;
  action?: ToastAction;
  /** ms en pantalla; 0 = se queda hasta que se cierre. */
  duration: number;
};

type Options = {
  tone?: ToastTone;
  action?: ToastAction;
  duration?: number;
  /** Si es `false`, el aviso no se repite en la región viva. */
  announce?: boolean;
};

const listeners = new Set<() => void>();
let toasts: Toast[] = [];
let nextId = 1;

export function getToasts(): Toast[] {
  return toasts;
}

export function subscribeToasts(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emit() {
  for (const listener of listeners) listener();
}

export function toast(message: string, options: Options = {}): number {
  const text = message.trim();
  if (!text) return 0;
  const id = nextId++;
  const entry: Toast = {
    id,
    message: text,
    tone: options.tone ?? "info",
    action: options.action,
    duration: options.duration ?? 5200,
  };
  // Máximo dos avisos a la vez: más que eso deja de ser un aviso.
  toasts = [...toasts.slice(-1), entry];
  emit();
  if (options.announce !== false) announce(text);
  return id;
}

export function dismissToast(id: number) {
  const next = toasts.filter((item) => item.id !== id);
  if (next.length === toasts.length) return;
  toasts = next;
  emit();
}
