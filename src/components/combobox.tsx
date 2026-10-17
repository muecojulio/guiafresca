import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, MapPin, Search, X } from "lucide-react";
import { matchesQuery, foldText } from "@/lib/interaction";

export type ComboOption = {
  id: string;
  label: string;
  hint?: string;
  /** Agrupación opcional, solo informativa. */
  group?: string;
};

type SearchComboboxProps = {
  /** Nombre del campo: se usa como etiqueta accesible cuando no hay una visible. */
  label: string;
  options: ComboOption[];
  onSelect: (option: ComboOption) => void;
  /** Enter sin opción activa (por ejemplo, ver todos los resultados). */
  onSubmit?: (query: string) => void;
  value: string;
  onValueChange: (next: string) => void;
  placeholder?: string;
  inputId: string;
  icon?: "search" | "map";
  emptyMessage?: string;
  hint?: string;
  /** Ofrece lo escrito tal cual, con esta etiqueta ("Usar «Puebla»"). */
  freeTextTemplate?: (query: string) => string;
  maxOptions?: number;
  className?: string;
  footer?: (query: string, close: () => void) => ReactNode;
};

/**
 * Combobox con búsqueda: filtra sin distinguir mayúsculas ni diacríticos
 * ("platano" encuentra "Plátano"), navega con flechas / Inicio / Fin,
 * confirma con Enter, cierra con Escape o al tocar fuera, mantiene visible la
 * opción activa y avisa cuando no hay coincidencias. El botón lateral abre y
 * cierra la lista con un toque cómodo, sin depender del gesto.
 */
export function SearchCombobox({
  label,
  options,
  onSelect,
  onSubmit,
  value,
  onValueChange,
  placeholder,
  inputId,
  icon = "search",
  emptyMessage = "Sin coincidencias. Prueba otra palabra.",
  hint,
  freeTextTemplate,
  maxOptions = 40,
  className = "",
  footer,
}: SearchComboboxProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  // Al devolver el foco al campo no queremos que el simple foco vuelva a
  // abrir la lista que se acaba de cerrar (elegir, limpiar o cerrar).
  const ignoreNextFocusRef = useRef(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLUListElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const uid = useId().replace(/[:]/g, "");
  const inputIdFinal = `${inputId}-${uid}`;
  const listId = `${inputIdFinal}-list`;

  const filtered = useMemo(() => {
    const query = foldText(value);
    const pool = options.filter((option) =>
      matchesQuery(`${option.label} ${option.hint ?? ""} ${option.group ?? ""}`, query),
    );
    if (!query) return pool.slice(0, maxOptions);
    // Lo que empieza con lo escrito va primero: menos ruido al teclear.
    return [
      ...pool.filter((option) => foldText(option.label).startsWith(query)),
      ...pool.filter((option) => !foldText(option.label).startsWith(query)),
    ].slice(0, maxOptions);
  }, [options, value, maxOptions]);

  const freeOption: ComboOption | null =
    freeTextTemplate &&
    value.trim().length >= 2 &&
    !filtered.some((option) => foldText(option.label) === foldText(value))
      ? { id: `free:${value.trim()}`, label: freeTextTemplate(value.trim()) }
      : null;

  const visible = freeOption ? [freeOption, ...filtered] : filtered;

  useEffect(() => {
    setActive((current) => (current >= visible.length ? -1 : current));
  }, [visible.length]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && open) setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open || active < 0) return;
    const node = listRef.current?.children.item(active) as HTMLElement | null;
    node?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  /** Devuelve el foco al campo sin reabrir la lista. */
  function focusInput() {
    ignoreNextFocusRef.current = true;
    inputRef.current?.focus();
    ignoreNextFocusRef.current = false;
  }

  function choose(option: ComboOption) {
    onSelect(option);
    setOpen(false);
    setActive(-1);
    focusInput();
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    const count = visible.length;
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        if (!open) setOpen(true);
        setActive((current) => (count === 0 ? -1 : current >= count - 1 ? 0 : current + 1));
        return;
      case "ArrowUp":
        event.preventDefault();
        if (!open) setOpen(true);
        setActive((current) => (count === 0 ? -1 : current <= 0 ? count - 1 : current - 1));
        return;
      case "Home":
        if (!open || count === 0) return;
        event.preventDefault();
        setActive(0);
        return;
      case "End":
        if (!open || count === 0) return;
        event.preventDefault();
        setActive(count - 1);
        return;
      case "Enter": {
        if (open && active >= 0 && visible[active]) {
          event.preventDefault();
          choose(visible[active]);
          return;
        }
        onSubmit?.(value);
        return;
      }
      case "Escape":
        if (!open) return;
        event.preventDefault();
        setOpen(false);
        return;
      case "Tab":
        setOpen(false);
        return;
      default:
        return;
    }
  }

  const activeOption = active >= 0 ? visible[active] : undefined;
  const Icon = icon === "map" ? MapPin : Search;

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <div className="relative flex items-center">
        <Icon
          className="pointer-events-none absolute left-4 size-4 text-stone"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id={inputIdFinal}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeOption ? `${listId}-${activeOption.id}` : undefined}
          aria-label={label}
          aria-describedby={hint ? `${inputIdFinal}-hint` : undefined}
          autoComplete="off"
          spellCheck={false}
          value={value}
          placeholder={placeholder}
          onChange={(event) => {
            onValueChange(event.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => {
            if (ignoreNextFocusRef.current) return;
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          className="field min-h-12 w-full rounded-full border border-line bg-card pr-24 pl-11 text-base text-ink outline-none placeholder:text-stone"
        />
        <span className="absolute right-2 flex items-center gap-1">
          {value ? (
            <button
              type="button"
              aria-label="Borrar búsqueda"
              className="tap grid size-9 place-items-center rounded-full text-stone"
              onClick={() => {
                onValueChange("");
                setActive(-1);
                focusInput();
              }}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          ) : null}
          <button
            type="button"
            aria-label={open ? `Cerrar ${label}` : `Abrir ${label}`}
            aria-expanded={open}
            aria-controls={listId}
            className="tap press grid size-10 place-items-center rounded-full border border-line bg-paper text-ink"
            onClick={() => {
              setOpen((current) => !current);
              focusInput();
            }}
          >
            <ChevronDown
              className={`size-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
              aria-hidden="true"
            />
          </button>
        </span>
      </div>
      {hint ? (
        <span id={`${inputIdFinal}-hint`} className="sr-only">
          {hint}
        </span>
      ) : null}

      {open ? (
        <div className="panel-enter absolute inset-x-0 top-[3.4rem] z-30 overflow-hidden rounded-card border border-line bg-card shadow-lift">
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={label}
            className="max-h-72 overflow-y-auto overscroll-contain py-1"
          >
            {visible.length === 0 ? (
              <li className="px-4 py-3 text-sm text-stone" role="presentation">
                {emptyMessage}
              </li>
            ) : null}
            {visible.map((option, index) => (
              <li
                key={option.id}
                id={`${listId}-${option.id}`}
                role="option"
                aria-selected={index === active}
                onPointerDown={(event) => event.preventDefault()}
                onClick={() => choose(option)}
                onMouseEnter={() => setActive(index)}
                className={`flex min-h-11 cursor-pointer items-center gap-3 px-4 py-2 text-sm ${
                  index === active ? "bg-leaf-soft text-leaf-deep" : "text-ink"
                }`}
              >
                <span className="min-w-0 flex-1 truncate">
                  {option.label}
                  {option.hint ? (
                    <span className="ml-2 text-xs text-stone">{option.hint}</span>
                  ) : null}
                </span>
                {index === active ? <Check className="size-4 shrink-0" aria-hidden="true" /> : null}
              </li>
            ))}
          </ul>
          {footer ? (
            <div className="border-t border-line px-2 py-1">
              {footer(value, () => setOpen(false))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
