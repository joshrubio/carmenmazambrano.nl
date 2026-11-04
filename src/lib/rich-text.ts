// Formato de texto dentro de un párrafo. Sin dependencias, para poder usarlo en el
// servidor, en el navegador y en los tests.
//   **negrita**   *cursiva*   ++subrayado++   ***negrita y cursiva***
// Una marca solo abre si lo que sigue no es un espacio y solo cierra si lo anterior no lo es
// (así "5 * 3" o "C++ y C++" quedan tal cual). Una barra invertida escapa la marca: \* \+ \\

export type Inline =
  | { kind: "text"; value: string }
  | { kind: "bold" | "italic" | "underline"; children: Inline[] };

const isSpace = (c: string | undefined) => c === undefined || /\s/.test(c);
const ESCAPABLE = new Set(["*", "+", "\\"]);

// Posición de la marca de cierre que corresponde a una de apertura en `open`, o -1.
function findClose(src: string, from: number, marker: string): number {
  for (let k = from; k < src.length; k++) {
    if (src[k] === "\\" && ESCAPABLE.has(src[k + 1])) {
      k++;
      continue;
    }
    if (!src.startsWith(marker, k) || k === from || isSpace(src[k - 1])) continue;
    // Un cierre de cursiva (*) no puede ser parte de ** ni de ***
    if (marker === "*" && (src[k + 1] === "*" || src[k - 1] === "*")) continue;
    return k;
  }
  return -1;
}

const KINDS: { marker: string; kind: "bold" | "italic" | "underline" }[] = [
  { marker: "**", kind: "bold" },
  { marker: "++", kind: "underline" },
  { marker: "*", kind: "italic" },
];

export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  // Si buscar el cierre de una marca desde la posición p no encontró nada, tampoco lo habrá
  // desde cualquier posición posterior: se recuerda para no recorrer el texto una y otra vez.
  const failedFrom = new Map<string, number>();
  const close = (marker: string, from: number) => {
    const failed = failedFrom.get(marker);
    if (failed !== undefined && from >= failed) return -1;
    const k = findClose(src, from, marker);
    if (k === -1) failedFrom.set(marker, Math.min(failed ?? from, from));
    return k;
  };
  let buffer = "";
  const flush = () => {
    if (buffer) out.push({ kind: "text", value: buffer });
    buffer = "";
  };

  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === "\\" && ESCAPABLE.has(src[i + 1])) {
      buffer += src[i + 1];
      i += 2;
      continue;
    }

    // ***negrita y cursiva***
    if (src.startsWith("***", i) && !isSpace(src[i + 3])) {
      const end = close("***", i + 3);
      if (end > -1) {
        flush();
        out.push({
          kind: "bold",
          children: [{ kind: "italic", children: parseInline(src.slice(i + 3, end)) }],
        });
        i = end + 3;
        continue;
      }
    }

    let matched = false;
    for (const { marker, kind } of KINDS) {
      if (!src.startsWith(marker, i) || isSpace(src[i + marker.length])) continue;
      if (marker === "*" && src[i + 1] === "*") continue;
      const end = close(marker, i + marker.length);
      if (end === -1) continue;
      flush();
      out.push({ kind, children: parseInline(src.slice(i + marker.length, end)) });
      i = end + marker.length;
      matched = true;
      break;
    }
    if (matched) continue;

    buffer += ch;
    i++;
  }
  flush();
  return out;
}

// Texto sin marcas (para metadatos, descripciones, etc.)
export function stripInline(src: string): string {
  const walk = (nodes: Inline[]): string =>
    nodes.map((n) => (n.kind === "text" ? n.value : walk(n.children))).join("");
  return walk(parseInline(src));
}
