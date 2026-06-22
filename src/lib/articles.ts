export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "pullquote"; text: string }
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "video"; url: string; caption?: string }
  | { type: "subheading"; text: string };

export interface Article {
  slug: string;
  title: string;
  subtitle?: string;
  category: string;
  date: string;
  author: string;
  excerpt: string;
  content: ContentBlock[];
  featured?: boolean;
  coverImage?: string;
}

export function getAllArticles(): Article[] {
  const { articles } = require("../../content/articles/index");
  return articles.sort(
    (a: Article, b: Article) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getFeaturedArticles(): Article[] {
  return getAllArticles().filter((a) => a.featured);
}

export function getArticleBySlug(slug: string): Article | undefined {
  return getAllArticles().find((a) => a.slug === slug);
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
