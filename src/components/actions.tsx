import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
import { Check, Heart, Loader2, TriangleAlert } from "lucide-react";
import { announce } from "@/lib/announcer";
import { toast } from "@/lib/toasts";
import { SparkBurst } from "@/components/decor";

export type ActionStatus = "idle" | "loading" | "success" | "error";
export type ActionVariant = "solid" | "leaf" | "citrus" | "outline" | "ghost";

const VARIANT: Record<ActionVariant, string> = {
  solid: "bg-ink text-paper border border-transparent",
  leaf: "bg-leaf text-paper border border-transparent",
  citrus: "bg-citrus text-paper border border-transparent",
  outline: "border border-line bg-card text-ink",
  ghost: "border border-transparent bg-transparent text-ink",
};

type IconType = ComponentType<{
  className?: string;
  strokeWidth?: number;
  "aria-hidden"?: boolean;
}>;

type ActionButtonProps = {
  children: ReactNode;
  variant?: ActionVariant;
  icon?: IconType;
  /** Si se pasa, el botón corre el ciclo cargando → éxito / error. */
  onAction?: () => void | Promise<void>;
  /** Estado controlado desde fuera (por ejemplo, una mutación en curso). */
  status?: ActionStatus;
  loadingLabel?: string;
  successLabel?: string;
  errorLabel?: string;
  /** Tiempo en pantalla del éxito / error antes de volver a la normalidad. */
  resetAfter?: number;
  disabled?: boolean;
  type?: "button" | "submit";
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
};

/**
 * Botón con los cinco estados del sistema: inactivo, cargando (sin envíos
 * duplicados), éxito, error y deshabilitado. El estado se ve, se anuncia con
 * `aria-busy` + región viva, y nunca se explica solo con color.
 */
export function ActionButton({
  children,
  variant = "outline",
  icon: Icon,
  onAction,
  status: statusProp,
  loadingLabel = "Un momento…",
  successLabel = "Listo",
  errorLabel = "No se pudo",
  resetAfter = 1800,
  disabled = false,
  type = "button",
  onClick,
  className = "",
  ariaLabel,
}: ActionButtonProps) {
  const [ownStatus, setOwnStatus] = useState<ActionStatus>("idle");
  const status = statusProp ?? ownStatus;
  const timersRef = useRef<number[]>([]);

  useEffect(
    () => () => {
      for (const timer of timersRef.current) window.clearTimeout(timer);
    },
    [],
  );

  function scheduleReset() {
    const timer = window.setTimeout(() => setOwnStatus("idle"), resetAfter);
    timersRef.current.push(timer);
  }

  async function handleClick() {
    if (disabled || status === "loading") return;
    if (!onAction) {
      onClick?.();
      return;
    }
    setOwnStatus("loading");
    try {
      await onAction();
      setOwnStatus("success");
      announce(successLabel);
      scheduleReset();
    } catch {
      setOwnStatus("error");
      announce(errorLabel);
      scheduleReset();
    }
  }

  const label =
    status === "loading"
      ? loadingLabel
      : status === "success"
        ? successLabel
        : status === "error"
          ? errorLabel
          : children;

  const StatusIcon =
    status === "loading"
      ? Loader2
      : status === "success"
        ? Check
        : status === "error"
          ? TriangleAlert
          : Icon;

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={disabled || status === "loading"}
      aria-busy={status === "loading" || undefined}
      aria-live="polite"
      aria-label={ariaLabel}
      className={`tap press ${VARIANT[variant]} ${
        status === "error" ? "shake" : ""
      } inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium disabled:opacity-55 ${className}`}
    >
      {StatusIcon ? (
        <StatusIcon
          className={`size-4 shrink-0 ${status === "loading" ? "animate-spin" : ""}`}
          strokeWidth={2}
          aria-hidden={true}
        />
      ) : null}
      <span className="truncate">{label}</span>
    </button>
  );
}

/**
 * Interruptor con `role="switch"`: nombre, estado y sí/no visibles, y el
 * movimiento del perno solo acompaña lo que ya dice el texto y `aria-checked`.
 */
export function SwitchRow({
  on,
  label,
  hint,
  onChange,
}: {
  on: boolean;
  label: string;
  hint: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => {
        onChange(!on);
        announce(`${label}: ${!on ? "activado" : "desactivado"}`);
      }}
      className="tap press card lift flex w-full items-center gap-4 px-4 py-3 text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-base text-ink">{label}</span>
        <span className="mt-1 block text-sm leading-relaxed text-stone">{hint}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        <span
          className={`switch-track relative h-7 w-12 rounded-full ${on ? "bg-leaf" : "bg-line-strong"}`}
        >
          <span
            className={`knob absolute top-0.5 grid size-6 place-items-center rounded-full bg-paper shadow-sm ${
              on ? "translate-x-5" : "translate-x-0.5"
            }`}
          >
            <Check
              className={`size-3.5 text-leaf transition-opacity duration-200 ${
                on ? "opacity-100" : "opacity-0"
              }`}
              strokeWidth={3}
              aria-hidden={true}
            />
          </span>
        </span>
        <span className="text-[0.7rem] tracking-wide text-stone uppercase">{on ? "Sí" : "No"}</span>
      </span>
    </button>
  );
}

/**
 * Botón de guardar: corazón que late, chispas al guardar, aviso con
 * "Deshacer" y estado accesible con `aria-pressed`.
 */
export function SaveButton({
  slug,
  saved,
  onToggle,
  variant = "outline",
  className = "",
}: {
  slug: string;
  saved: boolean;
  onToggle: (slug: string) => void;
  variant?: ActionVariant;
  className?: string;
}) {
  const [burst, setBurst] = useState(0);

  function toggle() {
    const next = !saved;
    onToggle(slug);
    if (next) {
      setBurst((value) => value + 1);
      toast("Guardado en este teléfono.", {
        tone: "success",
        action: { label: "Deshacer", run: () => onToggle(slug) },
      });
    } else {
      toast("Quitado de guardados.", {
        action: { label: "Deshacer", run: () => onToggle(slug) },
      });
    }
  }

  return (
    <button
      type="button"
      className={`tap press ${VARIANT[variant]} ${
        saved ? "ring-soft !border-leaf" : ""
      } inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm ${
        saved ? "text-leaf" : "text-ink"
      } ${className}`}
      aria-pressed={saved}
      onClick={toggle}
    >
      <span className="relative grid size-5 place-items-center">
        <Heart
          className={`absolute size-5 text-citrus transition-[opacity,scale,filter] duration-300 ${
            saved ? "scale-100 opacity-100 blur-none" : "scale-50 opacity-0 blur-[3px]"
          }`}
          fill="currentColor"
          strokeWidth={1.75}
          aria-hidden={true}
        />
        <Heart
          className={`size-5 transition-[opacity,scale,filter] duration-300 ${
            saved ? "scale-50 opacity-0 blur-[3px]" : "scale-100 opacity-100 blur-none"
          }`}
          strokeWidth={1.75}
          aria-hidden={true}
        />
        {burst > 0 ? <SparkBurst key={burst} /> : null}
      </span>
      {saved ? "Guardado" : "Guardar"}
    </button>
  );
}
