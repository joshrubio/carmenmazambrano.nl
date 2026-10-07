export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { removeSubscriber } from "@/lib/subscribers";
import { verifyUnsubscribe } from "@/lib/unsubscribe-token";
import { rateLimit, UNSUBSCRIBE_RULES } from "@/lib/rate-limit";

// Baja pública con enlace firmado. Es idempotente: responde igual si la persona
// ya no estaba en la lista, para no revelar quién está apuntado.
export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit(req, "unsubscribe", UNSUBSCRIBE_RULES);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later.", code: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
      );
    }

    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const token = typeof body?.token === "string" ? body.token : "";
    if (!email || !token || !verifyUnsubscribe(email, token)) {
      return NextResponse.json({ error: "Invalid link", code: "invalid_link" }, { status: 400 });
    }

    await removeSubscriber(email);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[unsubscribe]", err);
    return NextResponse.json({ error: "Something went wrong.", code: "server_error" }, { status: 500 });
  }
}
