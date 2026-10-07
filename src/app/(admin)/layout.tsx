import type { Metadata } from "next";
import "../globals.css";
import { fontClassNames } from "../fonts";
import { Masthead } from "@/components/ui/Masthead";
import { Footer } from "@/components/ui/Footer";
import { AdminShell } from "@/components/admin/AdminShell";
import { getDictionary } from "@/i18n/dictionaries";

// Raíz independiente para el panel de administración: sin prefijo de idioma,
// siempre en español y fuera de los buscadores.
export const metadata: Metadata = {
  title: { default: "Panel | Carmen Zambrano", template: "%s | Carmen Zambrano" },
  robots: { index: false, follow: false },
};

export default async function AdminRootLayout({ children }: { children: React.ReactNode }) {
  const dict = await getDictionary("es");

  return (
    <html lang="es" className={fontClassNames}>
      <body className="bg-paper text-ink min-h-screen flex flex-col antialiased font-ui">
        <Masthead lang="es" dict={dict} />
        <AdminShell lang="es">
          <main className="flex-1 min-w-0 max-w-6xl mx-auto w-full px-4 py-8">{children}</main>
        </AdminShell>
        <Footer lang="es" dict={dict} />
      </body>
    </html>
  );
}
