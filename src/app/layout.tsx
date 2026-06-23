import type { Metadata } from "next";
import { Playfair_Display, Lora, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { Masthead } from "@/components/ui/Masthead";
import { Footer } from "@/components/ui/Footer";

// Variable names intentionally different from @theme font tokens
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["400", "700", "900"],
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
  weight: ["300", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Carmen Zambrano — Social Communicator & Journalist",
    template: "%s | Carmen Zambrano",
  },
  description:
    "Social Communicator with over 30 years of experience in press, governmental, and corporate journalism. Based in Rotterdam, Netherlands.",
  metadataBase: new URL("https://carmenzambrano.nl"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${lora.variable} ${sourceSans.variable}`}
    >
      <body className="bg-paper text-ink min-h-screen flex flex-col antialiased font-ui">
        <Masthead />
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
