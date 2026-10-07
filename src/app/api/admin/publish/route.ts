export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { ghGet, ghPutText } from "@/lib/storage";
import { slugify } from "@/lib/slug";

interface Block {
  type: string;
  text?: string;
  src?: string;
  alt?: string;
  caption?: string;
  images?: { src: string; alt: string }[];
  items?: { label: string; value: string; href?: string }[];
}

function parseBody(body: string, pullquote: string): Block[] {
  const blocks: Block[] = [];
  const sections = body.split(/\n{2,}/);
  let pullInserted = false;
  let paraCount = 0;

  for (const raw of sections) {
    const s = raw.trim();
    if (!s) continue;
    if (s.startsWith("## ")) {
      blocks.push({ type: "subheading", text: s.slice(3).trim() });
    } else {
      blocks.push({ type: "paragraph", text: s });
      paraCount++;
      if (!pullInserted && pullquote && paraCount === 2) {
        blocks.push({ type: "pullquote", text: pullquote });
        pullInserted = true;
      }
    }
  }

  if (!pullInserted && pullquote) {
    blocks.push({ type: "pullquote", text: pullquote });
  }

  return blocks;
}

function serializeBlock(b: Block): string {
  const lines: string[] = ["      {", `        type: ${JSON.stringify(b.type)},`];

  if (b.type === "paragraph" || b.type === "pullquote" || b.type === "subheading") {
    lines.push(`        text: ${JSON.stringify(b.text)},`);
  } else if (b.type === "image") {
    lines.push(`        src: ${JSON.stringify(b.src)},`);
    lines.push(`        alt: ${JSON.stringify(b.alt)},`);
    if (b.caption) lines.push(`        caption: ${JSON.stringify(b.caption)},`);
  } else if (b.type === "gallery") {
    lines.push(`        images: [`);
    for (const img of b.images ?? []) {
      lines.push(`          { src: ${JSON.stringify(img.src)}, alt: ${JSON.stringify(img.alt)} },`);
    }
    lines.push(`        ],`);
    if (b.caption) lines.push(`        caption: ${JSON.stringify(b.caption)},`);
  } else if (b.type === "infobox") {
    lines.push(`        items: [`);
    for (const item of b.items ?? []) {
      let s = `          { label: ${JSON.stringify(item.label)}, value: ${JSON.stringify(item.value)}`;
      if (item.href) s += `, href: ${JSON.stringify(item.href)}`;
      s += " },";
      lines.push(s);
    }
    lines.push(`        ],`);
  }

  lines.push("      },");
  return lines.join("\n");
}

function articleToTS(params: {
  slug: string;
  title: string;
  subtitle?: string;
  category: string;
  date: string;
  author: string;
  excerpt: string;
  coverImage?: string;
  blocks: Block[];
}): string {
  const { slug, title, subtitle, category, date, author, excerpt, coverImage, blocks } = params;
  const lines: string[] = [];
  lines.push("  {");
  lines.push(`    slug: ${JSON.stringify(slug)},`);
  lines.push(`    title: ${JSON.stringify(title)},`);
  if (subtitle) lines.push(`    subtitle: ${JSON.stringify(subtitle)},`);
  lines.push(`    category: ${JSON.stringify(category)},`);
  lines.push(`    date: ${JSON.stringify(date)},`);
  lines.push(`    author: ${JSON.stringify(author)},`);
  lines.push(`    excerpt:`);
  lines.push(`      ${JSON.stringify(excerpt)},`);
  if (coverImage) lines.push(`    coverImage: ${JSON.stringify(coverImage)},`);
  lines.push(`    featured: false,`);
  lines.push(`    content: [`);
  for (const b of blocks) lines.push(serializeBlock(b));
  lines.push(`    ],`);
  lines.push(`  },`);
  return lines.join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    const title = data.title as string;
    const subtitle = (data.subtitle as string | undefined) || undefined;
    const category = data.category as string;
    const date = data.date as string;
    const excerpt = data.excerpt as string;
    const body = data.body as string;
    const pullquote = (data.pullquote as string | undefined) ?? "";
    const linkedin = (data.linkedin as string | undefined) ?? "";
    const coverImage = (data.coverImage as string | undefined) || undefined;
    const galleryImages = (data.galleryImages as { src: string; alt: string }[] | undefined) ?? [];

    if (!title || !category || !date || !excerpt || !body) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const slug = slugify(title);
    const commitMsg = `Add article: ${title}`;

    const blocks: Block[] = [];

    if (coverImage) {
      blocks.push({ type: "image", src: coverImage, alt: title });
    }

    blocks.push(...parseBody(body, pullquote));

    if (galleryImages.length > 0) {
      blocks.push({ type: "gallery", images: galleryImages });
    }

    if (linkedin) {
      blocks.push({
        type: "infobox",
        items: [{ label: "LinkedIn", value: "Lees de originele post", href: linkedin }],
      });
    }

    const newArticleTS = articleToTS({
      slug,
      title,
      subtitle,
      category,
      date,
      author: "Carmen Zambrano",
      excerpt,
      coverImage,
      blocks,
    });

    const indexPath = "content/articles/index.ts";
    const { content: encodedContent, sha } = await ghGet(indexPath);
    const currentContent = Buffer.from(encodedContent, "base64").toString("utf8").replace(/\r\n/g, "\n");

    if (currentContent.includes(`slug: ${JSON.stringify(slug)},`)) {
      return NextResponse.json(
        { error: "Ya existe una nota con ese título. Cambia el título." },
        { status: 409 }
      );
    }

    const MARKER = "export const articles: Article[] = [\n";
    if (!currentContent.includes(MARKER)) {
      throw new Error("Could not find insertion point in articles/index.ts");
    }

    const updatedContent = currentContent.replace(MARKER, MARKER + newArticleTS + "\n");

    await ghPutText(indexPath, updatedContent, commitMsg, sha);

    return NextResponse.json({ ok: true, slug });
  } catch (err) {
    console.error("[publish]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
