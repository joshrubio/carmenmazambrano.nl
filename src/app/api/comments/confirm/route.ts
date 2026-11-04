export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { COMMENTER_COOKIE, COMMENTER_TTL_SEC } from "@/lib/comment-rules";
import { deleteComment, getComment, isUnverifiedExpired, putComment, subscribeOnVerifiedComment } from "@/lib/comments";
import { CONFIRM_RULES, rateLimit } from "@/lib/rate-limit";
import { signCommenter, verifyCommentConfirm } from "@/lib/unsubscribe-token";

// Verifica un comentario. Se llama con POST desde la página de confirmación, no al abrir el
// enlace, para que los escáneres de correo no publiquen comentarios sin querer.
// El clic prueba que la persona controla ese correo: se publica, se apunta a la newsletter si
// marcó la casilla, y se deja una cookie firmada para no repetir la verificación 90 días.
export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit(req, "comment-confirm", CONFIRM_RULES);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later.", code: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
      );
    }

    const body = await req.json().catch(() => null);
    const slug = typeof body?.slug === "string" ? body.slug : "";
    const id = typeof body?.id === "string" ? body.id : "";
    const token = typeof body?.token === "string" ? body.token : "";
    const comment = slug && id ? await getComment(slug, id) : null;
    if (!comment || !token || !verifyCommentConfirm(comment.email, slug, id, comment.verifyNonce ?? "", token)) {
      return NextResponse.json({ error: "Invalid link", code: "invalid_link" }, { status: 400 });
    }

    if (isUnverifiedExpired(comment)) {
      await deleteComment(slug, id); // se borra con su correo
      return NextResponse.json({ error: "Link expired", code: "expired" }, { status: 410 });
    }

    const already = comment.status !== "unverified";
    if (!already) {
      await putComment({ ...comment, status: "published", verifiedAt: new Date().toISOString() });
      if (comment.promo) {
        await subscribeOnVerifiedComment(comment).catch((e) => console.error("[comment-confirm promo]", e));
      }
    }

    const res = NextResponse.json({ ok: true, already });
    res.cookies.set({
      name: COMMENTER_COOKIE,
      value: signCommenter(comment.email, COMMENTER_TTL_SEC),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: COMMENTER_TTL_SEC,
      path: "/",
    });
    return res;
  } catch (err) {
    console.error("[comment-confirm]", err);
    return NextResponse.json({ error: "Something went wrong.", code: "server_error" }, { status: 500 });
  }
}
