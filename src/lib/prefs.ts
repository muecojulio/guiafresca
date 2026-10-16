export const KEYS = {
  saved: "guiafresca.guardados",
  night: "guiafresca.noche",
  heat: "guiafresca.calor",
  ethylene: "guiafresca.etileno",
  city: "guiafresca.ciudad",
} as const;

export const DEFAULT_CITY = "Ciudad de México";

function readList(): string[] {
  try {
    const raw = localStorage.getItem(KEYS.saved);
    const parsed = raw ? (JSON.parse(raw) as unknown) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => typeof item === "string");
  } catch {
    return [];
  }
}

export function readSaved(): string[] {
  if (typeof window === "undefined") return [];
  return readList();
}

export function toggleSaved(slug: string): string[] {
  const current = readList();
  const next = current.includes(slug) ? current.filter((item) => item !== slug) : [slug, ...current];
  localStorage.setItem(KEYS.saved, JSON.stringify(next));
  window.dispatchEvent(new Event("guiafresca-saved"));
  return next;
}

export function readFlag(key: string): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(key) === "1";
}

export function writeFlag(key: string, on: boolean) {
  localStorage.setItem(key, on ? "1" : "0");
  window.dispatchEvent(new Event("guiafresca-prefs"));
}

export function applyNight(on: boolean) {
  document.documentElement.classList.toggle("night", on);
}

export function readCity(): string {
  if (typeof window === "undefined") return DEFAULT_CITY;
  const raw = localStorage.getItem(KEYS.city)?.trim();
  return raw && raw.length >= 2 ? raw.slice(0, 40) : DEFAULT_CITY;
}

export function writeCity(city: string) {
  const next = city.trim().slice(0, 40);
  if (next.length < 2) return;
  localStorage.setItem(KEYS.city, next);
  window.dispatchEvent(new Event("guiafresca-prefs"));
}
