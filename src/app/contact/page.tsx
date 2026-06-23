import type { Metadata } from "next";
import { about } from "../../../content/about";
import { ThickRule } from "@/components/ui/ColumnDivider";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with Carmen Zambrano.",
};

export default function ContactPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <span className="label text-accent">Contact</span>
        <ThickRule />
      </div>

      <h1 className="font-display text-5xl font-black text-ink mb-2">
        Get in Touch
      </h1>
      <p className="font-display text-lg text-muted italic font-normal mb-8">
        For press inquiries, collaborations, or consulting engagements.
      </p>

      <div className="space-y-5 border-t border-rule pt-6">
        <div className="flex gap-6 items-baseline">
          <span className="label text-accent w-20 shrink-0">Phone</span>
          <a href={`tel:${about.phone}`} className="font-body text-xl text-ink hover:text-accent transition-colors">
            {about.phone}
          </a>
        </div>
        <div className="flex gap-6 items-baseline">
          <span className="label text-accent w-20 shrink-0">Location</span>
          <span className="font-body text-xl text-ink">{about.location}</span>
        </div>
        {Object.entries(about.social).map(([key, url]) => (
          <div key={key} className="flex gap-6 items-baseline">
            <span className="label text-accent w-20 shrink-0 capitalize">{key}</span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-body text-base text-ink hover:text-accent transition-colors break-all"
            >
              {url.replace("https://", "")}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
