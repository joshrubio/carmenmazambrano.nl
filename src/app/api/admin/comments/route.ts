export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { deleteComment, getComment, listAllComments, putComment } from "@/lib/comments";

// Protegido por proxy.ts (todo /api/admin exige sesión).
// El panel ve los correos (los necesita para atender peticiones de borrado); el público, nunca.

export async function GET() {
  try {
    const comments = await listAllComments();
    return NextResponse.json({
      comments: comments.map((c) => ({
        id: c.id, slug: c.slug, articleTitle: c.articleTitle, name: c.name, email: c.email,
        body: c.body, status: c.status, promo: c.promo, createdAt: c.createdAt, locale: c.locale,
      })),
      total: comments.length,
    });
  } catch (err) {
    console.error("[admin comments GET]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error desconocido" }, { status: 500 });
  }
}

// { action: "hide" | "show" | "delete", slug, id }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const action = body?.action;
    const slug = typeof body?.slug === "string" ? body.slug : "";
    const id = typeof body?.id === "string" ? body.id : "";
    if (!slug || !id || !["hide", "show", "delete"].includes(action)) {
      return NextResponse.json({ error: "Petición no válida" }, { status: 400 });
    }
    const comment = await getComment(slug, id);
    if (!comment) return NextResponse.json({ error: "El comentario ya no existe" }, { status: 404 });

    if (action === "delete") {
      await deleteComment(slug, id);
    } else if (comment.status === "unverified") {
      return NextResponse.json({ error: "Aún no ha verificado su correo" }, { status: 409 });
    } else {
      await putComment({ ...comment, status: action === "hide" ? "hidden" : "published" });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin comments POST]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error desconocido" }, { status: 500 });
  }
}
