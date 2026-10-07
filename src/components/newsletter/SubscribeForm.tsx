"use client";

import Link from "next/link";
import { useState } from "react";
import { localePath } from "@/i18n/config";
import { useLocale } from "@/i18n/LocaleProvider";

type Status = "idle" | "loading" | "success" | "error";

const inputClass =
  "w-full border border-rule bg-white px-4 py-3 font-body text-ink focus:outline-none focus:border-ink";

export function SubscribeForm({ source }: { source: "footer" | "page" }) {
  const { lang, t } = useLocale();
  const s = t.subscribe;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, consent, website, source, locale: lang }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        // La API devuelve un `code` estable; el texto se localiza aquí.
        const messages: Record<string, string> = {
          invalid_email: s.errorInvalidEmail,
          consent_required: s.errorConsent,
          rate_limited: s.errorRate,
        };
        throw new Error(messages[data?.code] ?? s.errorGeneric);
      }
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof TypeError ? s.errorNetwork : err instanceof Error ? err.message : s.errorGeneric);
    }
  }

  if (status === "success") {
    return (
      <div className="border border-ink bg-paper p-6" role="status">
        <p className="font-display text-2xl font-black text-ink mb-1">{s.successTitle}</p>
        <p className="font-body text-muted">{s.successText}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`sub-name-${source}`} className="label text-muted block mb-1">
            {s.nameLabel}
          </label>
          <input
            id={`sub-name-${source}`}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            autoComplete="name"
            className={inputClass}
            placeholder={s.namePlaceholder}
          />
        </div>
        <div>
          <label htmlFor={`sub-email-${source}`} className="label text-accent block mb-1">
            {s.emailLabel}
          </label>
          <input
            id={`sub-email-${source}`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={254}
            autoComplete="email"
            required
            className={inputClass}
            placeholder={s.emailPlaceholder}
          />
        </div>
      </div>

      {/* Honeypot: invisible para personas, los bots lo rellenan */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          required
          className="mt-1 h-4 w-4 accent-[#8B1A1A] shrink-0"
        />
        <span className="font-body text-sm text-muted leading-snug">
          {s.consentBefore}
          <Link
            href={localePath(lang, "/privacy")}
            target="_blank"
            className="text-ink underline underline-offset-2 hover:text-accent"
          >
            {s.consentLink}
          </Link>
          {s.consentAfter}
        </span>
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
        {status === "loading" ? s.submitting : s.submit}
      </button>
    </form>
  );
}
