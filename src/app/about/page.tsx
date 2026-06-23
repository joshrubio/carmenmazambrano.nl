import type { Metadata } from "next";
import { about } from "../../../content/about";
import { ThickRule, HorizontalRule } from "@/components/ui/ColumnDivider";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { SkillBars } from "@/components/ui/SkillBars";
import { Timeline } from "@/components/ui/Timeline";

export const metadata: Metadata = {
  title: "About",
  description: about.bio[0],
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center gap-3 mb-8">
        <span className="label text-accent">Profile</span>
        <ThickRule />
      </div>

      {/* ── Bio section ── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
        {/* Sidebar — sticky */}
        <div className="md:col-span-4">
          <div className="sticky top-8">
            {/* Photo */}
            <div className="relative w-full aspect-[3/4] overflow-hidden mb-4">
              <PhotoSlot src={about.photo} alt={about.name} grayscale={false} />
            </div>

            <h1 className="font-display text-4xl font-black leading-tight text-ink">
              {about.name}
            </h1>
            <p className="font-display text-base italic text-muted font-normal mt-1">
              {about.title}
            </p>

            <div className="mt-6 space-y-3 border-t border-rule pt-4">
              <div className="flex gap-3">
                <span className="label text-accent w-20 shrink-0 pt-0.5">Location</span>
                <span className="font-body text-sm text-ink">{about.location}</span>
              </div>
              <div className="flex gap-3">
                <span className="label text-accent w-20 shrink-0 pt-0.5">Phone</span>
                <a
                  href={`tel:${about.phone}`}
                  className="font-body text-sm text-ink hover:text-accent transition-colors"
                >
                  {about.phone}
                </a>
              </div>
              <div className="flex gap-3">
                <span className="label text-accent w-20 shrink-0 pt-0.5">Email</span>
                <a
                  href={`mailto:${about.email}`}
                  className="font-body text-sm text-ink hover:text-accent transition-colors break-all"
                >
                  {about.email}
                </a>
              </div>
            </div>

            <div className="mt-6">
              <p className="label text-accent mb-3">Specialties</p>
              <ul className="space-y-1.5">
                {about.specialties.map((s) => (
                  <li
                    key={s}
                    className="label text-muted font-normal normal-case tracking-wide flex items-center gap-2 before:content-['—'] before:text-accent"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Social */}
            {Object.keys(about.social).length > 0 && (
              <div className="mt-6 flex gap-3 border-t border-rule pt-4">
                {Object.entries(about.social).map(([key, url]) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="label text-ink font-normal border border-ink px-3 py-2 hover:bg-ink hover:text-inverse transition-colors capitalize"
                  >
                    {key}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bio */}
        <div className="md:col-span-8 md:border-l md:border-rule md:pl-8">
          <div className="space-y-5">
            {about.bio.map((paragraph, i) => (
              <p
                key={i}
                className={`font-body text-ink text-justify hyphens-auto leading-[1.85] ${
                  i === 0 ? "text-lg font-medium" : "text-base"
                }`}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>

      <HorizontalRule />

      {/* ── Skills section ── */}
      <div className="mt-10 mb-12">
        <div className="flex items-center gap-3 mb-8">
          <span className="label text-accent">Skills</span>
          <ThickRule />
        </div>
        <SkillBars
          languages={about.skills.languages}
          tools={about.skills.tools}
        />
      </div>

      <HorizontalRule />

      {/* ── Experience section ── */}
      <div className="mt-10">
        <div className="flex items-center gap-3 mb-10">
          <span className="label text-accent">Experience</span>
          <ThickRule />
        </div>
        <Timeline items={about.experience} />
      </div>
    </div>
  );
}
