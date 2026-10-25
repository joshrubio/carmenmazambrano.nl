// Prueba de extremo a extremo del doble opt-in y del envío de newsletters, contra el
// servidor de pruebas con Redis y Resend FALSOS (ver scripts/lib/mocks.mjs).
//   1) En una terminal:  npm run dev:test
//   2) En otra:          npm run test:newsletter   [http://localhost:3100]
import { startMockRedis, startMockResend } from "./lib/mocks.mjs";

const base = process.argv[2] ?? "http://localhost:3100";
const password = process.env.ADMIN_PASSWORD ?? "dev-local-password";
const SITE = "https://web.example.test"; // SITE_URL del servidor de pruebas

const redis = await startMockRedis();
const resend = await startMockResend();
const subs = redis.hash("subscribers");
const campaigns = redis.hash("campaigns");

let failed = false;
const check = (ok, msg) => {
  console.log(`${ok ? "OK  " : "FAIL"} ${msg}`);
  if (!ok) failed = true;
};
let ipSeq = 0;
const newIp = () => `10.2.${Math.floor(++ipSeq / 250)}.${ipSeq % 250}`;
const post = (path, body, headers = {}) =>
  fetch(`${base}${path}`, {
    method: "POST",
    redirect: "manual",
    headers: { "Content-Type": "application/json", "x-forwarded-for": newIp(), ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
const local = (url) => url.replace(SITE, base); // enlace de un correo -> servidor de pruebas
const record = (email) => JSON.parse(subs.get(email) ?? "null");
const seed = (email, locale, status = "confirmed", name = "") =>
  subs.set(email, JSON.stringify({
    email, name, consent: true, source: "page", locale, status,
    createdAt: new Date().toISOString(), confirmNonce: "n-" + email,
    ...(status === "confirmed" ? { confirmedAt: new Date().toISOString() } : {}),
  }));
const linkIn = (mail, kind) => {
  const m = mail.html.match(new RegExp(`${SITE}/(\\w+)/${kind}\\?e=([^&"\\s]+)&amp;t=([^"\\s<&]+)|${SITE}/(\\w+)/${kind}\\?e=([^&"\\s]+)&t=([^"\\s<&]+)`));
  return m ? m[0].replace(/&amp;/g, "&") : null;
};

try {
  // ============ DOBLE OPT-IN ============
  let r = await post("/api/subscribe", { name: "Ana", email: "Ana@Example.com", consent: true, source: "page", locale: "nl" });
  check(r.status === 200, `alta (${r.status})`);
  let ana = record("ana@example.com");
  check(ana?.status === "pending" && !!ana.confirmNonce && !ana.confirmedAt, "el alta queda PENDIENTE (no confirmada)");
  check(resend.sent.length === 1 && resend.sent[0].to[0] === "ana@example.com", "se envía 1 correo de confirmación a esa dirección");
  const mail1 = resend.sent[0];
  check(mail1.from === "Carmen Zambrano <hola@example.test>" && mail1.reply_to === "carmenmazambrano@gmail.com", "remitente (EMAIL_FROM) y reply-to correctos");
  check(mail1.endpoint === "/emails", "la confirmación usa el endpoint de envío individual");
  check(mail1.subject.startsWith("Bevestig je inschrijving") && mail1.html.includes('lang="nl"') && mail1.html.includes("Hallo Ana,"), "correo en el idioma de la persona (nl) y con su nombre");
  const confirmUrl = linkIn(mail1, "confirm");
  check(!!confirmUrl && confirmUrl.startsWith(`${SITE}/nl/confirm?e=ana%40example.com&t=`), `enlace de confirmación firmado (${confirmUrl?.slice(0, 60)}…)`);
  check(mail1.text.includes(confirmUrl) && mail1.html.includes("<!doctype html>"), "versión de texto plano incluye el enlace; versión HTML completa");

  r = await post("/api/subscribe", { email: "ana@example.com", consent: true, locale: "nl" });
  check(r.status === 200 && resend.sent.length === 1, "repetir el alta en menos de 10 min NO reenvía el correo");

  // La página de confirmación NO confirma al abrirla (escáneres de correo)
  let html = await (await fetch(local(confirmUrl))).text();
  check(html.includes("Ja, bevestig mijn inschrijving") && record("ana@example.com").status === "pending", "abrir el enlace (GET) muestra el botón y NO confirma");
  html = await (await fetch(local(confirmUrl.replace(/t=.{4}/, "t=xxxx")))).text();
  check(html.includes("Deze link is niet geldig") && !html.includes("Ja, bevestig"), "token manipulado: enlace no válido, sin botón");
  const token = new URL(confirmUrl).searchParams.get("t");
  r = await post("/api/confirm", { email: "ana@example.com", token: "falso" });
  check(r.status === 400 && record("ana@example.com").status === "pending", "token falso -> 400 y sigue pendiente");
  seed("otra@example.com", "es", "pending");
  r = await post("/api/confirm", { email: "otra@example.com", token });
  check(r.status === 400 && record("otra@example.com").status === "pending", "el token de otra persona no sirve");
  r = await post("/api/confirm", { email: "ana@example.com", token });
  ana = record("ana@example.com");
  check(r.status === 200 && ana.status === "confirmed" && !!ana.confirmedAt, "POST con token válido: CONFIRMADA con fecha");
  r = await post("/api/confirm", { email: "ana@example.com", token });
  check(r.status === 200 && (await r.json()).already === true, "confirmar de nuevo es idempotente");
  html = await (await fetch(local(confirmUrl))).text();
  check(html.includes("Al bevestigd"), "el enlace de una alta ya confirmada muestra 'ya confirmada'");
  r = await post("/api/subscribe", { email: "ana@example.com", consent: true, locale: "nl" });
  check(r.status === 200 && resend.sent.length === 1, "apuntarse estando ya confirmada: misma respuesta y NO se envía nada");

  // Caducidad (7 días)
  await post("/api/subscribe", { name: "Eva", email: "eva@example.com", consent: true, locale: "es" });
  const evaUrl = linkIn(resend.sent.at(-1), "confirm");
  const eva = record("eva@example.com");
  subs.set("eva@example.com", JSON.stringify({ ...eva, createdAt: new Date(Date.now() - 8 * 86400e3).toISOString() }));
  html = await (await fetch(local(evaUrl))).text();
  check(html.includes("Este enlace ha caducado") && !html.includes("Sí, confirmar"), "enlace de más de 7 días: página 'caducado', sin botón");
  r = await post("/api/confirm", { email: "eva@example.com", token: new URL(evaUrl).searchParams.get("t") });
  check(r.status === 410 && !subs.has("eva@example.com"), "confirmar caducada -> 410 y se elimina el alta");
  const before = resend.sent.length;
  await post("/api/subscribe", { name: "Eva", email: "eva@example.com", consent: true, locale: "es" });
  const newEvaUrl = linkIn(resend.sent.at(-1), "confirm");
  check(resend.sent.length === before + 1 && newEvaUrl !== evaUrl, "volver a apuntarse genera un alta nueva con un enlace nuevo");
  r = await post("/api/confirm", { email: "eva@example.com", token: new URL(evaUrl).searchParams.get("t") });
  check(r.status === 400, "el enlace antiguo ya no vale para el alta nueva");

  // Reenvío tras el período de espera: se simula que el último envío fue hace 11 minutos
  const rec = record("eva@example.com");
  subs.set("eva@example.com", JSON.stringify({ ...rec, confirmationSentAt: new Date(Date.now() - 11 * 60e3).toISOString() }));
  const n0 = resend.sent.length;
  await post("/api/subscribe", { email: "eva@example.com", consent: true, locale: "es" });
  check(resend.sent.length === n0 + 1 && linkIn(resend.sent.at(-1), "confirm") === newEvaUrl, "pasados 10 min se reenvía la confirmación (mismo enlace)");

  // Si Resend falla, el alta responde 500 y el siguiente intento sí envía
  resend.failOn(1, 500);
  r = await post("/api/subscribe", { name: "Fallo", email: "fallo@example.com", consent: true, locale: "en" });
  check(r.status === 500, `si falla el proveedor de correo el alta responde error (${r.status})`);
  const n1 = resend.sent.length;
  r = await post("/api/subscribe", { name: "Fallo", email: "fallo@example.com", consent: true, locale: "en" });
  check(r.status === 200 && resend.sent.length === n1 + 1, "el reintento inmediato envía la confirmación (el fallo no bloquea)");

  // ============ ENVÍO DE NEWSLETTERS ============
  for (const p of ["/api/admin/newsletter/preview", "/api/admin/newsletter/test", "/api/admin/newsletter/send"]) {
    r = await post(p, {});
    check(r.status >= 300 && r.status < 400, `${p} sin sesión redirige (${r.status})`);
  }
  r = await fetch(`${base}/api/admin/newsletter/campaigns`, { redirect: "manual" });
  check(r.status >= 300 && r.status < 400, "historial sin sesión redirige");
  r = await fetch(`${base}/admin/newsletter`, { redirect: "manual" });
  check(r.status >= 300 && r.status < 400, "la pantalla /admin/newsletter sin sesión redirige");

  const login = await post("/api/admin/login", { password });
  const cookie = login.headers.get("set-cookie").split(";")[0];
  const A = { cookie };
  check(login.ok, "login admin");
  r = await fetch(`${base}/admin/newsletter`, { headers: A });
  check(r.ok, `/admin/newsletter con sesión (${r.status})`);

  // Datos de partida: 3 es + 2 en + 1 nl confirmados (ana ya es nl confirmada), 1 pendiente
  for (const e of ["a1", "a2", "a3"]) seed(`${e}@es.test`, "es");
  for (const e of ["b1", "b2"]) seed(`${e}@en.test`, "en");
  seed("c1@nl.test", "nl");
  seed("p1@pend.test", "es", "pending");
  r = await fetch(`${base}/api/admin/newsletter/campaigns`, { headers: A });
  let ov = await r.json();
  check(ov.audience.es === 3 && ov.audience.en === 2 && ov.audience.nl === 2 && ov.audience.all === 7 && ov.audience.pending >= 1 && ov.mode === "resend",
    `audiencias: es=${ov.audience.es} en=${ov.audience.en} nl=${ov.audience.nl} (solo confirmadas), pendientes aparte, modo resend`);

  // Vista previa
  r = await post("/api/admin/newsletter/preview", {
    subject: "Hola <b>mundo</b>", lang: "es",
    body: "Primer párrafo con [un enlace](https://example.com/x?a=1&b=2) y <script>alert(1)</script>.\n\n## Un título\n\nTrampa: [clic](javascript:alert(1)) y [correo](mailto:a@b.co)",
  }, A);
  const pv = await r.json();
  check(r.ok && pv.html.includes('href="https://example.com/x?a=1&amp;b=2"') && pv.html.includes('<h2'), "vista previa: enlaces y títulos");
  check(!pv.html.includes("<script>alert") && pv.html.includes("&lt;script&gt;") && !pv.html.includes("<b>mundo"), "vista previa: el HTML del texto se escapa (sin inyección)");
  check(!pv.html.includes('href="javascript:') && pv.html.includes('href="mailto:a@b.co"'), "vista previa: se bloquean enlaces javascript: y se permiten mailto:");

  // Correo de prueba
  resend.reset();
  r = await post("/api/admin/newsletter/test", { subject: "Asunto", body: "Texto", to: "carmen@example.com", lang: "es" }, A);
  check(r.ok && resend.sent.length === 1, "correo de prueba enviado");
  check(resend.sent[0].subject === "[PRUEBA] Asunto" && resend.sent[0].to[0] === "carmen@example.com", "prueba: asunto con [PRUEBA] y destinatario correcto");
  check((await post("/api/admin/newsletter/test", { subject: "A", body: "B", to: "malo" }, A)).status === 400, "prueba con email inválido -> 400");
  check((await post("/api/admin/newsletter/test", { subject: "", body: "B", to: "x@y.co" }, A)).status === 400, "prueba sin asunto -> 400");
  check(!subs.has("carmen@example.com"), "la prueba no añade a nadie a la lista");

  // Envío por audiencia
  resend.reset();
  r = await post("/api/admin/newsletter/send", { subject: "Novedades", body: "Hola.\n\nMira [esto](https://example.com).", audience: "es" }, A);
  let d = await r.json();
  const esMails = resend.sent.filter((e) => e.endpoint === "/emails/batch");
  check(r.ok && d.campaign.status === "sent" && d.campaign.sent === 3 && d.campaign.total === 3, `envío a es: ${d.campaign?.sent}/${d.campaign?.total}`);
  check(esMails.map((e) => e.to[0]).sort().join() === "a1@es.test,a2@es.test,a3@es.test", "solo reciben los 3 confirmados en español (ni pendientes ni otros idiomas)");
  check(esMails.every((e) => e.subject === "Novedades"), "el asunto no lleva [PRUEBA]");
  check(esMails.every((e) => e.html.includes(`${SITE}/es/unsubscribe?e=${encodeURIComponent(e.to[0])}&amp;t=`)), "cada correo lleva SU enlace de baja personal");
  const hdr = esMails[0].headers;
  check(hdr["List-Unsubscribe"]?.includes(`${SITE}/api/unsubscribe/one-click?e=${encodeURIComponent(esMails[0].to[0])}&t=`) && hdr["List-Unsubscribe"].includes("mailto:") && hdr["List-Unsubscribe-Post"] === "List-Unsubscribe=One-Click",
    "cabeceras List-Unsubscribe y List-Unsubscribe-Post (un clic, RFC 8058)");
  check(resend.requests.length === 1 && resend.requests[0].url === "/emails/batch" && !!resend.requests[0].idemKey, "una sola llamada por lotes, con clave de idempotencia");

  // Baja de un clic con el enlace de la cabecera
  const oc = hdr["List-Unsubscribe"].match(/<([^>]+one-click[^>]+)>/)[1];
  const who = esMails[0].to[0];
  r = await fetch(local(oc), { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded", "x-forwarded-for": newIp() }, body: "List-Unsubscribe=One-Click" });
  check(r.status === 200 && !subs.has(who), `baja de un clic (POST) elimina a ${who}`);
  r = await fetch(local(oc).replace(/t=.+/, "t=falso"), { method: "POST", headers: { "x-forwarded-for": newIp() } });
  check(r.status === 400, "baja de un clic con token falso -> 400");
  r = await fetch(local(oc), { redirect: "manual", headers: { "x-forwarded-for": newIp() } });
  check(r.status >= 300 && r.status < 400 && (r.headers.get("location") ?? "").includes("/unsubscribe"), "abrir la URL de un clic en el navegador (GET) redirige a la página de baja");
  seed(who, "es"); // se restaura para los siguientes tests

  // Protección contra doble envío
  resend.reset();
  r = await post("/api/admin/newsletter/send", { subject: "Novedades", body: "Hola.\n\nMira [esto](https://example.com).", audience: "es" }, A);
  check(r.status === 409 && (await r.json()).code === "duplicate_recent" && resend.sent.length === 0, "el mismo envío repetido en <10 min se rechaza (409) y no manda nada");

  // Otra audiencia, en neerlandés, con el pie en su idioma
  resend.reset();
  r = await post("/api/admin/newsletter/send", { subject: "Nieuws", body: "Hallo allemaal.", audience: "nl" }, A);
  d = await r.json();
  check(r.ok && d.campaign.sent === 2 && resend.sent.every((e) => e.html.includes("Uitschrijven") && e.html.includes('lang="nl"')), "audiencia nl: 2 correos con el pie en neerlandés");

  // Validaciones
  check((await post("/api/admin/newsletter/send", { subject: "", body: "x", audience: "all" }, A)).status === 400, "sin asunto -> 400");
  check((await post("/api/admin/newsletter/send", { subject: "x", body: "  ", audience: "all" }, A)).status === 400, "sin texto -> 400");
  check((await post("/api/admin/newsletter/send", { subject: "x", body: "y", audience: "fr" }, A)).status === 400, "audiencia inválida -> 400");
  for (const e of [...subs.keys()].filter((k) => k.endsWith("@en.test"))) subs.delete(e);
  for (const e of [...subs.keys()]) if (record(e)?.locale === "en") subs.delete(e);
  r = await post("/api/admin/newsletter/send", { subject: "Vacío", body: "x", audience: "en" }, A);
  check(r.status === 400 && (await r.json()).code === "no_recipients", "audiencia sin personas confirmadas -> 400 no_recipients");

  // ---- Lotes grandes, corte a mitad y reanudación ----
  for (let i = 0; i < 250; i++) seed(`bulk${i}@bulk.test`, "es");
  resend.reset();
  r = await post("/api/admin/newsletter/send", { subject: "Masivo", body: "Texto largo.", audience: "es" }, A);
  d = await r.json();
  const batches = resend.requests.filter((q) => q.url === "/emails/batch");
  check(r.ok && d.campaign.status === "sent" && d.campaign.sent === 253, `envío masivo: ${d.campaign?.sent} correos`);
  check(batches.map((b) => b.count).join() === "100,100,53" && new Set(batches.map((b) => b.idemKey)).size === 3, `lotes de 100 (${batches.map((b) => b.count).join("+")}) con claves de idempotencia distintas`);
  check(new Set(resend.sent.map((e) => e.to[0])).size === 253, "ningún destinatario duplicado");

  // El 2º lote falla: queda parcial; se da de baja a alguien; se continúa sin repetir
  resend.reset();
  resend.failOn(2, 500);
  r = await post("/api/admin/newsletter/send", { subject: "Cortado", body: "Texto.", audience: "es" }, A);
  d = await r.json();
  const cid = d.campaign.id;
  check(r.ok && d.campaign.status === "partial" && d.campaign.sent === 100 && /Resend 500/.test(d.campaign.lastError), `fallo en el 2º lote: queda PARCIAL (${d.campaign?.sent}/${d.campaign?.total}) con el error`);
  r = await fetch(`${base}/api/admin/newsletter/campaigns`, { headers: A });
  ov = await r.json();
  check(ov.campaigns.find((c) => c.id === cid)?.status === "partial", "el historial muestra el envío como incompleto");
  const campaignRaw = JSON.parse(campaigns.get(cid));
  const unsub = campaignRaw.recipients[150].e; // pertenece al 2º lote, aún sin enviar
  subs.delete(unsub);
  r = await post("/api/admin/newsletter/send", { campaignId: cid }, A);
  d = await r.json();
  const all = resend.sent.map((e) => e.to[0]);
  check(r.ok && d.campaign.status === "sent" && d.campaign.skipped === 1 && d.campaign.sent === 252, `continuar: terminado, ${d.campaign?.sent} enviados y ${d.campaign?.skipped} omitido por baja`);
  check(new Set(all).size === all.length && !all.includes(unsub), "sin duplicados tras reanudar y sin escribir a quien se dio de baja");
  r = await post("/api/admin/newsletter/send", { campaignId: cid }, A);
  const n3 = resend.sent.length;
  check(r.ok && (await r.json()).campaign.status === "sent" && resend.sent.length === n3, "continuar un envío ya terminado no manda nada");
  r = await post("/api/admin/newsletter/send", { campaignId: "no-existe" }, A);
  check(r.status === 404, "continuar un envío inexistente -> 404");

  // Límite de peticiones de Resend (429): se espera y reintenta solo
  resend.reset();
  resend.failOn(1, 429, 1);
  const t0 = Date.now();
  r = await post("/api/admin/newsletter/send", { subject: "Con 429", body: "Texto.", audience: "nl" }, A);
  d = await r.json();
  check(r.ok && d.campaign.status === "sent" && resend.requests.length === 2 && Date.now() - t0 >= 900, `429 de Resend: espera Retry-After y reintenta (${resend.requests.length} peticiones)`);
  check(resend.sent.length === d.campaign.sent, "tras el reintento cada correo se envió una sola vez");

  // Historial
  r = await fetch(`${base}/api/admin/newsletter/campaigns`, { headers: A });
  ov = await r.json();
  check(ov.campaigns.length === 5 && ov.campaigns[0].createdAt >= ov.campaigns.at(-1).createdAt && !("recipients" in ov.campaigns[0]) && !("body" in ov.campaigns[0]),
    `historial: ${ov.campaigns.length} envíos, recientes primero, sin lista de destinatarios ni cuerpo`);

  // Las altas pendientes no reciben nada: p1@pend.test es es y estaba pendiente
  check(!resend.sent.some((e) => e.to[0] === "p1@pend.test"), "una alta pendiente nunca recibe la newsletter");
} catch (e) {
  failed = true;
  console.log("ERROR", e);
} finally {
  redis.close();
  resend.close();
  console.log(failed ? "\nHay fallos." : "\nTodo correcto.");
  process.exit(failed ? 1 : 0);
}
