import type { Metadata } from "next";
import { ThickRule } from "@/components/ui/ColumnDivider";
import { SubscribeForm } from "@/components/newsletter/SubscribeForm";

export const metadata: Metadata = {
  title: "Newsletter",
  description: "Subscribe to Carmen Zambrano's newsletter: new articles, culture and community news from Rotterdam.",
};

export default function NewsletterPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <span className="label text-accent">Newsletter</span>
        <ThickRule />
      </div>

      <h1 className="font-display text-5xl font-black text-ink mb-2">Stay in the Loop</h1>
      <p className="font-display text-lg text-muted italic font-normal mb-8">
        New articles, culture and community news from Rotterdam, straight to your inbox.
      </p>

      <div className="relative border-t border-rule pt-6">
        <SubscribeForm source="page" />
      </div>
    </div>
  );
}
