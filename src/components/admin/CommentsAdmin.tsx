"use client";

import { useEffect, useMemo, useState } from "react";

type Status = "unverified" | "published" | "hidden";

interface Row {
  id: string;
  slug: string;
  articleTitle: string;
  name: string;
  email: string;
  body: string;
  status: Status;
  promo: boolean;
  createdAt: string;
  locale: string;
}

const dateFmt = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short" });
const STATUS_LABEL: Record<Status, string> = {
  published: "Publicado",
  hidden: "Oculto",
  unverified: "Sin verificar",
};
const FILTERS: { key: Status | "all"; label: string }[] = [
  { key: "all", label: "Todos" },
  { key: "published", label: "Publicados" },
  { key: "hidden", label: "Ocultos" },
  { key: "unverified", label: "Sin verificar" },
];

// Moderación a posteriori: los comentarios se publican al verificar el correo; aquí se pueden
// ocultar (reversible) o borrar. El correo solo lo ve la redacción.
export function CommentsAdmin() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Status | "all">("all");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    fetch("/api/admin/comments", { cache: "no-store" })
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        if (r.redirected) throw new Error("La sesión ha caducado. Vuelve a iniciar sesión.");
        if (!r.ok) throw new Error(d?.error ?? `Error del servidor (${r.status})`);
        setRows(d.comments);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Error desconocido"));
  }, []);

  const shown = useMemo(() => (rows ?? []).filter((r) => filter === "all" || r.status === filter), [rows, filter]);

  async function act(r: Row, action: "hide" | "show" | "delete") {
    if (action === "delete" && !window.confirm(`¿Borrar el comentario de ${r.name}?\n\nNo se puede deshacer.`)) return;
    setBusy(r.id);
    setError("");
    try {
      const res = await fetch("/api/admin/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, slug: r.slug, id: r.id }),
      });
      const d = await res.json().catch(() => null);
      if (!res.ok) throw new Error(d?.error ?? `Error del servidor (${res.status})`);
      setRows((cur) =>
        action === "delete"
          ? (cur?.filter((x) => x.id !== r.id) ?? null)
          : (cur?.map((x) => (x.id === r.id ? { ...x, status: action === "hide" ? "hidden" : "published" } : x)) ?? null)
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setBusy("");
    }
  }

  if (error && !rows) return <p className="font-body text-accent">{error}</p>;
  if (!rows) return <p className="font-body text-muted">Cargando...</p>;

  const count = (s: Status) => rows.filter((r) => r.status === s).length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className={`label font-normal border px-3 py-1.5 transition-colors ${
              filter === f.key ? "border-ink bg-ink text-inverse" : "border-rule text-ink hover:border-ink"
            }`}
          >
            {f.label}
            {f.key !== "all" && <span className="ml-1.5 opacity-70">{count(f.key)}</span>}
          </button>
        ))}
      </div>

      {error && (
        <p className="font-body text-sm text-accent mb-3" role="alert">
          {error}
        </p>
      )}

      {shown.length === 0 ? (
        <p className="font-body text-muted border border-rule bg-white p-6">No hay comentarios en esta vista.</p>
      ) : (
        <ul className="space-y-3">
          {shown.map((r) => (
            <li key={r.id} className="border border-rule bg-white p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-body text-sm text-ink">
                  <strong>{r.name}</strong> <span className="text-muted">· {r.email}</span>
                </p>
                <span
                  className={`label font-normal px-2 py-0.5 ${
                    r.status === "published" ? "bg-ink text-inverse" : r.status === "hidden" ? "bg-accent text-inverse" : "bg-surface text-muted"
                  }`}
                >
                  {STATUS_LABEL[r.status]}
                </span>
              </div>
              <p className="font-body text-xs text-dim mt-1">
                {dateFmt.format(new Date(r.createdAt))} · {r.locale.toUpperCase()} ·{" "}
                {r.promo ? "aceptó correos promocionales" : "sin promociones"} ·{" "}
                <a href={`/${r.locale}/articles/${r.slug}`} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-accent">
                  {r.articleTitle}
                </a>
              </p>
              <p className="font-body text-ink mt-3 whitespace-pre-wrap break-words">{r.body}</p>
              <div className="flex gap-2 mt-3">
                {r.status !== "unverified" && (
                  <button
                    type="button"
                    disabled={busy === r.id}
                    onClick={() => act(r, r.status === "hidden" ? "show" : "hide")}
                    className="label font-normal border border-ink text-ink px-3 py-1.5 hover:bg-ink hover:text-inverse transition-colors disabled:opacity-40"
                  >
                    {r.status === "hidden" ? "Volver a mostrar" : "Ocultar"}
                  </button>
                )}
                <button
                  type="button"
                  disabled={busy === r.id}
                  onClick={() => act(r, "delete")}
                  className="label font-normal border border-rule text-accent px-3 py-1.5 hover:border-accent transition-colors disabled:opacity-40"
                >
                  Borrar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
