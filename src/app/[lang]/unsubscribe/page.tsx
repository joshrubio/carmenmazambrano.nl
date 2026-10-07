import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { about } from "../../../../content/about";
import { ThickRule } from "@/components/ui/ColumnDivider";
import { UnsubscribeConfirm } from "@/components/newsletter/UnsubscribeConfirm";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { verifyUnsubscribe } from "@/lib/unsubscribe-token";

interface Props {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ e?: string; t?: string }>;
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.unsubscribe.title,
    description: dict.unsubscribe.description,
    robots: { index: false, follow: false },
  };
}

export default async function UnsubscribePage({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const U = (await getDictionary(lang)).unsubscribe;
  const { e, t } = await searchParams;

  const email = typeof e === "string" ? e.trim().toLowerCase() : "";
  const valid = !!email && typeof t === "string" && verifyUnsubscribe(email, t);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <span className="label text-accent">{U.label}</span>
        <ThickRule />
      </div>

      {valid ? (
        <>
          <h1 className="font-display text-4xl sm:text-5xl font-black text-ink mb-6">{U.title}</h1>
          <UnsubscribeConfirm
            email={email}
            token={t as string}
            lang={lang}
            labels={{
              confirmText: U.confirmText.replace("{email}", email),
              confirmButton: U.confirmButton,
              working: U.working,
              doneTitle: U.doneTitle,
              doneText: U.doneText,
              errorGeneric: U.errorGeneric,
              errorRate: U.errorRate,
              backHome: U.backHome,
            }}
          />
        </>
      ) : (
        <>
          <h1 className="font-display text-4xl sm:text-5xl font-black text-ink mb-6">{U.invalidTitle}</h1>
          <p className="font-body text-ink leading-relaxed">
            {U.invalidText.split("{email}").map((part, i) =>
              i === 0 ? (
                part
              ) : (
                <span key={i}>
                  <a href={`mailto:${about.email}`} className="text-accent underline underline-offset-2">
                    {about.email}
                  </a>
                  {part}
                </span>
              )
            )}
          </p>
        </>
      )}
    </div>
  );
}
