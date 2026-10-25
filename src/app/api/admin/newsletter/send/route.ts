export const runtime = "nodejs";
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { AUDIENCES, CampaignError, createCampaign, runCampaign, type Audience } from "@/lib/campaigns";

// Crea y envía una campaña, o continúa una cortada (campaignId). Protegido por proxy.ts.
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    let id: string;
    if (typeof data.campaignId === "string" && data.campaignId) {
      id = data.campaignId;
    } else {
      const subject = typeof data.subject === "string" ? data.subject.trim() : "";
      const body = typeof data.body === "string" ? data.body.trim() : "";
      const audience = data.audience as Audience;
      if (!subject || subject.length > 200) throw new CampaignError("El asunto es obligatorio (máx. 200 caracteres)", "invalid_subject");
      if (!body || body.length > 50000) throw new CampaignError("El texto es obligatorio", "invalid_body");
      if (!AUDIENCES.includes(audience)) throw new CampaignError("Audiencia no válida", "invalid_audience");
      id = (await createCampaign({ subject, body, audience })).id;
    }

    const budget = Number(process.env.SEND_TIME_BUDGET_MS) || undefined; // solo para pruebas
    return NextResponse.json({ ok: true, campaign: await runCampaign(id, req.nextUrl.origin, { timeBudgetMs: budget }) });
  } catch (err) {
    if (err instanceof CampaignError) {
      return NextResponse.json({ error: err.message, code: err.code }, { status: err.status });
    }
    console.error("[newsletter send]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Error desconocido" }, { status: 500 });
  }
}
