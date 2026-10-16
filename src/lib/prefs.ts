export const KEYS = {
  saved: "guiafresca.guardados",
  night: "guiafresca.noche",
  heat: "guiafresca.calor",
  ethylene: "guiafresca.etileno",
} as const;

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
