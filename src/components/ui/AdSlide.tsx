"use client";

import Image from "next/image";
import { format, useLocale } from "@/i18n/LocaleProvider";

// Un anuncio ya resuelto al idioma de la página.
export interface AdSlideData {
  id: string;
  advertiser: string;
  url: string;
  headline: string;
  text: string;
  cta: string;
  sample?: boolean;
  visual:
    | { kind: "image"; src: string; alt: string; position?: string; fit?: "cover" | "contain"; bg?: string }
    | { kind: "type"; word: string; kicker: string };
}

const ARROW = "M7 17L17 7M9 7h8v8";

// Tarjeta publicitaria del carrusel de la portada. Tiene la misma estructura que una noticia
// destacada, pero se distingue sin dudas: etiqueta "Publicidad", nombre del anunciante y,
// mientras sea un ejemplo, "Anuncio de ejemplo". Los enlaces son externos y marcados como
// patrocinados (`rel="sponsored"`). Al pie, una invitación a anunciarse. La imagen crece para
// ocupar el alto que deja la noticia más alta del carrusel, así no queda hueco bajo el anuncio.
export function AdSlide({ ad, advertiseHref }: { ad: AdSlideData; advertiseHref: string }) {
  const { t } = useLocale();
  const C = t.carousel;
  const linkProps = { href: ad.url, target: "_blank", rel: "sponsored noopener noreferrer" } as const;
  const v = ad.visual;

  return (
    <article className="group h-full flex flex-col">
      <a {...linkProps} className="block relative w-full flex-1 min-h-64 mb-4 overflow-hidden bg-surface" aria-label={format(C.adLabel, { name: ad.advertiser })} tabIndex={-1} style={v.kind === "image" && v.bg ? { backgroundColor: v.bg } : undefined}>
        {v.kind === "image" ? (
          <Image
            src={v.src}
            alt={v.alt}
            fill
            sizes="(min-width: 1024px) 720px, 100vw"
            className={`${v.fit === "contain" ? "object-contain" : "object-cover"} transition-transform duration-500 group-hover:scale-[1.03]`}
            style={v.position ? { objectPosition: v.position } : undefined}
          />
        ) : (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center text-center p-6"
            style={{ backgroundImage: "repeating-linear-gradient(135deg, transparent 0 10px, rgba(26,26,26,0.045) 10px 11px)" }}
          >
            <p className="label text-accent">{v.kicker}</p>
            <p className="font-display font-black text-5xl sm:text-6xl leading-none text-ink mt-3">{v.word}</p>
          </div>
        )}
      </a>

      <div className="flex flex-wrap items-center gap-2">
        <span className="label bg-ink text-inverse px-2 py-0.5">{C.adBadge}</span>
        <span className="font-body text-xs text-muted">{ad.advertiser}</span>
        {ad.sample && (
          <span className="label font-normal normal-case tracking-wide text-dim border border-dashed border-rule px-2 py-0.5">
            {C.adSample}
          </span>
        )}
      </div>

      <a {...linkProps}>
        <p className="font-display text-4xl font-black leading-[1.1] text-ink mt-2 group-hover:text-accent transition-colors">
          {ad.headline}
        </p>
      </a>
      <p className="font-body text-sm text-muted mt-2 leading-relaxed">{ad.text}</p>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <a {...linkProps} className="inline-flex items-center gap-2 label bg-ink text-inverse px-5 py-3 hover:bg-accent transition-colors">
          {ad.cta}
          <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={ARROW} />
          </svg>
        </a>
        <p className="font-body text-xs text-dim">
          {C.adPromo}{" "}
          <a href={advertiseHref} className="underline underline-offset-2 hover:text-accent">
            {C.adPromoCta}
          </a>
        </p>
      </div>
    </article>
  );
}
