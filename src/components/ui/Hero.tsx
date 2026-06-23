import Link from "next/link";
import { PhotoSlot } from "./PhotoSlot";
import { about } from "../../../content/about";

const socialIcons: Record<string, React.ReactNode> = {
  linkedin: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.75a8.19 8.19 0 004.79 1.53V6.82a4.85 4.85 0 01-1.02-.13z" />
    </svg>
  ),
};

const socialLabels: Record<string, string> = {
  linkedin: "LinkedIn",
  tiktok: "TikTok",
};

export function Hero() {
  const socialEntries = Object.entries(about.social) as [string, string][];

  return (
    <section className="border-b-2 border-ink mb-8 pb-8">
      {/* Section label */}
      <div className="flex items-center gap-3 mb-5">
        <div className="h-[3px] w-8 bg-accent" />
        <span className="label text-accent">The Journalist</span>
        <div className="flex-1 h-[3px] bg-ink" />
      </div>

      {/* Photo left · content right */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-0">

        {/* Photo column */}
        <div className="md:col-span-4 md:border-r md:border-rule">
          <div className="relative w-full aspect-[3/4] max-h-80 md:max-h-none bg-surface overflow-hidden">
            <PhotoSlot src={about.photo} alt="Carmen Zambrano" grayscale={false} />
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 bg-gradient-to-t from-ink/40 to-transparent pointer-events-none" />
          </div>
          <div className="bg-ink px-3 py-2">
            <p className="label text-inverse/70 font-normal normal-case tracking-wide">
              Social Communicator &amp; Journalist · Rotterdam
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="md:col-span-8 md:pl-8 mt-5 md:mt-0 flex flex-col">

          {/* Display headline */}
          <h2 className="font-display text-5xl md:text-6xl font-black leading-[0.95] tracking-tight text-ink mb-4">
            30 Years<br />
            <span className="text-accent">Telling the</span><br />
            Stories That<br />
            Matter
          </h2>

          <div className="h-[2px] bg-ink mb-4" />

          {/* Bio — Lora, 2 newspaper columns */}
          <div className="col-2 mb-5">
            {about.bio.map((para, i) => (
              <p
                key={i}
                className="font-body text-sm leading-[1.85] text-ink text-justify hyphens-auto mb-3 break-inside-avoid"
              >
                {para}
              </p>
            ))}
          </div>

          <div className="h-px bg-rule mb-4" />

          {/* Specialties */}
          <div className="flex flex-wrap gap-x-5 gap-y-2 mb-5">
            {about.specialties.map((s) => (
              <span
                key={s}
                className="label text-muted font-normal normal-case tracking-wide flex items-center gap-1.5 before:content-['▪'] before:text-accent"
              >
                {s}
              </span>
            ))}
          </div>

          {/* Footer strip: location · phone · social · CTA */}
          <div className="flex items-start sm:items-center gap-x-4 gap-y-3 border-t border-rule pt-4 flex-wrap mt-auto">
            <div>
              <p className="label text-accent">Based in</p>
              <p className="font-body text-sm text-ink mt-0.5">{about.location}</p>
            </div>
            <div className="hidden sm:block w-px h-8 bg-rule shrink-0" />
            <div>
              <p className="label text-accent">Contact</p>
              <a
                href={`tel:${about.phone}`}
                className="font-body text-sm text-ink hover:text-accent transition-colors block mt-0.5"
              >
                {about.phone}
              </a>
            </div>
            <div className="hidden sm:block w-px h-8 bg-rule shrink-0" />
            <div>
              <p className="label text-accent">Email</p>
              <a
                href={`mailto:${about.email}`}
                className="font-body text-sm text-ink hover:text-accent transition-colors block mt-0.5 break-all"
              >
                {about.email}
              </a>
            </div>
            <div className="hidden sm:block w-px h-8 bg-rule shrink-0" />

            {/* Social buttons */}
            <div className="flex items-center gap-2">
              {socialEntries.map(([key, url]) => (
                <a
                  key={key}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={socialLabels[key] ?? key}
                  className="flex items-center gap-1.5 label text-ink font-normal normal-case tracking-wide border border-ink px-3 py-2 hover:bg-ink hover:text-inverse transition-colors"
                >
                  {socialIcons[key]}
                  <span className="hidden sm:inline">{socialLabels[key] ?? key}</span>
                </a>
              ))}
            </div>

            <Link
              href="/about"
              className="w-full sm:w-auto sm:ml-auto label text-ink font-normal normal-case tracking-wide border border-ink px-4 py-2 hover:bg-ink hover:text-inverse transition-colors whitespace-nowrap text-center"
            >
              Full Profile →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
