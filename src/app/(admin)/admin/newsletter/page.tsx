"use client";

import { useCallback, useEffect, useState } from "react";
import { ThickRule } from "@/components/ui/ColumnDivider";

type Audience = "all" | "es" | "en" | "nl";

interface CampaignRow {
  id: string;
  subject: string;
  audience: Audience;
  createdAt: string;
  status: "sending" | "partial" | "sent";
  total: number;
  sent: number;
  skipped: number;
  lastError?: string;
}

interface Overview {
  campaigns: CampaignRow[];
  audience: Record<Audience | "pending", number>;
  mode: "resend" | "dry-run" | "unconfigured";
}

const AUDIENCE_LABEL: Record<Audience, string> = {
  all: "Todas las personas (cualquier idioma)",
  es: "Solo español",
  en: "Solo inglés",
  nl: "Solo neerlandés",
};
const STATUS_LABEL = { sending: "Enviando", partial: "Incompleto", sent: "Enviado" } as const;
const dateFmt = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" });
const inputClass = "w-full rounded-xl border border-rule bg-white px-4 py-3 font-body text-ink focus:outline-none focus:border-ink";

async function api(url: string, body?: unknown) {
  const res = await fetch(url, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : { cache: "no-store" });
  if (res.redirected) throw new Error("La sesión ha caducado. Vuelve a iniciar sesión.");
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error ?? `Error del servidor (${res.status})`);
  return data;
}

export default function NewsletterAdminPage() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<Audience>("all");
  const [testTo, setTestTo] = useState("");
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const load = useCallback(async () => {
    try {
      setOverview(await api("/api/admin/newsletter/campaigns"));
    } catch (e) {
      setMessage({ kind: "error", text: e instanceof Error ? e.message : "Error desconocido" });
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const previewLang = audience === "all" ? "es" : audience;
  const recipients = overview?.audience[audience] ?? 0;
  const ready = subject.trim() && body.trim();

  async function run(kind: string, fn: () => Promise<void>) {
    setBusy(kind);
    setMessage(null);
    try {
      await fn();
    } catch (e) {
      setMessage({ kind: "error", text: e instanceof Error ? e.message : "Error desconocido" });
    } finally {
      setBusy("");
    }
  }

  const showPreview = () =>
    run("preview", async () => setPreview((await api("/api/admin/newsletter/preview", { subject, body, lang: previewLang })).html));

  const sendTest = () =>
    run("test", async () => {
      const d = await api("/api/admin/newsletter/test", { subject, body, to: testTo, lang: previewLang });
      setMessage({
        kind: "ok",
        text:
          d.mode === "dry-run"
            ? `Modo simulación: el correo de prueba se guardó en .data/outbox (no se envió a ${testTo}).`
            : `Correo de prueba enviado a ${testTo}.`,
      });
    });

  async function sendCampaign(campaignId?: string) {
    const text = campaignId
      ? "¿Continuar el envío por donde se quedó?"
      : `¿Enviar "${subject.trim()}" a ${recipients} ${recipients === 1 ? "persona" : "personas"}?\n\nNo se puede deshacer.`;
    if (!window.confirm(text)) return;
    await run("send", async () => {
      const d = await api("/api/admin/newsletter/send", campaignId ? { campaignId } : { subject, body, audience });
      const c: CampaignRow = d.campaign;
      if (c.status === "sent") {
        setMessage({ kind: "ok", text: `Enviado a ${c.sent} ${c.sent === 1 ? "persona" : "personas"}${c.skipped ? ` (${c.skipped} se habían dado de baja)` : ""}.` });
        if (!campaignId) {
          setSubject("");
          setBody("");
          setPreview("");
        }
      } else {
        setMessage({ kind: "error", text: `Envío incompleto: ${c.sent} de ${c.total}${c.lastError ? ` (${c.lastError})` : ""}. Pulsa "Continuar envío" en el historial.` });
      }
      await load();
    });
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <span className="label text-accent">Newsletter</span>
        <ThickRule />
      </div>
      <h1 className="font-display text-4xl font-black text-ink mb-1">Enviar newsletter</h1>
      <p className="font-display text-lg text-muted italic font-normal mb-6">
        Solo la reciben las personas que han confirmado su email.
      </p>

      {overview?.mode === "dry-run" && (
        <p className="rounded-xl font-body text-sm border border-rule bg-surface px-4 py-3 mb-6">
          <strong>Modo simulación:</strong> no hay clave de Resend configurada, así que los correos no se envían; se guardan
          en <code>.data/outbox</code>.
        </p>
      )}
      {overview?.mode === "unconfigured" && (
        <p className="font-body text-sm text-accent border border-accent px-4 py-3 mb-6">
          <strong>Envío no configurado:</strong> falta <code>RESEND_API_KEY</code> (y <code>EMAIL_FROM</code>) en Vercel.
        </p>
      )}

      <div className="space-y-5">
        <div>
          <label className="label text-accent block mb-2">Asunto *</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200} className={inputClass} placeholder="El asunto del correo" />
        </div>

        <div>
          <label className="label text-accent block mb-2">Audiencia *</label>
          <select value={audience} onChange={(e) => setAudience(e.target.value as Audience)} className={inputClass}>
            {(Object.keys(AUDIENCE_LABEL) as Audience[]).map((a) => (
              <option key={a} value={a}>
                {AUDIENCE_LABEL[a]} — {overview?.audience[a] ?? "…"}
              </option>
            ))}
          </select>
          <p className="font-body text-xs text-dim mt-1">
            Escribe el correo en el idioma de la audiencia. {overview ? `${overview.audience.pending} altas pendientes de confirmar no recibirán nada.` : ""}
          </p>
        </div>

        <div>
          <label className="label text-accent block mb-2">Texto *</label>
          <p className="font-body text-xs text-dim mb-2">
            Separa los párrafos con una línea en blanco. Títulos con <code>## </code> al inicio. Enlaces con{" "}
            <code>[texto](https://…)</code>. El pie con el enlace de baja se añade solo.
          </p>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={14} className={`${inputClass} resize-y`} placeholder={"Hola,\n\nEsta semana he publicado…\n\n## Lo más leído\n\n[Leer la nota](https://…)"} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={showPreview} disabled={!ready || !!busy} className="rounded-full label text-ink border border-ink px-5 py-3 hover:bg-ink hover:text-inverse transition-colors disabled:opacity-40">
            {busy === "preview" ? "Generando..." : "Vista previa"}
          </button>
          <input value={testTo} onChange={(e) => setTestTo(e.target.value)} type="email" placeholder="tu@email.com" aria-label="Email para la prueba" className="rounded-full border border-rule bg-white px-4 py-3 font-body text-sm w-56 focus:outline-none focus:border-ink" />
          <button onClick={sendTest} disabled={!ready || !testTo || !!busy} className="rounded-full label text-ink border border-ink px-5 py-3 hover:bg-ink hover:text-inverse transition-colors disabled:opacity-40">
            {busy === "test" ? "Enviando..." : "Enviar prueba"}
          </button>
          <button onClick={() => sendCampaign()} disabled={!ready || recipients === 0 || !!busy} className="rounded-full label bg-accent text-inverse px-6 py-3 hover:opacity-90 transition-opacity disabled:opacity-40 sm:ml-auto">
            {busy === "send" ? "Enviando..." : `Enviar a ${recipients} ${recipients === 1 ? "persona" : "personas"}`}
          </button>
        </div>

        {message && (
          <p className={`font-body text-sm ${message.kind === "ok" ? "rounded-xl text-ink border border-ink bg-white px-4 py-3" : "text-accent"}`} role={message.kind === "error" ? "alert" : "status"}>
            {message.text}
          </p>
        )}

        {preview && (
          <iframe title="Vista previa del correo" srcDoc={preview} sandbox="" className="w-full h-[640px] rounded-2xl border border-rule bg-white" />
        )}
      </div>

      <div className="flex items-center gap-3 mt-12 mb-4">
        <span className="label text-accent">Historial</span>
        <ThickRule />
      </div>
      {!overview || overview.campaigns.length === 0 ? (
        <p className="rounded-2xl font-body text-muted border border-rule bg-white p-6">Todavía no se ha enviado ninguna newsletter.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-rule bg-white shadow-soft">
          <table className="w-full min-w-[640px] text-left">
            <thead className="border-b-2 border-ink">
              <tr>
                {["Fecha", "Asunto", "Audiencia", "Enviados", "Estado", ""].map((h) => (
                  <th key={h} className="label text-accent px-4 py-3 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {overview.campaigns.map((c) => (
                <tr key={c.id} className="border-b border-rule last:border-0">
                  <td className="px-4 py-3 font-body text-sm text-muted whitespace-nowrap">{dateFmt.format(new Date(c.createdAt))}</td>
                  <td className="px-4 py-3 font-body text-ink">{c.subject}</td>
                  <td className="px-4 py-3 label text-muted font-normal normal-case tracking-wide">{c.audience === "all" ? "Todas" : c.audience.toUpperCase()}</td>
                  <td className="px-4 py-3 font-body text-sm text-ink whitespace-nowrap">{c.sent} / {c.total}</td>
                  <td className="px-4 py-3 label font-normal normal-case tracking-wide">
                    <span className={c.status === "sent" ? "text-ink" : "text-accent"}>{STATUS_LABEL[c.status]}</span>
                    {c.lastError && <span className="block text-xs text-dim break-words max-w-xs">{c.lastError}</span>}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {c.status !== "sent" && (
                      <button onClick={() => sendCampaign(c.id)} disabled={!!busy} className="label text-accent font-normal hover:text-ink transition-colors disabled:opacity-40">
                        Continuar envío
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
