import Link from "next/link";
import { getAllArticles } from "@/lib/articles";
import { ArticleCard } from "@/components/article/ArticleCard";
import { ArticleCarousel } from "@/components/ui/ArticleCarousel";
import { ThickRule, HorizontalRule } from "@/components/ui/ColumnDivider";
import { Hero } from "@/components/ui/Hero";

export const revalidate = false;

export default function HomePage() {
  const articles = getAllArticles();
  const [main, second, ...rest] = articles;

  return (
    <div>
      <Hero />

      {/* Latest — 2 articles */}
      <div className="flex items-center gap-3 mb-4">
        <span className="label text-accent">Latest</span>
        <ThickRule />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 mb-10">
        {main && (
          <div className="md:col-span-7 md:border-r md:border-rule md:pr-6">
            <ArticleCard article={main} variant="featured" />
          </div>
        )}
        {second && (
          <div className="md:col-span-5">
            <ArticleCard article={second} variant="secondary" />
          </div>
        )}
      </div>

      {rest.length > 0 && (
        <>
          <HorizontalRule />
          <div className="mt-6 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <span className="label text-accent">More</span>
              <ThickRule />
            </div>
            <ArticleCarousel articles={rest} perPage={3} />
          </div>
        </>
      )}

      <div className="text-center mt-2 mb-4">
        <Link
          href="/articles"
          className="label text-ink font-normal border border-ink px-6 py-2 hover:bg-ink hover:text-inverse transition-colors"
        >
          View All Articles
        </Link>
      </div>
    </div>
  );
}
