import { createHash } from "crypto";

export interface Rule {
  limit: number;
  windowSec: number;
}

export interface RateResult {
  ok: boolean;
  retryAfter: number; // segundos hasta poder reintentar (0 si ok)
}

// Contador de ventana fija por clave. Con Redis (el mismo que usa la lista de
// suscriptores) el límite es compartido entre todas las instancias serverless;
// sin Redis cae a memoria, que sirve en desarrollo pero es solo por instancia.
const redisUrl = () => process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const redisToken = () => process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;

const memory: Map<string, { count: number; resetAt: number }> =
  ((globalThis as Record<string, unknown>).__rateLimitMemory as Map<string, { count: number; resetAt: number }>) ??
  ((globalThis as Record<string, unknown>).__rateLimitMemory = new Map());

async function hitRedis(url: string, token: string, key: string, rule: Rule) {
  // SET NX crea el contador con caducidad solo si no existe; INCR lo incrementa.
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify([
      ["SET", key, 0, "EX", rule.windowSec, "NX"],
      ["INCR", key],
      ["TTL", key],
    ]),
    cache: "no-store",
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !Array.isArray(data) || data.some((d) => d?.error)) {
    throw new Error(`Redis pipeline: ${res.status}`);
  }
  return { count: Number(data[1].result), ttl: Number(data[2].result) };
}

function hitMemory(key: string, rule: Rule) {
  const now = Date.now();
  let entry = memory.get(key);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + rule.windowSec * 1000 };
    memory.set(key, entry);
  }
  entry.count++;
  return { count: entry.count, ttl: Math.ceil((entry.resetAt - now) / 1000) };
}

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}

// Comprueba todas las reglas para (bucket, ip). Se guarda un hash de la IP,
// nunca la IP en claro. Si Redis falla se deja pasar (mejor que bloquear altas
// legítimas por una caída del limitador) y se registra el error.
export async function rateLimit(req: Request, bucket: string, rules: Rule[]): Promise<RateResult> {
  const ip = createHash("sha256").update(clientIp(req)).digest("hex").slice(0, 16);
  const url = redisUrl();
  const token = redisToken();
  let retryAfter = 0;
  for (const rule of rules) {
    const key = `rl:${bucket}:${rule.windowSec}:${ip}`;
    try {
      const { count, ttl } = url && token ? await hitRedis(url, token, key, rule) : hitMemory(key, rule);
      if (count > rule.limit) retryAfter = Math.max(retryAfter, ttl > 0 ? ttl : rule.windowSec);
    } catch (err) {
      console.error("[rate-limit]", err);
    }
  }
  return { ok: retryAfter === 0, retryAfter };
}

export const SUBSCRIBE_RULES: Rule[] = [
  { limit: 5, windowSec: 10 * 60 },
  { limit: 20, windowSec: 24 * 60 * 60 },
];
export const LOGIN_RULES: Rule[] = [{ limit: 10, windowSec: 15 * 60 }];
