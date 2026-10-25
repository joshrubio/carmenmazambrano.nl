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
