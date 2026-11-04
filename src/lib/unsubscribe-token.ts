import { createHmac, timingSafeEqual } from "crypto";

// Tokens firmados (HMAC-SHA256) con un secreto del servidor. Permiten enlaces de un solo
// clic sin que nadie pueda actuar sobre un tercero adivinando su email. Cada finalidad
// ("unsubscribe", "confirm") firma con un prefijo distinto: un token no vale para otra cosa.
// Se usa UNSUBSCRIBE_SECRET si existe y, si no, SESSION_SECRET.
function secret(): string {
  const s = process.env.UNSUBSCRIBE_SECRET ?? process.env.SESSION_SECRET;
  if (!s) throw new Error("Falta SESSION_SECRET (o UNSUBSCRIBE_SECRET) para firmar enlaces");
  return s;
}

function sign(purpose: string, email: string, extra = ""): string {
  return createHmac("sha256", secret())
    .update(`${purpose}\n${email.trim().toLowerCase()}\n${extra}`)
    .digest("base64url");
}

function verify(expected: string, given: string): boolean {
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(given);
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

// --- Baja ---
export const signUnsubscribe = (email: string) => sign("unsubscribe", email);
export const verifyUnsubscribe = (email: string, token: string) => verify(signUnsubscribe(email), token);
export const unsubscribePath = (email: string, locale: string) =>
  `/${locale}/unsubscribe?e=${encodeURIComponent(email)}&t=${signUnsubscribe(email)}`;
// Endpoint de baja de un clic (RFC 8058) para la cabecera List-Unsubscribe
export const oneClickUnsubscribePath = (email: string) =>
  `/api/unsubscribe/one-click?e=${encodeURIComponent(email)}&t=${signUnsubscribe(email)}`;

// --- Confirmación del alta ---
// El token incluye un valor aleatorio del registro (`confirmNonce`): si la persona se da de baja
// y vuelve a apuntarse, se genera otro y los enlaces de confirmación antiguos dejan de valer.
export const signConfirm = (email: string, nonce: string) => sign("confirm", email, nonce);
export const verifyConfirm = (email: string, nonce: string, token: string) =>
  verify(signConfirm(email, nonce), token);
export const confirmPath = (email: string, nonce: string, locale: string) =>
  `/${locale}/confirm?e=${encodeURIComponent(email)}&t=${signConfirm(email, nonce)}`;

// --- Verificación de un comentario ---
// El enlace lleva la nota y el id del comentario, y el token firma además el email y un valor
// aleatorio del comentario: nadie puede verificar (ni publicar) un comentario ajeno.
export const signCommentConfirm = (email: string, slug: string, id: string, nonce: string) =>
  sign("comment-confirm", email, `${slug}\n${id}\n${nonce}`);
export const verifyCommentConfirm = (email: string, slug: string, id: string, nonce: string, token: string) =>
  verify(signCommentConfirm(email, slug, id, nonce), token);
export const commentConfirmPath = (c: { email: string; slug: string; id: string; verifyNonce?: string; locale: string }) =>
  `/${c.locale}/comment-confirm?s=${encodeURIComponent(c.slug)}&c=${encodeURIComponent(c.id)}&t=${signCommentConfirm(c.email, c.slug, c.id, c.verifyNonce ?? "")}`;

// --- Cookie de "correo ya verificado" ---
// Valor: <email en base64url>.<caduca (ms)>.<firma>. Solo la crea el servidor tras verificar un
// comentario; si alguien la altera, la firma deja de valer.
export function signCommenter(email: string, ttlSec: number): string {
  const e = email.trim().toLowerCase();
  const exp = Date.now() + ttlSec * 1000;
  return `${Buffer.from(e).toString("base64url")}.${exp}.${sign("commenter", e, String(exp))}`;
}

export function verifyCommenter(value: string | undefined): string | null {
  if (!value) return null;
  const [b64, expRaw, sig] = value.split(".");
  if (!b64 || !expRaw || !sig) return null;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Date.now()) return null;
  const email = Buffer.from(b64, "base64url").toString("utf8").trim().toLowerCase();
  return verify(sign("commenter", email, String(exp)), sig) ? email : null;
}
