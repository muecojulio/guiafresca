import { useEffect, useRef, type ReactNode } from "react";
import { Check } from "lucide-react";
import { nextRovingIndex } from "@/lib/interaction";
import { useOverflowRail } from "@/lib/use-overflow-rail";
import { announce } from "@/lib/announcer";

export type ChipOption<T extends string> = {
  id: T;
  label: string;
  icon?: ReactNode;
  /** Color del punto/realce cuando la opción está elegida. */
  accent?: string;
};

/**
 * Filtros en carril horizontal con semántica de grupo de radios: una sola
 * opción elegida, flechas del teclado, Inicio/Fin, scroll nativo con imán
 * suave, puntos de desborde reales y la opción elegida centrada tras el
 * cambio. El desplazamiento del carril nunca activa una opción: un arrastre
 * anula el clic siguiente.
 */
export function ChipRail<T extends string>({
  options,
  value,
  onChange,
  label,
  className = "",
}: {
  options: ChipOption<T>[];
  value: T;
  onChange: (next: T) => void;
  label: string;
  className?: string;
}) {
  const rail = useOverflowRail<HTMLDivElement>(options.length);
  const index = Math.max(
    options.findIndex((option) => option.id === value),
    0,
  );
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const draggedRef = useRef(false);

  useEffect(() => {
    rail.scrollToIndex(index, { center: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function select(nextIndex: number) {
    const option = options[nextIndex];
    if (!option || option.id === value) return;
    onChange(option.id);
    announce(`${label}: ${option.label}`);
  }

  return (
    <div className={className}>
      <div
        className="rail-frame"
        data-overflow-start={!rail.atStart}
        data-overflow-end={!rail.atEnd}
      >
        <div
          ref={rail.ref}
          role="radiogroup"
          aria-label={label}
          className="rail -mx-5 px-5"
          onKeyDown={(event) => {
            const next = nextRovingIndex(event.key, index, options.length, "horizontal");
            if (next === null || next === index) return;
            event.preventDefault();
            select(next);
            window.requestAnimationFrame(() => buttonsRef.current[next]?.focus());
          }}
          onPointerDown={() => {
            draggedRef.current = false;
          }}
          onPointerMove={(event) => {
            if (event.buttons > 0) draggedRef.current = true;
          }}
          onClickCapture={(event) => {
            if (!draggedRef.current) return;
            // Desplazarse por el carril no elige nada.
            event.preventDefault();
            event.stopPropagation();
            draggedRef.current = false;
          }}
        >
          {options.map((option, optionIndex) => {
            const active = optionIndex === index;
            return (
              <button
                key={option.id}
                ref={(node) => {
                  buttonsRef.current[optionIndex] = node;
                }}
                type="button"
                role="radio"
                data-rail-item=""
                aria-checked={active}
                tabIndex={active ? 0 : -1}
                onClick={() => select(optionIndex)}
                className={`tap press inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full px-4 text-sm ${
                  active
                    ? "border border-leaf bg-leaf-soft font-medium text-leaf-deep"
                    : "border border-line bg-card text-ink"
                }`}
              >
                {active ? (
                  <Check className="size-4" strokeWidth={2.6} aria-hidden="true" />
                ) : option.icon ? (
                  <span className="grid size-4 place-items-center text-stone" aria-hidden="true">
                    {option.icon}
                  </span>
                ) : (
                  <span className="size-2 rounded-full bg-line-strong" aria-hidden="true" />
                )}
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      {rail.hasOverflow ? (
        <div className="mt-2 flex items-center gap-2 sm:hidden">
          <p className="text-xs text-stone">Desliza para ver más</p>
          <span className="rail-dots" role="presentation">
            {options.map((option, optionIndex) => (
              <span
                key={option.id}
                className="rail-dot"
                data-on={optionIndex === index}
                aria-hidden="true"
              />
            ))}
          </span>
        </div>
      ) : null}
    </div>
  );
}
