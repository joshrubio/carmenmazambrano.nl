"use client";

import { usePathname } from "next/navigation";
import { stripLocale } from "@/i18n/config";
import { NewsletterCard } from "./NewsletterCard";

// Banda de suscripción justo antes del footer. Se oculta donde sobra:
// la propia página /newsletter y las de confirmación y baja.
const HIDDEN_ON = ["/newsletter", "/unsubscribe", "/confirm"];

export function NewsletterSection({ label, title, text }: { label: string; title: string; text: string }) {
  const path = stripLocale(usePathname());
  if (HIDDEN_ON.some((p) => path === p || path.startsWith(`${p}/`))) return null;

  return (
    <section aria-labelledby="newsletter-heading" className="max-w-6xl mx-auto w-full px-4 mt-12 mb-12">
      <NewsletterCard label={label} title={title} text={text} source="footer" headingId="newsletter-heading" />
    </section>
  );
}
