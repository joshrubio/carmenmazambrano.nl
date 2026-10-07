import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { about } from "../../../../content/about";
import { ThickRule } from "@/components/ui/ColumnDivider";
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
    title: dict.contact.label,
    description: dict.contact.description,
    alternates: alternatesFor(lang, "/contact"),
  };
}

export default async function ContactPage({ params }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const C = dict.contact;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <span className="label text-accent">{C.label}</span>
        <ThickRule />
      </div>

      <h1 className="font-display text-5xl font-black text-ink mb-2">{C.title}</h1>
      <p className="font-display text-lg text-muted italic font-normal mb-8">{C.subtitle}</p>

      <div className="space-y-5 border-t border-rule pt-6">
        <div className="flex gap-6 items-baseline">
          <span className="label text-accent w-20 shrink-0">{C.phone}</span>
          <a href={`tel:${about.phone}`} className="font-body text-xl text-ink hover:text-accent transition-colors">
            {about.phone}
          </a>
        </div>
        <div className="flex gap-6 items-baseline">
          <span className="label text-accent w-20 shrink-0">{C.location}</span>
          <span className="font-body text-xl text-ink">{dict.common.location}</span>
        </div>
        {Object.entries(about.social).map(([key, url]) => (
          <div key={key} className="flex gap-6 items-baseline">
            <span className="label text-accent w-20 shrink-0 capitalize">{key}</span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-base text-ink hover:text-accent transition-colors break-all"
            >
              {url.replace("https://", "")}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
