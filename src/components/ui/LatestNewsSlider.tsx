"use client";

import type { ArticleSummary } from "@/lib/articles";
import { ArticleCard } from "@/components/article/ArticleCard";
import { useLocale } from "@/i18n/LocaleProvider";
import { LoopCarousel } from "./LoopCarousel";

// Bucle de las últimas noticias de la portada.
export function LatestNewsSlider({ articles }: { articles: ArticleSummary[] }) {
  const { t } = useLocale();
  return (
    <LoopCarousel
      labels={{ region: t.carousel.sliderLabel, slideOf: t.carousel.slideOf, goTo: t.carousel.goTo }}
      items={articles.map((article) => ({
        key: article.slug,
        node: <ArticleCard article={article} variant="featured" />,
      }))}
    />
  );
}
