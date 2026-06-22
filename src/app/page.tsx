import Link from "next/link";
import { getAllArticles, getFeaturedArticles } from "@/lib/articles";
import { ArticleCard } from "@/components/article/ArticleCard";
import { ThickRule, HorizontalRule } from "@/components/ui/ColumnDivider";
import { about } from "../../content/about";

export const revalidate = false; // SSG — re-build to update

export default function HomePage() {
  const featured = getFeaturedArticles();
  const rest = getAllArticles().filter((a) => !a.featured).slice(0, 4);
  const mainArticle = featured[0];
  const secondaryFeatured = featured.slice(1);

  return (
    <div>
      {/* Section label */}
      <div className="flex items-center gap-3 mb-4">
        <span className="font-sans text-[10px] uppercase tracking-widest font-semibold text-[#8B1A1A]">
          Latest
        </span>
        <ThickRule />
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
        {/* Featured article — wide */}
        {mainArticle && (
          <div className="md:col-span-8 md:border-r md:border-[#ccc] md:pr-6">
            <ArticleCard article={mainArticle} variant="featured" />
          </div>
        )}

        {/* Sidebar — about + secondary */}
        <aside className="md:col-span-4 flex flex-col gap-6">
          {/* About teaser */}
          <div className="bg-[#1A1A1A] text-[#FAF7F0] p-5">
            <p className="font-sans text-[10px] uppercase tracking-widest text-[#ccc] mb-2">
              About
            </p>
            <h2 className="font-serif text-2xl font-black leading-tight mb-2">
              {about.name}
            </h2>
            <p className="font-sans text-xs text-[#ccc] leading-relaxed mb-3">
              {about.bio[0]}
            </p>
            <Link
              href="/about"
              className="font-sans text-[10px] uppercase tracking-widest text-[#FAF7F0] border border-[#FAF7F0] px-3 py-1 hover:bg-[#FAF7F0] hover:text-[#1A1A1A] transition-colors"
            >
              Full Profile →
            </Link>
          </div>

          {/* Secondary featured articles */}
          {secondaryFeatured.map((article) => (
            <ArticleCard key={article.slug} article={article} variant="secondary" />
          ))}
        </aside>
      </div>

      {/* More articles */}
      {rest.length > 0 && (
        <>
          <HorizontalRule />
          <div className="flex items-center gap-3 mt-4 mb-4">
            <span className="font-sans text-[10px] uppercase tracking-widest font-semibold text-[#8B1A1A]">
              More
            </span>
            <ThickRule />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {rest.map((article) => (
              <ArticleCard key={article.slug} article={article} variant="compact" />
            ))}
          </div>
        </>
      )}

      {/* All articles CTA */}
      <div className="text-center mt-10">
        <Link
          href="/articles"
          className="font-sans text-xs uppercase tracking-widest border border-[#1A1A1A] px-6 py-2 hover:bg-[#1A1A1A] hover:text-[#FAF7F0] transition-colors"
        >
          View All Articles
        </Link>
      </div>
    </div>
  );
}
