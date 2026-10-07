import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { about } from "../../../../content/about";
import { ThickRule, HorizontalRule } from "@/components/ui/ColumnDivider";
import { PhotoSlot } from "@/components/ui/PhotoSlot";
import { SkillBars } from "@/components/ui/SkillBars";
import { Timeline } from "@/components/ui/Timeline";
import { hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { alternatesFor } from "@/i18n/metadata";
import { formatPeriod } from "@/lib/period";

interface Props {
  params: Promise<{ lang: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: dict.about.title,
    description: dict.about.bio[0],
    alternates: alternatesFor(lang, "/about"),
  };
}

export default async function AboutPage({ params }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const A = dict.about;

  const skillName = (name: string) => A.skillNames[name as keyof typeof A.skillNames] ?? name;
  const level = (l?: string) => (l ? A.levels[l as keyof typeof A.levels] ?? l : undefined);
  const languages = about.skills.languages.map((s) => ({ name: skillName(s.name), level: level(s.level), pct: s.pct }));
  const tools = about.skills.tools.map((s) => ({ name: skillName(s.name), pct: s.pct }));
  const experience = about.experience.map((e) => {
    const text = A.experienceItems[e.id as keyof typeof A.experienceItems];
    return {
      title: text.title,
      org: e.org,
      location: e.location,
      from: formatPeriod(e.from, lang, A.present),
      to: formatPeriod(e.to, lang, A.present),
      description: text.description,
    };
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <span className="label text-accent">{A.profile}</span>
        <ThickRule />
      </div>

      {/* One grid — sidebar sticky, right col holds everything */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

        {/* ── Sidebar (sticky) ── */}
        <aside className="md:col-span-4">
          <div className="sticky top-8">
            <div className="relative w-full aspect-[3/4] max-h-80 md:max-h-none overflow-hidden mb-4">
              <PhotoSlot src={about.photo} alt={about.name} grayscale={false} fallbackText={dict.common.photoComingSoon} />
            </div>

            <h1 className="font-display text-4xl font-black leading-tight text-ink">
              {about.name}
            </h1>
            <p className="font-display text-base italic text-muted font-normal mt-1">
              {A.jobTitle}
            </p>

            <div className="mt-6 space-y-3 border-t border-rule pt-4">
              <div className="flex gap-3">
                <span className="label text-accent w-20 shrink-0 pt-0.5">{A.location}</span>
                <span className="font-body text-sm text-ink">{dict.common.location}</span>
              </div>
              <div className="flex gap-3">
                <span className="label text-accent w-20 shrink-0 pt-0.5">{A.phone}</span>
                <a href={`tel:${about.phone}`} className="font-body text-sm text-ink hover:text-accent transition-colors">
                  {about.phone}
                </a>
              </div>
              <div className="flex gap-3">
                <span className="label text-accent w-20 shrink-0 pt-0.5">{A.email}</span>
                <a href={`mailto:${about.email}`} className="font-body text-sm text-ink hover:text-accent transition-colors break-all">
                  {about.email}
                </a>
              </div>
            </div>

            <div className="mt-6">
              <p className="label text-accent mb-3">{A.specialties}</p>
              <ul className="space-y-1.5">
                {A.specialtiesList.map((s) => (
                  <li key={s} className="label text-muted font-normal normal-case tracking-wide flex items-center gap-2 before:content-['—'] before:text-accent">
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6 border-t border-rule pt-4">
              <a
                href={`mailto:${about.email}`}
                className="block w-full text-center label bg-accent text-inverse py-2.5 hover:opacity-90 transition-opacity"
              >
                {A.contactCta}
              </a>
            </div>

            <div className="mt-3 flex gap-3">
              {Object.entries(about.social).map(([key, url]) => (
                <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                  className="label text-ink font-normal border border-ink px-3 py-2 hover:bg-ink hover:text-inverse transition-colors capitalize"
                >
                  {key}
                </a>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Right column: bio → skills → timeline ── */}
        <div className="md:col-span-8 md:border-l md:border-rule md:pl-8 space-y-10">

          {/* Bio */}
          <div className="space-y-5">
            {A.bio.map((paragraph, i) => (
              <p key={i} className={`font-body text-ink text-justify hyphens-auto leading-[1.85] ${i === 0 ? "text-lg font-medium" : "text-base"}`}>
                {paragraph}
              </p>
            ))}
          </div>

          <HorizontalRule />

          {/* Skills */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="label text-accent">{A.skills}</span>
              <ThickRule />
            </div>
            <SkillBars languages={languages} tools={tools} />
          </div>

          <HorizontalRule />

          {/* Experience */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <span className="label text-accent">{A.experience}</span>
              <ThickRule />
            </div>
            <Timeline items={experience} />
          </div>

        </div>
      </div>
    </div>
  );
}
