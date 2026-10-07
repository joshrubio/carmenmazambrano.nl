"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { localePath } from "@/i18n/config";
import { useLocale } from "@/i18n/LocaleProvider";

// Solo se muestra con la sesión de admin iniciada.
export function DeleteArticleButton({ slug, title }: { slug: string; title: string }) {
  const router = useRouter();
  const { lang } = useLocale();
  const [authenticated, setAuthenticated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    fetch("/api/admin/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setAuthenticated(d.authenticated === true))
      .catch(() => setAuthenticated(false));
  }, []);

  async function handleDelete() {
    if (!window.confirm(`¿Borrar "${title}"?\n\nSe eliminará la nota y sus fotos. No se puede deshacer.`)) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json().catch(() => null);
      if (res.redirected) throw new Error("La sesión ha caducado. Vuelve a iniciar sesión.");
      if (!res.ok) throw new Error(data?.error ?? `Error del servidor (${res.status})`);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
      setBusy(false);
    }
  }

  if (!authenticated) return null;

  if (done) {
    return (
      <div className="border border-ink p-4 mb-8">
        <p className="font-body text-ink">
          Nota borrada. La web se actualizará en <strong>2–3 minutos</strong>.
        </p>
        <button
          onClick={() => router.push(localePath(lang, "/articles"))}
          className="label text-ink border border-ink px-4 py-2 mt-3 hover:bg-ink hover:text-inverse transition-colors"
        >
          Ir a artículos
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <button
        onClick={handleDelete}
        disabled={busy}
        className="label bg-accent text-inverse px-3 py-1 leading-none hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {busy ? "Borrando..." : "Borrar nota"}
      </button>
      {error && <p className="font-body text-sm text-accent mt-2">{error}</p>}
    </div>
  );
}
