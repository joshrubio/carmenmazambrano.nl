// Prueba de extremo a extremo de la newsletter contra `npm run dev`, usando el
// almacén Redis (REST) de producción pero con un servidor falso en local.
//   1) En una terminal:
//        UPSTASH_REDIS_REST_URL=http://localhost:3199 UPSTASH_REDIS_REST_TOKEN=test npm run dev -- -p 3100
//   2) En otra:  npm run test:subscribe  [http://localhost:3100]
import http from "node:http";

const base = process.argv[2] ?? "http://localhost:3100";
const password = process.env.ADMIN_PASSWORD ?? "dev-local-password";

// --- Redis REST falso (HSETNX / HGETALL / HDEL) ---
const hash = new Map();
const counters = new Map();
const calls = [];
let ipSeq = 0;
const newIp = () => `10.1.${Math.floor(++ipSeq / 250)}.${ipSeq % 250}`; // cada petición, otra IP
const mock = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    res.setHeader("Content-Type", "application/json");
    if (req.headers.authorization !== "Bearer test") {
      res.statusCode = 401;
      return res.end(JSON.stringify({ error: "WRONGPASS" }));
    }
    if (req.url === "/pipeline") {
      const now = Date.now();
      const out = JSON.parse(body).map(([c, key, a, b, d, e]) => {
        const cur = counters.get(key);
        const alive = cur && cur.expiresAt > now;
        if (c === "SET") {
          if (e === "NX" && alive) return { result: null };
          counters.set(key, { value: Number(a), expiresAt: now + Number(d) * 1000 });
          return { result: "OK" };
        }
        if (c === "INCR") {
          if (!alive) counters.set(key, { value: 0, expiresAt: Infinity });
          const entry = counters.get(key);
          entry.value++;
          return { result: entry.value };
        }
        if (c === "TTL") return { result: alive ? Math.ceil((cur.expiresAt - now) / 1000) : -2 };
        return { error: `ERR unknown command ${c}` };
      });
      return res.end(JSON.stringify(out));
    }
    const [cmd, , field, value] = JSON.parse(body);
    calls.push(cmd);
    if (cmd === "HSETNX") {
      const isNew = !hash.has(field);
      if (isNew) hash.set(field, value);
      return res.end(JSON.stringify({ result: isNew ? 1 : 0 }));
    }
    if (cmd === "HGETALL") return res.end(JSON.stringify({ result: [...hash].flat() }));
    if (cmd === "HDEL") return res.end(JSON.stringify({ result: hash.delete(field) ? 1 : 0 }));
    res.statusCode = 400;
    res.end(JSON.stringify({ error: `ERR unknown command ${cmd}` }));
  });
});
await new Promise((r) => mock.listen(3199, r));

let failed = false;
const check = (ok, msg) => {
  console.log(`${ok ? "OK  " : "FAIL"} ${msg}`);
  if (!ok) failed = true;
};
const post = (path, body, headers = {}, init = {}) =>
  fetch(`${base}${path}`, {
    method: "POST",
    redirect: "manual",
    headers: { "Content-Type": "application/json", "x-forwarded-for": newIp(), ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
    ...init,
  });
const sub = (b, headers) => post("/api/subscribe", b, headers);

try {
  // --- Alta pública ---
  let r = await sub({ name: "  Ana  ", email: "  Ana@Example.COM ", consent: true, website: "", source: "footer", locale: "es" });
  check(r.status === 200, `alta válida (${r.status})`);
  const stored = JSON.parse(hash.get("ana@example.com") ?? "null");
  check(stored?.name === "Ana" && stored.source === "footer" && stored.locale === "es" && stored.consent === true && !!stored.createdAt,
    "se guarda normalizado (email en minúsculas, nombre sin espacios, consentimiento y fecha)");

  r = await sub({ name: "Otra Ana", email: "ana@example.com", consent: true, source: "page" });
  check(r.status === 200 && hash.size === 1 && JSON.parse(hash.get("ana@example.com")).name === "Ana",
    "email duplicado: misma respuesta y no sobrescribe el original");

  check((await sub({ email: "no-es-un-email", consent: true })).status === 400, "email inválido -> 400");
  check((await sub({ email: "b@example.com", consent: false })).status === 400, "sin consentimiento -> 400");
  check((await sub({ email: "b@example.com" })).status === 400, "consentimiento ausente -> 400");
  check((await post("/api/subscribe", "{no es json")).status === 400, "JSON mal formado -> 400");
  r = await sub({ email: "bot@example.com", consent: true, website: "http://spam.example" });
  check(r.status === 200 && !hash.has("bot@example.com"), "honeypot relleno: finge éxito y no guarda");
  await sub({ name: "x".repeat(500), email: "largo@example.com", consent: true, source: "otro", locale: "xx" });
  const largo = JSON.parse(hash.get("largo@example.com"));
  check(largo.name.length === 100 && largo.source === "page" && largo.locale === "en", "nombre limitado a 100, origen desconocido -> page, idioma desconocido -> en");
  r = await sub({ email: "x", consent: true });
  check((await r.json()).code === "invalid_email", "email inválido devuelve code invalid_email");
  r = await sub({ email: "b@example.com", consent: false });
  check((await r.json()).code === "consent_required", "sin consentimiento devuelve code consent_required");
  await sub({ name: "=cmd|' /C calc'!A0", email: "csv@example.com", consent: true });

  // --- Rate limit: 5 intentos / 10 min por IP ---
  const abuser = { "x-forwarded-for": "203.0.113.50" };
  const statuses = [];
  for (let i = 0; i < 7; i++) {
    statuses.push((await sub({ email: `spam${i}@example.com`, consent: true }, abuser)).status);
  }
  check(statuses.slice(0, 5).every((s) => s === 200) && statuses[5] === 429 && statuses[6] === 429,
    `una IP: 5 altas pasan y la 6ª y 7ª dan 429 (${statuses.join(",")})`);
  check(!hash.has("spam5@example.com") && hash.has("spam4@example.com"), "las peticiones bloqueadas no se guardan");
  r = await sub({ email: "spam9@example.com", consent: true }, abuser);
  const retry = Number(r.headers.get("retry-after"));
  const body429 = await r.json();
  check(r.status === 429 && retry > 0 && retry <= 600 && body429.code === "rate_limited",
    `429 con Retry-After (${retry}s) y código rate_limited`);
  r = await sub({ email: "otro@example.com", consent: true }, { "x-forwarded-for": "198.51.100.7" });
  check(r.status === 200, "otra IP no se ve afectada");
  for (const e of [...hash.keys()]) if (e.startsWith("spam")) hash.delete(e); // limpia para el resto de pruebas
  hash.delete("otro@example.com");

  // --- Admin protegido ---
  r = await fetch(`${base}/api/admin/subscribers`, { redirect: "manual" });
  check(r.status >= 300 && r.status < 400, `listado sin sesión redirige (${r.status})`);
  r = await fetch(`${base}/contact-list`, { redirect: "manual" });
  check(r.status >= 300 && r.status < 400 && (r.headers.get("location") ?? "").includes("/admin/login"),
    "/contact-list sin sesión redirige a /admin/login");
  r = await fetch(`${base}/api/admin/subscribers`, { method: "DELETE", redirect: "manual", body: "{}" });
  check(r.status >= 300 && r.status < 400, `borrar sin sesión redirige (${r.status})`);

  const login = await post("/api/admin/login", { password });
  check(login.ok, `login (${login.status})`);
  const cookie = login.headers.get("set-cookie").split(";")[0];
  const auth = { cookie };

  r = await fetch(`${base}/api/admin/subscribers`, { headers: auth });
  const list = await r.json();
  check(r.ok && list.total === 3 && list.subscribers[0].createdAt >= list.subscribers[2].createdAt,
    `listado con sesión: ${list.total} suscriptores, más recientes primero`);

  r = await fetch(`${base}/contact-list`, { headers: auth });
  check(r.ok, `/contact-list con sesión (${r.status})`);

  r = await fetch(`${base}/api/admin/subscribers?format=csv`, { headers: auth });
  const csv = await r.text();
  check(r.ok && r.headers.get("content-type").includes("text/csv") && r.headers.get("content-disposition").includes("attachment"),
    "exportación CSV con cabeceras de descarga");
  check(csv.startsWith("\"name\",\"email\",\"locale\",\"source\",\"subscribed_at\"") && csv.includes("ana@example.com"),
    "CSV con cabecera y datos");
  check(csv.includes("\"'=cmd|") && !csv.includes("\"=cmd"), "CSV neutraliza fórmulas (CSV injection)");

  // --- Baja con enlace firmado ---
  const ana = list.subscribers.find((x) => x.email === "ana@example.com");
  check(ana?.locale === "es" && ana.unsubscribePath.startsWith("/es/unsubscribe?e=ana%40example.com&t="), "el listado incluye idioma y enlace de baja firmado");
  const token = new URL(ana.unsubscribePath, base).searchParams.get("t");
  const unsub = (b, ip = newIp()) => post("/api/unsubscribe", b, { "x-forwarded-for": ip });
  r = await fetch(`${base}${ana.unsubscribePath}`);
  let html = await r.text();
  check(r.ok && html.includes("Darse de baja") && html.includes("Sí, darme de baja") && html.includes("ana@example.com"), "/es/unsubscribe con token válido muestra la confirmación en español");
  check(hash.has("ana@example.com"), "abrir el enlace (GET) NO da de baja a nadie");
  r = await fetch(`${base}/en/unsubscribe?e=ana%40example.com&t=${token.slice(0, -2)}xx`);
  html = await r.text();
  check(r.ok && html.includes("This link is not valid") && !html.includes("Yes, unsubscribe me"), "token manipulado: página de enlace no válido, sin botón");
  r = await fetch(`${base}/nl/unsubscribe`);
  html = await r.text();
  check(html.includes("Deze link is niet geldig") && html.includes("carmenmazambrano@gmail.com"), "sin token: aviso en neerlandés con el email de contacto");
  r = await unsub({ email: "ana@example.com", token: "falso" });
  check(r.status === 400 && hash.has("ana@example.com"), "token falso -> 400 y no borra");
  const largoTok = new URL(list.subscribers.find((x) => x.email === "largo@example.com").unsubscribePath, base).searchParams.get("t");
  r = await unsub({ email: "ana@example.com", token: largoTok });
  check(r.status === 400 && hash.has("ana@example.com"), "el token de otra persona no sirve");
  r = await unsub({ email: "ANA@example.com ", token });
  check(r.status === 200 && !hash.has("ana@example.com"), "token válido: baja inmediata (email normalizado)");
  r = await unsub({ email: "ana@example.com", token });
  check(r.status === 200, "baja repetida: misma respuesta (idempotente)");
  const spam = [];
  for (let i = 0; i < 12; i++) spam.push((await unsub({ email: "x@example.com", token: "mal" }, "203.0.113.77")).status);
  check(spam.slice(0, 10).every((x) => x === 400) && spam[10] === 429, `rate limit de la baja (${spam.join(",")})`);
  await sub({ name: "Ana", email: "ana@example.com", consent: true, locale: "es" }); // se recupera para el resto

  // --- Rate limit del login: 10 intentos / 15 min por IP ---
  const bruteIp = { "x-forwarded-for": "203.0.113.99" };
  const loginStatuses = [];
  for (let i = 0; i < 12; i++) loginStatuses.push((await post("/api/admin/login", { password: "mala" }, bruteIp)).status);
  check(loginStatuses.slice(0, 10).every((s) => s === 401) && loginStatuses.slice(10).every((s) => s === 429),
    `login: 10 intentos fallidos dan 401 y luego 429 (${loginStatuses.join(",")})`);
  r = await post("/api/admin/login", { password }, bruteIp);
  check(r.status === 429, "con la IP bloqueada ni la contraseña correcta entra");

  // --- Borrado ---
  r = await fetch(`${base}/api/admin/subscribers`, {
    method: "DELETE", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify({ email: "Csv@Example.com" }),
  });
  check(r.ok && !hash.has("csv@example.com"), `borrar suscriptor (${r.status})`);
  r = await fetch(`${base}/api/admin/subscribers`, {
    method: "DELETE", headers: { ...auth, "Content-Type": "application/json" }, body: JSON.stringify({ email: "csv@example.com" }),
  });
  check(r.status === 404, `borrar de nuevo -> 404 (${r.status})`);

  // --- Páginas públicas ---
  const page = await (await fetch(`${base}/newsletter`)).text();
  check(page.includes("Stay in the Loop") && page.includes("Subscribe"), "/newsletter se renderiza");
  const home = await (await fetch(`${base}/`)).text();
  check(home.includes("Stories from Rotterdam, in your inbox"), "banda de suscripción en la portada");
  check(home.includes('href="/en/newsletter"'), "botón Newsletter en el header");
  check(home.indexOf("The Newsletter") < home.indexOf("<footer") && home.indexOf("The Newsletter") > home.indexOf("</main>"),
    "la banda va entre el contenido y el footer");
  check(!page.includes("<section aria-labelledby=\"newsletter-heading\""), "la banda no se repite en /newsletter");
  check(calls.includes("HSETNX") && calls.includes("HGETALL") && calls.includes("HDEL"), "se usaron HSETNX, HGETALL y HDEL");
} catch (e) {
  failed = true;
  console.log("ERROR", e);
} finally {
  mock.close();
  console.log(failed ? "\nHay fallos." : "\nTodo correcto.");
  process.exit(failed ? 1 : 0);
}
