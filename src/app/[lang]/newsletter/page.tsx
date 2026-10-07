import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ThickRule } from "@/components/ui/ColumnDivider";
import { SubscribeForm } from "@/components/newsletter/SubscribeForm";
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
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <span className="label text-accent">{N.label}</span>
        <ThickRule />
      </div>

      <h1 className="font-display text-5xl font-black text-ink mb-2">{N.title}</h1>
      <p className="font-display text-lg text-muted italic font-normal mb-8">{N.subtitle}</p>

      <div className="relative border-t border-rule pt-6">
        <SubscribeForm source="page" />
      </div>
    </div>
  );
}
