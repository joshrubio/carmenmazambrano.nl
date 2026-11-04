"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import { format, useLocale } from "@/i18n/LocaleProvider";

// API de traducción integrada en el navegador (Chrome 138+ y Edge de escritorio).
// La traducción ocurre en el propio dispositivo: el texto no se envía a ningún servidor.
interface TranslatorInstance {
  translate(text: string): Promise<string>;
  destroy?(): void;
}
interface TranslatorStatic {
  availability(o: { sourceLanguage: string; targetLanguage: string }): Promise<string>;
  create(o: {
    sourceLanguage: string;
    targetLanguage: string;
    monitor?(m: EventTarget): void;
  }): Promise<TranslatorInstance>;
}
const getTranslator = () => (globalThis as unknown as { Translator?: TranslatorStatic }).Translator;

const CONCURRENCY = 3;

// Nodos de texto traducibles. Se omite lo marcado con data-no-translate (la firma, que ya
// está en el idioma de la interfaz) y los elementos que no son contenido.
function collectTextNodes(root: HTMLElement): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue?.trim()) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent || parent.closest("[data-no-translate],script,style,noscript,button")) {
        return NodeFilter.FILTER_REJECT;
      }
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  for (let n = walker.nextNode(); n; n = walker.nextNode()) nodes.push(n as Text);
  return nodes;
}

type Phase = "idle" | "working" | "done" | "error";

interface Props {
  articleLang: Locale; // idioma original de la nota
  fromName: string; // su nombre en el idioma de la interfaz ("neerlandés")
  children: React.ReactNode;
}

export function TranslatableArticle({ articleLang, fromName, children }: Props) {
  const { lang, t } = useLocale();
  const tr = t.translate;
  const rootRef = useRef<HTMLDivElement>(null);
  const [supported, setSupported] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [status, setStatus] = useState("");
  const [showingTranslation, setShowingTranslation] = useState(false);
  const state = useRef<{ nodes: Text[]; original: string[]; translated: string[] } | null>(null);

  // El botón solo aparece si el navegador tiene la API, el par de idiomas está soportado
  // y la nota no está ya en el idioma de la interfaz.
  useEffect(() => {
    if (articleLang === lang) return;
    const T = getTranslator();
    if (!T) return;
    let cancelled = false;
    T.availability({ sourceLanguage: articleLang, targetLanguage: lang })
      .then((a) => !cancelled && setSupported(a !== "unavailable"))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [articleLang, lang]);

  function apply(values: string[], language: string) {
    const s = state.current;
    if (!s || !rootRef.current) return;
    s.nodes.forEach((node, i) => (node.nodeValue = values[i]));
    rootRef.current.lang = language; // silabeo y lectores de pantalla usan el idioma correcto
  }

  async function handleTranslate() {
    const T = getTranslator();
    const root = rootRef.current;
    if (!T || !root) return;
    setPhase("working");
    setStatus(format(tr.translating, { done: 0, total: "…" }));
    try {
      const translator = await T.create({
        sourceLanguage: articleLang,
        targetLanguage: lang,
        monitor(m) {
          m.addEventListener("downloadprogress", (e) => {
            const loaded = (e as Event & { loaded?: number }).loaded ?? 0;
            setStatus(format(tr.downloading, { percent: Math.round(loaded * 100) }));
          });
        },
      });

      const nodes = collectTextNodes(root);
      const original = nodes.map((n) => n.nodeValue ?? "");
      const translated = [...original];
      let done = 0;
      let next = 0;
      setStatus(format(tr.translating, { done, total: nodes.length }));

      // Pequeño pool: varios párrafos a la vez sin saturar el traductor.
      const worker = async () => {
        while (next < nodes.length) {
          const i = next++;
          const text = original[i];
          const lead = text.match(/^\s*/)?.[0] ?? "";
          const trail = text.match(/\s*$/)?.[0] ?? "";
          translated[i] = lead + (await translator.translate(text.trim())) + trail;
          setStatus(format(tr.translating, { done: ++done, total: nodes.length }));
        }
      };
      await Promise.all(Array.from({ length: Math.min(CONCURRENCY, nodes.length) }, worker));
      translator.destroy?.();

      state.current = { nodes, original, translated };
      apply(translated, lang);
      setShowingTranslation(true);
      setPhase("done");
    } catch {
      // Si falló a medias, se deja el texto original tal cual estaba.
      if (state.current) apply(state.current.original, articleLang);
      setPhase("error");
    }
  }

  function toggle() {
    const s = state.current;
    if (!s) return;
    apply(showingTranslation ? s.original : s.translated, showingTranslation ? articleLang : lang);
    setShowingTranslation(!showingTranslation);
  }

  return (
    <>
      {supported && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-6" data-no-translate>
          {phase === "done" ? (
            <button
              onClick={toggle}
              className="label text-ink border border-ink px-4 py-2 hover:bg-ink hover:text-inverse transition-colors"
            >
              {showingTranslation ? tr.showOriginal : tr.translateAgain}
            </button>
          ) : (
            <button
              onClick={handleTranslate}
              disabled={phase === "working"}
              className="label bg-ink text-inverse px-4 py-2 hover:opacity-80 transition-opacity disabled:opacity-60"
            >
              {phase === "working" ? status : tr.button}
            </button>
          )}
          {phase === "done" && showingTranslation && (
            <p className="font-body text-xs text-muted">{format(tr.note, { from: fromName })}</p>
          )}
          {phase === "error" && (
            <p className="font-body text-sm text-accent" role="alert">
              {tr.error}
            </p>
          )}
        </div>
      )}
      <div lang={articleLang} ref={rootRef}>
        {children}
      </div>
    </>
  );
}
