import Link from "next/link";
import Image from "next/image";
import type { Article } from "@/lib/articles";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { formatDate } from "@/lib/articles";

interface Props {
  article: Article;
  variant?: "featured" | "secondary" | "compact";
}

export function ArticleCard({ article, variant = "secondary" }: Props) {
  const date = (
    <p className="label text-dim font-normal normal-case tracking-wide mt-2">
      {formatDate(article.date)}
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
              className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
            />
          </div>
        )}
        <CategoryBadge category={article.category} />
        <Link href={`/articles/${article.slug}`}>
          <h2 className="font-display text-4xl font-black leading-[1.1] text-ink mt-2 group-hover:text-accent transition-colors">
            {article.title}
          </h2>
        </Link>
        {article.subtitle && (
          <p className="font-display text-xl text-muted italic font-normal mt-1">
            {article.subtitle}
          </p>
        )}
        <p className="font-body text-sm text-muted mt-2 leading-relaxed">
          {article.excerpt}
        </p>
        {date}
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="group border-t border-rule pt-3">
        <CategoryBadge category={article.category} />
        <Link href={`/articles/${article.slug}`}>
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
      <CategoryBadge category={article.category} />
      <Link href={`/articles/${article.slug}`}>
        <h3 className="font-display text-2xl font-bold leading-snug text-ink mt-1 group-hover:text-accent transition-colors">
          {article.title}
        </h3>
      </Link>
      {article.subtitle && (
        <p className="font-display text-sm text-muted italic font-normal mt-0.5">
          {article.subtitle}
        </p>
      )}
      <p className="font-body text-sm text-muted mt-2 leading-relaxed line-clamp-3">
        {article.excerpt}
      </p>
      {date}
    </article>
  );
}
