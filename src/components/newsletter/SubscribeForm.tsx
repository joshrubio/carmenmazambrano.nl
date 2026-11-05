"use client";

import Link from "next/link";
import { useState } from "react";
import { localePath } from "@/i18n/config";
import { useLocale } from "@/i18n/LocaleProvider";

type Status = "idle" | "loading" | "success" | "error";

// "light": sobre fondo claro (campos blancos) · "accent": dentro del bloque burdeos
const TONES = {
  light: {
    input:
      "w-full border border-rule bg-white px-5 py-3 font-body text-sm text-ink placeholder:text-dim focus:outline-none focus:border-ink",
    button: "label shrink-0 bg-accent text-inverse px-6 py-3 hover:opacity-90 transition-opacity disabled:opacity-50",
    consent: "text-muted",
    link: "text-ink underline underline-offset-2 hover:text-accent",
    error: "text-accent",
    success: " border border-ink bg-paper p-5 text-ink",
    successText: "text-muted",
    check: "accent-[#8B1A1A]",
  },
  accent: {
    input:
      "w-full border border-white/30 bg-white/10 px-5 py-3 font-body text-sm text-inverse placeholder:text-inverse/70 focus:outline-none focus:bg-white/20 focus:border-white/60",
    button: "label shrink-0 bg-paper text-ink px-6 py-3 hover:bg-white transition-colors disabled:opacity-60",
    consent: "text-inverse/80",
    link: "text-inverse underline underline-offset-2 hover:text-white",
    error: "text-inverse font-semibold",
    success: " border border-white/30 bg-white/10 p-5 text-inverse",
    successText: "text-inverse/80",
    check: "accent-[#FAF7F0]",
  },
} as const;

export function SubscribeForm({ source, tone = "light" }: { source: "footer" | "page"; tone?: keyof typeof TONES }) {
  const { lang, t } = useLocale();
  const s = t.subscribe;
  const c = TONES[tone];
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
      <div className={c.success} role="status">
        <p className="font-display text-2xl font-black mb-1">{s.successTitle}</p>
        <p className={`font-body ${c.successText}`}>{s.successText}</p>
      </div>
    );
  }

  const nameId = `sub-name-${source}`;
  const emailId = `sub-email-${source}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label htmlFor={nameId} className="sr-only">{s.nameLabel}</label>
        <input
          id={nameId}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          autoComplete="name"
          className={c.input}
          placeholder={s.namePlaceholder}
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="flex-1 min-w-0">
          <label htmlFor={emailId} className="sr-only">{s.emailLabel}</label>
          <input
            id={emailId}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={254}
            autoComplete="email"
            required
            className={c.input}
            placeholder={s.emailPlaceholder}
          />
        </div>
        <button type="submit" disabled={status === "loading"} className={c.button}>
          {status === "loading" ? s.submitting : s.submit}
        </button>
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
          className={`mt-1 h-4 w-4 shrink-0 ${c.check}`}
        />
        <span className={`font-body text-xs leading-snug ${c.consent}`}>
          {s.consentBefore}
          <Link href={localePath(lang, "/privacy")} target="_blank" className={c.link}>
            {s.consentLink}
          </Link>
          {s.consentAfter}
        </span>
      </label>

      {status === "error" && (
        <p className={`font-body text-sm ${c.error}`} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
