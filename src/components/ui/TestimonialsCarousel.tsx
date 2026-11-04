"use client";

import { useLocale } from "@/i18n/LocaleProvider";
import type { Testimonial } from "../../../content/testimonials";
import { LoopCarousel } from "./LoopCarousel";

// Testimonios en bucle, con la misma mecánica que el carrusel de noticias.
// Rellena el alto que le deja la columna (`fill`) y centra cada cita.
export function TestimonialsCarousel({ items }: { items: Testimonial[] }) {
  const { t } = useLocale();
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
              <blockquote lang={it.lang} className="font-display italic text-xl leading-snug text-ink mt-2">
                {it.quote}
              </blockquote>
              <figcaption className="mt-5">
                <span className="block label text-ink">{it.author}</span>
                <span lang={it.lang} className="block font-body text-xs text-muted mt-1">
                  {it.role}
                </span>
                {it.sample && (
                  <span className="inline-block mt-3 label font-normal normal-case tracking-wide text-dim border border-dashed border-rule px-2 py-0.5">
                    {T.sample}
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
