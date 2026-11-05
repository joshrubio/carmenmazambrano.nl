"use client";

import Image from "next/image";
import { format, useLocale } from "@/i18n/LocaleProvider";

// Un anuncio ya resuelto al idioma de la página.
export interface AdSlideData {
  id: string;
  advertiser: string;
  display: string;
  url: string;
  kicker: string;
  headline: string;
  emphasis: string;
  text: string;
  cta: string;
  sample?: boolean;
  visual:
    | { kind: "image"; src: string; alt: string; position?: string; credit?: { text: string; href?: string } }
    | { kind: "art"; art: "web"; alt: string };
}

const ARROW = "M5 12h14M13 6l6 6-6 6";

// Colores de la marca para el dibujo (un SVG no puede leer los tokens de Tailwind).
const INK = "#1A1A1A";
const PAPER = "#FAF7F0";
const ACCENT = "#8B1A1A";
const SURFACE = "#F0EDE6";
const RULE = "#CCCCCC";

// Una página web maquetada como la portada de un periódico: versión de escritorio y, delante,
// la versión móvil. Es la ilustración del anuncio de diseño web.
function WebArt({ label }: { label: string }) {
  const bars = (x: number, y: number, widths: number[], gap = 14) =>
    widths.map((w, i) => <rect key={i} x={x} y={y + i * gap} width={w} height="6" fill={RULE} />);
  return (
    <svg viewBox="0 0 800 340" preserveAspectRatio="xMidYMid slice" role="img" aria-label={label} className="absolute inset-0 w-full h-full">
      <defs>
        <pattern id="ad-hatch" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(135)">
          <line x1="0" y1="0" x2="0" y2="9" stroke={INK} strokeOpacity="0.07" strokeWidth="1.5" />
        </pattern>
      </defs>
      <rect width="800" height="340" fill={SURFACE} />
      <rect width="800" height="340" fill="url(#ad-hatch)" />

      {/* Escritorio */}
      <rect x="70" y="38" width="520" height="264" fill={PAPER} stroke={INK} strokeWidth="2" />
      <rect x="70" y="38" width="520" height="24" fill={INK} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={88 + i * 16} cy="50" r="4" fill={i === 0 ? ACCENT : PAPER} fillOpacity={i === 0 ? 1 : 0.5} />
      ))}
      {/* cabecera */}
      <rect x="96" y="84" width="468" height="5" fill={INK} />
      <rect x="196" y="98" width="268" height="20" fill={INK} />
      <rect x="96" y="128" width="468" height="1.5" fill={INK} />
      {/* foto y titular */}
      <rect x="96" y="142" width="196" height="126" fill={SURFACE} stroke={INK} strokeWidth="1" />
      <path d="M96 268 L170 196 L214 238 L246 212 L292 268 Z" fill={ACCENT} fillOpacity="0.85" />
      <circle cx="248" cy="170" r="14" fill={PAPER} />
      <rect x="312" y="142" width="200" height="12" fill={INK} />
      <rect x="312" y="160" width="150" height="12" fill={INK} />
      {bars(312, 186, [252, 244, 252, 232, 248, 180], 13)}
      {/* columna lateral */}
      <rect x="528" y="142" width="36" height="126" fill={ACCENT} />

      {/* Móvil */}
      <rect x="610" y="74" width="120" height="232" rx="12" fill={PAPER} stroke={INK} strokeWidth="2.5" />
      <rect x="656" y="82" width="28" height="4" rx="2" fill={INK} />
      <rect x="624" y="100" width="92" height="4" fill={INK} />
      <rect x="634" y="110" width="72" height="12" fill={INK} />
      <rect x="624" y="130" width="92" height="1.5" fill={INK} />
      <rect x="624" y="140" width="92" height="64" fill={SURFACE} stroke={INK} strokeWidth="1" />
      <path d="M624 204 L654 172 L674 190 L690 176 L716 204 Z" fill={ACCENT} fillOpacity="0.85" />
      {bars(624, 216, [92, 86, 92, 60], 12)}
      <rect x="624" y="270" width="92" height="20" fill={ACCENT} />
    </svg>
  );
}

// Anuncio del carrusel de la portada, con aire de anuncio de periódico: marco fino, cabecera
// "Publicidad" entre filetes, foto o dibujo, titular de dos líneas (la segunda en cursiva),
// texto corto y un enlace subrayado. Se distingue de una noticia sin dudas (marco, etiqueta,
// anunciante) y mientras sea un ejemplo lleva "Anuncio de ejemplo". Los enlaces son externos y
// van marcados como patrocinados (`rel="sponsored"`). La imagen crece para ocupar el alto que
// deja la noticia más alta del carrusel, así no queda hueco.
export function AdSlide({ ad, advertiseHref }: { ad: AdSlideData; advertiseHref: string }) {
  const { t } = useLocale();
  const C = t.carousel;
  const linkProps = { href: ad.url, target: "_blank", rel: "sponsored noopener noreferrer" } as const;
  const v = ad.visual;

  return (
    <article className="group h-full flex flex-col border border-ink bg-white/50">
      <div className="flex items-center gap-3 px-4 py-1.5 border-b border-ink">
        <span className="label text-ink">{C.adBadge}</span>
        <span className="flex-1 h-px bg-rule" aria-hidden="true" />
        {ad.sample && <span className="label font-normal normal-case tracking-wide text-dim">{C.adSample}</span>}
      </div>

      <div className="relative flex-1 min-h-56 border-b border-ink overflow-hidden bg-surface">
        <a {...linkProps} className="absolute inset-0 block" aria-label={format(C.adLabel, { name: ad.advertiser })} tabIndex={-1}>
          {v.kind === "image" ? (
            <Image
              src={v.src}
              alt={v.alt}
              fill
              sizes="(min-width: 1024px) 720px, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              style={v.position ? { objectPosition: v.position } : undefined}
            />
          ) : (
            <WebArt label={v.alt} />
          )}
        </a>
        {v.kind === "image" && v.credit &&
          (v.credit.href ? (
            <a
              href={v.credit.href}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-0 right-0 bg-paper/90 px-2 py-0.5 font-body text-[11px] text-muted hover:text-accent"
            >
              {v.credit.text}
            </a>
          ) : (
            <span className="absolute bottom-0 right-0 bg-paper/90 px-2 py-0.5 font-body text-[11px] text-muted">{v.credit.text}</span>
          ))}
      </div>

      <div className="px-6 py-5 text-center">
        <p className="label text-accent">{ad.kicker}</p>
        <a {...linkProps}>
          <p className="font-display text-4xl sm:text-[2.6rem] font-black leading-[1.05] text-ink mt-2 group-hover:text-accent transition-colors">
            {ad.headline}
            <span className="block italic font-normal text-accent group-hover:text-ink transition-colors">{ad.emphasis}</span>
          </p>
        </a>
        <p className="font-body text-sm leading-relaxed text-muted mt-3 max-w-xl mx-auto">{ad.text}</p>
        <a
          {...linkProps}
          className="mt-4 inline-flex items-center gap-2 label text-ink border-b-2 border-ink pb-0.5 hover:text-accent hover:border-accent transition-colors"
        >
          {ad.cta}
          <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={ARROW} />
          </svg>
        </a>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-t border-rule px-4 py-2 font-body text-xs text-dim">
        <span>
          <span className="text-ink">{ad.advertiser}</span> · {ad.display}
        </span>
        <span>
          {C.adPromo}{" "}
          <a href={advertiseHref} className="underline underline-offset-2 hover:text-accent">
            {C.adPromoCta}
          </a>
        </span>
      </div>
    </article>
  );
}
