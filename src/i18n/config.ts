export const locales = ["es", "en", "nl"] as const;
export type Locale = (typeof locales)[number];

// Idioma por defecto cuando el navegador no declara ninguno de los soportados.
export const defaultLocale: Locale = "en";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export const localeNames: Record<Locale, string> = {
  es: "Español",
  en: "English",
  nl: "Nederlands",
};

export const hasLocale = (value: string | undefined | null): value is Locale =>
  !!value && (locales as readonly string[]).includes(value);

// Ruta pública con prefijo de idioma: localePath("es", "/articles") -> "/es/articles"
export const localePath = (lang: Locale, path = "/") =>
  `/${lang}${path === "/" ? "" : path}`;

// Quita el prefijo de idioma de una ruta: "/es/articles" -> "/articles"
export function stripLocale(pathname: string): string {
  const [, first, ...rest] = pathname.split("/");
  if (!hasLocale(first)) return pathname;
  return rest.length ? `/${rest.join("/")}` : "/";
}

// Elige idioma a partir de Accept-Language ("es-ES,es;q=0.9,en;q=0.8").
export function matchAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return defaultLocale;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { base: tag.trim().toLowerCase().split("-")[0], q: q ? Number(q.trim().slice(2)) : 1 };
    })
    .filter((x) => x.base && !Number.isNaN(x.q) && x.q > 0)
    .sort((a, b) => b.q - a.q);
  for (const { base } of ranked) if (hasLocale(base)) return base;
  return defaultLocale;
}
