import type { Metadata } from "next";
import { localePath, locales, defaultLocale, type Locale } from "./config";

// URL canónica + alternativas hreflang de una página pública.
// alternatesFor("es", "/articles") -> canonical /es/articles, alternates es/en/nl/x-default
export function alternatesFor(lang: Locale, path = "/"): NonNullable<Metadata["alternates"]> {
  return {
    canonical: localePath(lang, path),
    languages: {
      ...Object.fromEntries(locales.map((l) => [l, localePath(l, path)])),
      "x-default": localePath(defaultLocale, path),
    },
  };
}
