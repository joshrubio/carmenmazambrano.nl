import type { Metadata } from "next";
import { ThickRule } from "@/components/ui/ColumnDivider";
import { SubscribersTable } from "@/components/admin/SubscribersTable";

export const metadata: Metadata = {
  title: "Suscriptores",
  robots: { index: false, follow: false },
};

// Protegida por proxy.ts: sin sesión redirige al login.
export default function ContactListPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <span className="label text-accent">Newsletter</span>
        <ThickRule />
      </div>
      <h1 className="font-display text-4xl font-black text-ink mb-1">Suscriptores</h1>
      <p className="font-display text-lg text-muted italic font-normal mb-6">
        Personas que se han apuntado a la newsletter.
      </p>
      <SubscribersTable />
    </div>
  );
}
