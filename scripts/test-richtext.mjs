// Tests unitarios del formato de texto y del troceado de párrafos (sin servidor).
//   npm run test:richtext
import { parseInline, stripInline } from "../src/lib/rich-text.ts";
import { parseBody } from "../src/lib/article-body.ts";
import { toggleWrap, toggleHeading, diffRange } from "../src/lib/text-format.ts";

let failed = false;
const check = (ok, msg, extra = "") => {
  console.log(`${ok ? "OK  " : "FAIL"} ${msg}${ok ? "" : ` ${extra}`}`);
  if (!ok) failed = true;
};

// Representación compacta: negrita -> <b>, cursiva -> <i>, subrayado -> <u>
const html = (src) => {
  const walk = (nodes) =>
    nodes
      .map((n) => {
        if (n.kind === "text") return n.value;
        const tag = { bold: "b", italic: "i", underline: "u" }[n.kind];
        return `<${tag}>${walk(n.children)}</${tag}>`;
      })
      .join("");
  return walk(parseInline(src));
};
const eq = (src, expected) => {
  const got = html(src);
  check(got === expected, JSON.stringify(src), `-> ${JSON.stringify(got)} (esperado ${JSON.stringify(expected)})`);
};

// --- Casos básicos ---
eq("hola **mundo**", "hola <b>mundo</b>");
eq("hola *mundo*", "hola <i>mundo</i>");
eq("hola ++mundo++", "hola <u>mundo</u>");
eq("***ambas***", "<b><i>ambas</i></b>");
eq("a **b** c *d* e ++f++ g", "a <b>b</b> c <i>d</i> e <u>f</u> g");

// --- Anidados ---
eq("**negrita con *cursiva* dentro**", "<b>negrita con <i>cursiva</i> dentro</b>");
eq("++subrayado con **negrita**++", "<u>subrayado con <b>negrita</b></u>");
eq("*cursiva con ++subrayado++*", "<i>cursiva con <u>subrayado</u></i>");

// --- Texto que NO debe interpretarse ---
eq("5 * 3 * 2", "5 * 3 * 2");
eq("C++ y C++", "C++ y C++");
eq("una * suelta", "una * suelta");
eq("sin cerrar **negrita", "sin cerrar **negrita");
eq("sin cerrar *cursiva", "sin cerrar *cursiva");
eq("sin cerrar ++subrayado", "sin cerrar ++subrayado");
eq("** vacío **", "** vacío **");
eq("**", "**");
eq("", "");
eq("texto normal sin marcas", "texto normal sin marcas");
eq("a *b *c", "a *b *c"); // el cierre no puede ir precedido de espacio

// --- Escapes ---
eq("\\*no cursiva\\*", "*no cursiva*");
eq("\\+\\+no subrayado\\+\\+", "++no subrayado++");
eq("barra \\\\ y **negrita**", "barra \\ y <b>negrita</b>");

// --- Caso real: una nota existente usa *…* pensando en cursiva ---
eq("De tentoonstelling *Dom dom, tak dom, tak* van Mohamed", "De tentoonstelling <i>Dom dom, tak dom, tak</i> van Mohamed");
eq("de reeks *Spiritual Disobedience* en meer", "de reeks <i>Spiritual Disobedience</i> en meer");

// --- Seguridad: nada de HTML, todo es texto ---
eq("<script>alert(1)</script> **x**", "<script>alert(1)</script> <b>x</b>"); // el renderizador React lo escapa; aquí solo texto

// --- stripInline ---
check(stripInline("a **b** *c* ++d++ \\* e") === "a b c d * e", "stripInline quita las marcas y respeta escapes");
check(stripInline("5 * 3") === "5 * 3", "stripInline no toca texto sin formato");

// --- Rendimiento: entrada larga y patológica no se cuelga ---
const big = "*a ".repeat(5000) + "**b ".repeat(5000);
const t0 = Date.now();
parseInline(big);
check(Date.now() - t0 < 1500, `entrada patológica de ${big.length} caracteres en ${Date.now() - t0} ms`);

// --- parseBody ---
const blocks = parseBody("Primero.\r\n\r\n## Título **fuerte**\r\n\r\nSegundo *it*.\n\nTercero.", "Cita");
check(blocks.map((b) => b.type).join() === "paragraph,subheading,paragraph,pullquote,paragraph", "parseBody: tipos y cita tras el 2.º párrafo", blocks.map((b) => b.type).join());
check(blocks[1].text === "Título **fuerte**", "parseBody: el título conserva el formato interno y quita '## '");
check(blocks[2].text === "Segundo *it*.", "parseBody: el formato del párrafo se guarda tal cual");
check(parseBody("A\n\nB", "").every((b) => b.type !== "pullquote"), "parseBody: sin cita no se añade");
check(parseBody("  \n\n  ", "").length === 0, "parseBody: vacío -> sin bloques");
check(parseBody("Solo uno", "Cita").map((b) => b.type).join() === "paragraph,pullquote", "parseBody: con un solo párrafo la cita va al final");

// --- Operaciones del editor (texto + selección) ---
const wrap = (text, sel, marker) => {
  const start = text.indexOf(sel);
  const r = toggleWrap(text, start, start + sel.length, marker);
  return { text: r.value, sel: r.value.slice(r.start, r.end) };
};
const w = (text, sel, marker, expText, expSel = sel) => {
  const r = wrap(text, sel, marker);
  check(r.text === expText && r.sel === expSel, `${marker} sobre "${sel}" en ${JSON.stringify(text)}`, `-> ${JSON.stringify(r)}`);
};
w("hola mundo", "mundo", "**", "hola **mundo**");
w("hola mundo", "mundo", "*", "hola *mundo*");
w("hola mundo", "mundo", "++", "hola ++mundo++");
w("hola **mundo**", "mundo", "**", "hola mundo"); // quitar negrita
w("hola *mundo*", "mundo", "*", "hola mundo"); // quitar cursiva
w("hola ++mundo++", "mundo", "++", "hola mundo"); // quitar subrayado
w("hola **mundo**", "mundo", "*", "hola ***mundo***"); // cursiva sobre negrita: no rompe **
w("hola ***mundo***", "mundo", "*", "hola **mundo**"); // quitar solo la cursiva
w("hola ***mundo***", "mundo", "**", "hola *mundo*"); // quitar solo la negrita
w("hola **mundo**", "**mundo**", "**", "hola mundo", "mundo"); // selección que incluye las marcas
w("hola mundo", " mundo", "**", "hola **mundo**", "mundo"); // espacios del borde fuera de las marcas
w("hola mundo ", "mundo ", "**", "hola **mundo** ", "mundo");
w("uno\n\ndos", "uno\n\ndos", "**", "**uno**\n\n**dos**", "**uno**\n\n**dos**"); // varios párrafos: cada uno por separado
{
  const r = toggleWrap("abc", 1, 1, "**");
  check(r.value === "a****bc" && r.start === 3 && r.end === 3, "sin selección: inserta la pareja y deja el cursor en medio", JSON.stringify(r));
  const only = toggleWrap("a   b", 1, 4, "**");
  check(only.value === "a   b", "selección solo de espacios: no hace nada");
}
const hd = (text, a, b, exp, expSel) => {
  const r = toggleHeading(text, a, b);
  check(r.value === exp && (expSel === undefined || `${r.start},${r.end}` === expSel), `título en ${JSON.stringify(text)} [${a},${b}]`, `-> ${JSON.stringify(r)}`);
};
hd("Un párrafo", 3, 3, "## Un párrafo", "6,6"); // el cursor se desplaza con el texto
hd("## Un párrafo", 5, 5, "Un párrafo", "2,2"); // quitar
hd("uno\n\ndos\n\ntres", 6, 6, "uno\n\n## dos\n\ntres"); // solo el párrafo del cursor
hd("uno\nsigue\n\ndos", 6, 6, "## uno\nsigue\n\ndos"); // cursor en la 2.ª línea: título al inicio del bloque
hd("uno\n\ndos\n\ntres", 0, 12, "## uno\n\n## dos\n\n## tres"); // varios párrafos seleccionados
hd("## uno\n\n## dos", 0, 12, "uno\n\ndos"); // todos ya eran título -> los quita
hd("## uno\n\ndos", 0, 12, "## uno\n\n## dos"); // mezcla -> convierte los que faltan
hd("", 0, 0, "## ", "3,3"); // texto vacío
hd("uno\n\n", 5, 5, "uno\n\n## "); // cursor en la línea en blanco final
{
  const oldV = "hola mundo cruel";
  const newV = "hola **mundo** cruel";
  const d = diffRange(oldV, newV);
  check(oldV.slice(0, d.from) + d.insert + oldV.slice(d.to) === newV, "diffRange reconstruye el texto nuevo", JSON.stringify(d));
  const same = diffRange("igual", "igual");
  check(same.from === 5 && same.to === 5 && same.insert === "", "diffRange sin cambios");
}

console.log(failed ? "\nHay fallos." : "\nTodo correcto.");
process.exit(failed ? 1 : 0);
