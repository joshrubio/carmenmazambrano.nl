import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsletterCard } from "@/components/newsletter/NewsletterCard";
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
    title: dict.newsletter.label,
    description: dict.newsletter.description,
    alternates: alternatesFor(lang, "/newsletter"),
  };
}

export default async function NewsletterPage({ params }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const N = (await getDictionary(lang)).newsletter;

  return (
    <div className="max-w-4xl mx-auto py-4">
      <NewsletterCard
        label={N.label}
        title={N.title}
        text={N.subtitle}
        source="page"
        headingId="newsletter-page-heading"
        as="h1"
      />
    </div>
  );
}
