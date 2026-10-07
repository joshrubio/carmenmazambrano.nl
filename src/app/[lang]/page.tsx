import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllArticles, toSummary } from "@/lib/articles";
import { ArticleCard } from "@/components/article/ArticleCard";
import { ArticleCarousel } from "@/components/ui/ArticleCarousel";
import { ThickRule, HorizontalRule } from "@/components/ui/ColumnDivider";
import { Hero } from "@/components/ui/Hero";
import { hasLocale, localePath } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { alternatesFor } from "@/i18n/metadata";

export const revalidate = false;

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return { alternates: alternatesFor(lang) };
}

export default async function HomePage({ params }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  // Solo el resumen viaja al navegador (sin el cuerpo de cada nota).
  const [main, second, ...rest] = getAllArticles().map(toSummary);

  return (
    <div>
      <Hero lang={lang} dict={dict} />

      {/* Latest — 2 articles */}
      <div className="flex items-center gap-3 mb-4">
        <span className="label text-accent">{dict.home.latest}</span>
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
              <span className="label text-accent">{dict.home.more}</span>
              <ThickRule />
            </div>
            <ArticleCarousel articles={rest} perPage={3} />
          </div>
        </>
      )}

      <div className="text-center mt-2 mb-4">
        <Link
          href={localePath(lang, "/articles")}
          className="label text-ink font-normal border border-ink px-6 py-2 hover:bg-ink hover:text-inverse transition-colors"
        >
          {dict.home.viewAll}
        </Link>
      </div>
    </div>
  );
}
