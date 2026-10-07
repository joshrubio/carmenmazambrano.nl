"use client";

import { usePathname } from "next/navigation";
import { stripLocale } from "@/i18n/config";
import { SubscribeForm } from "./SubscribeForm";

// Banda de suscripción justo antes del footer. Se oculta donde sobra:
// la propia página /newsletter y la de baja.
const HIDDEN_ON = ["/newsletter", "/unsubscribe"];

export function NewsletterSection({ label, title, text }: { label: string; title: string; text: string }) {
  const path = stripLocale(usePathname());
  if (HIDDEN_ON.some((p) => path === p || path.startsWith(`${p}/`))) return null;

  return (
    <section aria-labelledby="newsletter-heading" className="border-t-4 border-ink bg-surface mt-12">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5">
          <span className="label text-accent">{label}</span>
          <h2 id="newsletter-heading" className="font-display text-3xl sm:text-4xl font-black text-ink leading-tight mt-2">
            {title}
          </h2>
          <p className="font-body text-muted mt-3">{text}</p>
        </div>
        <div className="md:col-span-7 relative">
          <SubscribeForm source="footer" />
        </div>
      </div>
    </section>
  );
}
