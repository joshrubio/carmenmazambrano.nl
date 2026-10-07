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
const calls = [];
const mock = http.createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", () => {
    res.setHeader("Content-Type", "application/json");
    if (req.headers.authorization !== "Bearer test") {
      res.statusCode = 401;
      return res.end(JSON.stringify({ error: "WRONGPASS" }));
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
    headers: { "Content-Type": "application/json", ...headers },
    body: typeof body === "string" ? body : JSON.stringify(body),
    ...init,
  });
const sub = (b) => post("/api/subscribe", b);

try {
  // --- Alta pública ---
  let r = await sub({ name: "  Ana  ", email: "  Ana@Example.COM ", consent: true, website: "", source: "footer" });
  check(r.status === 200, `alta válida (${r.status})`);
  const stored = JSON.parse(hash.get("ana@example.com") ?? "null");
  check(stored?.name === "Ana" && stored.source === "footer" && stored.consent === true && !!stored.createdAt,
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
  await sub({ name: "x".repeat(500), email: "largo@example.com", consent: true, source: "otro" });
  const largo = JSON.parse(hash.get("largo@example.com"));
  check(largo.name.length === 100 && largo.source === "page", "nombre limitado a 100 y origen desconocido -> page");
  await sub({ name: "=cmd|' /C calc'!A0", email: "csv@example.com", consent: true });

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
  check(csv.startsWith("\"name\",\"email\",\"source\",\"subscribed_at\"") && csv.includes("ana@example.com"),
    "CSV con cabecera y datos");
  check(csv.includes("\"'=cmd|") && !csv.includes("\"=cmd"), "CSV neutraliza fórmulas (CSV injection)");

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
  check(home.includes('href="/newsletter"'), "botón Newsletter en el header");
  check(home.indexOf("The Newsletter") < home.indexOf("<footer") && home.indexOf("The Newsletter") > home.indexOf("</main>"),
    "la banda va entre el contenido y el footer");
  check(!page.includes("Stories from Rotterdam, in your inbox"), "la banda no se repite en /newsletter");
  check(calls.includes("HSETNX") && calls.includes("HGETALL") && calls.includes("HDEL"), "se usaron HSETNX, HGETALL y HDEL");
} catch (e) {
  failed = true;
  console.log("ERROR", e);
} finally {
  mock.close();
  console.log(failed ? "\nHay fallos." : "\nTodo correcto.");
  process.exit(failed ? 1 : 0);
}
