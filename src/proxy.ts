import { NextRequest, NextResponse } from "next/server";
import { hasLocale, LOCALE_COOKIE, matchAcceptLanguage } from "@/i18n/config";

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

const isAdminPath = (p: string) =>
  p.startsWith("/admin") || p.startsWith("/api/admin") || p.startsWith("/contact-list");

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- Administración: sin prefijo de idioma, protegida por sesión ---
  if (isAdminPath(pathname)) {
    if (
      pathname === "/admin/login" ||
      pathname.startsWith("/api/admin/login") ||
      pathname.startsWith("/api/admin/session")
    ) {
      return NextResponse.next();
    }

    const session = req.cookies.get("admin_session")?.value;
    const secret = process.env.SESSION_SECRET;

    if (!session || !secret) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    const expected = await generateToken(secret);
    if (session !== expected) {
      const res = NextResponse.redirect(new URL("/admin/login", req.url));
      res.cookies.delete("admin_session");
      return res;
    }
    return NextResponse.next();
  }

  // --- API pública: no se toca ---
  if (pathname.startsWith("/api/")) return NextResponse.next();

  // --- Web pública: todas las rutas llevan prefijo de idioma (/es, /en, /nl) ---
  const first = pathname.split("/")[1];
  if (hasLocale(first)) return NextResponse.next();

  const cookie = req.cookies.get(LOCALE_COOKIE)?.value;
  const locale = hasLocale(cookie) ? cookie : matchAcceptLanguage(req.headers.get("accept-language"));
  const url = req.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Se excluyen los estáticos y los archivos con extensión (favicon, imágenes, etc.)
  matcher: ["/((?!_next/|images/|opengraph-image|.*\\..*).*)"],
};
