import Link from "next/link";
import { AdminButton } from "./AdminButton";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { TodayDate } from "./TodayDate";
import { about } from "../../../content/about";
import { site } from "@/lib/site";

export function Masthead({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  return (
    <>
      {/* Barra de navegación fija: es hermana de la cabecera (no hija) para que se quede
          pegada arriba durante todo el scroll de la página. Sus enlaces no se traducen. */}
      <div id="site-nav" className="sticky top-0 z-40 bg-paper border-b border-rule">
        <div className="max-w-6xl mx-auto px-4 py-2 flex justify-between items-center">
          <span className="label text-muted font-normal normal-case tracking-wide hidden sm:inline">
            {dict.common.location}
          </span>
          <nav className="flex flex-wrap items-center gap-x-3 gap-y-2 sm:gap-x-6 label text-muted w-full sm:w-auto justify-between sm:justify-end">
            <Link href={localePath(lang)} className="hover:text-accent transition-colors">{dict.nav.home}</Link>
            <Link href={localePath(lang, "/about")} className="hover:text-accent transition-colors">{dict.nav.about}</Link>
            <Link href={localePath(lang, "/articles")} className="hover:text-accent transition-colors">{dict.nav.articles}</Link>
            <a href={`mailto:${about.email}`} className="hover:text-accent transition-colors hidden sm:inline">{dict.nav.contact}</a>
            <Link
              href={localePath(lang, "/newsletter")}
              className="rounded-full label border border-ink text-ink px-3 py-1 leading-none hover:bg-ink hover:text-inverse transition-colors"
            >
              {dict.nav.newsletter}
            </Link>
            <LanguageSwitcher current={lang} label={dict.nav.language} />
            <AdminButton lang={lang} loginLabel={dict.nav.login} />
          </nav>
        </div>
      </div>

      <header className="border-b-4 border-ink pt-4 pb-3">
        <div className="max-w-6xl mx-auto px-4">
          {/* Nameplate — display font */}
          <div className="text-center py-2">
            <Link href={localePath(lang)} className="no-underline">
              {/* Altura de línea holgada: la "p" de "Paper" tiene rabo y con leading-none pisaba el lema */}
              <span className="block font-display text-4xl sm:text-6xl md:text-8xl font-black tracking-tight text-ink leading-[1.18]">
                {site.name}
              </span>
              <span className="block font-display text-sm tracking-[0.3em] uppercase text-muted font-normal italic mt-1.5">
                {dict.common.tagline}
              </span>
            </Link>
          </div>

          {/* Edition line */}
          <div className="flex justify-between items-center border-t border-ink mt-3 pt-2">
            <span className="label text-muted font-normal normal-case tracking-wide">
              <TodayDate lang={lang} />
            </span>
            <span className="label text-muted font-normal normal-case tracking-wide">
              {site.domain}
            </span>
          </div>
        </div>
      </header>
    </>
  );
}
