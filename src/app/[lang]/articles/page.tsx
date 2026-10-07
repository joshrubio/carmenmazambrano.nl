import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllArticles, toSummary } from "@/lib/articles";
import { ArticleCard } from "@/components/article/ArticleCard";
import { ThickRule } from "@/components/ui/ColumnDivider";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { alternatesFor } from "@/i18n/metadata";

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.articles.title,
    description: dict.articles.description,
    alternates: alternatesFor(lang, "/articles"),
  };
}

export default async function ArticlesPage({ params }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const articles = getAllArticles().map(toSummary);

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <span className="label text-accent">{dict.articles.label}</span>
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
