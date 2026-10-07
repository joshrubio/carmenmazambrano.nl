"use client";

import Link from "next/link";
import Image from "next/image";
import type { ArticleSummary } from "@/lib/articles";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { formatDate } from "@/lib/articles";
import { localePath } from "@/i18n/config";
import { useLocale } from "@/i18n/LocaleProvider";

interface Props {
  article: ArticleSummary;
  variant?: "featured" | "secondary" | "compact";
}

export function ArticleCard({ article, variant = "secondary" }: Props) {
  const { lang, categories } = useLocale();
  const href = localePath(lang, `/articles/${article.slug}`);
  const category = categories[article.category] ?? article.category;
  // El texto de la nota va en su idioma original; `lang` permite al navegador
  // traducirlo, silabear bien y leerlo con la voz correcta.
  const textLang = article.language;

  const date = (
    <p className="label text-dim font-normal normal-case tracking-wide mt-2">
      {formatDate(article.date, lang)}
    </p>
  );

  if (variant === "featured") {
    return (
      <article className="group">
        {article.coverImage && (
          <div className="relative w-full h-64 mb-3 overflow-hidden">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              lang={textLang}
              className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
            />
          </div>
        )}
        <CategoryBadge label={category} />
        <Link href={href} lang={textLang}>
          <h2 className="font-display text-4xl font-black leading-[1.1] text-ink mt-2 group-hover:text-accent transition-colors">
            {article.title}
          </h2>
        </Link>
        {article.subtitle && (
          <p lang={textLang} className="font-display text-xl text-muted italic font-normal mt-1">
            {article.subtitle}
          </p>
        )}
        <p lang={textLang} className="font-body text-sm text-muted mt-2 leading-relaxed">
          {article.excerpt}
        </p>
        {date}
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="group border-t border-rule pt-3">
        {article.coverImage && (
          <Link href={href} className="block mb-2 overflow-hidden">
            <div className="relative w-full h-32">
              <Image
                src={article.coverImage}
                alt={article.title}
                fill
                lang={textLang}
                className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
              />
            </div>
          </Link>
        )}
        <CategoryBadge label={category} />
        <Link href={href} lang={textLang}>
          <h3 className="font-display text-base font-bold leading-snug text-ink mt-1 group-hover:text-accent transition-colors">
            {article.title}
          </h3>
        </Link>
        {date}
      </article>
    );
  }

  // secondary
  return (
    <article className="group border-t border-rule pt-4">
      {article.coverImage && (
        <Link href={href} className="block mb-3 overflow-hidden">
          <div className="relative w-full h-48">
            <Image
              src={article.coverImage}
              alt={article.title}
              fill
              lang={textLang}
              className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
            />
          </div>
        </Link>
      )}
      <CategoryBadge label={category} />
      <Link href={href} lang={textLang}>
        <h3 className="font-display text-2xl font-bold leading-snug text-ink mt-1 group-hover:text-accent transition-colors">
          {article.title}
        </h3>
      </Link>
      {article.subtitle && (
        <p lang={textLang} className="font-display text-sm text-muted italic font-normal mt-0.5">
          {article.subtitle}
        </p>
      )}
      <p lang={textLang} className="font-body text-sm text-muted mt-2 leading-relaxed line-clamp-3">
        {article.excerpt}
      </p>
      {date}
    </article>
  );
}
