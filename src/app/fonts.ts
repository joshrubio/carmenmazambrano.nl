import { Playfair_Display, Lora, Source_Sans_3 } from "next/font/google";

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

export const fontClassNames = `${playfair.variable} ${lora.variable} ${sourceSans.variable}`;
