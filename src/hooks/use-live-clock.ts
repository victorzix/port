"use client";

import { useEffect, useState } from "react";

const LOCALE_MAP: Record<string, string> = {
  pt: "pt-BR",
  en: "en-GB",
  es: "es-ES",
};

export function useLiveClock(locale: string) {
  const [clock, setClock] = useState("");

  useEffect(() => {
    function sync() {
      try {
        const formatted = new Intl.DateTimeFormat(
          LOCALE_MAP[locale] ?? "pt-BR",
          {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: "America/Sao_Paulo",
            hour12: false,
          },
        ).format(new Date());
        setClock(`${formatted} BRT`);
      } catch {
        setClock("");
      }
    }

    sync();
    const interval = setInterval(sync, 15_000);
    return () => clearInterval(interval);
  }, [locale]);

  return clock;
}
