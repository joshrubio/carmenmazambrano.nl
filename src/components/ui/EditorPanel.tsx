import Link from "next/link";
import { PhotoSlot } from "./PhotoSlot";
import { about } from "../../../content/about";
import { localePath, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries";

const socialIcons: Record<string, React.ReactNode> = {
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.19 8.19 0 004.79 1.53V6.82a4.85 4.85 0 01-1.02-.13z" />
    </svg>
  ),
};

const socialLabels: Record<string, string> = {
  linkedin: "LinkedIn",
  tiktok: "TikTok",
};

const stroke = (d: string) => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const MAIL = "M4 6h16v12H4zM4 7l8 6 8-6";
const PHONE = "M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z";
const ARROW = "M5 12h14M13 6l6 6-6 6";

const roundButton =
  "w-10 h-10 rounded-full border border-rule bg-white text-ink flex items-center justify-center hover:bg-ink hover:text-inverse hover:border-ink transition-colors";

// Tarjeta de la editora (columna izquierda de la portada): foto grande a sangre con el nombre
// encima y, debajo, una tarjeta suave con la biografía, las especialidades y el contacto.
export function EditorPanel({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const socialEntries = Object.entries(about.social) as [string, string][];

  return (
    <section
      aria-label={dict.hero.label}
      className="rounded-2xl overflow-hidden border border-rule/70 bg-gradient-to-b from-white to-surface/70 shadow-soft"
    >
      {/* Foto grande con el nombre encima */}
      <div className="relative w-full aspect-[4/5] bg-surface">
        <PhotoSlot src={about.photo} alt={about.name} grayscale={false} fallbackText={dict.common.photoComingSoon} />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent pointer-events-none" />
        <span className="absolute top-3 left-3 label text-inverse bg-accent rounded-full px-3 py-1">{dict.hero.label}</span>
        <div className="absolute bottom-0 inset-x-0 p-5 text-inverse">
          <h2 className="font-display text-3xl font-black leading-none">{about.name}</h2>
          <p className="font-display italic text-inverse/80 text-sm mt-1">{dict.hero.photoCaption}</p>
        </div>
      </div>

      <div className="p-5">
        {/* Titular de la casa */}
        <p className="font-display text-2xl font-black leading-[1.05] tracking-tight text-ink">
          {dict.hero.headline.map((line, i) => (
            <span key={i} className={i === 1 ? "text-accent" : undefined}>
              {line}{" "}
            </span>
          ))}
        </p>

        <div className="mt-4 space-y-3">
          {dict.about.bio.map((para, i) => (
            <p key={i} className="font-body text-sm leading-[1.75] text-ink">
              {para}
            </p>
          ))}
        </div>

        {/* Especialidades */}
        <ul className="flex flex-wrap gap-1.5 mt-4">
          {dict.about.specialtiesList.map((s) => (
            <li key={s} className="label font-normal normal-case tracking-wide text-ink bg-surface rounded-full px-3 py-1">
              {s}
            </li>
          ))}
        </ul>

        {/* Contacto: botones redondos */}
        <div className="flex flex-wrap items-center gap-2 mt-5 pt-5 border-t border-rule/70">
          <a href={`mailto:${about.email}`} className={roundButton} aria-label={`${dict.hero.email}: ${about.email}`} title={about.email}>
            {stroke(MAIL)}
          </a>
          <a href={`tel:${about.phone}`} className={roundButton} aria-label={`${dict.hero.contact}: ${about.phone}`} title={about.phone}>
            {stroke(PHONE)}
          </a>
          {socialEntries.map(([key, url]) => (
            <a
              key={key}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={socialLabels[key] ?? key}
              title={socialLabels[key] ?? key}
              className={roundButton}
            >
              {socialIcons[key]}
            </a>
          ))}
        </div>

        <Link
          href={localePath(lang, "/about")}
          className="mt-5 flex items-center justify-center gap-2 label bg-ink text-inverse rounded-full px-5 py-3 hover:bg-accent transition-colors"
        >
          {dict.hero.fullProfile.replace(" →", "")}
          {stroke(ARROW)}
        </Link>
      </div>
    </section>
  );
}
