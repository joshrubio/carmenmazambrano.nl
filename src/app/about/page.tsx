import type { Metadata } from "next";
import { about } from "../../../content/about";
import { ThickRule } from "@/components/ui/ColumnDivider";

export const metadata: Metadata = {
  title: "About",
  description: about.bio[0],
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* Section label */}
      <div className="flex items-center gap-3 mb-8">
        <span className="font-sans text-[10px] uppercase tracking-widest font-semibold text-[#8B1A1A]">
          Profile
        </span>
        <ThickRule />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Name & title */}
        <div className="md:col-span-4">
          <div className="sticky top-8">
            <h1 className="font-serif text-4xl font-black leading-tight text-[#1A1A1A]">
              {about.name}
            </h1>
            <p className="font-serif text-base italic text-[#555] mt-1">{about.title}</p>

            <div className="mt-6 space-y-2 text-sm font-sans text-[#333] border-t border-[#ccc] pt-4">
              <div className="flex gap-2">
                <span className="text-[#8B1A1A] uppercase text-[10px] tracking-widest w-20 pt-0.5">
                  Location
                </span>
                <span>{about.location}</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#8B1A1A] uppercase text-[10px] tracking-widest w-20 pt-0.5">
                  Phone
                </span>
                <a href={`tel:${about.phone}`} className="hover:text-[#8B1A1A]">
                  {about.phone}
                </a>
              </div>
              {"email" in about.social && (
                <div className="flex gap-2">
                  <span className="text-[#8B1A1A] uppercase text-[10px] tracking-widest w-20 pt-0.5">
                    Email
                  </span>
                  <a
                    href={`mailto:${(about.social as { email: string }).email}`}
                    className="hover:text-[#8B1A1A]"
                  >
                    {(about.social as { email: string }).email}
                  </a>
                </div>
              )}
            </div>

            {/* Specialties */}
            <div className="mt-6">
              <p className="font-sans text-[10px] uppercase tracking-widest text-[#8B1A1A] mb-2">
                Specialties
              </p>
              <ul className="space-y-1">
                {about.specialties.map((s) => (
                  <li
                    key={s}
                    className="font-sans text-xs text-[#333] flex items-center gap-2 before:content-['—'] before:text-[#8B1A1A]"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="md:col-span-8 md:border-l md:border-[#ccc] md:pl-8">
          <div className="space-y-5">
            {about.bio.map((paragraph, i) => (
              <p
                key={i}
                className={`font-serif text-lg leading-relaxed text-[#1A1A1A] text-justify hyphens-auto ${
                  i === 0 ? "text-xl font-medium" : ""
                }`}
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Social links */}
          {Object.keys(about.social).length > 0 && (
            <div className="mt-8 flex gap-4 border-t border-[#ccc] pt-6">
              {Object.entries(about.social).map(([key, url]) => (
                <a
                  key={key}
                  href={url as string}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-sans text-[10px] uppercase tracking-widest border border-[#1A1A1A] px-4 py-2 hover:bg-[#1A1A1A] hover:text-[#FAF7F0] transition-colors"
                >
                  {key}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
