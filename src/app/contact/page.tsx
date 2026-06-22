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
        <span className="font-sans text-[10px] uppercase tracking-widest font-semibold text-[#8B1A1A]">
          Contact
        </span>
        <ThickRule />
      </div>

      <h1 className="font-serif text-4xl font-black text-[#1A1A1A] mb-2">
        Get in Touch
      </h1>
      <p className="font-serif text-lg text-[#555] italic mb-8">
        For press inquiries, collaborations, or consulting engagements.
      </p>

      <div className="space-y-4 border-t border-[#ccc] pt-6">
        <div className="flex gap-4 items-start">
          <span className="font-sans text-[10px] uppercase tracking-widest text-[#8B1A1A] w-20 pt-1">
            Phone
          </span>
          <a
            href={`tel:${about.phone}`}
            className="font-serif text-lg text-[#1A1A1A] hover:text-[#8B1A1A] transition-colors"
          >
            {about.phone}
          </a>
        </div>
        <div className="flex gap-4 items-start">
          <span className="font-sans text-[10px] uppercase tracking-widest text-[#8B1A1A] w-20 pt-1">
            Location
          </span>
          <span className="font-serif text-lg text-[#1A1A1A]">{about.location}</span>
        </div>
        {"email" in about.social && (
          <div className="flex gap-4 items-start">
            <span className="font-sans text-[10px] uppercase tracking-widest text-[#8B1A1A] w-20 pt-1">
              Email
            </span>
            <a
              href={`mailto:${(about.social as { email: string }).email}`}
              className="font-serif text-lg text-[#1A1A1A] hover:text-[#8B1A1A] transition-colors"
            >
              {(about.social as { email: string }).email}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
