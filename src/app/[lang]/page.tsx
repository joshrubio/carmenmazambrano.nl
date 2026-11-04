import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllArticles, toSummary } from "@/lib/articles";
import { ArticleCard } from "@/components/article/ArticleCard";
import { ArticleCarousel } from "@/components/ui/ArticleCarousel";
import { ThickRule, HorizontalRule } from "@/components/ui/ColumnDivider";
import { EditorPanel } from "@/components/ui/EditorPanel";
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
  const [main, second, third, ...rest] = getAllArticles().map(toSummary);

  return (
    // Contenedor de consultas: el reparto en dos columnas depende del ancho realmente
    // disponible (que cambia si el panel de administración está abierto), no de la pantalla.
    <div className="@container">
      <div className="grid grid-cols-1 @3xl:grid-cols-12 gap-x-8 gap-y-10">
        {/* Noticias */}
        <div className="@3xl:col-span-8 min-w-0">
          <div className="flex items-center gap-3 mb-4">
            <span className="label text-accent">{dict.home.latest}</span>
            <ThickRule />
          </div>

          {main && (
            <div className="mb-8">
              <ArticleCard article={main} variant="featured" />
            </div>
          )}

          {(second || third) && (
            <div className="grid grid-cols-1 @xl:grid-cols-2 gap-6 mb-10">
              {second && <ArticleCard article={second} variant="secondary" />}
              {third && <ArticleCard article={third} variant="secondary" />}
            </div>
          )}

          {rest.length > 0 && (
            <>
              <HorizontalRule />
              <div className="mt-6 mb-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="label text-accent">{dict.home.more}</span>
                  <ThickRule />
                </div>
                <ArticleCarousel articles={rest} perPage={4} />
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

        {/* Perfil de la editora: panel vertical a la izquierda (debajo de las noticias en móvil) */}
        <aside className="@3xl:col-span-4 @3xl:order-first">
          <EditorPanel lang={lang} dict={dict} />
        </aside>
      </div>
    </div>
  );
}
