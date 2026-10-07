export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { addSubscriber, EMAIL_RE, type SubscriberSource } from "@/lib/subscribers";
import { rateLimit, SUBSCRIBE_RULES } from "@/lib/rate-limit";

const SOURCES: SubscriberSource[] = ["footer", "page"];

// Endpoint público: se apunta a la newsletter. Siempre responde igual tanto si
// el email es nuevo como si ya existía, para no revelar quién está apuntado.
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

    if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (body.consent !== true) {
      return NextResponse.json({ error: "Please accept the consent checkbox to subscribe." }, { status: 400 });
    }

    await addSubscriber({ email, name, consent: true, source, createdAt: new Date().toISOString() });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[subscribe]", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again in a moment." },
      { status: 500 }
    );
  }
}
