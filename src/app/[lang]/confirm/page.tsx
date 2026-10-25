import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { about } from "../../../../content/about";
import { ThickRule } from "@/components/ui/ColumnDivider";
import { ConfirmSubscription } from "@/components/newsletter/ConfirmSubscription";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getSubscriber } from "@/lib/subscribers";
import { verifyConfirm } from "@/lib/unsubscribe-token";
import { isExpired } from "@/lib/confirmation";

interface Props {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ e?: string; t?: string }>;
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.confirm.title,
    description: dict.confirm.description,
    robots: { index: false, follow: false },
  };
}

export default async function ConfirmPage({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const C = (await getDictionary(lang)).confirm;
  const { e, t } = await searchParams;

  const email = typeof e === "string" ? e.trim().toLowerCase() : "";
  const sub = email ? await getSubscriber(email) : null;
  const valid = !!sub && typeof t === "string" && verifyConfirm(email, sub.confirmNonce ?? "", t);

  // Un solo mensaje por estado; el botón solo aparece con un alta pendiente y vigente.
  let heading = C.invalidTitle;
  let content: React.ReactNode = (
    <p className="font-body text-ink leading-relaxed">
      {C.invalidText.split("{email}").map((part, i) =>
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
  );

  if (valid && sub.status === "confirmed") {
    heading = C.alreadyTitle;
    content = <p className="font-body text-ink leading-relaxed">{C.alreadyText}</p>;
  } else if (valid && isExpired(sub)) {
    heading = C.expiredTitle;
    content = <p className="font-body text-ink leading-relaxed">{C.expiredText}</p>;
  } else if (valid) {
    heading = C.title;
    content = (
      <ConfirmSubscription
        email={email}
        token={t as string}
        lang={lang}
        labels={{
          confirmText: C.confirmText.replace("{email}", email),
          confirmButton: C.confirmButton,
          working: C.working,
          doneTitle: C.doneTitle,
          doneText: C.doneText,
          expiredTitle: C.expiredTitle,
          expiredText: C.expiredText,
          invalidTitle: C.invalidTitle,
          errorGeneric: C.errorGeneric,
          errorRate: C.errorRate,
          backHome: C.backHome,
        }}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <span className="label text-accent">{C.label}</span>
        <ThickRule />
      </div>
      <h1 className="font-display text-4xl sm:text-5xl font-black text-ink mb-6">{heading}</h1>
      {content}
    </div>
  );
}
