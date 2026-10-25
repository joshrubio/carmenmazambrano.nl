export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { renderNewsletterEmail } from "@/lib/email-templates";
import { siteUrl } from "@/lib/email";
import { defaultLocale, hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

// Vista previa del correo tal y como lo verá quien lo reciba (protegido por proxy.ts).
export async function POST(req: NextRequest) {
  try {
    const { subject, body, lang } = await req.json();
    const locale = hasLocale(lang) ? lang : defaultLocale;
    const mail = renderNewsletterEmail({
      lang: locale,
      dict: await getDictionary(locale),
      subject: typeof subject === "string" && subject.trim() ? subject.trim() : "(sin asunto)",
      body: typeof body === "string" ? body : "",
      unsubscribeUrl: `${siteUrl(req.nextUrl.origin)}/${locale}/unsubscribe`,
    });
    return NextResponse.json({ html: mail.html, text: mail.text });
  } catch (err) {
    console.error("[newsletter preview]", err);
    return NextResponse.json({ error: "No se pudo generar la vista previa" }, { status: 500 });
  }
}
