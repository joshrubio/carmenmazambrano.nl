export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { buildEmail } from "@/lib/campaigns";
import { emailMode, sendEmail, siteUrl } from "@/lib/email";
import { EMAIL_RE } from "@/lib/subscribers";
import { defaultLocale, hasLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";

// Correo de prueba a una dirección concreta (no toca la lista de suscriptores).
export async function POST(req: NextRequest) {
  try {
    const { subject, body, to, lang } = await req.json();
    const email = typeof to === "string" ? to.trim().toLowerCase() : "";
    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Email de prueba no válido" }, { status: 400 });
    if (typeof subject !== "string" || !subject.trim() || typeof body !== "string" || !body.trim()) {
      return NextResponse.json({ error: "Escribe un asunto y un texto" }, { status: 400 });
    }
    const locale = hasLocale(lang) ? lang : defaultLocale;
    const mail = buildEmail(
      { e: email, l: locale },
      { subject: subject.trim(), body },
      await getDictionary(locale),
      siteUrl(req.nextUrl.origin),
      true
    );
    await sendEmail(mail);
    return NextResponse.json({ ok: true, mode: emailMode() });
  } catch (err) {
    console.error("[newsletter test]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error desconocido" }, { status: 500 });
  }
}
