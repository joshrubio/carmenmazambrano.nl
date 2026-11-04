"use client";

import type { ArticleSummary } from "@/lib/articles";
import { ArticleCard } from "@/components/article/ArticleCard";
import { format, useLocale } from "@/i18n/LocaleProvider";
import { AdSlide, type AdSlideData } from "./AdSlide";
import { LoopCarousel, type LoopItem } from "./LoopCarousel";

// Cada cuántas noticias entra un anuncio (3 noticias, anuncio, 3 noticias, anuncio…).
const AD_EVERY = 3;

// Bucle de la portada: las últimas noticias con anuncios intercalados. La primera tarjeta es
// siempre la noticia más reciente; los anuncios que no caben entre noticias van al final.
export function LatestNewsSlider({
  articles,
  ads = [],
  advertiseHref,
}: {
  articles: ArticleSummary[];
  ads?: AdSlideData[];
  advertiseHref: string;
}) {
  const { t } = useLocale();

  const items: LoopItem[] = [];
  let nextAd = 0;
  const pushAd = () => {
    const ad = ads[nextAd++];
    items.push({
      key: `ad-${ad.id}`,
      node: <AdSlide ad={ad} advertiseHref={advertiseHref} />,
      label: format(t.carousel.adLabel, { name: ad.advertiser }),
    });
  };
  articles.forEach((article, i) => {
    items.push({ key: article.slug, node: <ArticleCard article={article} variant="featured" /> });
    if ((i + 1) % AD_EVERY === 0 && nextAd < ads.length) pushAd();
  });
  while (nextAd < ads.length) pushAd();

  return (
    <LoopCarousel
      labels={{ region: t.carousel.sliderLabel, slideOf: t.carousel.slideOf, goTo: t.carousel.goTo }}
      items={items}
    />
  );
}
