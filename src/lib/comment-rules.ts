// Reglas de los comentarios que comparten el formulario (navegador) y la API (servidor).
// Sin dependencias del servidor, para poder importarlo desde componentes cliente.

// Decisión editorial: la casilla de recibir correos promocionales es obligatoria para comentar.
// OJO: el RGPD pide que el consentimiento de marketing sea libre y separado; exigirlo para
// comentar lo deja "condicionado". Para pasar a opcional basta con poner esto en `false`:
// el formulario y la API se adaptan solos.
export const PROMO_REQUIRED = true;

export const COMMENT_LIMITS = {
  nameMin: 2,
  nameMax: 60,
  bodyMin: 2,
  bodyMax: 1500,
  // Más de un enlace en un comentario es casi siempre spam
  maxLinks: 1,
} as const;

// Un comentario sin verificar caduca (y se borra, con su email) a los 7 días.
export const UNVERIFIED_TTL_MS = 7 * 24 * 60 * 60 * 1000;

// Cookie que recuerda el correo ya verificado, para no repetir la verificación.
export const COMMENTER_COOKIE = "tnp_commenter";
export const COMMENTER_TTL_SEC = 90 * 24 * 60 * 60;

export type CommentErrorCode =
  | "invalid_name"
  | "invalid_email"
  | "invalid_body"
  | "too_many_links"
  | "privacy_required"
  | "promo_required";

// Limpia un texto de comentario: saltos de línea normalizados, sin caracteres de control,
// sin más de una línea en blanco seguida y sin espacios sobrantes.
export function cleanBody(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export const cleanName = (raw: string) => raw.replace(/\s+/g, " ").trim().slice(0, COMMENT_LIMITS.nameMax);

export const countLinks = (text: string) => (text.match(/https?:\/\/|www\./gi) ?? []).length;
