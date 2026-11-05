"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { localePath, stripLocale, type Locale } from "@/i18n/config";

const icon = (d: string) => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);

// El panel está siempre en español. Los enlaces a la web pública usan el idioma actual.
const tabs = (lang: Locale) => [
  { href: "/admin/new", label: "Redactar", icon: icon("M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4 12.5-12.5z") },
  { href: localePath(lang, "/articles"), label: "Notas de prensa", icon: icon("M4 4h13v16H6a2 2 0 01-2-2V4zM17 8h3v10a2 2 0 01-2 2M8 8h5M8 12h5M8 16h5") },
  { href: localePath(lang, "/about"), label: "About", icon: icon("M12 12a4 4 0 100-8 4 4 0 000 8zM4 21a8 8 0 0116 0") },
  { href: "/admin/comments", label: "Comentarios", icon: icon("M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z") },
  { href: "/contact-list", label: "Suscriptores", icon: icon("M9 11a3.5 3.5 0 100-7 3.5 3.5 0 000 7zM2.5 20a6.5 6.5 0 0113 0M16 4.3a3.5 3.5 0 010 6.4M18 14.2a6.5 6.5 0 013.5 5.8") },
  { href: "/admin/newsletter", label: "Newsletter", icon: icon("M22 3L11 14M22 3l-7 18-4-7-7-4 18-7z") },
];

const STORAGE_KEY = "admin-panel-collapsed";

function isActive(pathname: string, href: string) {
  // /es/articles y /es/articles/mi-nota cuentan como la pestaña "Notas de prensa"
  return stripLocale(pathname) === stripLocale(href) || stripLocale(pathname).startsWith(`${stripLocale(href)}/`);
}

// Envuelve el contenido de cada página. Con sesión de admin añade un panel plegable:
// barra lateral en escritorio (se pliega a una tira de iconos) y una barra desplegable
// en móvil. Sin sesión no renderiza nada extra. La estructura es estable para que
// `children` no se vuelva a montar al detectar la sesión.
export function AdminShell({ lang, children }: { lang: Locale; children: React.ReactNode }) {
  const pathname = usePathname();
  const TABS = tabs(lang);
  const [authenticated, setAuthenticated] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  // En móvil el panel está plegado por defecto y se cierra solo al cambiar de página
  const [openPath, setOpenPath] = useState<string | null>(null);
  const mobileOpen = openPath === pathname;
  const current = TABS.find((t) => isActive(pathname, t.href));

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setAuthenticated(d.authenticated === true);
        try {
          setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
        } catch {}
      })
      .catch(() => setAuthenticated(false));
  }, [pathname]);

  // La barra de navegación es fija: el panel se ancla justo debajo, con su altura real.
  useEffect(() => {
    const nav = document.getElementById("site-nav");
    if (!nav) return;
    const set = () => document.documentElement.style.setProperty("--nav-h", `${nav.offsetHeight}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(nav);
    return () => ro.disconnect();
  }, []);

  function toggleCollapsed() {
    setCollapsed((c) => {
      try {
        localStorage.setItem(STORAGE_KEY, c ? "0" : "1");
      } catch {}
      return !c;
    });
  }

  return (
    <div className="flex-1 flex flex-col">
      {authenticated && (
        <nav aria-label="Administración" className="lg:hidden border-b border-rule bg-surface">
          <button
            type="button"
            onClick={() => setOpenPath(mobileOpen ? null : pathname)}
            aria-expanded={mobileOpen}
            className="w-full flex items-center justify-between gap-3 px-4 py-3"
          >
            <span className="label text-accent">Panel{current ? ` · ${current.label}` : ""}</span>
            <svg viewBox="0 0 24 24" className={`w-4 h-4 text-muted transition-transform ${mobileOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          {mobileOpen && (
            <ul className="flex gap-1 px-4 pb-2 overflow-x-auto whitespace-nowrap">
              {TABS.map((t) => (
                <li key={t.href}>
                  <Link
                    href={t.href}
                    className={`label flex items-center gap-2 px-3 py-2 border-b-2 ${
                      isActive(pathname, t.href) ? "border-accent text-accent" : "border-transparent text-muted hover:text-ink"
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </nav>
      )}
      <div className="flex flex-1">
        {authenticated && (
          <aside
            aria-label="Administración"
            className={`hidden lg:block shrink-0 border-r border-rule bg-surface transition-[width] duration-200 ${collapsed ? "w-14" : "w-52"}`}
          >
            <div className={`sticky top-[var(--nav-h,3rem)] max-h-[calc(100vh-var(--nav-h,3rem))] overflow-y-auto ${collapsed ? "p-2" : "p-4"}`}>
              <div className={`flex items-center mb-3 ${collapsed ? "justify-center" : "justify-between"}`}>
                {!collapsed && <p className="label text-accent pl-2">Panel</p>}
                <button
                  type="button"
                  onClick={toggleCollapsed}
                  aria-expanded={!collapsed}
                  aria-label={collapsed ? "Desplegar el panel" : "Plegar el panel"}
                  title={collapsed ? "Desplegar el panel" : "Plegar el panel"}
                  className="w-8 h-8 flex items-center justify-center text-muted hover:text-ink hover:bg-paper transition-colors"
                >
                  <svg viewBox="0 0 24 24" className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M15 6l-6 6 6 6" />
                  </svg>
                </button>
              </div>
              <ul className="space-y-1">
                {TABS.map((t) => (
                  <li key={t.href}>
                    <Link
                      href={t.href}
                      title={collapsed ? t.label : undefined}
                      aria-label={collapsed ? t.label : undefined}
                      className={`label flex items-center gap-3 border-l-2 ${collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2"} ${
                        isActive(pathname, t.href)
                          ? "border-accent bg-paper text-accent"
                          : "border-transparent text-muted hover:text-ink hover:bg-paper"
                      }`}
                    >
                      {t.icon}
                      {!collapsed && <span>{t.label}</span>}
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
