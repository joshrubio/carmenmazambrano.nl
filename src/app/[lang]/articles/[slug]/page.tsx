import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAllArticles, getArticleBySlug } from "@/lib/articles";
import { ArticleBody } from "@/components/article/ArticleBody";
import { TranslatableArticle } from "@/components/article/TranslatableArticle";
import { DeleteArticleButton } from "@/components/article/DeleteArticleButton";
import { Byline } from "@/components/ui/Byline";
import { CategoryBadge } from "@/components/ui/CategoryBadge";
import { ThickRule } from "@/components/ui/ColumnDivider";
import { hasLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { alternatesFor } from "@/i18n/metadata";

interface Props {
  params: Promise<{ lang: string; slug: string }>;
}

// Una nota que no estaba al compilar se resuelve bajo demanda (y da 404 si no existe).
export const dynamicParams = true;

export function generateStaticParams() {
  return locales.flatMap((lang) => getAllArticles().map((a) => ({ lang, slug: a.slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang, slug } = await params;
  const article = getArticleBySlug(slug);
  if (!hasLocale(lang) || !article) return {};
  return {
    title: article.title,
    description: article.excerpt,
    alternates: alternatesFor(lang, `/articles/${slug}`),
  };
}

export default async function ArticlePage({ params }: Props) {
  const { lang, slug } = await params;
  if (!hasLocale(lang)) notFound();
  const article = getArticleBySlug(slug);
  if (!article) notFound();
  const dict = await getDictionary(lang);

  const category = dict.categories[article.category as keyof typeof dict.categories] ?? article.category;
  const differs = article.language !== lang;

  return (
    <article className="max-w-3xl mx-auto">
      <DeleteArticleButton slug={article.slug} title={article.title} />

      {/* Las notas se publican en un solo idioma: se avisa si no es el de la interfaz. */}
      {differs && (
        <p className="label text-muted font-normal normal-case tracking-wide border border-rule bg-surface px-3 py-2 mb-6">
          {dict.article.writtenIn.replace("{language}", dict.article.languages[article.language])}
        </p>
      )}

      <div className="flex items-center gap-3 mb-6">
        <CategoryBadge label={category} />
        <ThickRule />
      </div>

      {/* `lang` del contenido: permite que el navegador ofrezca traducirlo y silabee bien.
          Además, TranslatableArticle ofrece un botón de traducción local donde el navegador la soporte. */}
      <TranslatableArticle articleLang={article.language} fromName={dict.article.languages[article.language]}>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-[1.05] text-ink">
          {article.title}
        </h1>

        {article.subtitle && (
          <p className="font-display text-xl italic text-muted font-normal mt-2">
            {article.subtitle}
          </p>
        )}

        <Byline author={article.author} date={article.date} category={category} lang={lang} byLabel={dict.article.by} />

        <p className="font-body text-lg font-medium text-muted leading-relaxed mb-8 border-l-4 border-accent pl-4">
          {article.excerpt}
        </p>

        <ArticleBody blocks={article.content} />
      </TranslatableArticle>
    </article>
  );
}
