import { NextRequest, NextResponse } from "next/server";

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

export async function GET(req: NextRequest) {
  const session = req.cookies.get("admin_session")?.value;
  const secret = process.env.SESSION_SECRET;

  if (!session || !secret) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const expected = await generateToken(secret);
  if (session !== expected) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({ authenticated: true });
}
