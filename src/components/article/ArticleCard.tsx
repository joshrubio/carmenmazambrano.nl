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
          <h2 className="font-serif text-4xl font-black leading-tight text-[#1A1A1A] mt-2 group-hover:text-[#8B1A1A] transition-colors">
            {article.title}
          </h2>
        </Link>
        {article.subtitle && (
          <p className="font-serif text-lg text-[#333] italic mt-1">{article.subtitle}</p>
        )}
        <p className="font-sans text-sm text-[#555] mt-2 leading-relaxed">{article.excerpt}</p>
        <div className="text-xs font-sans text-[#888] mt-2 uppercase tracking-wide">
          {formatDate(article.date)}
        </div>
      </article>
    );
  }

  if (variant === "compact") {
    return (
      <article className="group border-t border-[#ccc] pt-3">
        <CategoryBadge category={article.category} />
        <Link href={`/articles/${article.slug}`}>
          <h3 className="font-serif text-base font-bold leading-snug text-[#1A1A1A] mt-1 group-hover:text-[#8B1A1A] transition-colors">
            {article.title}
          </h3>
        </Link>
        <div className="text-xs font-sans text-[#888] mt-1 uppercase tracking-wide">
          {formatDate(article.date)}
        </div>
      </article>
    );
  }

  // secondary
  return (
    <article className="group border-t border-[#ccc] pt-4">
      <CategoryBadge category={article.category} />
      <Link href={`/articles/${article.slug}`}>
        <h3 className="font-serif text-2xl font-bold leading-tight text-[#1A1A1A] mt-1 group-hover:text-[#8B1A1A] transition-colors">
          {article.title}
        </h3>
      </Link>
      {article.subtitle && (
        <p className="font-serif text-sm text-[#444] italic mt-0.5">{article.subtitle}</p>
      )}
      <p className="font-sans text-sm text-[#555] mt-2 leading-relaxed line-clamp-3">
        {article.excerpt}
      </p>
      <div className="text-xs font-sans text-[#888] mt-2 uppercase tracking-wide">
        {formatDate(article.date)}
      </div>
    </article>
  );
}
