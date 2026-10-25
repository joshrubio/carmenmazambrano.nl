export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { audienceCounts, listCampaigns } from "@/lib/campaigns";
import { emailMode } from "@/lib/email";

// Historial de envíos + cuánta gente hay en cada audiencia (protegido por proxy.ts).
export async function GET() {
  try {
    let mode: string;
    try {
      mode = emailMode();
    } catch {
      mode = "unconfigured";
    }
    return NextResponse.json({ campaigns: await listCampaigns(), audience: await audienceCounts(), mode });
  } catch (err) {
    console.error("[newsletter campaigns]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error desconocido" }, { status: 500 });
  }
}
