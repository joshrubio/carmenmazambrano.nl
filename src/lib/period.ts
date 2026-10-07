import type { Locale } from "@/i18n/config";

const MONTHS: Record<string, number> = {
  Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
};

const intlLocales: Record<Locale, string> = { es: "es-ES", en: "en-GB", nl: "nl-NL" };

// Convierte las fechas de la experiencia ("Feb 1993", "2023", "Present") al idioma actual.
export function formatPeriod(value: string, lang: Locale, presentLabel: string): string {
  if (value === "Present") return presentLabel;
  const m = value.match(/^([A-Z][a-z]{2}) (\d{4})$/);
  if (!m || !(m[1] in MONTHS)) return value;
  return new Intl.DateTimeFormat(intlLocales[lang], { month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(Number(m[2]), MONTHS[m[1]], 1))
  );
}
