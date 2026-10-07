import { NextRequest, NextResponse } from "next/server";
import { rateLimit, LOGIN_RULES } from "@/lib/rate-limit";

async function generateToken(secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode("admin-session"));
  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit(req, "login", LOGIN_RULES);
  if (!limited.ok) {
    return NextResponse.json(
      { error: `Demasiados intentos. Inténtalo de nuevo en ${Math.ceil(limited.retryAfter / 60)} min.` },
      { status: 429, headers: { "Retry-After": String(limited.retryAfter) } }
    );
  }

  const { password } = await req.json();

  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Contraseña incorrecta" }, { status: 401 });
  }

  const secret = process.env.SESSION_SECRET!;
  const token = await generateToken(secret);

  const res = NextResponse.json({ ok: true });
  res.cookies.set("admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}
