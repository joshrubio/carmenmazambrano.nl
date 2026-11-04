"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { ArticleSummary } from "@/lib/articles";
import { ArticleCard } from "@/components/article/ArticleCard";
import { format, useLocale } from "@/i18n/LocaleProvider";

// Tiempo que se muestra cada noticia antes de pasar a la siguiente.
const INTERVAL_MS = 6500;
const SLIDE_MS = 650;

const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
function subscribeReduced(cb: () => void) {
  const mq = window.matchMedia(REDUCED_QUERY);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const getReduced = () => window.matchMedia(REDUCED_QUERY).matches;
const getReducedServer = () => false;

// Bucle de las últimas noticias: las tarjetas pasan solas, en círculo, y la última
// vuelve a la primera. Debajo, un punto por noticia: el activo se tiñe de burdeos y
// todos son clicables para saltar a esa posición.
export function LatestNewsSlider({ articles }: { articles: ArticleSummary[] }) {
  const { t } = useLocale();
  const n = articles.length;
  const reduced = useSyncExternalStore(subscribeReduced, getReduced, getReducedServer);
  const [index, setIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  const [focusing, setFocusing] = useState(false);
  const touchX = useRef<number | null>(null);

  // Pasa a la siguiente tras el intervalo; cualquier cambio (a mano o solo) lo reinicia.
  useEffect(() => {
    if (!(n > 1 && !reduced && !hovering && !focusing)) return;
    const id = setTimeout(() => setIndex((i) => (i + 1) % n), INTERVAL_MS);
    return () => clearTimeout(id);
  }, [index, n, reduced, hovering, focusing]);

  if (n === 0) return null;

  const multiple = n > 1;
  const running = multiple && !reduced && !hovering && !focusing;
  const go = (i: number) => setIndex(((i % n) + n) % n);
  const next = () => go(index + 1);
  const prev = () => go(index - 1);

  // Posición circular respecto a la tarjeta activa: 0 = visible, 1 = a la derecha,
  // -1 = a la izquierda. Las que quedan lejos se recolocan sin animación (no se ven).
  const offsetOf = (i: number) => {
    let d = (i - index) % n;
    if (d < 0) d += n;
    return d > n / 2 ? d - n : d;
  };

  return (
    <section
      aria-roledescription="carousel"
      aria-label={t.carousel.sliderLabel}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocus={(e) => {
        // Solo el foco de teclado pausa; un clic en un botón no debe dejarlo parado.
        if (e.target.matches(":focus-visible")) setFocusing(true);
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setFocusing(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft") prev();
        else if (e.key === "ArrowRight") next();
      }}
    >
      <div
        className="grid overflow-hidden touch-pan-y"
        aria-live={running ? "off" : "polite"}
        onTouchStart={(e) => {
          touchX.current = e.touches[0].clientX;
        }}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          touchX.current = null;
          if (Math.abs(dx) > 50) (dx < 0 ? next : prev)();
        }}
      >
        {articles.map((article, i) => {
          const off = offsetOf(i);
          const active = off === 0;
          const animate = !reduced && Math.abs(off) <= 1;
          return (
            <div
              key={article.slug}
              role="group"
              aria-roledescription="slide"
              aria-label={format(t.carousel.slideOf, { n: i + 1, total: n })}
              aria-hidden={!active}
              inert={!active}
              className="col-start-1 row-start-1 min-w-0"
              style={{
                transform: `translateX(${off * 100}%)`,
                opacity: active ? 1 : 0,
                transition: animate
                  ? `transform ${SLIDE_MS}ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity ${SLIDE_MS}ms ease`
                  : "none",
              }}
            >
              <ArticleCard article={article} variant="featured" />
            </div>
          );
        })}
      </div>

      {multiple && (
        <ol className="mt-4 flex items-center justify-center" aria-label={t.carousel.sliderLabel}>
          {articles.map((article, i) => (
            <li key={article.slug}>
              <button
                type="button"
                onClick={() => go(i)}
                aria-label={format(t.carousel.goTo, { n: i + 1 })}
                aria-current={i === index ? "true" : undefined}
                className="group block p-2"
              >
                <span
                  className={`block w-2.5 h-2.5 rounded-full transition-colors duration-300 ${
                    i === index ? "bg-accent" : "bg-rule group-hover:bg-dim"
                  }`}
                />
              </button>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
