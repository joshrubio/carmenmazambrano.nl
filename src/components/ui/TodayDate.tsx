"use client";

import { useSyncExternalStore } from "react";
import type { Locale } from "@/i18n/config";

const intlLocales: Record<Locale, string> = { es: "es-ES", en: "en-GB", nl: "nl-NL" };

const subscribe = () => () => {};

// Fecha de hoy en la cabecera, como en un periódico. Se calcula en el navegador (la
// página es estática y la del servidor sería la del día del despliegue); en el servidor
// y durante la hidratación no se pinta nada para que no haya diferencias.
export function TodayDate({ lang }: { lang: Locale }) {
  const text = useSyncExternalStore(
    subscribe,
    () =>
      new Intl.DateTimeFormat(intlLocales[lang], {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    () => ""
  );
  return <span suppressHydrationWarning>{text || " "}</span>;
}
