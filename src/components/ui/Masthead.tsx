import Link from "next/link";
import { AdminButton } from "./AdminButton";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { about } from "../../../content/about";

export function Masthead({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  return (
    <header className="border-b-4 border-ink pt-6 pb-3">
      <div className="max-w-6xl mx-auto px-4">
        {/* Top bar — UI font */}
        <div className="flex justify-between items-center border-b border-rule pb-2 mb-3">
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
              className="label border border-ink text-ink px-3 py-1 leading-none hover:bg-ink hover:text-inverse transition-colors"
            >
              {dict.nav.newsletter}
            </Link>
            <LanguageSwitcher current={lang} label={dict.nav.language} />
            <AdminButton lang={lang} loginLabel={dict.nav.login} />
          </nav>
        </div>

        {/* Nameplate — display font */}
        <div className="text-center py-2">
          <Link href={localePath(lang)} className="no-underline">
            <span className="block font-display text-4xl sm:text-6xl md:text-8xl font-black tracking-tight text-ink leading-none">
              Carmen Zambrano
            </span>
            <span className="block font-display text-sm tracking-[0.3em] uppercase text-muted font-normal italic mt-1">
              {dict.common.tagline}
            </span>
          </Link>
        </div>

        {/* Edition line */}
        <div className="flex justify-between items-center border-t border-ink mt-3 pt-2">
          <span className="label text-muted font-normal normal-case tracking-wide">
            {dict.common.est}
          </span>
          <span className="label text-muted font-normal normal-case tracking-wide">
            carmenzambrano.nl
          </span>
        </div>
      </div>
    </header>
  );
}
