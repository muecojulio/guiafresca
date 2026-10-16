import { createServerFn } from "@tanstack/react-start";

export type MiCiudad = {
  city: string;
  region: string;
  country: string;
};

function cleanCityValue(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const city = raw.trim().slice(0, 40);
  if (city.length < 2) return null;
  if (!/^[\p{L}\p{N}\s.'-]{2,40}$/u.test(city)) return null;
  return city;
}

/**
 * Rough city from the caller's IP, via ipapi.co — a public
 * API that needs no key and no registration (free tier:
 * ~1,000 requests a day). Only fires from an explicit
 * "usar mi ubicación" tap; the answer is coarse (city-level)
 * and is used solely to pick a weather city.
 */
export const miCiudad = createServerFn({ method: "GET" })
  .handler(async (): Promise<MiCiudad> => {
    const response = await fetch("https://ipapi.co/json/", {
      headers: {
        Accept: "application/json",
        "User-Agent": "GuiaFresca/1.0 (guia de conservacion en el hogar)",
      },
      signal: AbortSignal.timeout(8000),
      redirect: "error",
    });
    if (!response.ok) throw new Error("No pude detectar la ciudad.");
    const body = (await response.json()) as {
      city?: unknown;
      region?: unknown;
      country_name?: unknown;
    };
    const city = cleanCityValue(body.city);
    const region = cleanCityValue(body.region) ?? "";
    const country = cleanCityValue(body.country_name) ?? "";
    if (!city) throw new Error("No pude detectar la ciudad.");
    return { city, region, country };
  });
