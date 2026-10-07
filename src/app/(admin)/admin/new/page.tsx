"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { slugify } from "@/lib/slug";
import { compressImage } from "@/lib/compress-image";

const CATEGORIES = ["Cultuur", "Rotterdam", "Nederland", "Politiek", "Onderwijs", "Gemeenschap", "Kunst"];

type Status = "idle" | "loading" | "success" | "error";

// Las respuestas de error de la plataforma (413, 504...) no son JSON, así que
// se traducen aquí a un mensaje comprensible en vez de un fallo genérico.
async function postJson(url: string, init: RequestInit) {
  let res: Response;
  try {
    res = await fetch(url, { method: "POST", ...init });
  } catch {
    throw new Error("No se pudo conectar con el servidor. Revisa tu conexión a internet.");
  }
  const data = await res.json().catch(() => null);
  if (res.redirected) throw new Error("La sesión ha caducado. Vuelve a iniciar sesión.");
  if (res.ok && data) return data;
  if (data?.error) throw new Error(data.error);
  if (res.status === 401 || res.status === 403) throw new Error("La sesión ha caducado. Vuelve a iniciar sesión.");
  if (res.status === 413) throw new Error("Una de las fotos pesa demasiado. Prueba con una más pequeña.");
  if (res.status === 504) throw new Error("El servidor tardó demasiado en responder. Inténtalo de nuevo.");
  throw new Error(`Error del servidor (${res.status})`);
}

export default function NewArticlePage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [publishedSlug, setPublishedSlug] = useState("");
  const [progress, setProgress] = useState("");

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[1]);
  const [language, setLanguage] = useState("nl");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [excerpt, setExcerpt] = useState("");
  const [body, setBody] = useState("");
  const [pullquote, setPullquote] = useState("");
  const [linkedin, setLinkedin] = useState("");

  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  const coverRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  function handleCover(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setCoverFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setCoverPreview(url);
    } else {
      setCoverPreview(null);
    }
  }

  function handleGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setGalleryFiles(files);
    setGalleryPreviews(files.map((f) => URL.createObjectURL(f)));
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");

    try {
      const slug = slugify(title);
      const total = (coverFile ? 1 : 0) + galleryFiles.length;
      let done = 0;
      const progress = () => setProgress(total ? `Subiendo fotos (${done}/${total})...` : "Publicando...");
      progress();

      const upload = async (file: File, name: string) => {
        const small = await compressImage(file);
        const fd = new FormData();
        fd.append("file", small);
        fd.append("slug", slug);
        fd.append("name", name);
        const data = await postJson("/api/admin/upload-image", { body: fd });
        done++;
        progress();
        return data.src as string;
      };

      const coverImage = coverFile ? await upload(coverFile, "cover") : undefined;
      const galleryImages: { src: string; alt: string }[] = [];
      for (let i = 0; i < galleryFiles.length; i++) {
        const src = await upload(galleryFiles[i], String(i + 1));
        galleryImages.push({ src, alt: `${title} — foto ${i + 1}` });
      }

      setProgress("Publicando...");
      const data = await postJson("/api/admin/publish", {
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, subtitle, category, language, date, excerpt, body, pullquote, linkedin,
          coverImage, galleryImages,
        }),
      });
      setStatus("success");
      setPublishedSlug(data.slug);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Error desconocido");
    }
  }

  if (status === "success") {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="border-b-2 border-accent pb-4 mb-6">
            <p className="font-display text-5xl mb-2">✓</p>
            <h1 className="font-display text-3xl font-black text-ink">¡Nota publicada!</h1>
          </div>
          <p className="font-body text-muted mb-2">
            La web se actualizará automáticamente en <strong>2–3 minutos</strong>.
          </p>
          <p className="label text-dim font-normal normal-case tracking-wide mb-8">
            Slug: {publishedSlug}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setStatus("idle");
                setTitle(""); setSubtitle(""); setExcerpt(""); setBody("");
                setPullquote(""); setLinkedin(""); setCoverFile(null);
                setCoverPreview(null); setGalleryFiles([]); setGalleryPreviews([]);
              }}
              className="label bg-ink text-inverse py-3 hover:bg-accent transition-colors"
            >
              Publicar otra nota
            </button>
            <Link
              href="/"
              className="label text-ink border border-ink py-3 hover:bg-ink hover:text-inverse transition-colors block text-center"
            >
              Ver la web
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="border-b-2 border-ink px-6 py-4 flex items-center justify-between">
        <div>
          <p className="label text-accent mb-0.5">Carmen Zambrano</p>
          <h1 className="font-display text-xl font-black text-ink leading-none">Nueva nota de prensa</h1>
        </div>
        <button
          onClick={handleLogout}
          className="label text-muted font-normal hover:text-ink transition-colors"
        >
          Cerrar sesión
        </button>
      </div>

      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Título */}
        <div>
          <label className="label text-accent block mb-2">Título *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-rule bg-white px-4 py-3 font-display text-xl text-ink focus:outline-none focus:border-ink"
            placeholder="El título de la nota de prensa"
            required
          />
        </div>

        {/* Subtítulo */}
        <div>
          <label className="label text-muted block mb-2">Subtítulo (opcional)</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="w-full border border-rule bg-white px-4 py-3 font-body text-ink focus:outline-none focus:border-ink"
            placeholder="Una línea complementaria al título"
          />
        </div>

        {/* Idioma de la nota */}
        <div>
          <label className="label text-accent block mb-2">Idioma en el que está escrita la nota *</label>
          <p className="font-body text-xs text-dim mb-2">
            La web se ve en español, inglés y neerlandés, pero cada nota se publica en un solo idioma:
            el navegador de quien la lea podrá ofrecer traducirla.
          </p>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full border border-rule bg-white px-4 py-3 font-body text-ink focus:outline-none focus:border-ink"
            required
          >
            <option value="nl">Neerlandés (Nederlands)</option>
            <option value="es">Español</option>
            <option value="en">Inglés (English)</option>
          </select>
        </div>

        {/* Categoría y fecha */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label text-accent block mb-2">Categoría *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-rule bg-white px-4 py-3 font-body text-ink focus:outline-none focus:border-ink"
              required
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label text-accent block mb-2">Fecha *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-rule bg-white px-4 py-3 font-body text-ink focus:outline-none focus:border-ink"
              required
            />
          </div>
        </div>

        {/* Extracto */}
        <div>
          <label className="label text-accent block mb-2">Extracto / Samenvatting *</label>
          <p className="font-body text-xs text-dim mb-2">
            Resumen breve que aparece en las tarjetas de la web (1–2 frases).
          </p>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            className="w-full border border-rule bg-white px-4 py-3 font-body text-ink focus:outline-none focus:border-ink resize-none"
            placeholder="Breve descripción del artículo para la portada..."
            required
          />
        </div>

        {/* Imagen principal */}
        <div>
          <label className="label text-accent block mb-2">Imagen principal</label>
          <div
            onClick={() => coverRef.current?.click()}
            className="border-2 border-dashed border-rule hover:border-ink transition-colors cursor-pointer bg-white"
          >
            {coverPreview ? (
              <div className="relative w-full h-48">
                <Image src={coverPreview} alt="Preview" fill className="object-cover" />
              </div>
            ) : (
              <div className="py-10 text-center">
                <p className="font-body text-muted text-sm">Haz clic para seleccionar una foto</p>
                <p className="label text-dim font-normal normal-case tracking-wide mt-1">JPG, PNG o WEBP</p>
              </div>
            )}
          </div>
          <input
            ref={coverRef}
            type="file"
            accept="image/*"
            onChange={handleCover}
            className="hidden"
          />
          {coverPreview && (
            <button
              type="button"
              onClick={() => { setCoverFile(null); setCoverPreview(null); if (coverRef.current) coverRef.current.value = ""; }}
              className="label text-muted font-normal mt-2 hover:text-accent transition-colors"
            >
              Eliminar imagen
            </button>
          )}
        </div>

        {/* Texto del artículo */}
        <div>
          <label className="label text-accent block mb-2">Texto del artículo *</label>
          <p className="font-body text-xs text-dim mb-2">
            Separa los párrafos con una línea en blanco. Para títulos de sección escribe{" "}
            <code className="bg-surface px-1">## </code> al inicio de la línea.
          </p>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={16}
            className="w-full border border-rule bg-white px-4 py-3 font-body text-ink focus:outline-none focus:border-ink resize-y"
            placeholder={"Primer párrafo del artículo...\n\nSegundo párrafo...\n\n## Título de sección\n\nTexto después del título..."}
            required
          />
        </div>

        {/* Cita destacada */}
        <div>
          <label className="label text-muted block mb-2">Cita destacada (opcional)</label>
          <input
            type="text"
            value={pullquote}
            onChange={(e) => setPullquote(e.target.value)}
            className="w-full border border-rule bg-white px-4 py-3 font-display italic text-ink focus:outline-none focus:border-ink"
            placeholder="Una frase importante del artículo..."
          />
        </div>

        {/* Galería */}
        <div>
          <label className="label text-muted block mb-2">Galería de fotos (opcional)</label>
          <div
            onClick={() => galleryRef.current?.click()}
            className="border-2 border-dashed border-rule hover:border-ink transition-colors cursor-pointer bg-white py-6 text-center"
          >
            <p className="font-body text-muted text-sm">Haz clic para seleccionar varias fotos</p>
            <p className="label text-dim font-normal normal-case tracking-wide mt-1">Puedes seleccionar múltiples archivos a la vez</p>
          </div>
          <input
            ref={galleryRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleGallery}
            className="hidden"
          />
          {galleryPreviews.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-3">
              {galleryPreviews.map((src, i) => (
                <div key={i} className="relative aspect-square overflow-hidden bg-surface">
                  <Image src={src} alt={`Gallery ${i + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
          {galleryFiles.length > 0 && (
            <button
              type="button"
              onClick={() => { setGalleryFiles([]); setGalleryPreviews([]); if (galleryRef.current) galleryRef.current.value = ""; }}
              className="label text-muted font-normal mt-2 hover:text-accent transition-colors"
            >
              Eliminar galería ({galleryFiles.length} fotos)
            </button>
          )}
        </div>

        {/* LinkedIn */}
        <div>
          <label className="label text-muted block mb-2">Link de LinkedIn (opcional)</label>
          <input
            type="url"
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            className="w-full border border-rule bg-white px-4 py-3 font-body text-sm text-ink focus:outline-none focus:border-ink"
            placeholder="https://www.linkedin.com/posts/..."
          />
        </div>

        {/* Error */}
        {status === "error" && (
          <div className="border border-accent bg-white px-4 py-3">
            <p className="font-body text-sm text-accent">{errorMsg}</p>
          </div>
        )}

        {/* Submit */}
        <div className="border-t border-rule pt-6">
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full label bg-accent text-inverse py-4 text-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "loading" ? (progress || "Publicando...") : "Publicar nota de prensa"}
          </button>
        </div>

      </form>
    </div>
  );
}
