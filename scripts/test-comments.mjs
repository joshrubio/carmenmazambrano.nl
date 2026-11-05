// Prueba de extremo a extremo de los comentarios (alta, verificación por correo, cookie de
// "correo ya verificado", usuarios que ya están en la lista, límites, moderación y textos).
// Usa el servidor de pruebas con Redis y Resend FALSOS (ver scripts/lib/mocks.mjs).
//   1) En una terminal:  npm run dev:test
//   2) En otra:          npm run test:comments   [http://localhost:3100]
import { startMockRedis, startMockResend } from "./lib/mocks.mjs";
import { PROMO_REQUIRED } from "../src/lib/comment-rules.ts";

const base = process.argv[2] ?? "http://localhost:3100";
const password = process.env.ADMIN_PASSWORD ?? "dev-local-password";
const SLUG = "dokkum-koningsdag-2026";
const OTHER_SLUG = "erasmusbrug-rotterdam-icoon-stad";

const redis = await startMockRedis();
const resend = await startMockResend();
const subs = redis.hash("subscribers");
const comments = redis.hash(`comments-${SLUG}`);
let ipSeq = 0;
const newIp = () => `10.2.${Math.floor(++ipSeq / 250)}.${ipSeq % 250}`; // cada petición, otra IP

let failed = false;
const check = (ok, msg) => {
  console.log(`${ok ? "OK  " : "FAIL"} ${msg}`);
  if (!ok) failed = true;
};
const post = (path, body, headers = {}) =>
  fetch(`${base}${path}`, {
    method: "POST",
    redirect: "manual",
    headers: { "Content-Type": "application/json", "x-forwarded-for": newIp(), ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

const valid = (over = {}) => ({
  slug: SLUG, name: "Lucía", email: "lucia@example.com", body: "Qué bonita crónica.", privacy: true, promo: true, locale: "es", ...over,
});
const send = (over, headers) => post("/api/comments", valid(over), headers);
const publicList = async (slug = SLUG) => (await (await fetch(`${base}/api/comments?slug=${slug}`)).json()).comments;
const stored = () => [...comments.values()].map((v) => JSON.parse(v));
const lastMail = () => resend.sent[resend.sent.length - 1];
// El enlace de verificación del último correo: pasa de la URL pública (SITE_URL) a una local
const linkOf = (mail, part) => {
  const m = (mail?.text ?? "").match(new RegExp(`https?://[^\\s]+${part}[^\\s]*`));
  return m ? m[0].replace(/^https?:\/\/[^/]+/, "") : null;
};
const parts = (link) => {
  const q = new URL(base + link).searchParams;
  return { slug: q.get("s"), id: q.get("c"), token: q.get("t") };
};

try {
  // --- Lectura ---
  check((await fetch(`${base}/api/comments?slug=no-existe`)).status === 404, "GET de una nota inexistente -> 404");
  check(Array.isArray(await publicList()) && (await publicList()).length === 0, "GET de una nota sin comentarios -> lista vacía");

  // --- Validaciones ---
  const bad = async (over, code) => {
    const r = await send(over);
    const d = await r.json();
    check(r.status === 400 && d.code === code, `${code} -> 400 (${r.status}, ${d.code})`);
  };
  await bad({ name: "A" }, "invalid_name");
  await bad({ name: "   " }, "invalid_name");
  await bad({ email: "no-es-un-email" }, "invalid_email");
  await bad({ body: "x" }, "invalid_body");
  await bad({ body: "x".repeat(1501) }, "invalid_body");
  await bad({ body: "mira http://a.com y http://b.com" }, "too_many_links");
  await bad({ privacy: false }, "privacy_required");
  await bad({ privacy: undefined }, "privacy_required");
  if (PROMO_REQUIRED) await bad({ promo: false }, "promo_required");
  else check((await send({ promo: false, email: "optional@example.com" })).status === 200, "promo opcional: se acepta sin marcarla");
  check((await post("/api/comments", "{no es json")).status === 400, "JSON mal formado -> 400");
  check((await send({ slug: "no-existe" })).status === 404, "comentar una nota inexistente -> 404");
  check(stored().length === (PROMO_REQUIRED ? 0 : 1), "los intentos no válidos no guardan nada");
  comments.clear();
  resend.reset();

  // --- Honeypot ---
  let r = await send({ website: "http://spam.example", email: "bot@example.com" });
  check(r.status === 200 && stored().length === 0 && resend.sent.length === 0, "honeypot relleno: finge éxito, no guarda ni envía");

  // --- Alta de alguien nuevo: queda sin verificar y recibe un correo ---
  r = await send({ name: "  Lucía  ", email: "  LUCIA@Example.com ", body: "Qué bonita crónica.\r\n\r\n\r\n\r\nGracias.<b>x</b>" });
  const newBody = await r.json();
  check(r.status === 200 && newBody.status === "verify", `comentario nuevo -> "verify" (${r.status})`);
  let c = stored()[0];
  check(c?.status === "unverified" && c.email === "lucia@example.com" && c.name === "Lucía" && c.promo === true && !c.verifiedAt,
    "se guarda sin verificar, con el correo normalizado");
  check(c.body === "Qué bonita crónica.\n\nGracias.<b>x</b>", "el texto se normaliza (saltos de línea) y se guarda tal cual, sin interpretar HTML");
  check((await publicList()).length === 0, "un comentario sin verificar NO aparece en la lista pública");
  let mail = lastMail();
  check(resend.sent.length === 1 && mail.to?.[0] === "lucia@example.com", "se envía un único correo de verificación a esa dirección");
  check(/confirm/i.test(mail.subject) && mail.html.includes("Qué bonita crónica") && mail.html.includes("&lt;b&gt;x&lt;/b&gt;") && !mail.html.includes("<b>x</b>"),
    "el correo muestra el comentario y escapa el HTML");
  check(mail.html.includes("newsletter") && mail.text.includes("newsletter"), "con la casilla marcada, el correo avisa de que el clic también la apunta a la newsletter");
  let link = linkOf(mail, "comment-confirm");
  check(!!link && link.startsWith("/es/comment-confirm?"), "el correo lleva el enlace de verificación en español");
  let { slug, id, token } = parts(link);

  // --- La página del enlace NO publica por sí sola ---
  r = await fetch(`${base}${link}`);
  let html = await r.text();
  check(r.ok && html.includes("Confirma tu comentario") && html.includes("lucia@example.com") && html.includes("Sí, confirmar y publicar"),
    "la página del enlace pide confirmar (botón) y muestra el correo");
  check(stored()[0].status === "unverified", "abrir el enlace (como haría un escáner de correo) no publica el comentario");
  check(html.includes("Koningsdag"), "la página nombra la nota a la que se responde");

  // --- Enlace manipulado o ajeno ---
  r = await post("/api/comments/confirm", { slug, id, token: token.slice(0, -2) + "xx" });
  check(r.status === 400, "token manipulado -> 400");
  r = await post("/api/comments/confirm", { slug: OTHER_SLUG, id, token });
  check(r.status === 400, "el token no vale para otra nota -> 400");
  r = await fetch(`${base}/es/comment-confirm?s=${slug}&c=${id}&t=basura`);
  check((await r.text()).includes("Este enlace no es válido"), "la página con un token falso dice que el enlace no es válido");
  check(stored()[0].status === "unverified", "ningún intento falso publica el comentario");

  // --- Verificación válida ---
  r = await post("/api/comments/confirm", { slug, id, token });
  const setCookie = r.headers.get("set-cookie") ?? "";
  check(r.ok && (await r.json()).already === false, `confirmar con el token correcto (${r.status})`);
  check(/tnp_commenter=/.test(setCookie) && /httponly/i.test(setCookie) && /samesite=lax/i.test(setCookie) && /max-age=7776000/i.test(setCookie),
    "deja la cookie firmada (HttpOnly, SameSite=Lax, 90 días)");
  c = stored()[0];
  check(c.status === "published" && !!c.verifiedAt, "el comentario pasa a publicado");
  const pub = await publicList();
  check(pub.length === 1 && pub[0].name === "Lucía" && !("email" in pub[0]) && !JSON.stringify(pub).includes("lucia@example.com"),
    "la lista pública muestra nombre y texto, pero NUNCA el correo");
  const luciaCookie = setCookie.split(";")[0];
  let sub = JSON.parse(subs.get("lucia@example.com") ?? "null");
  check(sub?.status === "confirmed" && sub.source === "comment" && sub.consent === true && sub.locale === "es" && !!sub.confirmedAt,
    "con la casilla marcada, el clic la apunta a la newsletter ya confirmada (origen: comentario)");
  r = await post("/api/comments/confirm", { slug, id, token });
  check(r.ok && (await r.json()).already === true, "confirmar dos veces es inofensivo (already)");
  html = await (await fetch(`${base}${link}`)).text();
  check(html.includes("Ya está publicado"), "reabrir el enlace dice que ya está publicado");

  // --- La respuesta NO delata si el correo está en la lista ---
  resend.reset();
  subs.set("ana@example.com", JSON.stringify({ email: "ana@example.com", name: "Ana", consent: true, source: "footer", locale: "es", status: "confirmed", createdAt: "2026-01-01T00:00:00.000Z", confirmedAt: "2026-01-01T00:00:00.000Z" }));
  const anaBefore = subs.get("ana@example.com");
  const rNew = await send({ email: "nueva.persona@example.com", body: "Primera vez por aquí" });
  const rKnown = await send({ email: "ana@example.com", name: "Ana", body: "Yo ya estoy en la lista" });
  const [bNew, bKnown] = [await rNew.json(), await rKnown.json()];
  check(rNew.status === rKnown.status && JSON.stringify(bNew) === JSON.stringify(bKnown),
    `quien YA está en la lista y quien no reciben exactamente la misma respuesta (${JSON.stringify(bKnown)})`);
  check(resend.sent.length === 2 && resend.sent[1].to[0] === "ana@example.com",
    "una persona ya suscrita también recibe el correo de verificación (no se salta el paso)");
  check(!stored().some((x) => x.email === "ana@example.com" && x.status === "published"), "su comentario no se publica sin verificar");
  const anaLink = linkOf(resend.sent[1], "comment-confirm");
  const ap = parts(anaLink);
  r = await post("/api/comments/confirm", ap);
  check(r.ok && stored().some((x) => x.email === "ana@example.com" && x.status === "published"), "al verificar, su comentario se publica");
  check(subs.get("ana@example.com") === anaBefore, "su suscripción NO se toca (ni duplica ni cambia nada)");

  // --- Sin marcar la casilla (solo si es opcional) ---
  if (!PROMO_REQUIRED) {
    check(!subs.has("optional@example.com"), "sin marcar la casilla no se apunta a nadie");
  }

  // --- Suscriptor pendiente: el clic del comentario lo confirma ---
  resend.reset();
  subs.set("pepe@example.com", JSON.stringify({ email: "pepe@example.com", name: "Pepe", consent: true, source: "footer", locale: "es", status: "pending", createdAt: new Date().toISOString(), confirmNonce: "abc" }));
  await send({ email: "pepe@example.com", name: "Pepe", body: "Soy pendiente" });
  r = await post("/api/comments/confirm", parts(linkOf(lastMail(), "comment-confirm")));
  const pepe = JSON.parse(subs.get("pepe@example.com"));
  check(r.ok && pepe.status === "confirmed" && !!pepe.confirmedAt, "un suscriptor pendiente queda confirmado al verificar su comentario");

  // --- Cookie de correo ya verificado ---
  resend.reset();
  const before = stored().length;
  r = await send({ body: "Segundo comentario de Lucía" }, { cookie: luciaCookie });
  let d = await r.json();
  check(r.status === 200 && d.status === "published" && d.comment?.name === "Lucía" && !("email" in d.comment),
    "con la cookie y el MISMO correo: se publica al momento");
  check(resend.sent.length === 0 && stored().length === before + 1, "…sin enviar ningún correo nuevo");
  r = await send({ email: "otra@example.com", body: "Intento con la cookie de otra persona" }, { cookie: luciaCookie });
  check((await r.json()).status === "verify", "la cookie solo vale para el correo que verificó: otro correo sigue pidiendo verificación");
  const tampered = luciaCookie.replace(/\.[^.]+$/, ".firmafalsa");
  r = await send({ body: "Con la cookie alterada" }, { cookie: tampered });
  check((await r.json()).status === "verify", "una cookie alterada no sirve");
  const forged = `tnp_commenter=${Buffer.from("lucia@example.com").toString("base64url")}.${Date.now() + 1e9}.abc`;
  r = await send({ body: "Cookie inventada" }, { cookie: forged });
  check((await r.json()).status === "verify", "una cookie inventada (sin la firma del servidor) no sirve");
  // Cookie caducada: con otra persona verificada (el correo de Lucía ya agotó su límite de 3 correos/hora)
  resend.reset();
  await send({ email: "marta@example.com", name: "Marta", body: "Primer comentario de Marta" });
  r = await post("/api/comments/confirm", parts(linkOf(lastMail(), "comment-confirm")));
  const martaCookie = (r.headers.get("set-cookie") ?? "").split(";")[0];
  check((await (await send({ email: "marta@example.com", name: "Marta", body: "Con cookie vigente" }, { cookie: martaCookie })).json()).status === "published",
    "(control) la cookie vigente de Marta sí publica al momento");
  const expired = martaCookie.replace(/=([^.]+)\.(\d+)\.(.+)$/, (m, x, e, sig) => `=${x}.${Date.now() - 1000}.${sig}`);
  r = await send({ email: "marta@example.com", name: "Marta", body: "Cookie caducada" }, { cookie: expired });
  check((await r.json()).status === "verify", "una cookie caducada no sirve");

  // --- Con cookie, pero ya no está en la lista (se dio de baja) y marca la casilla ---
  resend.reset();
  subs.delete("lucia@example.com");
  r = await send({ body: "Vuelvo tras darme de baja" }, { cookie: luciaCookie });
  check((await r.json()).status === "published", "con cookie sigue publicando al momento");
  sub = JSON.parse(subs.get("lucia@example.com") ?? "null");
  check(sub?.status === "pending" && resend.sent.length === 1 && /\/es\/confirm\?/.test(resend.sent[0].text ?? ""),
    "pero NO se la reapunta sin más: queda pendiente y recibe el correo de confirmación de la newsletter (doble opt-in)");

  // --- Idiomas ---
  resend.reset();
  await send({ email: "joost@example.com", name: "Joost", locale: "nl", body: "Mooi artikel." });
  mail = lastMail();
  const nlLink = linkOf(mail, "/nl/comment-confirm");
  check(/reactie/i.test(mail.subject) && !!nlLink, "el correo y el enlace salen en neerlandés para quien comenta desde /nl");
  resend.reset();
  await send({ email: "kate@example.com", name: "Kate", locale: "en", body: "Great piece." });
  const enLink = linkOf(lastMail(), "/en/comment-confirm");
  check(/comment/i.test(lastMail().subject) && !!enLink, "…y en inglés para /en");
  for (const [lng, expect] of [["es", "Deja tu comentario"], ["en", "Leave a comment"], ["nl", "Laat een reactie achter"]]) {
    const h = await (await fetch(`${base}/${lng}/articles/${SLUG}`)).text();
    check(h.includes(expect), `/${lng}: la nota muestra el formulario de comentarios traducido ("${expect}")`);
  }
  for (const [link, expect] of [[enLink, "Confirm your comment"], [nlLink, "Bevestig je reactie"]]) {
    const h = await (await fetch(`${base}${link}`)).text();
    check(h.includes(expect), `${link.slice(0, 3)}/comment-confirm está traducida ("${expect}")`);
  }
  for (const [lng, expect] of [["es", "8. Comentarios en las notas"], ["en", "8. Comments on articles"], ["nl", "8. Reacties bij artikelen"]]) {
    const h = await (await fetch(`${base}/${lng}/privacy`)).text();
    check(h.includes(expect) && h.includes("tnp_commenter"), `/${lng}/privacy incluye el apartado de comentarios y la cookie`);
  }

  // --- Caducidad: un comentario sin verificar se borra, con su correo ---
  resend.reset();
  await send({ email: "caduca@example.com", name: "Caduca", body: "Este caducará" });
  const cl = parts(linkOf(lastMail(), "comment-confirm"));
  const rec = JSON.parse(comments.get(cl.id));
  comments.set(cl.id, JSON.stringify({ ...rec, createdAt: new Date(Date.now() - 8 * 86400000).toISOString() }));
  r = await post("/api/comments/confirm", cl);
  check(r.status === 410 && !comments.has(cl.id), "un enlace de más de 7 días da 410 y borra el comentario (y su correo)");
  await send({ email: "caduca2@example.com", name: "Caduca2", body: "Otro que caduca" });
  const cl2 = parts(linkOf(lastMail(), "comment-confirm"));
  comments.set(cl2.id, JSON.stringify({ ...JSON.parse(comments.get(cl2.id)), createdAt: new Date(Date.now() - 9 * 86400000).toISOString() }));
  await send({ email: "otra.persona.mas@example.com", body: "Esto dispara la limpieza" });
  check(!comments.has(cl2.id), "publicar un comentario nuevo limpia los caducados sin verificar");

  // --- Si el correo falla, no queda nada guardado ---
  const n0 = stored().length;
  resend.failOn(1, 500);
  r = await send({ email: "falla@example.com", name: "Falla", body: "Esto no llegará" });
  d = await r.json();
  check(r.status === 502 && d.code === "email_failed" && stored().length === n0, "si falla el envío del correo -> 502 y no se guarda el comentario");

  // --- Límites ---
  const limited = [];
  for (let i = 0; i < 5; i++) limited.push((await send({ email: "mismo@example.com", body: `intento ${i}` })).status);
  check(limited.slice(0, 3).every((s) => s === 200) && limited.slice(3).every((s) => s === 429),
    `por correo: 3 correos de verificación a la hora y luego 429 (${limited.join(",")})`);
  const abuser = { "x-forwarded-for": "203.0.113.77" };
  const byIp = [];
  for (let i = 0; i < 7; i++) byIp.push((await send({ email: `ip${i}@example.com` }, abuser)).status);
  check(byIp.slice(0, 5).every((s) => s === 200) && byIp[5] === 429 && byIp[6] === 429, `por IP: 5 intentos y luego 429 (${byIp.join(",")})`);
  r = await send({ email: "ip9@example.com" }, abuser);
  check(Number(r.headers.get("retry-after")) > 0 && (await r.json()).code === "rate_limited", "el 429 trae Retry-After y code rate_limited");

  // --- Administración ---
  r = await fetch(`${base}/api/admin/comments`, { redirect: "manual" });
  check(r.status >= 300 && r.status < 400, `listado sin sesión redirige (${r.status})`);
  r = await fetch(`${base}/api/admin/comments`, { method: "POST", redirect: "manual", body: "{}" });
  check(r.status >= 300 && r.status < 400, `moderar sin sesión redirige (${r.status})`);
  const login = await post("/api/admin/login", { password });
  const auth = { cookie: login.headers.get("set-cookie").split(";")[0] };
  r = await fetch(`${base}/api/admin/comments`, { headers: auth });
  const list = await r.json();
  const target = list.comments.find((x) => x.email === "lucia@example.com" && x.status === "published");
  check(r.ok && list.total > 3 && !!target && typeof target.articleTitle === "string", `con sesión: lista ${list.total} comentarios con su nota`);
  check(list.comments.some((x) => x.status === "unverified"), "el panel también ve los sin verificar");
  check(list.comments.every((x, i, a) => i === 0 || a[i - 1].createdAt >= x.createdAt), "ordenados del más reciente al más antiguo");
  const mod = (action, t) => fetch(`${base}/api/admin/comments`, { method: "POST", headers: { "Content-Type": "application/json", ...auth }, body: JSON.stringify({ action, slug: t.slug, id: t.id }) });
  check((await mod("hide", target)).ok && !(await publicList()).some((x) => x.id === target.id), "ocultar: desaparece de la lista pública");
  check(JSON.parse(comments.get(target.id)).status === "hidden", "…y queda guardado como oculto (reversible)");
  check((await mod("show", target)).ok && (await publicList()).some((x) => x.id === target.id), "volver a mostrar: reaparece");
  const unv = list.comments.find((x) => x.status === "unverified");
  r = await mod("hide", unv);
  check(r.status === 409, "no se puede ocultar un comentario sin verificar (409)");
  check((await mod("delete", target)).ok && !comments.has(target.id) && !(await publicList()).some((x) => x.id === target.id), "borrar: se elimina del todo");
  check((await mod("delete", target)).status === 404, "borrar uno que ya no existe -> 404");
  r = await fetch(`${base}/api/admin/comments`, { method: "POST", headers: { "Content-Type": "application/json", ...auth }, body: JSON.stringify({ action: "explotar", slug: SLUG, id: "x" }) });
  check(r.status === 400, "acción desconocida -> 400");
  r = await fetch(`${base}/admin/comments`, { headers: auth });
  check(r.ok && (await r.text()).includes("Comentarios"), "/admin/comments carga con sesión");
  r = await fetch(`${base}/admin/comments`, { redirect: "manual" });
  check(r.status >= 300 && r.status < 400, `/admin/comments sin sesión redirige (${r.status})`);
} catch (err) {
  console.error(err);
  failed = true;
} finally {
  redis.close();
  resend.close();
}

console.log(failed ? "\nHAY FALLOS" : "\nTodo correcto.");
process.exit(failed ? 1 : 0);
