import type { Metadata } from "next";
import { ThickRule } from "@/components/ui/ColumnDivider";
import { CommentsAdmin } from "@/components/admin/CommentsAdmin";

export const metadata: Metadata = {
  title: "Comentarios",
  robots: { index: false, follow: false },
};

// Protegida por proxy.ts: sin sesión redirige al login.
export default function AdminCommentsPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="label text-accent">Notas</span>
        <ThickRule />
      </div>
      <h1 className="font-display text-4xl font-black text-ink mb-1">Comentarios</h1>
      <p className="font-display text-lg text-muted italic font-normal mb-6">
        Se publican al verificar el correo. Aquí puedes ocultarlos o borrarlos.
      </p>
      <CommentsAdmin />
    </div>
  );
}
