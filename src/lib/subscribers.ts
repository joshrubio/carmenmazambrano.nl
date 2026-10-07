import fs from "fs/promises";
import path from "path";

export type SubscriberSource = "footer" | "page";

export interface Subscriber {
  email: string;
  name: string;
  consent: true;
  source: SubscriberSource;
  createdAt: string;
}

interface Store {
  add(s: Subscriber): Promise<boolean>; // false si el email ya existía
  list(): Promise<Subscriber[]>;
  remove(email: string): Promise<boolean>;
}

const KEY = "subscribers";

// Producción: Redis REST (Upstash, desde el Marketplace de Vercel). Los datos de
// los suscriptores NO pueden ir al repo de GitHub porque es público.
function redisStore(url: string, token: string): Store {
  const cmd = async (args: (string | number)[]) => {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || data.error) {
      throw new Error(`Redis ${args[0]}: ${data?.error ?? res.status}`);
    }
    return data.result;
  };
  return {
    async add(s) {
      return (await cmd(["HSETNX", KEY, s.email, JSON.stringify(s)])) === 1;
    },
    async list() {
      const flat: string[] = (await cmd(["HGETALL", KEY])) ?? [];
      const out: Subscriber[] = [];
      for (let i = 1; i < flat.length; i += 2) out.push(JSON.parse(flat[i]));
      return out;
    },
    async remove(email) {
      return (await cmd(["HDEL", KEY, email])) === 1;
    },
  };
}

// Desarrollo: archivo JSON local (carpeta .data/, ignorada por git).
function fileStore(): Store {
  const file = path.resolve(process.cwd(), ".data", "subscribers.json");
  const read = async (): Promise<Record<string, Subscriber>> => {
    try {
      return JSON.parse(await fs.readFile(file, "utf8"));
    } catch {
      return {};
    }
  };
  const write = async (data: Record<string, Subscriber>) => {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
  };
  return {
    async add(s) {
      const data = await read();
      if (data[s.email]) return false;
      data[s.email] = s;
      await write(data);
      return true;
    },
    async list() {
      return Object.values(await read());
    },
    async remove(email) {
      const data = await read();
      if (!data[email]) return false;
      delete data[email];
      await write(data);
      return true;
    },
  };
}

function getStore(): Store {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (url && token) return redisStore(url, token);
  if (process.env.NODE_ENV !== "production") return fileStore();
  throw new Error("Almacén de suscriptores no configurado (faltan las variables de Redis en Vercel)");
}

export const addSubscriber = (s: Subscriber) => getStore().add(s);
export const removeSubscriber = (email: string) => getStore().remove(email);
export async function listSubscribers(): Promise<Subscriber[]> {
  const all = await getStore().list();
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
