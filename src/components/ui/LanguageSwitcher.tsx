"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { hasLocale, LOCALE_COOKIE, localeNames, locales, stripLocale, type Locale } from "@/i18n/config";

// Recuerda el idioma elegido para que el proxy lo use en la próxima visita sin prefijo.
function rememberLocale(l: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
}

export function LanguageSwitcher({ current, label }: { current: Locale; label: string }) {
  const pathname = usePathname();
  const first = pathname.split("/")[1];
  // En rutas sin prefijo (admin) el cambio de idioma lleva a la portada.
  const rest = hasLocale(first) ? stripLocale(pathname) : "/";

  return (
    <ul aria-label={label} className="flex items-center gap-1">
      {locales.map((l) => {
        const active = l === current;
        return (
          <li key={l}>
            <Link
              href={`/${l}${rest === "/" ? "" : rest}`}
              hrefLang={l}
              lang={l}
              title={localeNames[l]}
              aria-current={active ? "true" : undefined}
              onClick={() => rememberLocale(l)}
              className={`label px-1.5 py-0.5 leading-none transition-colors ${
                active ? "text-accent underline underline-offset-4" : "text-muted hover:text-ink"
              }`}
            >
              {l.toUpperCase()}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
