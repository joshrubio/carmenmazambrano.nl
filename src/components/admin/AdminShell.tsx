"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { localePath, stripLocale, type Locale } from "@/i18n/config";

// El panel está siempre en español. Los enlaces a la web pública usan el idioma actual.
const tabs = (lang: Locale) => [
  { href: "/admin/new", label: "Redactar" },
  { href: localePath(lang, "/articles"), label: "Notas de prensa" },
  { href: localePath(lang, "/about"), label: "About" },
  { href: "/contact-list", label: "Suscriptores" },
];

function isActive(pathname: string, href: string) {
  // /es/articles y /es/articles/mi-nota cuentan como la pestaña "Notas de prensa"
  return stripLocale(pathname) === stripLocale(href) || stripLocale(pathname).startsWith(`${stripLocale(href)}/`);
}

// Envuelve el contenido de cada página. Con sesión de admin añade una sidebar
// (escritorio) o una barra de pestañas (móvil). Sin sesión no renderiza nada extra.
// La estructura es estable para que `children` no se vuelva a montar al detectar la sesión.
export function AdminShell({ lang, children }: { lang: Locale; children: React.ReactNode }) {
  const pathname = usePathname();
  const TABS = tabs(lang);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setAuthenticated(d.authenticated === true))
      .catch(() => setAuthenticated(false));
  }, [pathname]);

  return (
    <div className="flex-1 flex flex-col">
      {authenticated && (
        <nav
          aria-label="Administración"
          className="lg:hidden border-b border-rule bg-surface overflow-x-auto"
        >
          <ul className="flex gap-1 px-4 whitespace-nowrap">
            {TABS.map((t) => (
              <li key={t.href}>
                <Link
                  href={t.href}
                  className={`label block px-3 py-3 border-b-2 ${
                    isActive(pathname, t.href)
                      ? "border-accent text-accent"
                      : "border-transparent text-muted hover:text-ink"
                  }`}
                >
                  {t.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <div className="flex flex-1">
        {authenticated && (
          <aside
            aria-label="Administración"
            className="hidden lg:block w-52 shrink-0 border-r border-rule bg-surface"
          >
            <div className="sticky top-0 p-5">
              <p className="label text-accent mb-4">Panel</p>
              <ul className="space-y-1">
                {TABS.map((t) => (
                  <li key={t.href}>
                    <Link
                      href={t.href}
                      className={`label block px-3 py-2 border-l-2 ${
                        isActive(pathname, t.href)
                          ? "border-accent bg-paper text-accent"
                          : "border-transparent text-muted hover:text-ink hover:bg-paper"
                      }`}
                    >
                      {t.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
        {children}
      </div>
    </div>
  );
}
