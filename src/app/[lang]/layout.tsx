import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../globals.css";
import { fontClassNames } from "../fonts";
import { Masthead } from "@/components/ui/Masthead";
import { Footer } from "@/components/ui/Footer";
import { AdminShell } from "@/components/admin/AdminShell";
import { NewsletterSection } from "@/components/newsletter/NewsletterSection";
import { hasLocale, locales } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { LocaleProvider } from "@/i18n/LocaleProvider";

interface Props {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}

// Los 3 idiomas se generan en el build: todo se sirve estático desde la CDN.
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: Pick<Props, "params">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const dict = await getDictionary(lang);
  return {
    title: { default: dict.meta.siteTitle, template: dict.meta.titleTemplate },
    description: dict.meta.description,
    metadataBase: new URL("https://carmenzambrano.nl"),
    openGraph: {
      locale: dict.meta.ogLocale,
      alternateLocale: locales.filter((l) => l !== lang).map((l) => ({ es: "es_ES", en: "en_GB", nl: "nl_NL" })[l]),
    },
  };
}

export default async function RootLayout({ children, params }: Props) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <html lang={lang} className={fontClassNames}>
      <body className="bg-paper text-ink min-h-screen flex flex-col antialiased font-ui">
        <LocaleProvider lang={lang} client={dict.client} categories={dict.categories}>
          <Masthead lang={lang} dict={dict} />
          <AdminShell lang={lang}>
            <main className="flex-1 min-w-0 max-w-6xl mx-auto w-full px-4 py-8">{children}</main>
          </AdminShell>
          <NewsletterSection
            label={dict.newsletter.bandLabel}
            title={dict.newsletter.bandTitle}
            text={dict.newsletter.bandText}
          />
          <Footer lang={lang} dict={dict} />
        </LocaleProvider>
      </body>
    </html>
  );
}
