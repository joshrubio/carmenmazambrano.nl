import Link from "next/link";
import { getAllArticles, getFeaturedArticles } from "@/lib/articles";
import { ArticleCard } from "@/components/article/ArticleCard";
import { ThickRule, HorizontalRule } from "@/components/ui/ColumnDivider";
import { Hero } from "@/components/ui/Hero";

export const revalidate = false;

export default function HomePage() {
  const featured = getFeaturedArticles();
  const rest = getAllArticles().filter((a) => !a.featured).slice(0, 4);
  const mainArticle = featured[0];
  const secondaryFeatured = featured.slice(1);

  return (
    <div>
      <Hero />

      <div className="flex items-center gap-3 mb-4">
        <span className="label text-accent">Latest</span>
        <ThickRule />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
        {mainArticle && (
          <div className="md:col-span-8 md:border-r md:border-rule md:pr-6">
            <ArticleCard article={mainArticle} variant="featured" />
          </div>
        )}
        <aside className="md:col-span-4 flex flex-col gap-6">
          {secondaryFeatured.map((article) => (
            <ArticleCard key={article.slug} article={article} variant="secondary" />
          ))}
        </aside>
      </div>

      {rest.length > 0 && (
        <>
          <HorizontalRule />
          <div className="flex items-center gap-3 mt-4 mb-4">
            <span className="label text-accent">More</span>
            <ThickRule />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {rest.map((article) => (
              <ArticleCard key={article.slug} article={article} variant="compact" />
            ))}
          </div>
        </>
      )}

      <div className="text-center mt-10">
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
