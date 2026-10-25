export const runtime = "nodejs";

import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { addSubscriber, EMAIL_RE, getSubscriber, putSubscriber, type Subscriber, type SubscriberSource } from "@/lib/subscribers";
import { rateLimit, SUBSCRIBE_RULES } from "@/lib/rate-limit";
import { canResend, isExpired, sendConfirmation } from "@/lib/confirmation";
import { defaultLocale, hasLocale } from "@/i18n/config";

const SOURCES: SubscriberSource[] = ["footer", "page"];

// Endpoint público: se apunta a la newsletter (doble opt-in). El alta queda "pendiente" y se
// envía un correo de confirmación; solo cuenta cuando la persona pulsa el enlace. Responde
// siempre igual tanto si el email es nuevo como si ya existía, para no revelar quién está apuntado.
export async function POST(req: NextRequest) {
  try {
    const limited = await rateLimit(req, "subscribe", SUBSCRIBE_RULES);
    if (!limited.ok) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again later.", code: "rate_limited" },
        { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Honeypot: un bot rellena este campo oculto; fingimos éxito sin guardar nada.
    if (typeof body.website === "string" && body.website.trim() !== "") {
      return NextResponse.json({ ok: true });
    }

    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : "";
    const source: SubscriberSource = SOURCES.includes(body.source) ? body.source : "page";
    const locale = hasLocale(body.locale) ? body.locale : defaultLocale;

    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address.", code: "invalid_email" }, { status: 400 });
    }
    if (body.consent !== true) {
      return NextResponse.json({ error: "Please accept the consent checkbox to subscribe.", code: "consent_required" }, { status: 400 });
    }

    const fresh: Subscriber = {
      email, name, consent: true, source, locale, status: "pending", createdAt: new Date().toISOString(),
      confirmNonce: randomBytes(18).toString("base64url"),
    };
    let current: Subscriber = fresh;
    if (!(await addSubscriber(fresh))) {
      const existing = await getSubscriber(email);
      if (existing) current = existing;
    }

    if (current.status === "pending") {
      if (current !== fresh && isExpired(current)) {
        // Alta caducada sin confirmar: se renueva para que el nuevo enlace valga.
        current = fresh;
        await putSubscriber(fresh);
      }
      if (canResend(current)) await sendConfirmation(current, req.nextUrl.origin);
    }
    // Ya confirmada: no se envía nada y la respuesta es idéntica.

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[subscribe]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again in a moment." },
      { status: 500 }
    );
  }
}
