"use client";

import { useRef, useState } from "react";
import { ArticleBody } from "@/components/article/ArticleBody";
import { parseBody } from "@/lib/article-body";
import { diffRange, toggleHeading, toggleWrap, type Edit, type Marker } from "@/lib/text-format";

interface Props {
  value: string;
  onChange: (value: string) => void;
  pullquote?: string; // solo para la vista previa
  rows?: number;
  placeholder?: string;
}

const buttonClass =
  "h-8 min-w-8 px-2.5 flex items-center justify-center text-ink border border-transparent hover:bg-paper hover:border-rule transition-colors disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:border-transparent";

// Editor de texto con barra de formato: Título (##), negrita (**), cursiva (*) y subrayado (++).
// El texto sigue siendo texto plano con marcas, así que se guarda y publica igual que antes.
export function RichTextEditor({ value, onChange, pullquote = "", rows = 16, placeholder }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  // Aplica el cambio sustituyendo solo la zona que cambió con execCommand, para que el
  // "deshacer" del navegador (Ctrl+Z) siga funcionando después de usar un botón.
  function apply(next: Edit) {
    const el = ref.current;
    if (!el || next.value === el.value) return;
    const scroll = el.scrollTop;
    const { from, to, insert } = diffRange(el.value, next.value);
    el.focus();
    el.setSelectionRange(from, to);
    if (!document.execCommand("insertText", false, insert)) onChange(next.value);
    // Se fija ya y otra vez al siguiente fotograma (por si React repinta el valor entre medias)
    const restore = () => {
      el.setSelectionRange(next.start, next.end);
      el.scrollTop = scroll;
    };
    restore();
    requestAnimationFrame(restore);
  }

  const wrap = (marker: Marker) => {
    const el = ref.current;
    if (el) apply(toggleWrap(el.value, el.selectionStart, el.selectionEnd, marker));
  };
  const heading = () => {
    const el = ref.current;
    if (el) apply(toggleHeading(el.value, el.selectionStart, el.selectionEnd));
  };

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
    const marker = ({ b: "**", i: "*", u: "++" } as Record<string, Marker>)[e.key.toLowerCase()];
    if (!marker) return;
    e.preventDefault();
    wrap(marker);
  }

  const blocks = parseBody(value, pullquote);

  return (
    <div>
      <div
        role="toolbar"
        aria-label="Formato del texto"
        className="flex flex-wrap items-center gap-1 border border-b-0 border-rule bg-surface px-2 py-1.5"
      >
        <button type="button" onClick={heading} disabled={preview} title="Título de sección (##)" aria-label="Título" className={`${buttonClass} label tracking-wide`}>
          Título
        </button>
        <span className="w-px h-5 bg-rule mx-1" aria-hidden="true" />
        <button type="button" onClick={() => wrap("**")} disabled={preview} title="Negrita (Ctrl+B)" aria-label="Negrita" className={`${buttonClass} font-body font-bold`}>
          B
        </button>
        <button type="button" onClick={() => wrap("*")} disabled={preview} title="Cursiva (Ctrl+I)" aria-label="Cursiva" className={`${buttonClass} font-body italic`}>
          I
        </button>
        <button type="button" onClick={() => wrap("++")} disabled={preview} title="Subrayado (Ctrl+U)" aria-label="Subrayado" className={`${buttonClass} font-body underline underline-offset-2`}>
          U
        </button>
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          aria-pressed={preview}
          className={`${buttonClass} label ml-auto ${preview ? "bg-ink text-inverse hover:bg-ink" : ""}`}
        >
          {preview ? "Editar" : "Vista previa"}
        </button>
      </div>

      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        rows={rows}
        className={`w-full border border-rule bg-white px-4 py-3 font-body text-ink focus:outline-none focus:border-ink resize-y ${preview ? "hidden" : ""}`}
        placeholder={placeholder}
        required={!preview}
      />

      {preview && (
        <div className="border border-rule bg-white px-6 py-5 min-h-48" aria-label="Vista previa del texto">
          {blocks.length ? (
            <ArticleBody blocks={blocks} />
          ) : (
            <p className="font-body text-sm text-dim">Todavía no hay texto que mostrar.</p>
          )}
        </div>
      )}
    </div>
  );
}
