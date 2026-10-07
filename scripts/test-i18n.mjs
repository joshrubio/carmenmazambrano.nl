// Tests de i18n.
//   node scripts/test-i18n.mjs            -> solo diccionarios (no necesita servidor)
//   node scripts/test-i18n.mjs http://localhost:3100   -> además, rutas y cabeceras contra `npm run dev`
import fs from "node:fs";
import path from "node:path";

const locales = ["es", "en", "nl"];
const dicts = Object.fromEntries(
  locales.map((l) => [l, JSON.parse(fs.readFileSync(path.resolve(`src/i18n/dictionaries/${l}.json`), "utf8"))])
);

let failed = false;
const check = (ok, msg) => {
  console.log(`${ok ? "OK  " : "FAIL"} ${msg}`);
  if (!ok) failed = true;
};

// Recorre un diccionario y devuelve { "ruta.al.valor": valor } con arrays indexados.
function flatten(obj, prefix = "", out = {}) {
  if (Array.isArray(obj)) {
    out[`${prefix}#len`] = obj.length;
    obj.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out));
  } else if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  } else out[prefix] = obj;
  return out;
}
const flat = Object.fromEntries(locales.map((l) => [l, flatten(dicts[l])]));
const placeholders = (s) => (typeof s === "string" ? (s.match(/\{\w+\}/g) ?? []).sort().join(",") : "");

// --- Diccionarios ---
for (const l of ["es", "nl"]) {
  const missing = Object.keys(flat.en).filter((k) => !(k in flat[l]));
  const extra = Object.keys(flat[l]).filter((k) => !(k in flat.en));
  check(missing.length === 0 && extra.length === 0,
    `${l}: mismas claves que en (${missing.length} faltan, ${extra.length} sobran)${missing.length ? " -> " + missing.slice(0, 5).join(", ") : ""}${extra.length ? " / " + extra.slice(0, 5).join(", ") : ""}`);
}
for (const l of locales) {
  const empty = Object.entries(flat[l]).filter(([, v]) => v === "");
  check(empty.length === 0, `${l}: ningún texto vacío`);
}
for (const l of ["es", "nl"]) {
  const bad = Object.keys(flat.en).filter((k) => placeholders(flat.en[k]) !== placeholders(flat[l][k]));
  check(bad.length === 0, `${l}: mismos {placeholders} que en${bad.length ? " -> " + bad.slice(0, 5).join(", ") : ""}`);
}
const untranslated = (l) =>
  Object.keys(flat.en).filter((k) => typeof flat.en[k] === "string" && flat.en[k].length > 25 && flat[l][k] === flat.en[k]);
for (const l of ["es", "nl"]) {
  const same = untranslated(l);
  check(same.length === 0, `${l}: ningún texto largo copiado tal cual del inglés${same.length ? " -> " + same.slice(0, 3).join(", ") : ""}`);
}
// Las claves de categoría, experiencia y habilidades deben cubrir lo que usa el contenido.
const aboutSrc = fs.readFileSync("content/about.ts", "utf8");
const ids = [...aboutSrc.matchAll(/id: "([a-z-]+)"/g)].map((m) => m[1]);
check(ids.length >= 14 && ids.every((id) => dicts.en.about.experienceItems[id]), `about.ts: ${ids.length} experiencias, todas con texto en los 3 idiomas`);
const cats = new Set([...fs.readFileSync("content/articles/index.ts", "utf8").matchAll(/^ {4}category: "([^"]+)"/gm)].map((m) => m[1]));
check([...cats].every((c) => dicts.en.categories[c]), `categorías del contenido (${[...cats].join(", ")}) traducidas`);
const langs = [...fs.readFileSync("content/articles/index.ts", "utf8").matchAll(/^ {4}language: "([a-z]{2})"/gm)].map((m) => m[1]);
const nArticles = (fs.readFileSync("content/articles/index.ts", "utf8").match(/^ {4}slug: /gm) ?? []).length;
check(langs.length === nArticles && langs.every((l) => locales.includes(l)), `las ${nArticles} notas declaran su idioma original (${langs.length} con language)`);

// --- Servidor ---
const base = process.argv[2];
if (base) {
  const get = (p, headers = {}) => fetch(`${base}${p}`, { redirect: "manual", headers });
  const loc = (r) => new URL(r.headers.get("location") ?? "http://x/", base).pathname;

  let r = await get("/", { "accept-language": "es-ES,es;q=0.9,en;q=0.8" });
  check(r.status >= 300 && r.status < 400 && loc(r) === "/es", `/ con Accept-Language es -> /es (${loc(r)})`);
  r = await get("/", { "accept-language": "nl-NL,nl;q=0.9" });
  check(loc(r) === "/nl", `/ con Accept-Language nl -> /nl (${loc(r)})`);
  r = await get("/", { "accept-language": "fr-FR,fr;q=0.9,en;q=0.5" });
  check(loc(r) === "/en", `/ con fr,en -> /en (${loc(r)})`);
  r = await get("/", { "accept-language": "de-DE,de;q=0.9" });
  check(loc(r) === "/en", `/ con un idioma no soportado -> /en por defecto (${loc(r)})`);
  r = await get("/", { "accept-language": "en;q=0.4,nl;q=0.9" });
  check(loc(r) === "/nl", `Accept-Language respeta los pesos q (${loc(r)})`);
  r = await get("/", { "accept-language": "en", cookie: "NEXT_LOCALE=nl" });
  check(loc(r) === "/nl", `la cookie NEXT_LOCALE gana a Accept-Language (${loc(r)})`);
  r = await get("/", { cookie: "NEXT_LOCALE=zz" });
  check(loc(r) === "/en", `cookie inválida se ignora (${loc(r)})`);
  r = await get("/articles/algo?x=1", { "accept-language": "es" });
  check(loc(r) === "/es/articles/algo" && (r.headers.get("location") ?? "").includes("x=1"), "enlaces antiguos sin prefijo se redirigen conservando ruta y query");
  r = await get("/xx/articles");
  check(r.status === 404 || (r.status >= 300 && r.status < 400), `prefijo desconocido no se sirve como idioma (${r.status})`);
  r = await get("/api/subscribe", { "accept-language": "es" });
  check(!(r.status >= 300 && r.status < 400), `la API no se redirige (${r.status})`);
  r = await get("/admin/login");
  check(r.status === 200, `/admin/login no lleva prefijo de idioma (${r.status})`);

  for (const l of locales) {
    const home = await (await fetch(`${base}/${l}`)).text();
    check(new RegExp(`<html[^>]*lang="${l}"`).test(home), `/${l}: <html lang="${l}">`);
    for (const other of locales) {
      check(new RegExp(`<link[^>]*rel="alternate"[^>]*hreflang="${other}"[^>]*href="https://carmenzambrano.nl/${other}"`, "i").test(home),
        `/${l}: hreflang para ${other}`);
    }
    const links = locales.map((o) => home.includes(`href="/${o}"`));
    check(links.every(Boolean), `/${l}: selector de idioma con los 3 enlaces`);
    check(home.includes(dicts[l].hero.headline[0]) && home.includes(dicts[l].nav.articles), `/${l}: textos de la interfaz en ${l}`);
    for (const p of ["articles", "about", "contact", "newsletter", "privacy"]) {
      const res = await fetch(`${base}/${l}/${p}`);
      check(res.ok, `/${l}/${p} (${res.status})`);
    }
  }
}

console.log(failed ? "\nHay fallos." : "\nTodo correcto.");
process.exit(failed ? 1 : 0);
