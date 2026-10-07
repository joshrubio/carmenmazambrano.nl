"use client";

import { createContext, useContext } from "react";
import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries";

// A los componentes cliente solo se les pasa el trozo del diccionario que usan
// (`client`, `categories`), no el diccionario entero.
interface LocaleContextValue {
  lang: Locale;
  t: Dictionary["client"];
  categories: Record<string, string>;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  lang,
  client,
  categories,
  children,
}: {
  lang: Locale;
  client: Dictionary["client"];
  categories: Record<string, string>;
  children: React.ReactNode;
}) {
  return <LocaleContext.Provider value={{ lang, t: client, categories }}>{children}</LocaleContext.Provider>;
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale debe usarse dentro de <LocaleProvider>");
  return ctx;
}

// Sustituye {placeholders} en un texto del diccionario.
export function format(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (m, k) => (k in values ? String(values[k]) : m));
}
