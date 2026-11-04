// Convierte el texto del formulario de redacción en bloques de artículo.
// Los párrafos se separan con una línea en blanco y un párrafo que empieza por "## "
// es un título de sección. El formato dentro de un párrafo (negrita, cursiva, subrayado)
// se guarda tal cual y se interpreta al mostrarlo (ver rich-text.ts).
export interface TextBlock {
  type: "paragraph" | "subheading" | "pullquote";
  text: string;
}

export function parseBody(body: string, pullquote: string): TextBlock[] {
  const blocks: TextBlock[] = [];
  const sections = body.replace(/\r\n/g, "\n").split(/\n{2,}/);
  let pullInserted = false;
  let paraCount = 0;

  for (const raw of sections) {
    const s = raw.trim();
    if (!s) continue;
    if (s.startsWith("## ")) {
      blocks.push({ type: "subheading", text: s.slice(3).trim() });
    } else {
      blocks.push({ type: "paragraph", text: s });
      paraCount++;
      if (!pullInserted && pullquote && paraCount === 2) {
        blocks.push({ type: "pullquote", text: pullquote });
        pullInserted = true;
      }
    }
  }

  if (!pullInserted && pullquote) {
    blocks.push({ type: "pullquote", text: pullquote });
  }

  return blocks;
}
