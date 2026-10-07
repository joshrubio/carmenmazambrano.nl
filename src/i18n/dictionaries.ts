import "server-only";
import type { Locale } from "./config";

// Los diccionarios solo se cargan en el servidor: no engordan el JS del navegador.
// A los componentes cliente solo se les pasa el trozo que necesitan (ver LocaleProvider).
const dictionaries = {
  es: () => import("./dictionaries/es.json").then((m) => m.default),
  en: () => import("./dictionaries/en.json").then((m) => m.default),
  nl: () => import("./dictionaries/nl.json").then((m) => m.default),
};

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["en"]>>;

export const getDictionary = (lang: Locale): Promise<Dictionary> => dictionaries[lang]();
