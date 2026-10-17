import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { announce } from "@/lib/announcer";

/**
 * Panel plegable: abre y cierra con transición de altura (nada salta), el
 * control conserva `aria-expanded` / `aria-controls` y el contenido cerrado
 * queda fuera del orden de foco y de la lectura.
 */
export function Disclosure({
  label,
  hint,
  children,
  defaultOpen = false,
  icon,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  icon?: ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const uid = useId().replace(/[:]/g, "");
  const panelId = `panel-${uid}`;

  return (
    <section className={`card overflow-hidden ${className}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen((current) => {
            announce(`${label}: ${current ? "cerrado" : "abierto"}`);
            return !current;
          });
        }}
        className="disclosure tap flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left"
      >
        {icon ? (
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-leaf-soft text-leaf-deep">
            {icon}
          </span>
        ) : null}
        <span className="min-w-0 flex-1">
          <span className="block text-base text-ink">{label}</span>
          {hint ? <span className="mt-0.5 block text-sm text-stone">{hint}</span> : null}
        </span>
        <ChevronDown
          className="disclosure__chevron size-5 shrink-0 text-stone"
          aria-hidden="true"
        />
      </button>
      <div
        id={panelId}
        className="collapsible px-4"
        data-open={open ? "true" : "false"}
        inert={!open}
        aria-hidden={!open}
      >
        <div className="pb-4">{children}</div>
      </div>
    </section>
  );
}
