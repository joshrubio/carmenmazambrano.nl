export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { listSubscribers, removeSubscriber, type Subscriber } from "@/lib/subscribers";

// Protegido por proxy.ts (todo /api/admin exige sesión).

// Evita que Excel/Sheets interpreten una celda como fórmula (CSV injection).
function csvCell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

function toCsv(subs: Subscriber[]) {
  const rows = [["name", "email", "source", "subscribed_at"]];
  for (const s of subs) rows.push([s.name, s.email, s.source, s.createdAt]);
  return rows.map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

export async function GET(req: NextRequest) {
  try {
    const subscribers = await listSubscribers();
    if (req.nextUrl.searchParams.get("format") === "csv") {
      return new NextResponse(toCsv(subscribers), {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="suscriptores-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }
    return NextResponse.json({ subscribers, total: subscribers.length });
  } catch (err) {
    console.error("[subscribers GET]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string };
    if (!email) return NextResponse.json({ error: "Falta el email" }, { status: 400 });
    const removed = await removeSubscriber(email.trim().toLowerCase());
    if (!removed) return NextResponse.json({ error: "No se encontró ese suscriptor" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[subscribers DELETE]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    );
  }
}
