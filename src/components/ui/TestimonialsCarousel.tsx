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
    <div className="flex flex-col flex-1 bg-surface px-6 py-7 border border-rule/70">
      <p className="label text-accent mb-2">{T.label}</p>
      <LoopCarousel
        fill
        className="flex-1"
        labels={{ region: T.sliderLabel, slideOf: T.slideOf, goTo: T.goTo }}
        items={items.map((it, i) => ({
          key: `${i}-${it.author}`,
          node: (
            <figure className="text-center px-1">
              <span aria-hidden="true" className="block font-display font-black text-7xl leading-none text-accent h-10">
                “
              </span>
              <blockquote lang={lang} className="font-display italic text-xl leading-snug text-ink mt-2">
                {it.quote}
              </blockquote>
              <figcaption className="mt-5">
                <span className="block label text-ink">{it.author}</span>
                <span className="block font-body text-xs text-muted mt-1">{it.role}</span>
                {it.href && it.articleTitle && (
                  <Link
                    href={it.href}
                    lang={it.articleLang}
                    className="mt-3 inline-block font-body text-xs text-accent underline underline-offset-2 hover:text-ink max-w-full"
                  >
                    {T.about}: {it.articleTitle} →
                  </Link>
                )}
                {it.draft && (
                  <span className="block mt-3">
                    <span className="inline-block label font-normal normal-case tracking-wide text-dim border border-dashed border-rule px-2 py-0.5">
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
