import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Check, Info, Undo2, X, TriangleAlert } from "lucide-react";
import { dismissToast, getToasts, subscribeToasts, type Toast, type ToastTone } from "@/lib/toasts";

const TONE_ICON: Record<ToastTone, typeof Info> = {
  info: Info,
  success: Check,
  error: TriangleAlert,
};

const TONE_CLASS: Record<ToastTone, string> = {
  info: "text-ink",
  success: "text-leaf",
  error: "text-berry",
};

/** Pila de avisos: sobre la barra inferior, sin tapar lo que se está tocando. */
export function Toaster() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, getToasts);
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-40 flex flex-col items-center gap-2 px-4 sm:bottom-8">
      {toasts.map((entry) => (
        <ToastCard key={entry.id} toast={entry} />
      ))}
    </div>
  );
}

function ToastCard({ toast: entry }: { toast: Toast }) {
  const [leaving, setLeaving] = useState(false);
  const timerRef = useRef<number | null>(null);
  const Icon = TONE_ICON[entry.tone];

  useEffect(() => {
    if (entry.duration <= 0) return;
    const close = () => setLeaving(true);
    timerRef.current = window.setTimeout(close, entry.duration);
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    };
  }, [entry.duration, entry.id]);

  useEffect(() => {
    if (!leaving) return;
    const finish = window.setTimeout(() => dismissToast(entry.id), 200);
    return () => window.clearTimeout(finish);
  }, [leaving, entry.id]);

  function pause() {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }

  function resume() {
    if (entry.duration <= 0 || leaving) return;
    timerRef.current = window.setTimeout(() => setLeaving(true), 2600);
  }

  return (
    <div
      role={entry.tone === "error" ? "alert" : "status"}
      aria-live={entry.tone === "error" ? "assertive" : "polite"}
      onMouseEnter={pause}
      onFocus={pause}
      onMouseLeave={resume}
      onBlur={resume}
      data-leaving={leaving ? "true" : "false"}
      data-toast=""
      className={`pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-card border border-line bg-card px-4 py-3 shadow-lift transition-[opacity,transform] duration-200 ease-out data-[leaving=true]:translate-y-2 data-[leaving=true]:opacity-0`}
    >
      <Icon className={`size-5 shrink-0 ${TONE_CLASS[entry.tone]}`} aria-hidden="true" />
      <p className="min-w-0 flex-1 text-sm leading-relaxed text-ink">{entry.message}</p>
      {entry.action ? (
        <button
          type="button"
          className="tap inline-flex min-h-11 shrink-0 items-center gap-1 rounded-full px-3 text-sm font-medium text-leaf"
          onClick={() => {
            entry.action?.run();
            dismissToast(entry.id);
          }}
        >
          <Undo2 className="size-4" aria-hidden="true" />
          {entry.action.label}
        </button>
      ) : null}
      <button
        type="button"
        aria-label="Cerrar aviso"
        className="tap -mr-1 grid size-11 shrink-0 place-items-center rounded-full text-stone"
        onClick={() => setLeaving(true)}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
