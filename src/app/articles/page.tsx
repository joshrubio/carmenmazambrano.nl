import type { Metadata } from "next";
import { getAllArticles } from "@/lib/articles";
import { ArticleCard } from "@/components/article/ArticleCard";
import { ThickRule } from "@/components/ui/ColumnDivider";

export const metadata: Metadata = {
  title: "Articles",
  description: "Press notes and articles by Carmen Zambrano.",
};

export default function ArticlesPage() {
  const articles = getAllArticles();

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <span className="font-sans text-[10px] uppercase tracking-widest font-semibold text-[#8B1A1A]">
          Articles
        </span>
        <ThickRule />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
        {articles.map((article) => (
          <ArticleCard key={article.slug} article={article} variant="secondary" />
        ))}
      </div>
    </div>
  );
}
