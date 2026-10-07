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
    title: dict.privacy.title,
    description: dict.privacy.description,
    alternates: alternatesFor(lang, "/privacy"),
  };
}

// Sustituye {email} por un enlace mailto dentro de un texto del diccionario.
function withEmail(text: string) {
  const parts = text.split("{email}");
  return parts.flatMap((part, i) =>
    i === 0
      ? [part]
      : [
          <a key={i} href={`mailto:${about.email}`} className="text-accent underline underline-offset-2">
            {about.email}
          </a>,
          part,
        ]
  );
}

export default async function PrivacyPage({ params }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const P = (await getDictionary(lang)).privacy;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <span className="label text-accent">{P.label}</span>
        <ThickRule />
      </div>

      <h1 className="font-display text-4xl sm:text-5xl font-black text-ink mb-2">{P.title}</h1>
      <p className="label text-dim font-normal normal-case tracking-wide mb-8">{P.updated}</p>

      <div className="space-y-8 border-t border-rule pt-6">
        {P.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-display text-xl font-bold text-ink mb-3">{section.heading}</h2>
            <div className="space-y-3 font-body text-ink leading-relaxed">
              {section.paragraphs.map((p, i) => (
                <p key={i}>{withEmail(p)}</p>
              ))}
              {"items" in section && section.items && (
                <ul className="list-disc pl-6 space-y-1">
                  {section.items.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
              {"after" in section &&
                section.after?.map((p, i) => (
                  <p key={`a${i}`}>{withEmail(p)}</p>
                ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
