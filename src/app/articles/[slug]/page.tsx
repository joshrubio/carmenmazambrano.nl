import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllArticles, getArticleBySlug } from "@/lib/articles";
import { ArticleBody } from "@/components/article/ArticleBody";
import { Byline } from "@/components/ui/Byline";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { ThickRule } from "@/components/ui/ColumnDivider";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return { title: article.title, description: article.excerpt };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <article className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <CategoryBadge category={article.category} />
        <ThickRule />
      </div>

      <h1 className="font-display text-5xl md:text-6xl font-black leading-[1.05] text-ink">
        {article.title}
      </h1>

      {article.subtitle && (
        <p className="font-display text-xl italic text-muted font-normal mt-2">
          {article.subtitle}
        </p>
      )}

      <Byline author={article.author} date={article.date} category={article.category} />

      <p className="font-body text-lg font-medium text-muted leading-relaxed mb-8 border-l-4 border-accent pl-4">
        {article.excerpt}
      </p>

      <ArticleBody blocks={article.content} />
    </article>
  );
}
