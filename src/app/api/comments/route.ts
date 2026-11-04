export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getArticleBySlug } from "@/lib/articles";
import {
  COMMENT_LIMITS, COMMENTER_COOKIE, PROMO_REQUIRED,
  cleanBody, cleanName, countLinks, type CommentErrorCode,
} from "@/lib/comment-rules";
import {
  deleteComment, listPublished, newCommentId, newNonce, purgeExpired, putComment,
  subscribeOnTrustedComment, toPublic, type Comment,
} from "@/lib/comments";
import { sendEmail, siteUrl } from "@/lib/email";
import { renderCommentConfirmEmail } from "@/lib/email-templates";
import { COMMENT_EMAIL_RULES, COMMENT_RULES, limitBy, rateLimit } from "@/lib/rate-limit";
import { EMAIL_RE } from "@/lib/subscribers";
import { commentConfirmPath, verifyCommenter } from "@/lib/unsubscribe-token";
import { defaultLocale, hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

type Code = CommentErrorCode | "unknown_article" | "rate_limited" | "email_failed";
const fail = (code: Code, status = 400, headers?: HeadersInit) =>
  NextResponse.json({ error: code, code }, { status, headers });

// Comentarios publicados de una nota (sin correos). Siempre frescos: no se cachean.
export async function GET(req: NextRequest) {
  try {
    const slug = req.nextUrl.searchParams.get("slug") ?? "";
    if (!getArticleBySlug(slug)) return fail("unknown_article", 404);
    const comments = await listPublished(slug);
    return NextResponse.json({ comments }, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error("[comments GET]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

// Deja un comentario.
//  · Con la cookie firmada de un correo ya verificado (y ese mismo correo): se publica al momento.
//  · Si no: se guarda "sin verificar" y se envía un correo con un enlace; se publica al pulsarlo.
// La respuesta no depende de si el correo está en la lista de suscriptores.
export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit(req, "comment", COMMENT_RULES);
    if (!limited.ok) return fail("rate_limited", 429, { "Retry-After": String(limited.retryAfter) });

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    // Honeypot: un bot rellena este campo oculto; fingimos éxito sin guardar nada.
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({ ok: true, status: "verify" });
    }

    const slug = typeof body.slug === "string" ? body.slug : "";
    const article = getArticleBySlug(slug);
    if (!article) return fail("unknown_article", 404);

    const name = typeof body.name === "string" ? cleanName(body.name) : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const text = typeof body.body === "string" ? cleanBody(body.body) : "";
    const locale = hasLocale(body.locale) ? body.locale : defaultLocale;

    if (name.length < COMMENT_LIMITS.nameMin) return fail("invalid_name");
    if (!email || email.length > 254 || !EMAIL_RE.test(email)) return fail("invalid_email");
    if (text.length < COMMENT_LIMITS.bodyMin || text.length > COMMENT_LIMITS.bodyMax) return fail("invalid_body");
    if (countLinks(text) > COMMENT_LIMITS.maxLinks) return fail("too_many_links");
    if (body.privacy !== true) return fail("privacy_required");
    if (PROMO_REQUIRED && body.promo !== true) return fail("promo_required");
    const promo = body.promo === true;

    await purgeExpired(slug); // no se conservan correos de comentarios que caducaron sin verificar

    const now = new Date().toISOString();
    const base: Comment = {
      id: newCommentId(), slug, name, email, body: text, locale, status: "unverified", createdAt: now, promo,
    };

    // --- Correo ya verificado en este navegador: se publica al momento ---
    if (verifyCommenter(req.cookies.get(COMMENTER_COOKIE)?.value) === email) {
      const published: Comment = { ...base, status: "published", verifiedAt: now };
      await putComment(published);
      if (promo) {
        // Un fallo al apuntarle a la lista no debe tirar abajo un comentario ya publicado.
        await subscribeOnTrustedComment(published, req.nextUrl.origin).catch((e) => console.error("[comments promo]", e));
      }
      return NextResponse.json({ ok: true, status: "published", comment: toPublic(published) });
    }

    // --- Sin verificar: se guarda y se envía el enlace ---
    const byEmail = await limitBy("comment-email", email, COMMENT_EMAIL_RULES);
    if (!byEmail.ok) return fail("rate_limited", 429, { "Retry-After": String(byEmail.retryAfter) });

    const pending: Comment = { ...base, verifyNonce: newNonce() };
    await putComment(pending);
    try {
      const dict = await getDictionary(locale);
      const confirmUrl = siteUrl(req.nextUrl.origin) + commentConfirmPath(pending);
      const mail = renderCommentConfirmEmail({
        lang: locale, dict, name, articleTitle: article.title, commentBody: text, confirmUrl, promo,
      });
      await sendEmail({ to: email, subject: mail.subject, html: mail.html, text: mail.text });
      await putComment({ ...pending, verificationSentAt: new Date().toISOString() });
    } catch (err) {
      // Sin correo no hay forma de verificar: no se deja el comentario (ni el email) guardado.
      console.error("[comments email]", err);
      await deleteComment(slug, pending.id).catch(() => {});
      return fail("email_failed", 502);
    }
    return NextResponse.json({ ok: true, status: "verify" });
  } catch (err) {
    console.error("[comments POST]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again in a moment." }, { status: 500 });
  }
}
