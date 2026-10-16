import { useEffect, useState } from "react";
import { applyNight, KEYS, readFlag, writeFlag } from "@/lib/prefs";

/**
 * Night mode, heat and ethylene preferences, mirrored from `localStorage` and
 * kept in sync across tabs/components through the `guiafresca-prefs` event.
 *
 * Lives outside `@/components/ui` so that file keeps exporting components only
 * and stays eligible for React fast refresh.
 */
export function usePrefs() {
  const [night, setNight] = useState(false);
  const [heat, setHeat] = useState(false);
  const [ethylene, setEthylene] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      const nextNight = readFlag(KEYS.night);
      setNight(nextNight);
      setHeat(readFlag(KEYS.heat));
      const stored = localStorage.getItem(KEYS.ethylene);
      setEthylene(stored === null ? true : stored === "1");
      applyNight(nextNight);
      setReady(true);
    };
    sync();
    window.addEventListener("guiafresca-prefs", sync);
    return () => window.removeEventListener("guiafresca-prefs", sync);
  }, []);

  return {
    ready,
    night,
    heat,
    ethylene,
    setNight: (on: boolean) => {
      writeFlag(KEYS.night, on);
      applyNight(on);
      setNight(on);
    },
    setHeat: (on: boolean) => {
      writeFlag(KEYS.heat, on);
      setHeat(on);
    },
    setEthylene: (on: boolean) => {
      writeFlag(KEYS.ethylene, on);
      setEthylene(on);
    },
  };
}
