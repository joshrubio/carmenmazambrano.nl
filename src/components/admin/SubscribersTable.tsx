"use client";

import { useEffect, useMemo, useState } from "react";

interface Subscriber {
  email: string;
  name: string;
  source: string;
  locale: string;
  unsubscribePath: string;
  createdAt: string;
}

const dateFmt = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" });

export function SubscribersTable() {
  const [subs, setSubs] = useState<Subscriber[] | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState("");
  const [copied, setCopied] = useState("");

  useEffect(() => {
    fetch("/api/admin/subscribers", { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        if (r.redirected) throw new Error("La sesión ha caducado. Vuelve a iniciar sesión.");
        if (!r.ok) throw new Error(d?.error ?? `Error del servidor (${r.status})`);
        setSubs(d.subscribers);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error desconocido"));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!subs) return [];
    return q ? subs.filter((s) => s.email.includes(q) || s.name.toLowerCase().includes(q)) : subs;
  }, [subs, query]);

  async function handleDelete(s: Subscriber) {
    if (!window.confirm(`¿Eliminar a ${s.email} de la lista?\n\nNo se puede deshacer.`)) return;
    setBusy(s.email);
    try {
      const res = await fetch("/api/admin/subscribers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: s.email }),
      });
      const d = await res.json().catch(() => null);
      if (!res.ok) throw new Error(d?.error ?? `Error del servidor (${res.status})`);
      setSubs((cur) => cur?.filter((x) => x.email !== s.email) ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setBusy("");
    }
  }

  async function copyUnsubscribeLink(s: Subscriber) {
    const url = `${window.location.origin}${s.unsubscribePath}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Respaldo si el navegador no permite el portapapeles: se muestra para copiarlo a mano.
      window.prompt("Copia el enlace de baja (Ctrl+C):", url);
    }
    setCopied(s.email);
    setTimeout(() => setCopied((c) => (c === s.email ? "" : c)), 2000);
  }

  if (error && !subs) return <p className="font-body text-accent">{error}</p>;
  if (!subs) return <p className="font-body text-muted">Cargando...</p>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <p className="font-body text-muted">
          <strong className="text-ink">{subs.length}</strong>{" "}
          {subs.length === 1 ? "persona apuntada" : "personas apuntadas"}
        </p>
        <div className="flex items-center gap-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o email"
            aria-label="Buscar suscriptores"
            className="border border-rule bg-white px-3 py-2 font-body text-sm text-ink focus:outline-none focus:border-ink w-full sm:w-64"
          />
          <button
            onClick={() => window.location.assign("/api/admin/subscribers?format=csv")}
            className="label bg-ink text-inverse px-4 py-2 leading-none whitespace-nowrap hover:opacity-80 transition-opacity"
          >
            Exportar CSV
          </button>
        </div>
      </div>

      {error && <p className="font-body text-sm text-accent mb-3">{error}</p>}

      {filtered.length === 0 ? (
        <p className="font-body text-muted border border-rule bg-white p-6">
          {subs.length === 0 ? "Aún no se ha apuntado nadie." : "Ningún resultado para esa búsqueda."}
        </p>
      ) : (
        <div className="overflow-x-auto border border-rule bg-white">
          <table className="w-full min-w-[640px] text-left">
            <thead className="border-b-2 border-ink">
              <tr>
                {["Nombre", "Email", "Idioma", "Origen", "Fecha", ""].map((h) => (
                  <th key={h} className="label text-accent px-4 py-3 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.email} className="border-b border-rule last:border-0">
                  <td className="px-4 py-3 font-body text-ink">{s.name || <span className="text-dim">—</span>}</td>
                  <td className="px-4 py-3 font-body text-ink whitespace-nowrap">{s.email}</td>
                  <td className="px-4 py-3 label text-muted font-normal tracking-wide">{s.locale}</td>
                  <td className="px-4 py-3 label text-muted font-normal normal-case tracking-wide">
                    {s.source === "page" ? "Página" : "Footer"}
                  </td>
                  <td className="px-4 py-3 font-body text-sm text-muted whitespace-nowrap">
                    {dateFmt.format(new Date(s.createdAt))}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      onClick={() => copyUnsubscribeLink(s)}
                      className="label text-muted font-normal hover:text-ink transition-colors mr-4"
                    >
                      {copied === s.email ? "¡Copiado!" : "Copiar enlace de baja"}
                    </button>
                    <button
                      onClick={() => handleDelete(s)}
                      disabled={busy === s.email}
                      className="label text-muted font-normal hover:text-accent transition-colors disabled:opacity-50"
                    >
                      Eliminar
                    </button>
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
