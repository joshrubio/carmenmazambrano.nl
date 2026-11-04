"use client";

import Link from "next/link";
import { useState } from "react";
import { localePath, type Locale } from "@/i18n/config";

interface Labels {
  confirmText: string;
  confirmButton: string;
  working: string;
  doneTitle: string;
  doneText: string;
  expiredTitle: string;
  expiredText: string;
  invalidTitle: string;
  errorGeneric: string;
  errorRate: string;
  backHome: string;
}

// La confirmación se hace con un POST al pulsar el botón (no al abrir el enlace) para que los
// escáneres de correo que "visitan" los enlaces no confirmen altas por su cuenta.
export function ConfirmSubscription({
  email,
  token,
  lang,
  labels,
}: {
  email: string;
  token: string;
  lang: Locale;
  labels: Labels;
}) {
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "expired" | "error">("idle");
  const [error, setError] = useState("");

  async function handleConfirm() {
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 410) return setStatus("expired");
      if (!res.ok) throw new Error(data?.code === "rate_limited" ? labels.errorRate : labels.errorGeneric);
      setStatus("done");
    } catch (err) {
      setStatus("error");
      setError(err instanceof TypeError || !(err instanceof Error) ? labels.errorGeneric : err.message);
    }
  }

  if (status === "done" || status === "expired") {
    const done = status === "done";
    return (
      <div className="rounded-2xl border border-ink bg-white p-6 shadow-soft" role="status">
        <p className="font-display text-2xl font-black text-ink mb-1">{done ? labels.doneTitle : labels.expiredTitle}</p>
        <p className="font-body text-muted mb-4">{done ? labels.doneText : labels.expiredText}</p>
        <Link
          href={localePath(lang, done ? "" : "/newsletter")}
          className="rounded-full label text-ink border border-ink px-4 py-2 hover:bg-ink hover:text-inverse transition-colors inline-block"
        >
          {labels.backHome}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="font-body text-ink">{labels.confirmText}</p>
      {status === "error" && (
        <p className="font-body text-sm text-accent" role="alert">
          {error}
        </p>
      )}
      <button
        onClick={handleConfirm}
        disabled={status === "loading"}
        className="rounded-full label bg-accent text-inverse px-8 py-3 hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {status === "loading" ? labels.working : labels.confirmButton}
      </button>
    </div>
  );
}
