import { createHash, randomUUID } from "crypto";
import { about } from "../../content/about";
import { locales, type Locale } from "@/i18n/config";
import { getDictionary, type Dictionary } from "@/i18n/dictionaries";
import { hash } from "./kv";
import { sendBatch, siteUrl, type OutEmail } from "./email";
import { renderNewsletterEmail } from "./email-templates";
import { listSubscribers } from "./subscribers";
import { oneClickUnsubscribePath, unsubscribePath } from "./unsubscribe-token";

export type Audience = "all" | Locale;
export const AUDIENCES: Audience[] = ["all", ...locales];

export interface Recipient {
  e: string; // email
  l: Locale; // idioma de la persona (para el pie del correo y el enlace de baja)
}

// sending: en curso · partial: cortado (error o tiempo) y se puede continuar · sent: terminado
export interface Campaign {
  id: string;
  subject: string;
  body: string;
  audience: Audience;
  createdAt: string;
  status: "sending" | "partial" | "sent";
  recipients: Recipient[]; // instantánea de quién debía recibirlo
  cursor: number; // cuántos destinatarios de la lista ya se han procesado
  sent: number;
  skipped: number; // se dieron de baja entre la creación y el envío
  lastError?: string;
  finishedAt?: string;
}

export type CampaignSummary = Omit<Campaign, "recipients" | "body"> & { total: number };

const campaigns = () => hash("campaigns");
const BATCH = 100; // límite de Resend por llamada
const DUPLICATE_WINDOW_MS = 10 * 60 * 1000;

const summarize = ({ recipients, body: _body, ...rest }: Campaign): CampaignSummary => {
  void _body;
  return { ...rest, total: recipients.length };
};

async function save(c: Campaign) {
  await campaigns().set(c.id, JSON.stringify(c));
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  const raw = await campaigns().get(id);
  return raw ? (JSON.parse(raw) as Campaign) : null;
}

export async function listCampaigns(): Promise<CampaignSummary[]> {
  const all = await campaigns().all();
  return Object.values(all)
    .map((raw) => summarize(JSON.parse(raw) as Campaign))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// Solo reciben la newsletter las altas CONFIRMADAS (doble opt-in), filtradas por idioma si procede.
export async function audienceRecipients(audience: Audience): Promise<Recipient[]> {
  const subs = await listSubscribers();
  return subs
    .filter((s) => s.status === "confirmed" && (audience === "all" || s.locale === audience))
    .map((s) => ({ e: s.email, l: s.locale }));
}

export async function audienceCounts() {
  const subs = await listSubscribers();
  const confirmed = subs.filter((s) => s.status === "confirmed");
  return {
    all: confirmed.length,
    es: confirmed.filter((s) => s.locale === "es").length,
    en: confirmed.filter((s) => s.locale === "en").length,
    nl: confirmed.filter((s) => s.locale === "nl").length,
    pending: subs.length - confirmed.length,
  };
}

// Correo de una persona concreta: su idioma, su enlace de baja y las cabeceras List-Unsubscribe.
export function buildEmail(
  r: Recipient,
  c: Pick<Campaign, "subject" | "body">,
  dict: Dictionary,
  base: string,
  test = false
): OutEmail {
  const mail = renderNewsletterEmail({
    lang: r.l,
    dict,
    subject: c.subject,
    body: c.body,
    unsubscribeUrl: base + unsubscribePath(r.e, r.l),
    test,
  });
  return {
    to: r.e,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    headers: {
      "List-Unsubscribe": `<${base + oneClickUnsubscribePath(r.e)}>, <mailto:${about.email}?subject=unsubscribe>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  };
}

export class CampaignError extends Error {
  constructor(message: string, public code: string, public status = 400) {
    super(message);
  }
}

export async function createCampaign(input: { subject: string; body: string; audience: Audience }): Promise<Campaign> {
  // Salvaguarda contra el error más caro: enviar dos veces lo mismo (doble clic, recarga...).
  const now = Date.now();
  const all = await campaigns().all();
  for (const raw of Object.values(all)) {
    const c = JSON.parse(raw) as Campaign;
    if (
      c.subject === input.subject &&
      c.body === input.body &&
      c.audience === input.audience &&
      now - new Date(c.createdAt).getTime() < DUPLICATE_WINDOW_MS
    ) {
      throw new CampaignError("Ya se creó un envío idéntico hace menos de 10 minutos", "duplicate_recent", 409);
    }
  }
  const recipients = await audienceRecipients(input.audience);
  if (recipients.length === 0) throw new CampaignError("No hay personas confirmadas en esa audiencia", "no_recipients");
  const c: Campaign = {
    id: randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
    status: "sending",
    recipients,
    cursor: 0,
    sent: 0,
    skipped: 0,
  };
  await save(c);
  return c;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Envía por lotes de 100 con un presupuesto de tiempo (la función de Vercel tiene límite).
// Si se corta, queda "partial" y se puede continuar sin repetir: el cursor avanza solo tras
// cada lote enviado y cada lote lleva una clave de idempotencia.
export async function runCampaign(
  id: string,
  requestOrigin: string,
  opts: { timeBudgetMs?: number } = {}
): Promise<CampaignSummary> {
  const c = await getCampaign(id);
  if (!c) throw new CampaignError("Envío no encontrado", "not_found", 404);
  if (c.status === "sent") return summarize(c);

  const started = Date.now();
  const budget = opts.timeBudgetMs ?? 45_000;
  const base = siteUrl(requestOrigin);
  const current = new Map((await listSubscribers()).map((s) => [s.email, s]));
  const dicts = new Map<Locale, Dictionary>();
  const dictFor = async (l: Locale) => {
    if (!dicts.has(l)) dicts.set(l, await getDictionary(l));
    return dicts.get(l)!;
  };

  c.status = "sending";
  delete c.lastError;
  while (c.cursor < c.recipients.length && Date.now() - started < budget) {
    const slice = c.recipients.slice(c.cursor, c.cursor + BATCH);
    const emails: OutEmail[] = [];
    let skipped = 0;
    for (const r of slice) {
      const s = current.get(r.e);
      // Quien se dio de baja desde que se creó el envío ya no lo recibe.
      if (!s || s.status !== "confirmed") {
        skipped++;
        continue;
      }
      emails.push(buildEmail(r, c, await dictFor(r.l), base));
    }
    const key = `campaign-${c.id}-${c.cursor}-${createHash("sha1").update(emails.map((e) => e.to).join()).digest("hex").slice(0, 10)}`;
    try {
      await sendBatch(emails, key);
    } catch (err) {
      c.status = "partial";
      c.lastError = err instanceof Error ? err.message : "Error desconocido";
      await save(c);
      return summarize(c);
    }
    c.cursor += slice.length;
    c.sent += emails.length;
    c.skipped += skipped;
    await save(c);
    await sleep(150); // Resend permite ~10 peticiones por segundo
  }

  if (c.cursor >= c.recipients.length) {
    c.status = "sent";
    c.finishedAt = new Date().toISOString();
  } else {
    c.status = "partial"; // se agotó el tiempo: "Continuar envío"
  }
  await save(c);
  return summarize(c);
}
