import type { Locale } from "@/i18n/config";
import { hash } from "./kv";

export type SubscriberSource = "footer" | "page" | "comment";

// pending: se apuntó pero no ha confirmado su email (doble opt-in); no recibe la newsletter.
export type SubscriberStatus = "pending" | "confirmed";

export interface Subscriber {
  email: string;
  name: string;
  consent: true;
  source: SubscriberSource;
  // Idioma de la web en el que se apuntó (para la newsletter y los enlaces)
  locale: Locale;
  status: SubscriberStatus;
  createdAt: string;
  // Valor aleatorio que firma el enlace de confirmación (solo altas con doble opt-in)
  confirmNonce?: string;
  confirmationSentAt?: string;
  confirmedAt?: string;
}

const subscribers = () => hash("subscribers");

// Registros anteriores al doble opt-in no tienen `status`: se tratan como confirmados.
function parse(raw: string): Subscriber {
  const s = JSON.parse(raw) as Subscriber;
  return { ...s, status: s.status ?? "confirmed", locale: s.locale ?? "en" };
}

export async function getSubscriber(email: string): Promise<Subscriber | null> {
  const raw = await subscribers().get(email);
  return raw ? parse(raw) : null;
}

// Crea el registro solo si no existía. false = ya estaba.
export const addSubscriber = async (s: Subscriber) => subscribers().setNx(s.email, JSON.stringify(s));

export const putSubscriber = async (s: Subscriber) => subscribers().set(s.email, JSON.stringify(s));

export const removeSubscriber = async (email: string) => subscribers().del(email);

export async function listSubscribers(): Promise<Subscriber[]> {
  const all = await subscribers().all();
  return Object.values(all)
    .map(parse)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
