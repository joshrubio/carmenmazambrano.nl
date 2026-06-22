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
  return {
    title: article.title,
    description: article.excerpt,
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  return (
    <article className="max-w-3xl mx-auto">
      {/* Section label */}
      <div className="flex items-center gap-3 mb-6">
        <CategoryBadge category={article.category} />
        <ThickRule />
      </div>

      {/* Headline */}
      <h1 className="font-serif text-4xl md:text-5xl font-black leading-tight text-[#1A1A1A]">
        {article.title}
      </h1>
      {article.subtitle && (
        <p className="font-serif text-xl italic text-[#444] mt-2">{article.subtitle}</p>
      )}

      <Byline author={article.author} date={article.date} category={article.category} />

      {/* Excerpt / lede */}
      <p className="font-serif text-lg font-semibold text-[#333] leading-relaxed mb-6 border-l-4 border-[#8B1A1A] pl-4">
        {article.excerpt}
      </p>

      {/* Body */}
      <ArticleBody blocks={article.content} />
    </article>
  );
}
