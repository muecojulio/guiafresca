import { createServerFn } from "@tanstack/react-start";

export type Clima = {
  city: string;
  temp: number;
  hot: boolean;
  veryHot: boolean;
};

type CacheEntry = { at: number; value: Clima };
const cache = new Map<string, CacheEntry>();
const TTL_MS = 30 * 60 * 1000;

function cleanCity(raw: unknown): string {
  if (typeof raw !== "string") throw new Error("Escribe una ciudad.");
  const city = raw.trim().slice(0, 40);
  if (!/^[\p{L}\p{N}\s.'-]{2,40}$/u.test(city)) throw new Error("Esa ciudad no se puede consultar.");
  return city;
}

export const climaDe = createServerFn({ method: "GET" })
  .validator(cleanCity)
  .handler(async ({ data: city }) => {
    const key = city.toLocaleLowerCase("es");
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.value;

    // Mismo contrato público, sin llave, que documenta
    // https://github.com/open-meteo/open-meteo : geocoding y current=temperature_2m.
    const geoUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
    geoUrl.searchParams.set("name", city);
    geoUrl.searchParams.set("count", "1");
    geoUrl.searchParams.set("language", "es");
    geoUrl.searchParams.set("format", "json");
    const geoRes = await fetch(geoUrl, {
      headers: { Accept: "application/json", "User-Agent": "GuiaFresca/1.0 (guia de conservacion en el hogar)" },
      signal: AbortSignal.timeout(8000),
      redirect: "error",
    });
    if (!geoRes.ok) throw new Error("El clima no respondió.");
    const geo = (await geoRes.json()) as {
      results?: Array<{ name?: string; latitude?: number; longitude?: number; country?: string }>;
    };
    const place = geo.results?.[0];
    if (!place || typeof place.latitude !== "number" || typeof place.longitude !== "number") {
      throw new Error("No encontré esa ciudad.");
    }

    const forecast = new URL("https://api.open-meteo.com/v1/forecast");
    forecast.searchParams.set("latitude", String(place.latitude));
    forecast.searchParams.set("longitude", String(place.longitude));
    forecast.searchParams.set("current", "temperature_2m");
    forecast.searchParams.set("timezone", "auto");
    const weatherRes = await fetch(forecast, {
      headers: { Accept: "application/json", "User-Agent": "GuiaFresca/1.0 (guia de conservacion en el hogar)" },
      signal: AbortSignal.timeout(8000),
      redirect: "error",
    });
    if (!weatherRes.ok) throw new Error("El clima no respondió.");
    const weather = (await weatherRes.json()) as { current?: { temperature_2m?: number } };
    const temp = weather.current?.temperature_2m;
    if (typeof temp !== "number" || !Number.isFinite(temp)) throw new Error("El clima no respondió.");

    const value: Clima = {
      city: place.country ? `${place.name}, ${place.country}` : (place.name ?? city),
      temp: Math.round(temp * 10) / 10,
      hot: temp >= 25,
      veryHot: temp >= 32,
    };
    cache.set(key, { at: Date.now(), value });
    if (cache.size > 40) {
      const oldest = cache.keys().next().value;
      if (oldest) cache.delete(oldest);
    }
    return value;
  });
