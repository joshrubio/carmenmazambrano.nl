import Link from "next/link";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";
import { about } from "../../../content/about";

export function Footer({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  return (
    <footer className="border-t-4 border-ink mt-12 [section+&]:mt-0">
      <div className="max-w-6xl mx-auto px-4 pt-6 pb-4">

        {/* Main row: name + CTA */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
          <div>
            <p className="font-display text-3xl font-black text-ink leading-none">
              Carmen Zambrano
            </p>
            <p className="font-display text-sm italic text-muted font-normal mt-1">
              {dict.footer.tagline}
            </p>
          </div>
          <a
            href={`mailto:${about.email}`}
            className="label bg-accent text-inverse px-6 py-3 hover:opacity-90 transition-opacity whitespace-nowrap self-start sm:self-auto"
          >
            {dict.footer.contactCta}
          </a>
        </div>

        {/* Bottom strip */}
        <div className="border-t border-rule pt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <p className="label text-dim font-normal normal-case tracking-normal">
            © {new Date().getFullYear()} carmenzambrano.nl
          </p>
          <Link
            href={localePath(lang, "/privacy")}
            className="label text-dim font-normal normal-case tracking-normal hover:text-accent transition-colors"
          >
            {dict.footer.privacy}
          </Link>
        </div>

      </div>
    </footer>
  );
}
