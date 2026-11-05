import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { about } from "../../../../content/about";
import { ThickRule } from "@/components/ui/ColumnDivider";
import { ConfirmSubscription } from "@/components/newsletter/ConfirmSubscription";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { getArticleBySlug } from "@/lib/articles";
import { getComment, isUnverifiedExpired } from "@/lib/comments";
import { verifyCommentConfirm } from "@/lib/unsubscribe-token";

interface Props {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ s?: string; c?: string; t?: string }>;
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.commentConfirm.title,
    description: dict.commentConfirm.description,
    robots: { index: false, follow: false },
  };
}

// Página del enlace de verificación de un comentario. Dinámica: depende del comentario guardado.
export default async function CommentConfirmPage({ params, searchParams }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const C = dict.commentConfirm;
  const { s, c, t } = await searchParams;

  const slug = typeof s === "string" ? s : "";
  const id = typeof c === "string" ? c : "";
  const article = slug ? getArticleBySlug(slug) : undefined;
  const comment = article && id ? await getComment(slug, id) : null;
  const valid =
    !!comment && typeof t === "string" && verifyCommentConfirm(comment.email, slug, id, comment.verifyNonce ?? "", t);
  const email = valid ? comment.email : "";

  // Un solo mensaje por estado; el botón solo aparece con un comentario pendiente y vigente.
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

  if (valid && comment.status !== "unverified") {
    heading = C.alreadyTitle;
    content = <p className="font-body text-ink leading-relaxed">{C.alreadyText}</p>;
  } else if (valid && isUnverifiedExpired(comment)) {
    heading = C.expiredTitle;
    content = <p className="font-body text-ink leading-relaxed">{C.expiredText}</p>;
  } else if (valid && article) {
    heading = C.title;
    content = (
      <ConfirmSubscription
        email={email}
        token={t as string}
        lang={lang}
        endpoint="/api/comments/confirm"
        payload={{ slug, id, token: t as string }}
        doneHref={`/articles/${slug}`}
        expiredHref={`/articles/${slug}`}
        labels={{
          confirmText: C.confirmText.replace("{article}", article.title).replace("{email}", email),
          confirmButton: C.confirmButton,
          working: dict.confirm.working,
          doneTitle: C.doneTitle,
          doneText: comment.promo ? C.doneTextPromo : C.doneText,
          expiredTitle: C.expiredTitle,
          expiredText: C.expiredText,
          invalidTitle: C.invalidTitle,
          errorGeneric: dict.confirm.errorGeneric,
          errorRate: dict.confirm.errorRate,
          backHome: C.backToArticle,
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
