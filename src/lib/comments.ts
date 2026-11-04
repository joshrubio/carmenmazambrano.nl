import { randomBytes } from "crypto";
import type { Locale } from "@/i18n/config";
import { getAllArticles } from "./articles";
import { canResend, sendConfirmation } from "./confirmation";
import { hash } from "./kv";
import { UNVERIFIED_TTL_MS } from "./comment-rules";
import { addSubscriber, getSubscriber, putSubscriber, type Subscriber } from "./subscribers";

// unverified: aún no ha confirmado su correo (no se muestra)
// published:  visible en la nota
// hidden:     retirado por la redacción (no se muestra)
export type CommentStatus = "unverified" | "published" | "hidden";

export interface Comment {
  id: string;
  slug: string;
  name: string;
  // Privado: nunca se envía al navegador de otras personas.
  email: string;
  body: string;
  locale: Locale;
  status: CommentStatus;
  createdAt: string;
  // Marcó la casilla de recibir correos promocionales
  promo: boolean;
  // Valor aleatorio que firma el enlace de verificación
  verifyNonce?: string;
  verificationSentAt?: string;
  verifiedAt?: string;
}

// Lo único que se publica de un comentario.
export interface PublicComment {
  id: string;
  name: string;
  body: string;
  createdAt: string;
}

// Un hash por nota: `comments-<slug>`. (Sin ":" para que valga también como nombre de archivo.)
const store = (slug: string) => hash(`comments-${slug}`);

export const newCommentId = () => `${Date.now().toString(36)}${randomBytes(4).toString("hex")}`;
export const newNonce = () => randomBytes(18).toString("base64url");

const parse = (raw: string) => JSON.parse(raw) as Comment;

export async function getComment(slug: string, id: string): Promise<Comment | null> {
  const raw = await store(slug).get(id);
  return raw ? parse(raw) : null;
}

export const putComment = async (c: Comment) => store(c.slug).set(c.id, JSON.stringify(c));
export const deleteComment = async (slug: string, id: string) => store(slug).del(id);

export async function listComments(slug: string): Promise<Comment[]> {
  const all = await store(slug).all();
  return Object.values(all)
    .map(parse)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export const toPublic = (c: Comment): PublicComment => ({ id: c.id, name: c.name, body: c.body, createdAt: c.createdAt });

export async function listPublished(slug: string): Promise<PublicComment[]> {
  return (await listComments(slug)).filter((c) => c.status === "published").map(toPublic);
}

export const isUnverifiedExpired = (c: Comment, now = Date.now()) =>
  c.status === "unverified" && now - new Date(c.createdAt).getTime() > UNVERIFIED_TTL_MS;

// Borra los comentarios sin verificar que ya caducaron (así no se conserva su email).
export async function purgeExpired(slug: string): Promise<number> {
  let n = 0;
  for (const c of await listComments(slug)) {
    if (isUnverifiedExpired(c) && (await deleteComment(slug, c.id))) n++;
  }
  return n;
}

// Todos los comentarios de todas las notas (para el panel de administración).
export async function listAllComments(): Promise<(Comment & { articleTitle: string })[]> {
  const out: (Comment & { articleTitle: string })[] = [];
  for (const a of getAllArticles()) {
    await purgeExpired(a.slug);
    for (const c of await listComments(a.slug)) out.push({ ...c, articleTitle: a.title });
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// --- Casilla "recibir correos promocionales" ---

// Se llama cuando la persona acaba de verificar su correo con el enlace del comentario. Ese clic
// vale como confirmación de la suscripción (el correo explica las dos cosas).
//   · no estaba en la lista      -> se apunta, ya confirmada
//   · estaba pendiente           -> se confirma
//   · ya estaba confirmada       -> no se toca nada
export async function subscribeOnVerifiedComment(c: Comment): Promise<void> {
  const now = new Date().toISOString();
  const existing = await getSubscriber(c.email);
  if (!existing) {
    const fresh: Subscriber = {
      email: c.email, name: c.name, consent: true, source: "comment", locale: c.locale,
      status: "confirmed", createdAt: now, confirmedAt: now,
    };
    if (await addSubscriber(fresh)) return;
    const again = await getSubscriber(c.email);
    if (!again) return;
    return subscribeOnVerifiedCommentExisting(again, now);
  }
  return subscribeOnVerifiedCommentExisting(existing, now);
}

async function subscribeOnVerifiedCommentExisting(existing: Subscriber, now: string) {
  if (existing.status === "pending") await putSubscriber({ ...existing, status: "confirmed", confirmedAt: now });
}

// Comentario de alguien con la cookie de correo ya verificado: se publica al momento. Si marcó la
// casilla y NO figura en la lista (nunca se apuntó, o se dio de baja), no se le apunta por esta
// vía: se le deja pendiente y recibe el correo de confirmación habitual (doble opt-in).
export async function subscribeOnTrustedComment(c: Comment, requestOrigin: string): Promise<void> {
  const existing = await getSubscriber(c.email);
  if (existing?.status === "confirmed") return;
  const sub: Subscriber = existing ?? {
    email: c.email, name: c.name, consent: true, source: "comment", locale: c.locale,
    status: "pending", createdAt: new Date().toISOString(), confirmNonce: newNonce(),
  };
  if (!existing && !(await addSubscriber(sub))) return;
  if (canResend(sub)) await sendConfirmation(sub, requestOrigin);
}
