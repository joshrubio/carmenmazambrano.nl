import type { Metadata } from "next";
import { Playfair_Display, Source_Sans_3 } from "next/font/google";
import "./globals.css";
import { Masthead } from "@/components/ui/Masthead";
import { Footer } from "@/components/ui/Footer";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
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
    <html lang="en" className={`${playfair.variable} ${sourceSans.variable}`}>
      <body className="bg-[#FAF7F0] text-[#1A1A1A] min-h-screen flex flex-col antialiased">
        <Masthead />
        <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
