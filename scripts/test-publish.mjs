// Prueba de extremo a extremo del flujo de publicación contra `npm run dev`
// con PUBLISH_MODE=local. Publica una nota de prueba, comprueba que sale en
// el feed y la artículo, y al final restaura content/ y public/images.
//   npm run dev -- -p 3100      (en otra terminal)
//   node scripts/test-publish.mjs [http://localhost:3100]
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const base = process.argv[2] ?? "http://localhost:3100";
const password = process.env.ADMIN_PASSWORD ?? "dev-local-password";
const indexPath = path.resolve("content/articles/index.ts");
const title = `Nota de prueba local ${Date.now()}`;
const slug = title.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");

const check = (ok, msg) => {
  console.log(`${ok ? "OK  " : "FAIL"} ${msg}`);
  if (!ok) { process.exitCode = 1; throw new Error(msg); }
};

const original = await fs.readFile(indexPath, "utf8");
try {
  const login = await fetch(`${base}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": `10.9.${Math.floor(Math.random()*250)}.${Math.floor(Math.random()*250)}` },
    body: JSON.stringify({ password }),
  });
  check(login.ok, `login (${login.status})`);
  const cookie = login.headers.get("set-cookie").split(";")[0];

  // Fotos grandes (>5 MB de ruido) para comprobar que no hay límite de tamaño por foto
  const bigPhoto = () =>
    sharp({ create: { width: 3000, height: 2000, channels: 3, noise: { type: "gaussian", mean: 128, sigma: 60 } } })
      .jpeg({ quality: 95 }).toBuffer();

  const upload = async (name) => {
    const buf = await bigPhoto();
    const fd = new FormData();
    fd.append("file", new File([buf], "foto.jpg", { type: "image/jpeg" }));
    fd.append("slug", slug);
    fd.append("name", name);
    const r = await fetch(`${base}/api/admin/upload-image`, { method: "POST", headers: { cookie }, body: fd });
    const j = await r.json();
    check(r.ok && j.src, `upload ${name} (${(buf.length / 1e6).toFixed(1)} MB -> ${j.src})`);
    return j.src;
  };

  const coverImage = await upload("cover");
  const g1 = await upload("1");
  const g2 = await upload("2");

  const pub = await fetch(`${base}/api/admin/publish`, {
    method: "POST",
    headers: { cookie, "Content-Type": "application/json" },
    body: JSON.stringify({
      title, subtitle: "Subtítulo de prueba", category: "Rotterdam", date: "2026-10-07",
      excerpt: "Extracto de prueba.", body: "Primer párrafo.\n\nSegundo párrafo.\n\n## Sección\n\nTercer párrafo.",
      pullquote: "Cita de prueba", linkedin: "", language: "es",
      coverImage, galleryImages: [{ src: g1, alt: "foto 1" }, { src: g2, alt: "foto 2" }],
    }),
  });
  const pj = await pub.json();
  check(pub.ok && pj.slug === slug, `publish (${pub.status}, slug=${pj.slug})`);

  const dup = await fetch(`${base}/api/admin/publish`, {
    method: "POST", headers: { cookie, "Content-Type": "application/json" },
    body: JSON.stringify({ title, category: "Rotterdam", date: "2026-10-07", excerpt: "x", body: "x" }),
  });
  check(dup.status === 409, `título duplicado rechazado (${dup.status})`);

  const unauth = await fetch(`${base}/api/admin/publish`, { method: "POST", redirect: "manual", body: "{}" });
  check(unauth.status >= 300 && unauth.status < 400, `sin sesión redirige (${unauth.status})`);

  // El dev server recarga el módulo al cambiar index.ts
  let feed = "";
  for (let i = 0; i < 10 && !feed.includes(title); i++) {
    if (i) await new Promise((r) => setTimeout(r, 1000));
    feed = await (await fetch(`${base}/articles`, { cache: "no-store" })).text();
  }
  check(feed.includes(title), "la nota aparece en /articles");
  const home = await (await fetch(`${base}/`, { cache: "no-store" })).text();
  check(home.includes(title), "la nota aparece en la portada");
  let art;
  for (let i = 0; i < 10; i++) {
    art = await fetch(`${base}/es/articles/${slug}`);
    if (art.ok) break;
    await new Promise((r) => setTimeout(r, 1000));
  }
  const artHtml = await art.text();
  check(art.ok && artHtml.includes("Tercer párrafo."), `la página del artículo se renderiza (${art.status}, ${artHtml.length} bytes)`);
  check(/<div lang="es">/.test(artHtml), "el contenido de la nota lleva lang=\"es\" (idioma original)");
  const artEn = await (await fetch(`${base}/en/articles/${slug}`)).text();
  check(artEn.includes("This article is written in Spanish."), "en /en avisa de que la nota está escrita en español");
  check(!artHtml.includes("Este artículo está escrito en"), "en /es (mismo idioma) no se muestra el aviso");
  check(/language: "es"/.test(await fs.readFile(indexPath, "utf8")), "index.ts guarda language: \"es\"");
  for (const src of [coverImage, g1, g2]) {
    const im = await fetch(`${base}${src}`);
    check(im.ok && im.headers.get("content-type")?.includes("image"), `imagen servida ${src}`);
  }
  // --- Borrado ---
  const slugCount = (src) => (src.match(/^ {4}slug: /gm) ?? []).length;
  const postDelete = (b, headers = { cookie, "Content-Type": "application/json" }) =>
    fetch(`${base}/api/admin/delete`, { method: "POST", redirect: "manual", headers, body: JSON.stringify(b) });
  const before = slugCount((await fs.readFile(indexPath, "utf8")).replace(/\r\n/g, "\n"));
  const unauthDel = await postDelete({ slug }, {});
  check(unauthDel.status >= 300 && unauthDel.status < 400, `borrar sin sesión redirige (${unauthDel.status})`);
  const del = await postDelete({ slug });
  const dj = await del.json();
  check(del.ok && dj.imagesDeleted === 3, `borrar nota (${del.status}, fotos borradas=${dj.imagesDeleted})`);
  const after = (await fs.readFile(indexPath, "utf8")).replace(/\r\n/g, "\n");
  check(slugCount(after) === before - 1 && !after.includes(slug), "index.ts conserva el resto de notas intactas");
  const left = (await fs.readdir("public/images")).filter((f) => f.startsWith(slug));
  check(left.length === 0, "las fotos de la nota se borraron del disco");
  const again = await postDelete({ slug });
  check(again.status === 404, `borrar de nuevo da 404 (${again.status})`);
  const bad = await postDelete({ slug: "../x" });
  check(bad.status === 400, `slug inválido rechazado (${bad.status})`);

  console.log("\nTodo correcto.");
} finally {
  await fs.writeFile(indexPath, original);
  for (const f of await fs.readdir("public/images")) {
    if (f.startsWith(slug)) await fs.rm(path.join("public/images", f));
  }
  console.log("Restaurado content/articles/index.ts y public/images.");
}
