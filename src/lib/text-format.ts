// Operaciones de formato sobre el texto del formulario de redacción. Son funciones puras
// (texto + selección -> texto + selección) para poder probarlas sin navegador.
// Ver rich-text.ts para la sintaxis: **negrita**, *cursiva*, ++subrayado++ y "## " para títulos.

export interface Edit {
  value: string;
  start: number; // selección resultante
  end: number;
}

export type Marker = "**" | "*" | "++";

const runBefore = (v: string, i: number, ch: string) => {
  let n = 0;
  while (i - 1 - n >= 0 && v[i - 1 - n] === ch) n++;
  return n;
};
const runAfter = (v: string, i: number, ch: string) => {
  let n = 0;
  while (i + n < v.length && v[i + n] === ch) n++;
  return n;
};

// ¿Las marcas que rodean [s, e) son exactamente `marker`? (distingue * de ** y ***)
function surroundedBy(v: string, s: number, e: number, marker: Marker): boolean {
  const ch = marker[0];
  const n = Math.min(runBefore(v, s, ch), runAfter(v, e, ch));
  if (marker === "++") return n >= 2;
  if (marker === "**") return n >= 2; // ** y *** incluyen negrita
  return n === 1 || n >= 3; // * y *** incluyen cursiva
}

// Negrita / cursiva / subrayado: pone o quita la marca alrededor de la selección.
// Sin selección inserta la pareja de marcas y deja el cursor en medio.
export function toggleWrap(value: string, start: number, end: number, marker: Marker): Edit {
  const m = marker.length;
  if (start === end) {
    return { value: value.slice(0, start) + marker + marker + value.slice(end), start: start + m, end: start + m };
  }

  // Las marcas deben pegarse al texto: se descartan los espacios de los extremos de la selección.
  const sel = value.slice(start, end);
  const lead = sel.length - sel.trimStart().length;
  const trail = sel.length - sel.trimEnd().length;
  const s = start + lead;
  const e = end - trail;
  if (s >= e) return { value, start, end };

  // 1) La selección ya está rodeada por la marca -> quitarla
  if (surroundedBy(value, s, e, marker)) {
    return {
      value: value.slice(0, s - m) + value.slice(s, e) + value.slice(e + m),
      start: s - m,
      end: e - m,
    };
  }

  // 2) La selección incluye las marcas ("**texto**" seleccionado entero) -> quitarlas
  const inner = value.slice(s, e);
  if (inner.length > 2 * m && inner.startsWith(marker) && inner.endsWith(marker) && surroundedBy(inner, m, inner.length - m, marker)) {
    const stripped = inner.slice(m, -m);
    return { value: value.slice(0, s) + stripped + value.slice(e), start: s, end: s + stripped.length };
  }

  // 3) Poner la marca. Si la selección abarca varios párrafos se marca cada uno por separado,
  //    porque el formato no puede cruzar una línea en blanco.
  const parts = inner.split(/(\n{2,})/);
  const wrapped = parts.map((part) => (/^\n*$/.test(part) ? part : marker + part + marker)).join("");
  const next = value.slice(0, s) + wrapped + value.slice(e);
  // Un solo párrafo: la selección queda sobre el texto (sin las marcas), como en Word, para poder
  // pulsar otra vez y quitarlo o combinarlo con otro formato. Varios párrafos: se selecciona todo.
  return parts.length === 1
    ? { value: next, start: s + m, end: s + m + inner.length }
    : { value: next, start: s, end: s + wrapped.length };
}

// Posición donde empieza el párrafo (bloque separado por línea en blanco) que contiene `pos`
function blockStart(v: string, pos: number): number {
  // Cursor en una línea en blanco: se trabaja justo ahí
  if (pos > 0 && v[pos - 1] === "\n" && (pos >= v.length || v[pos] === "\n")) return pos;
  const i = v.lastIndexOf("\n\n", pos - 1);
  let s = i === -1 ? 0 : i + 2;
  while (v[s] === "\n" && s < pos) s++;
  return s;
}

// Título: añade o quita "## " al principio de cada párrafo tocado por la selección.
// Si todos ya son títulos, los quita; si no, convierte en título los que no lo son.
export function toggleHeading(value: string, start: number, end: number): Edit {
  const starts: number[] = [];
  let cursor = blockStart(value, start);
  starts.push(cursor);
  for (;;) {
    const next = value.indexOf("\n\n", cursor);
    if (next === -1) break;
    let n = next + 2;
    while (value[n] === "\n") n++;
    if (n >= end || n >= value.length) break;
    starts.push(n);
    cursor = n;
  }

  const allHeadings = starts.every((p) => value.startsWith("## ", p));
  let out = value;
  let ns = start;
  let ne = end;
  for (const p of [...starts].reverse()) {
    if (allHeadings) {
      out = out.slice(0, p) + out.slice(p + 3);
      if (p < start) ns = Math.max(p, ns - 3);
      if (p < end) ne = Math.max(p, ne - 3);
    } else if (!value.startsWith("## ", p)) {
      out = out.slice(0, p) + "## " + out.slice(p);
      if (p <= start) ns += 3;
      if (p < end || start === end) ne += 3;
    }
  }
  return { value: out, start: ns, end: ne };
}

// Zona mínima que cambió entre dos textos (para reemplazar solo eso y no perder el "deshacer")
export function diffRange(oldV: string, newV: string) {
  let a = 0;
  while (a < oldV.length && a < newV.length && oldV[a] === newV[a]) a++;
  let b = 0;
  while (b < oldV.length - a && b < newV.length - a && oldV[oldV.length - 1 - b] === newV[newV.length - 1 - b]) b++;
  return { from: a, to: oldV.length - b, insert: newV.slice(a, newV.length - b) };
}
