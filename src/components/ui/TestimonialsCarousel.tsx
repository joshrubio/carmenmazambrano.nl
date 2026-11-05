"use client";

import Link from "next/link";
import { useLocale } from "@/i18n/LocaleProvider";
import { LoopCarousel } from "./LoopCarousel";

// Ya resuelta al idioma de la página (la cita, el cargo y el enlace a la nota).
export interface VoiceItem {
  quote: string;
  author: string;
  role: string;
  draft?: boolean;
  href?: string;
  articleTitle?: string;
  articleLang?: string;
}

// Voces de la redacción en bucle, con la misma mecánica que el carrusel de noticias.
// Rellena el alto que le deja la columna (`fill`) y centra cada cita.
export function TestimonialsCarousel({ items }: { items: VoiceItem[] }) {
  const { lang, t } = useLocale();
  const T = t.testimonials;

  return (
    <div className="relative overflow-hidden flex flex-col flex-1 bg-ink text-inverse px-6 py-7 border border-white/10 shadow-soft">
      <span
        aria-hidden="true"
        className="pointer-events-none select-none absolute -left-2 -bottom-16 font-display font-black text-[16rem] leading-none text-white/[0.04]"
      >
        “
      </span>
      <p className="relative label text-[#D2504F] mb-2">{T.label}</p>
      <LoopCarousel
        fill
        tone="dark"
        className="relative flex-1"
        labels={{ region: T.sliderLabel, slideOf: T.slideOf, goTo: T.goTo }}
        items={items.map((it, i) => ({
          key: `${i}-${it.author}`,
          node: (
            <figure className="text-center px-1">
              <span aria-hidden="true" className="block font-display font-black text-7xl leading-none text-[#D2504F] h-10">
                “
              </span>
              <blockquote lang={lang} className="font-display italic text-xl leading-snug text-inverse mt-2">
                {it.quote}
              </blockquote>
              <figcaption className="mt-5">
                <span className="block label text-inverse">{it.author}</span>
                <span className="block font-body text-xs text-inverse/60 mt-1">{it.role}</span>
                {it.href && it.articleTitle && (
                  <Link
                    href={it.href}
                    lang={it.articleLang}
                    className="mt-3 inline-block font-body text-xs text-inverse/80 underline underline-offset-2 hover:text-white max-w-full"
                  >
                    {T.about}: {it.articleTitle} →
                  </Link>
                )}
                {it.draft && (
                  <span className="block mt-3">
                    <span className="inline-block label font-normal normal-case tracking-wide text-inverse/60 border border-dashed border-white/30 px-2 py-0.5">
                      {T.draft}
                    </span>
                  </span>
                )}
              </figcaption>
            </figure>
          ),
        }))}
      />
    </div>
  );
}
