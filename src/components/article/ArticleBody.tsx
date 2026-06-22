import Image from "next/image";
import type { ContentBlock } from "@/lib/articles";
import { MediaEmbed } from "./MediaEmbed";

interface Props {
  blocks: ContentBlock[];
}

export function ArticleBody({ blocks }: Props) {
  return (
    <div className="article-body space-y-4">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "paragraph":
            return (
              <p
                key={i}
                className="font-serif text-[1.05rem] leading-[1.75] text-[#1A1A1A] text-justify hyphens-auto"
              >
                {block.text}
              </p>
            );

          case "subheading":
            return (
              <h3
                key={i}
                className="font-serif text-xl font-bold text-[#1A1A1A] mt-6 mb-1 border-b border-[#ccc] pb-1"
              >
                {block.text}
              </h3>
            );

          case "pullquote":
            return (
              <blockquote
                key={i}
                className="border-l-4 border-[#8B1A1A] pl-4 my-6 font-serif text-xl italic text-[#333] leading-snug"
              >
                &ldquo;{block.text}&rdquo;
              </blockquote>
            );

          case "image":
            return (
              <figure key={i} className="my-6">
                <div className="relative w-full h-72">
                  <Image
                    src={block.src}
                    alt={block.alt}
                    fill
                    className="object-cover grayscale"
                  />
                </div>
                {block.caption && (
                  <figcaption className="text-xs font-sans text-[#666] mt-1 italic text-center">
                    {block.caption}
                  </figcaption>
                )}
              </figure>
            );

          case "video":
            return (
              <figure key={i} className="my-6">
                <MediaEmbed url={block.url} />
                {block.caption && (
                  <figcaption className="text-xs font-sans text-[#666] mt-1 italic text-center">
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
