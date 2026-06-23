export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

const GH_API = "https://api.github.com";
const owner = () => process.env.GITHUB_OWNER!;
const repo = () => process.env.GITHUB_REPO!;
const branch = () => process.env.GITHUB_BRANCH ?? "master";
const ghToken = () => process.env.GITHUB_TOKEN!;

function ghHeaders() {
  return {
    Authorization: `Bearer ${ghToken()}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function ghGet(path: string): Promise<{ content: string; sha: string }> {
  const res = await fetch(
    `${GH_API}/repos/${owner()}/${repo()}/contents/${path}?ref=${branch()}`,
    { headers: ghHeaders() }
  );
  if (!res.ok) throw new Error(`GitHub GET ${path}: ${res.status}`);
  return res.json();
}

async function ghPutText(path: string, text: string, message: string, sha?: string) {
  const content = Buffer.from(text, "utf8").toString("base64");
  const body: Record<string, string> = { message, content, branch: branch() };
  if (sha) body.sha = sha;
  const res = await fetch(`${GH_API}/repos/${owner()}/${repo()}/contents/${path}`, {
    method: "PUT",
    headers: ghHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GitHub PUT ${path}: ${res.status} ${await res.text()}`);
}

async function ghPutBinary(path: string, data: Buffer, message: string) {
  const content = data.toString("base64");
  const body: Record<string, string> = { message, content, branch: branch() };
  try {
    const existing = await ghGet(path);
    body.sha = existing.sha;
  } catch {}
  const res = await fetch(`${GH_API}/repos/${owner()}/${repo()}/contents/${path}`, {
    method: "PUT",
    headers: ghHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GitHub PUT binary ${path}: ${res.status} ${await res.text()}`);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

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
    const formData = await req.formData();

    const title = formData.get("title") as string;
    const subtitle = formData.get("subtitle") as string | null;
    const category = formData.get("category") as string;
    const date = formData.get("date") as string;
    const excerpt = formData.get("excerpt") as string;
    const body = formData.get("body") as string;
    const pullquote = (formData.get("pullquote") as string | null) ?? "";
    const linkedin = (formData.get("linkedin") as string | null) ?? "";
    const coverFile = formData.get("cover") as File | null;
    const galleryFiles = formData.getAll("gallery") as File[];

    if (!title || !category || !date || !excerpt || !body) {
      return NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 });
    }

    const slug = slugify(title);
    const commitMsg = `Add article: ${title}`;

    // Upload cover image
    let coverImage: string | undefined;
    if (coverFile && coverFile.size > 0) {
      const coverBuffer = await sharp(Buffer.from(await coverFile.arrayBuffer()))
        .webp({ quality: 85 })
        .toBuffer();
      const coverPath = `public/images/${slug}-cover.webp`;
      await ghPutBinary(coverPath, coverBuffer, `Add cover image for: ${title}`);
      coverImage = `/images/${slug}-cover.webp`;
    }

    // Upload gallery images
    const galleryImages: { src: string; alt: string }[] = [];
    for (let i = 0; i < galleryFiles.length; i++) {
      const f = galleryFiles[i];
      if (!f || f.size === 0) continue;
      const buf = await sharp(Buffer.from(await f.arrayBuffer()))
        .webp({ quality: 85 })
        .toBuffer();
      const imgPath = `public/images/${slug}-${i + 1}.webp`;
      await ghPutBinary(imgPath, buf, `Add gallery image ${i + 1} for: ${title}`);
      galleryImages.push({ src: `/images/${slug}-${i + 1}.webp`, alt: `${title} — foto ${i + 1}` });
    }

    // Build content blocks
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

    // Generate TypeScript code for new article
    const newArticleTS = articleToTS({
      slug,
      title,
      subtitle: subtitle ?? undefined,
      category,
      date,
      author: "Carmen Zambrano",
      excerpt,
      coverImage,
      blocks,
    });

    // Fetch current articles index file
    const indexPath = "content/articles/index.ts";
    const { content: encodedContent, sha } = await ghGet(indexPath);
    const currentContent = Buffer.from(encodedContent, "base64").toString("utf8");

    const MARKER = "export const articles: Article[] = [\n";
    if (!currentContent.includes(MARKER)) {
      throw new Error("Could not find insertion point in articles/index.ts");
    }

    const updatedContent = currentContent.replace(
      MARKER,
      MARKER + newArticleTS + "\n"
    );

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
