export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { removeSubscriber } from "@/lib/subscribers";
import { verifyUnsubscribe } from "@/lib/unsubscribe-token";
import { rateLimit, UNSUBSCRIBE_RULES } from "@/lib/rate-limit";
import { defaultLocale } from "@/i18n/config";

// Baja de un clic (RFC 8058) para la cabecera List-Unsubscribe-Post: Gmail y Yahoo la
// llaman con un POST al pulsar "Cancelar suscripción". Debe responder 200 con página vacía.
export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, "unsubscribe", UNSUBSCRIBE_RULES);
  if (!limited.ok) return new NextResponse(null, { status: 429, headers: { "Retry-After": String(limited.retryAfter) } });

  const email = (req.nextUrl.searchParams.get("e") ?? "").trim().toLowerCase();
  const token = req.nextUrl.searchParams.get("t") ?? "";
  if (!email || !token || !verifyUnsubscribe(email, token)) return new NextResponse(null, { status: 400 });

  try {
    await removeSubscriber(email);
  } catch (err) {
    console.error("[unsubscribe one-click]", err);
    return new NextResponse(null, { status: 500 });
  }
  return new NextResponse(null, { status: 200 });
}

// Si alguien abre la URL en el navegador (GET), se le lleva a la página de baja normal.
export function GET(req: NextRequest) {
  const url = new URL(`/${defaultLocale}/unsubscribe`, req.nextUrl.origin);
  url.search = req.nextUrl.search;
  return NextResponse.redirect(url);
}
