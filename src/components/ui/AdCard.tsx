import { about } from "../../../content/about";
import type { Dictionary } from "@/i18n/dictionaries";

const ARROW = "M5 12h14M13 6l6 6-6 6";

// Tarjeta para captar anunciantes: marco de anuncio de prensa (filete discontinuo) sobre
// el bloque burdeos de la newsletter, con la misma sombra suave y una letra grande de fondo.
export function AdCard({ dict }: { dict: Dictionary }) {
  const A = dict.ads;
  const href = `mailto:${about.email}?subject=${encodeURIComponent(A.mailSubject)}`;

  return (
    <aside aria-label={A.label} className="relative overflow-hidden bg-accent text-inverse shadow-soft p-2">
      <span
        aria-hidden="true"
        className="pointer-events-none select-none absolute -right-3 -bottom-14 font-display font-black text-[14rem] leading-none text-white/[0.07]"
      >
        Ad
      </span>
      <div className="relative border border-dashed border-white/40 px-6 py-8 text-center">
        <span className="label bg-paper text-accent px-3 py-1 inline-block">{A.label}</span>
        <h2 className="font-display text-4xl sm:text-5xl font-black leading-[1.02] mt-5">
          {A.lead}
          <span className="block italic font-normal text-inverse/85">{A.accent}</span>
        </h2>
        <p className="font-body text-sm sm:text-base leading-relaxed text-inverse/85 mt-4">{A.text}</p>
        <a
          href={href}
          className="mt-6 inline-flex items-center justify-center gap-2 label bg-paper text-ink px-6 py-3 hover:bg-white transition-colors"
        >
          {A.cta}
          <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={ARROW} />
          </svg>
        </a>
        <p className="font-body text-xs text-inverse/75 mt-4">
          {A.hint}
          <a href={href} className="block mt-1 underline underline-offset-2 hover:text-white">
            {about.email}
          </a>
        </p>
      </div>
    </aside>
  );
}
