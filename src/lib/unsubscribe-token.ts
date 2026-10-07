import { createHmac, timingSafeEqual } from "crypto";

// Token de baja = HMAC-SHA256(email) con un secreto del servidor. Permite enlaces
// de baja de un solo clic sin que nadie pueda dar de baja a un tercero adivinando
// su email. Se usa UNSUBSCRIBE_SECRET si existe y, si no, SESSION_SECRET.
function secret(): string {
  const s = process.env.UNSUBSCRIBE_SECRET ?? process.env.SESSION_SECRET;
  if (!s) throw new Error("Falta SESSION_SECRET (o UNSUBSCRIBE_SECRET) para firmar enlaces de baja");
  return s;
}

export function signUnsubscribe(email: string): string {
  return createHmac("sha256", secret()).update(email.trim().toLowerCase()).digest("base64url");
}

export function verifyUnsubscribe(email: string, token: string): boolean {
  try {
    const expected = Buffer.from(signUnsubscribe(email));
    const given = Buffer.from(token);
    return expected.length === given.length && timingSafeEqual(expected, given);
  } catch {
    return false;
  }
}

export function unsubscribePath(email: string, locale: string): string {
  return `/${locale}/unsubscribe?e=${encodeURIComponent(email)}&t=${signUnsubscribe(email)}`;
}
