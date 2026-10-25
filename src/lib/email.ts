import fs from "fs/promises";
import path from "path";
import { about } from "../../content/about";

export interface OutEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  headers?: Record<string, string>;
}

export class EmailError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

// Con RESEND_API_KEY se envía de verdad por Resend. Sin clave y fuera de producción
// los correos NO se envían: se guardan en .data/outbox/ para poder revisarlos en local.
// En producción sin clave falla con un error claro.
export function emailMode(): "resend" | "dry-run" {
  if (process.env.RESEND_API_KEY) return "resend";
  if (process.env.NODE_ENV !== "production") return "dry-run";
  throw new EmailError("Envío de email no configurado: falta RESEND_API_KEY en Vercel");
}

const apiUrl = () => (process.env.RESEND_API_URL ?? "https://api.resend.com").replace(/\/$/, "");

function from(): string {
  const f = process.env.EMAIL_FROM;
  if (f) return f;
  if (process.env.NODE_ENV !== "production") return "Carmen Zambrano <newsletter@carmenzambrano.nl>";
  throw new EmailError("Falta EMAIL_FROM en Vercel (por ejemplo: Carmen Zambrano <hola@carmenzambrano.nl>)");
}

// URL pública del sitio para los enlaces de los correos. SITE_URL manda; si no está,
// se usa el origen de la petición (útil en local y mientras el dominio no esté conectado).
export const siteUrl = (requestOrigin: string) => (process.env.SITE_URL ?? requestOrigin).replace(/\/$/, "");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function resendFetch(endpoint: string, body: unknown, idempotencyKey?: string): Promise<unknown> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${apiUrl()}${endpoint}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey.slice(0, 256) } : {}),
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await res.json().catch(() => null);
    if (res.ok) return data;
    // Límite de peticiones: se espera lo que indique Resend (máx. 5 s) y se reintenta.
    if (res.status === 429 && attempt < 3) {
      await sleep(Math.min(Number(res.headers.get("retry-after")) || 1, 5) * 1000);
      continue;
    }
    throw new EmailError(`Resend ${res.status}: ${data?.message ?? data?.name ?? "error"}`, res.status);
  }
}

const payload = (e: OutEmail) => ({
  from: from(),
  to: [e.to],
  subject: e.subject,
  html: e.html,
  text: e.text,
  reply_to: process.env.EMAIL_REPLY_TO ?? about.email,
  ...(e.headers ? { headers: e.headers } : {}),
});

async function writeOutbox(emails: OutEmail[]) {
  const dir = path.resolve(process.cwd(), ".data", "outbox");
  await fs.mkdir(dir, { recursive: true });
  const stamp = Date.now();
  const ids: string[] = [];
  for (const [i, e] of emails.entries()) {
    const id = `dry-${stamp}-${i}`;
    const safeTo = e.to.replace(/[^a-z0-9@.-]/gi, "_");
    await fs.writeFile(path.join(dir, `${id}-${safeTo}.json`), JSON.stringify({ from: from(), ...e }, null, 2), "utf8");
    ids.push(id);
  }
  return ids;
}

export async function sendEmail(email: OutEmail, idempotencyKey?: string): Promise<string> {
  if (emailMode() === "dry-run") return (await writeOutbox([email]))[0];
  const data = (await resendFetch("/emails", payload(email), idempotencyKey)) as { id?: string };
  return data?.id ?? "";
}

// Hasta 100 correos por llamada (límite de Resend). La clave de idempotencia hace que
// repetir la misma llamada tras un corte NO envíe los correos dos veces (válida 24 h).
export async function sendBatch(emails: OutEmail[], idempotencyKey: string): Promise<string[]> {
  if (emails.length === 0) return [];
  if (emails.length > 100) throw new EmailError("Un lote no puede superar los 100 correos");
  if (emailMode() === "dry-run") return writeOutbox(emails);
  const data = (await resendFetch("/emails/batch", emails.map(payload), idempotencyKey)) as {
    data?: { id: string }[];
  };
  return (data?.data ?? []).map((d) => d.id);
}
