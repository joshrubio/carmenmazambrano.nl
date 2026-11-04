import { Fragment } from "react";
import { parseInline, type Inline } from "@/lib/rich-text";

function render(nodes: Inline[]): React.ReactNode {
  return nodes.map((n, i) => {
    if (n.kind === "text") return <Fragment key={i}>{n.value}</Fragment>;
    if (n.kind === "bold") return <strong key={i}>{render(n.children)}</strong>;
    if (n.kind === "italic") return <em key={i}>{render(n.children)}</em>;
    return (
      <u key={i} className="underline-offset-2">
        {render(n.children)}
      </u>
    );
  });
}

// Texto con formato (**negrita**, *cursiva*, ++subrayado++). Todo se pinta como elementos de
// React, nunca como HTML en bruto, así que el contenido no puede inyectar código.
export function RichText({ text }: { text: string }) {
  return <>{render(parseInline(text))}</>;
}
