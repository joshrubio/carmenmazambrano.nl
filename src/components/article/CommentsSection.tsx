"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { COMMENT_LIMITS, PROMO_REQUIRED } from "@/lib/comment-rules";
import { localePath } from "@/i18n/config";
import { format, useLocale } from "@/i18n/LocaleProvider";

interface PublicComment {
  id: string;
  name: string;
  body: string;
  createdAt: string;
}

type Status = "idle" | "loading" | "verify" | "published" | "error";

const DATE_TAGS = { es: "es-ES", en: "en-GB", nl: "nl-NL" } as const;

const field =
  "w-full border border-rule bg-white px-4 py-3 font-body text-sm text-ink placeholder:text-dim focus:outline-none focus:border-ink";

// Comentarios de una nota: lista pública (solo nombre, texto y fecha) y formulario. Las notas
// son estáticas, así que la lista se pide a la API al cargar.
export function CommentsSection({ slug }: { slug: string }) {
  const { lang, t } = useLocale();
  const C = t.comments;
  const [comments, setComments] = useState<PublicComment[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [privacy, setPrivacy] = useState(false);
  const [promo, setPromo] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/comments?slug=${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        if (!r.ok || !Array.isArray(d?.comments)) throw new Error("load");
        if (!cancelled) setComments(d.comments);
      })
      .catch(() => {
        if (!cancelled) setLoadFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name, email, body, privacy, promo, website, locale: lang }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        const known = C.errors as Record<string, string>;
        throw new Error(known[data?.code] ?? C.errors.generic);
      }
      if (data?.status === "published" && data.comment) {
        setComments((cur) => [...(cur ?? []), data.comment]);
        setStatus("published");
      } else {
        setStatus("verify");
      }
      setBody("");
    } catch (err) {
      setStatus("error");
      setError(err instanceof TypeError ? C.errors.network : err instanceof Error ? err.message : C.errors.generic);
    }
  }

  const n = comments?.length ?? 0;
  const done = status === "verify" || status === "published";

  return (
    <section aria-labelledby="comments-heading" className="mt-14 pt-8 border-t-4 border-ink">
      <h2 id="comments-heading" className="font-display text-3xl font-black text-ink">
        {C.title}
        {comments && n > 0 && (
          <span className="ml-3 label font-normal text-dim align-middle">{n === 1 ? C.countOne : format(C.count, { n })}</span>
        )}
      </h2>

      {/* Lista */}
      <div className="mt-6" aria-live="polite">
        {loadFailed && <p className="font-body text-sm text-muted">{C.loadError}</p>}
        {comments && n === 0 && <p className="font-body text-muted">{C.empty}</p>}
        {comments && n > 0 && (
          <ul className="divide-y divide-rule border-y border-rule">
            {comments.map((c) => (
              <li key={c.id} className="py-4">
                <p className="flex flex-wrap items-baseline gap-x-3">
                  <span className="label text-ink">{c.name}</span>
                  <time dateTime={c.createdAt} className="font-body text-xs text-dim">
                    {new Date(c.createdAt).toLocaleDateString(DATE_TAGS[lang], { dateStyle: "long" })}
                  </time>
                </p>
                <p className="font-body text-ink leading-relaxed mt-2 whitespace-pre-line break-words">{c.body}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Formulario */}
      <div className="mt-10 bg-surface border border-rule p-5 sm:p-6">
        <h3 className="font-display text-2xl font-black text-ink mb-4">{C.formTitle}</h3>

        {done ? (
          <div role="status" className="border border-ink bg-white p-5">
            <p className="font-display text-2xl font-black text-ink mb-1">
              {status === "verify" ? C.verifyTitle : C.publishedTitle}
            </p>
            <p className="font-body text-muted mb-4">{status === "verify" ? C.verifyText : C.publishedText}</p>
            <button
              type="button"
              onClick={() => setStatus("idle")}
              className="label text-ink border border-ink px-4 py-2 hover:bg-ink hover:text-inverse transition-colors"
            >
              {C.another}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="cm-name" className="label text-ink block mb-1.5">{C.nameLabel}</label>
                <input
                  id="cm-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  minLength={COMMENT_LIMITS.nameMin}
                  maxLength={COMMENT_LIMITS.nameMax}
                  autoComplete="name"
                  required
                  className={field}
                  placeholder={C.namePlaceholder}
                />
              </div>
              <div>
                <label htmlFor="cm-email" className="label text-ink block mb-1.5">{C.emailLabel}</label>
                <input
                  id="cm-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={254}
                  autoComplete="email"
                  required
                  className={field}
                  placeholder={C.emailPlaceholder}
                  aria-describedby="cm-email-note"
                />
                <p id="cm-email-note" className="font-body text-xs text-muted mt-1.5">{C.emailNote}</p>
              </div>
            </div>

            <div>
              <label htmlFor="cm-body" className="label text-ink block mb-1.5">{C.bodyLabel}</label>
              <textarea
                id="cm-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                minLength={COMMENT_LIMITS.bodyMin}
                maxLength={COMMENT_LIMITS.bodyMax}
                rows={5}
                required
                className={`${field} resize-y`}
                placeholder={C.bodyPlaceholder}
              />
              <p className="font-body text-xs text-dim mt-1 text-right" aria-hidden="true">
                {body.length} / {COMMENT_LIMITS.bodyMax}
              </p>
            </div>

            {/* Honeypot: invisible para personas, los bots lo rellenan */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Website
                <input type="text" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </label>
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={privacy}
                onChange={(e) => setPrivacy(e.target.checked)}
                required
                className="mt-1 h-4 w-4 shrink-0 accent-[#8B1A1A]"
              />
              <span className="font-body text-sm leading-snug text-ink">
                {C.privacyBefore}
                <Link href={localePath(lang, "/privacy")} target="_blank" className="underline underline-offset-2 hover:text-accent">
                  {C.privacyLink}
                </Link>
                {C.privacyAfter}
              </span>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={promo}
                onChange={(e) => setPromo(e.target.checked)}
                required={PROMO_REQUIRED}
                className="mt-1 h-4 w-4 shrink-0 accent-[#8B1A1A]"
              />
              <span className="font-body text-sm leading-snug text-ink">{C.promo}</span>
            </label>

            {status === "error" && (
              <p className="font-body text-sm text-accent" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "loading"}
              className="label bg-accent text-inverse px-8 py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {status === "loading" ? C.submitting : C.submit}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
