import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAllArticles, toSummary } from "@/lib/articles";
import { ArticleCard } from "@/components/article/ArticleCard";
import { AdCard } from "@/components/ui/AdCard";
import { TestimonialsCarousel } from "@/components/ui/TestimonialsCarousel";
import { testimonials } from "../../../content/testimonials";
import { LatestNewsSlider } from "@/components/ui/LatestNewsSlider";
import { ThickRule } from "@/components/ui/ColumnDivider";
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
  // Caja superior: ficha de la editora + bucle de las 8 últimas + las 2 siguientes (se actualizan
  // solas con cada nota nueva). Caja inferior: 8 notas más y la tarjeta publicitaria.
  const all = getAllArticles().map(toSummary);
  const latest = all.slice(0, 8);
  const below = all.slice(8, 10);
  const rest = all.slice(10, 18);

  return (
    // Contenedor de consultas: el reparto en columnas depende del ancho realmente
    // disponible (que cambia si el panel de administración está abierto), no de la pantalla.
    <div className="@container space-y-8">
      <section className="grid grid-cols-1 @3xl:grid-cols-12 gap-x-8 gap-y-10">
        {/* Noticias */}
        <div className="@3xl:col-span-8 min-w-0">
          <div className="flex items-center gap-3 mb-4">
            <span className="label text-accent">{dict.home.latest}</span>
            <ThickRule />
          </div>

          <LatestNewsSlider articles={latest} />

          {below.length > 0 && (
            <div className="mt-8 grid grid-cols-1 @xl:grid-cols-2 gap-6">
              {below.map((article) => (
                <ArticleCard key={article.slug} article={article} variant="secondary" />
              ))}
            </div>
          )}
        </div>

        {/* Perfil de la editora: panel vertical a la izquierda (debajo de las noticias en móvil) */}
        <aside className="@3xl:col-span-4 @3xl:order-first">
          {/* Mismo alto que la fila "Últimas" para que la foto de la ficha y la del bucle arranquen a la par */}
          <div aria-hidden="true" className="hidden @3xl:flex items-center gap-3 mb-4 invisible">
            <span className="label">{dict.home.latest}</span>
          </div>
          <EditorPanel lang={lang} dict={dict} />
        </aside>
      </section>

      <section className="grid grid-cols-1 @3xl:grid-cols-12 gap-x-8 gap-y-10">
        <div className="@3xl:col-span-8 min-w-0">
          <div className="flex items-center gap-3 mb-6">
            <span className="label text-accent">{dict.home.more}</span>
            <ThickRule />
          </div>

          <div className="grid grid-cols-1 @xl:grid-cols-2 gap-6">
            {rest.map((article) => (
              <ArticleCard key={article.slug} article={article} variant="compact" />
            ))}
          </div>

          <div className="text-center mt-8">
            <Link
              href={localePath(lang, "/articles")}
              className="label text-ink font-normal border border-ink px-6 py-2 hover:bg-ink hover:text-inverse transition-colors"
            >
              {dict.home.viewAll}
            </Link>
          </div>
        </div>

        {/* Publicidad + testimonios: juntos cubren el alto de la lista de notas */}
        <div className="@3xl:col-span-4 flex flex-col">
          {/* Mismo alto que la fila "Más" para que la tarjeta arranque a la par de las notas */}
          <div aria-hidden="true" className="hidden @3xl:flex items-center gap-3 mb-6 invisible">
            <span className="label">{dict.home.more}</span>
          </div>
          <AdCard dict={dict} />
          <div className="mt-6 flex-1 flex flex-col">
            <TestimonialsCarousel items={testimonials} />
          </div>
        </div>
      </section>
    </div>
  );
}
