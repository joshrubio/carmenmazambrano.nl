import type { Dictionary } from "@/i18n/dictionaries";
import { site } from "./site";

const INK = "#1A1A1A";
const PAPER = "#FAF7F0";
const ACCENT = "#8B1A1A";
const MUTED = "#555555";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Solo enlaces http(s) y mailto: nada de javascript: ni data:
const safeUrl = (u: string) => (/^(https?:\/\/|mailto:)/i.test(u.trim()) ? u.trim() : null);

// Texto -> HTML: [texto](https://enlace) y todo lo demás escapado.
function inline(text: string): string {
  let out = "";
  let last = 0;
  for (const m of text.matchAll(/\[([^\]]+)\]\(([^)\s]+)\)/g)) {
    out += esc(text.slice(last, m.index));
    const url = safeUrl(m[2]);
    out += url
      ? `<a href="${esc(url)}" style="color:${ACCENT};text-decoration:underline;">${esc(m[1])}</a>`
      : esc(m[0]);
    last = (m.index ?? 0) + m[0].length;
  }
  return out + esc(text.slice(last));
}

const plainInline = (text: string) => text.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, "$1 ($2)");

// Cuerpo escrito por Carmen: párrafos separados por línea en blanco y "## " para títulos.
export function renderBody(markup: string): { html: string; text: string } {
  const blocks = markup
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  const html = blocks
    .map((b) =>
      b.startsWith("## ")
        ? `<h2 style="font-family:Georgia,'Times New Roman',serif;font-size:20px;line-height:1.3;color:${INK};margin:28px 0 8px;">${inline(b.slice(3).trim())}</h2>`
        : `<p style="font-size:16px;line-height:1.7;color:${INK};margin:0 0 16px;">${inline(b).replace(/\n/g, "<br>")}</p>`
    )
    .join("\n");
  const text = blocks.map((b) => (b.startsWith("## ") ? b.slice(3).trim().toUpperCase() : plainInline(b))).join("\n\n");
  return { html, text };
}

interface LayoutParts {
  lang: string;
  title: string;
  preheader: string;
  innerHtml: string;
  footerHtml: string;
}

function layout({ lang, title, preheader, innerHtml, footerHtml }: LayoutParts): string {
  return `<!doctype html>
<html lang="${esc(lang)}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${PAPER};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</span>
<div style="background:${PAPER};padding:24px 12px;">
  <div style="max-width:600px;margin:0 auto;font-family:Georgia,'Times New Roman',serif;color:${INK};">
    <div style="border-bottom:3px solid ${INK};padding-bottom:12px;margin-bottom:24px;">
      <div style="font-size:28px;font-weight:bold;letter-spacing:-0.5px;">${esc(site.name)}</div>
    </div>
    ${innerHtml}
    <div style="border-top:1px solid #CCCCCC;margin-top:32px;padding-top:16px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:${MUTED};">
      ${footerHtml}
    </div>
  </div>
</div>
</body>
</html>`;
}

const button = (url: string, label: string) =>
  `<p style="margin:24px 0;"><a href="${esc(url)}" style="display:inline-block;background:${ACCENT};color:${PAPER};font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;text-decoration:none;padding:14px 28px;">${esc(label)}</a></p>`;

export interface Rendered {
  subject: string;
  html: string;
  text: string;
}

// Correo de confirmación del alta (doble opt-in)
export function renderConfirmEmail(o: {
  lang: string;
  dict: Dictionary;
  name: string;
  confirmUrl: string;
}): Rendered {
  const c = o.dict.email.confirm;
  const greeting = o.name ? c.greeting.replace("{name}", o.name) : c.greetingNoName;
  const html = layout({
    lang: o.lang,
    title: c.subject,
    preheader: c.preheader,
    innerHtml: `
    <p style="font-size:16px;line-height:1.7;margin:0 0 16px;">${esc(greeting)}</p>
    <p style="font-size:16px;line-height:1.7;margin:0 0 8px;">${esc(c.body)}</p>
    ${button(o.confirmUrl, c.button)}
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:${MUTED};margin:0 0 4px;">${esc(c.linkHint)}</p>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;word-break:break-all;margin:0 0 16px;"><a href="${esc(o.confirmUrl)}" style="color:${ACCENT};">${esc(o.confirmUrl)}</a></p>
    <p style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:${MUTED};margin:0;">${esc(c.expires)}</p>`,
    footerHtml: esc(c.ignore),
  });
  const text = [greeting, c.body, `${c.button}: ${o.confirmUrl}`, c.expires, c.ignore].join("\n\n");
  return { subject: c.subject, html, text };
}

// Correo de la newsletter con el enlace de baja propio de cada persona
export function renderNewsletterEmail(o: {
  lang: string;
  dict: Dictionary;
  subject: string;
  body: string;
  unsubscribeUrl: string;
  test?: boolean;
}): Rendered {
  const n = o.dict.email.newsletter;
  const body = renderBody(o.body);
  const subject = (o.test ? n.testPrefix : "") + o.subject;
  const html = layout({
    lang: o.lang,
    title: subject,
    preheader: o.body.replace(/\s+/g, " ").replace(/[#[\]()]/g, "").slice(0, 110),
    innerHtml: `<h1 style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;margin:0 0 20px;">${esc(o.subject)}</h1>\n${body.html}`,
    footerHtml: `${esc(n.why)}<br><a href="${esc(o.unsubscribeUrl)}" style="color:${ACCENT};">${esc(n.unsubscribe)}</a>`,
  });
  const text = [o.subject.toUpperCase(), body.text, "—", n.why, `${n.unsubscribe}: ${o.unsubscribeUrl}`].join("\n\n");
  return { subject, html, text };
}
