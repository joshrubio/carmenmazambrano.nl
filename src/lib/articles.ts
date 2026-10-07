import type { Locale } from "@/i18n/config";

export type GalleryImage = { src: string; alt: string; caption?: string };

export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "pullquote"; text: string }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "gallery"; images: GalleryImage[]; caption?: string }
  | { type: "video"; url: string; caption?: string }
  | { type: "infobox"; items: { label: string; value: string; href?: string }[] }
  | { type: "subheading"; text: string };

export interface Article {
  slug: string;
  title: string;
  subtitle?: string;
  category: string;
  // Idioma en el que está escrita la nota (se usa para `lang=` y el aviso al lector)
  language: Locale;
  date: string;
  author: string;
  excerpt: string;
  content: ContentBlock[];
  featured?: boolean;
  coverImage?: string;
}

export function getAllArticles(): Article[] {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { articles } = require("../../content/articles/index") as { articles: Article[] };
  return [...articles].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getFeaturedArticles(): Article[] {
  return getAllArticles().filter((a) => a.featured);
}

export function getArticleBySlug(slug: string): Article | undefined {
  return getAllArticles().find((a) => a.slug === slug);
}

const dateLocales: Record<Locale, string> = { es: "es-ES", en: "en-GB", nl: "nl-NL" };

export function formatDate(dateStr: string, lang: Locale = "en"): string {
  return new Date(dateStr).toLocaleDateString(dateLocales[lang], {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Versión ligera para listados y carruseles: sin el cuerpo, para no serializar
// artículos enteros hacia el navegador.
export type ArticleSummary = Omit<Article, "content">;

export function toSummary({ content: _content, ...rest }: Article): ArticleSummary {
  void _content;
  return rest;
}
