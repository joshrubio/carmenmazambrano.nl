import Link from "next/link";
import { getAllArticles } from "@/lib/articles";
import { ArticleCard } from "@/components/article/ArticleCard";
import { ThickRule, HorizontalRule } from "@/components/ui/ColumnDivider";
import { Hero } from "@/components/ui/Hero";

export const revalidate = false;

export default function HomePage() {
  const latest = getAllArticles().slice(0, 3);
  const [main, ...secondary] = latest;

  return (
    <div>
      <Hero />

      <div className="flex items-center gap-3 mb-4">
        <span className="label text-accent">Latest</span>
        <ThickRule />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
        {main && (
          <div className="md:col-span-8 md:border-r md:border-rule md:pr-6">
            <ArticleCard article={main} variant="featured" />
          </div>
        )}
        <aside className="md:col-span-4 flex flex-col gap-6">
          {secondary.map((article) => (
            <ArticleCard key={article.slug} article={article} variant="secondary" />
          ))}
        </aside>
      </div>

      <HorizontalRule />

      <div className="text-center mt-4">
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
