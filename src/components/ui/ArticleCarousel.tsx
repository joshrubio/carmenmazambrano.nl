"use client";

import { useState } from "react";
import type { Article } from "@/lib/articles";
import { ArticleCard } from "@/components/article/ArticleCard";

interface Props {
  articles: Article[];
  perPage?: number;
}

export function ArticleCarousel({ articles, perPage = 3 }: Props) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(articles.length / perPage);
  const slice = articles.slice(page * perPage, page * perPage + perPage);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 min-h-[220px]">
        {slice.map((article) => (
          <ArticleCard key={article.slug} article={article} variant="compact" />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 border-t border-rule pt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="label text-ink font-normal px-4 py-1.5 border border-rule hover:border-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Previous"
          >
            ‹ Prev
          </button>

          <span className="label text-dim font-normal normal-case tracking-wide">
            {page + 1} / {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="label text-ink font-normal px-4 py-1.5 border border-rule hover:border-ink transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            aria-label="Next"
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
}
