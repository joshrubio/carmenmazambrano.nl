export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { getSubscriber, putSubscriber, removeSubscriber } from "@/lib/subscribers";
import { verifyConfirm } from "@/lib/unsubscribe-token";
import { isExpired } from "@/lib/confirmation";
import { rateLimit, CONFIRM_RULES } from "@/lib/rate-limit";

// Confirma el alta (doble opt-in). Se llama con POST desde la página de confirmación,
// no al abrir el enlace, para que los escáneres de correo no confirmen altas sin querer.
export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit(req, "confirm", CONFIRM_RULES);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later.", code: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
      );
    }

    const body = await req.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const token = typeof body?.token === "string" ? body.token : "";
    const sub = email ? await getSubscriber(email) : null;
    if (!sub || !token || !verifyConfirm(email, sub.confirmNonce ?? "", token)) {
      return NextResponse.json({ error: "Invalid link", code: "invalid_link" }, { status: 400 });
    }

    if (sub.status === "confirmed") return NextResponse.json({ ok: true, already: true });

    if (isExpired(sub)) {
      await removeSubscriber(email); // se limpia para que pueda volver a apuntarse
      return NextResponse.json({ error: "Link expired", code: "expired" }, { status: 410 });
    }

    await putSubscriber({ ...sub, status: "confirmed", confirmedAt: new Date().toISOString() });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[confirm]", err);
    return NextResponse.json({ error: "Something went wrong.", code: "server_error" }, { status: 500 });
  }
}
