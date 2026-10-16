import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { GROUPS, PLACE_LABEL, type Guide, type GroupId, type HomePlace } from "@/lib/catalog";

/**
 * Shared UI primitives. Components only — the `usePrefs` / `useSavedSet` hooks
 * live in `@/lib/use-prefs` and `@/lib/use-saved-set` so this file stays
 * eligible for React fast refresh.
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
      onClick={() => onChange(!on)}
      className="tap flex w-full items-center gap-4 rounded-card border border-line bg-card px-4 py-3 text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-base text-ink">{label}</span>
        <span className="mt-1 block text-sm leading-relaxed text-stone">{hint}</span>
      </span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full ${on ? "bg-leaf" : "bg-line"} transition-colors duration-200`}>
        <span className={`knob absolute top-0.5 size-6 rounded-full bg-paper ${on ? "translate-x-5" : "translate-x-0.5"}`} />
      </span>
    </button>
  );
}

export function SaveButton({ slug, saved, onToggle }: { slug: string; saved: boolean; onToggle: (slug: string) => void }) {
  return (
    <button
      type="button"
      className="tap inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-card px-4 text-sm text-ink"
      aria-pressed={saved}
      onClick={() => onToggle(slug)}
    >
      <span className="relative size-4">
        <Heart
          className={`absolute inset-0 size-4 transition-[opacity,scale,filter] duration-300 ${
            saved ? "scale-100 opacity-100 blur-none" : "scale-[0.25] opacity-0 blur-[4px]"
          }`}
          fill="currentColor"
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <Heart
          className={`size-4 transition-[opacity,scale,filter] duration-300 ${
            saved ? "scale-[0.25] opacity-0 blur-[4px]" : "scale-100 opacity-100 blur-none"
          }`}
          strokeWidth={1.75}
          aria-hidden="true"
        />
      </span>
      {saved ? "Guardado" : "Guardar"}
    </button>
  );
}

const GROUP_LABEL = Object.fromEntries(GROUPS.map((group) => [group.id, group.label])) as Record<GroupId, string>;

export function GuideCard({ item, showEthylene }: { item: Guide; showEthylene: boolean }) {
  return (
    <Link
      to="/guia/$slug"
      params={{ slug: item.slug }}
      className="tap block overflow-hidden rounded-card border border-line bg-card"
    >
      {item.photo ? (
        <img src={item.photo} alt="" className="aspect-[4/3] w-full object-cover" />
      ) : (
        <div className="flex aspect-[4/3] items-end bg-paper p-4">
          <span className="font-display text-3xl text-leaf">{item.name.slice(0, 1)}</span>
        </div>
      )}
      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-display text-2xl leading-none">{item.name}</h2>
          <span className="pt-1 text-xs tracking-wide text-stone uppercase">{GROUP_LABEL[item.group]}</span>
        </div>
        <p className="text-sm leading-relaxed text-stone">{PLACE_LABEL[item.home]}</p>
        {showEthylene && item.ethylene !== "neutro" ? (
          <p className="text-xs text-citrus">
            {item.ethylene === "emite" ? "Suelta etileno" : "Sensible al etileno"}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

export function PlaceFilters({
  value,
  onChange,
}: {
  value: HomePlace | "todas";
  onChange: (next: HomePlace | "todas") => void;
}) {
  const options: { id: HomePlace | "todas"; label: string }[] = [
    { id: "todas", label: "Todo" },
    { id: "refrigerador", label: "Dentro" },
    { id: "fuera", label: "Fuera" },
    { id: "madura-fuera", label: "Madura fuera" },
  ];
  return (
    <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Dónde se guarda">
      {options.map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.id)}
            className={`tap min-h-11 shrink-0 rounded-full px-4 text-sm ${
              active ? "bg-ink text-paper" : "border border-line bg-card text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export function GroupFilters({
  value,
  onChange,
}: {
  value: GroupId | "todas";
  onChange: (next: GroupId | "todas") => void;
}) {
  const options = [{ id: "todas" as const, label: "Todo" }, ...GROUPS];
  return (
    <div className="flex gap-2" role="tablist" aria-label="Tipo">
      {options.map((option) => {
        const active = value === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.id)}
            className={`tap min-h-11 flex-1 rounded-full text-sm ${
              active ? "bg-leaf text-paper" : "text-stone"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
