import { about } from "../../../content/about";
import type { Dictionary } from "@/i18n/dictionaries";

export type AdVariant = "classic" | "ink" | "slot";

const stroke = (d: string) => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={d} />
  </svg>
);
const MAIL = "M4 6h16v12H4zM4 7l8 6 8-6";
const PHONE = "M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z";
const ARROW = "M5 12h14M13 6l6 6-6 6";

// Tarjeta para captar anunciantes. Tres versiones para elegir:
//  · classic: anuncio de prensa, marco doble con filete discontinuo
//  · ink:     bloque oscuro, el contrapunto del burdeos de la newsletter
//  · slot:    como la ficha de la editora, con un hueco de anuncio de muestra
export function AdCard({ dict, variant = "classic" }: { dict: Dictionary; variant?: AdVariant }) {
  const A = dict.ads;
  const href = `mailto:${about.email}?subject=${encodeURIComponent(A.mailSubject)}`;

  if (variant === "ink") {
    return (
      <aside aria-label={A.label} className="relative overflow-hidden bg-ink text-inverse p-6 sm:p-7">
        <span
          aria-hidden="true"
          className="pointer-events-none select-none absolute -right-4 -bottom-10 font-display font-black text-[11rem] leading-none text-white/[0.06]"
        >
          Ad
        </span>
        <div className="relative">
          <span className="label bg-accent text-inverse px-3 py-1 inline-block">{A.label}</span>
          <h2 className="font-display text-4xl font-black leading-[1.02] mt-5">
            {A.lead}
            <span className="block italic font-normal text-inverse/70">{A.accent}</span>
          </h2>
          <p className="font-body text-sm leading-relaxed text-inverse/80 mt-4">{A.text}</p>
          <a
            href={href}
            className="mt-6 flex items-center justify-center gap-2 label bg-paper text-ink px-5 py-3 hover:bg-white transition-colors"
          >
            {A.cta}
            {stroke(ARROW)}
          </a>
          <p className="font-body text-xs text-inverse/60 mt-3">
            {A.hint}{" "}
            <a href={href} className="underline underline-offset-2 hover:text-inverse">
              {about.email}
            </a>
          </p>
        </div>
      </aside>
    );
  }

  if (variant === "slot") {
    return (
      <aside
        aria-label={A.label}
        className="overflow-hidden border border-rule/70 bg-gradient-to-b from-white to-surface/70 shadow-soft"
      >
        <div
          className="relative aspect-[4/3] bg-surface flex items-center justify-center p-6"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, transparent 0 10px, rgba(26,26,26,0.045) 10px 11px)",
          }}
        >
          <span className="absolute top-3 left-3 label text-inverse bg-accent px-3 py-1">{A.label}</span>
          <div className="w-full h-full border border-dashed border-ink/40 flex items-center justify-center text-center">
            <p className="font-display italic text-xl text-ink/60 px-4">{A.placeholder}</p>
          </div>
        </div>
        <div className="p-5">
          <h2 className="font-display text-2xl font-black leading-[1.05] tracking-tight text-ink">
            {A.lead} <span className="text-accent">{A.accent}</span>
          </h2>
          <p className="font-body text-sm leading-[1.75] text-ink mt-3">{A.text}</p>
          <div className="flex items-center gap-2 mt-5 pt-5 border-t border-rule/70">
            <a
              href={href}
              aria-label={`${dict.hero.email}: ${about.email}`}
              title={about.email}
              className="w-10 h-10 border border-rule bg-white text-ink flex items-center justify-center hover:bg-ink hover:text-inverse hover:border-ink transition-colors"
            >
              {stroke(MAIL)}
            </a>
            <a
              href={`tel:${about.phone}`}
              aria-label={`${dict.hero.contact}: ${about.phone}`}
              title={about.phone}
              className="w-10 h-10 border border-rule bg-white text-ink flex items-center justify-center hover:bg-ink hover:text-inverse hover:border-ink transition-colors"
            >
              {stroke(PHONE)}
            </a>
          </div>
          <a
            href={href}
            className="mt-5 flex items-center justify-center gap-2 label bg-ink text-inverse px-5 py-3 hover:bg-accent transition-colors"
          >
            {A.cta}
            {stroke(ARROW)}
          </a>
        </div>
      </aside>
    );
  }

  // classic
  return (
    <aside aria-label={A.label} className="border-2 border-ink bg-paper p-1.5">
      <div className="border border-dashed border-ink/60 px-6 py-8 text-center">
        <p className="label text-accent">{A.label}</p>
        <span aria-hidden="true" className="block mx-auto my-4 h-px w-12 bg-ink" />
        <h2 className="font-display text-4xl font-black leading-[1.02] text-ink">
          {A.lead}
          <span className="block text-accent">{A.accent}</span>
        </h2>
        <p className="font-body text-sm leading-relaxed text-muted mt-4">{A.text}</p>
        <a
          href={href}
          className="mt-6 inline-flex items-center justify-center gap-2 label bg-ink text-inverse px-6 py-3 hover:bg-accent transition-colors"
        >
          {A.cta}
          {stroke(ARROW)}
        </a>
        <p className="font-body text-xs text-dim mt-3">
          {A.hint}{" "}
          <a href={href} className="underline underline-offset-2 hover:text-accent">
            {about.email}
          </a>
        </p>
      </div>
    </aside>
  );
}
