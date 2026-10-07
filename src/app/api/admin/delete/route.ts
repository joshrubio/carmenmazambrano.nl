export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { ghGet, commitChanges, type FileChange } from "@/lib/storage";

const INDEX_PATH = "content/articles/index.ts";

// Cada artículo de index.ts empieza con "  {\n    slug: ..." y termina con
// "\n  },\n" (los bloques internos van más indentados, así que no confunden).
function removeArticle(source: string, slug: string) {
  const start = source.indexOf(`  {\n    slug: ${JSON.stringify(slug)},\n`);
  if (start === -1) return null;
  const closing = "\n  },\n";
  const end = source.indexOf(closing, start);
  if (end === -1) return null;
  const stop = end + closing.length;
  return { removed: source.slice(start, stop), rest: source.slice(0, start) + source.slice(stop) };
}

export async function POST(req: NextRequest) {
  try {
    const { slug } = (await req.json()) as { slug?: string };
    if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: "Slug no válido" }, { status: 400 });
    }

    const { content } = await ghGet(INDEX_PATH);
    const source = Buffer.from(content, "base64").toString("utf8").replace(/\r\n/g, "\n");
    const result = removeArticle(source, slug);
    if (!result) {
      return NextResponse.json({ error: "No se encontró esa nota" }, { status: 404 });
    }

    // Borra también sus fotos, salvo las que otra nota o la página About sigan usando.
    const { content: aboutB64 } = await ghGet("content/about.ts");
    const stillUsed = result.rest + Buffer.from(aboutB64, "base64").toString("utf8");
    const images = new Set(result.removed.match(/\/images\/[A-Za-z0-9._-]+\.webp/g) ?? []);
    const changes: FileChange[] = [{ path: INDEX_PATH, text: result.rest }];
    for (const img of images) {
      if (!stillUsed.includes(img)) changes.push({ path: `public${img}`, delete: true });
    }

    await commitChanges(changes, `Delete article: ${slug}`);
    return NextResponse.json({ ok: true, slug, imagesDeleted: changes.length - 1 });
  } catch (err) {
    console.error("[delete]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
