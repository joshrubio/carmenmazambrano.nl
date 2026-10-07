"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

const inputClass =
  "w-full border border-rule bg-white px-4 py-3 font-body text-ink focus:outline-none focus:border-ink";

export function SubscribeForm({ source }: { source: "footer" | "page" }) {
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
        body: JSON.stringify({ name, email, consent, website, source }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong. Please try again.");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(
        err instanceof TypeError
          ? "Could not reach the server. Check your connection and try again."
          : err instanceof Error
            ? err.message
            : "Something went wrong. Please try again."
      );
    }
  }

  if (status === "success") {
    return (
      <div className="border border-ink bg-paper p-6" role="status">
        <p className="font-display text-2xl font-black text-ink mb-1">Thank you!</p>
        <p className="font-body text-muted">
          You&apos;re on the list. You&apos;ll hear from Carmen soon.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate={false}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor={`sub-name-${source}`} className="label text-muted block mb-1">
            Name (optional)
          </label>
          <input
            id={`sub-name-${source}`}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={100}
            autoComplete="name"
            className={inputClass}
            placeholder="Your name"
          />
        </div>
        <div>
          <label htmlFor={`sub-email-${source}`} className="label text-accent block mb-1">
            Email *
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
            placeholder="you@example.com"
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
          I agree to receive Carmen Zambrano&apos;s newsletter and to my name and email being stored for
          that purpose. I can unsubscribe at any time by emailing carmenmazambrano@gmail.com.
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
        {status === "loading" ? "Subscribing..." : "Subscribe"}
      </button>
    </form>
  );
}
