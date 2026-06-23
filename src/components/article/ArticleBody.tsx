import Image from "next/image";
import type { ContentBlock } from "@/lib/articles";
import { MediaEmbed } from "./MediaEmbed";

interface Props {
  blocks: ContentBlock[];
  dropCap?: boolean;
}

export function ArticleBody({ blocks, dropCap = true }: Props) {
  return (
    <div className="space-y-4">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "paragraph":
            return (
              <p
                key={i}
                className={`font-body text-base leading-[1.85] text-ink text-justify hyphens-auto ${
                  i === 0 && dropCap ? "drop-cap" : ""
                }`}
              >
                {block.text}
              </p>
            );

          case "subheading":
            return (
              <h3
                key={i}
                className="font-display text-2xl font-bold text-ink mt-8 mb-2 border-b border-rule pb-1"
              >
                {block.text}
              </h3>
            );

          case "pullquote":
            return (
              <blockquote
                key={i}
                className="border-l-4 border-accent pl-5 my-8 font-display text-2xl italic text-muted leading-snug"
              >
                &ldquo;{block.text}&rdquo;
              </blockquote>
            );

          case "image":
            return (
              <figure key={i} className="my-6">
                <div className="relative w-full h-72">
                  <Image src={block.src} alt={block.alt} fill className="object-cover" />
                </div>
                {block.caption && (
                  <figcaption className="label text-dim font-normal normal-case tracking-wide mt-2 italic text-center">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );

          case "gallery":
            return (
              <figure key={i} className="my-8">
                <div className={`grid gap-2 ${
                  block.images.length === 2
                    ? "grid-cols-2"
                    : block.images.length >= 3
                    ? "grid-cols-2 md:grid-cols-3"
                    : "grid-cols-1"
                }`}>
                  {block.images.map((img, j) => (
                    <div key={j} className="relative aspect-[4/3] overflow-hidden">
                      <Image
                        src={img.src}
                        alt={img.alt}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ))}
                </div>
                {block.caption && (
                  <figcaption className="label text-dim font-normal normal-case tracking-wide mt-2 italic text-center">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );

          case "infobox":
            return (
              <div key={i} className="my-6 border border-rule bg-surface p-5">
                <dl className="space-y-2">
                  {block.items.map((item, j) => (
                    <div key={j} className="flex gap-4 items-baseline">
                      <dt className="label text-accent shrink-0 w-24">{item.label}</dt>
                      <dd className="font-body text-sm text-ink">
                        {item.href ? (
                          <a href={item.href} target="_blank" rel="noopener noreferrer"
                            className="hover:text-accent transition-colors underline underline-offset-2">
                            {item.value}
                          </a>
                        ) : item.value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            );

          case "video":
            return (
              <figure key={i} className="my-6">
                <MediaEmbed url={block.url} />
                {block.caption && (
                  <figcaption className="label text-dim font-normal normal-case tracking-wide mt-2 italic text-center">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
