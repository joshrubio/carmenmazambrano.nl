import fs from "fs/promises";
import path from "path";

// Almacén clave-valor tipo "hash" (como un Redis HASH): un nombre y, dentro, campo -> texto.
// Producción: Redis REST (Upstash vía Marketplace de Vercel). Desarrollo: archivo JSON en
// .data/ (ignorado por git). Los datos personales NO pueden ir al repo público de GitHub.
export interface Hash {
  get(field: string): Promise<string | null>;
  set(field: string, value: string): Promise<void>;
  setNx(field: string, value: string): Promise<boolean>; // false si ya existía
  del(field: string): Promise<boolean>;
  all(): Promise<Record<string, string>>;
}

function redisHash(url: string, token: string, name: string): Hash {
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
    async get(field) {
      return (await cmd(["HGET", name, field])) ?? null;
    },
    async set(field, value) {
      await cmd(["HSET", name, field, value]);
    },
    async setNx(field, value) {
      return (await cmd(["HSETNX", name, field, value])) === 1;
    },
    async del(field) {
      return (await cmd(["HDEL", name, field])) === 1;
    },
    async all() {
      const flat: string[] = (await cmd(["HGETALL", name])) ?? [];
      const out: Record<string, string> = {};
      for (let i = 0; i < flat.length; i += 2) out[flat[i]] = flat[i + 1];
      return out;
    },
  };
}

function fileHash(name: string): Hash {
  const file = path.resolve(process.cwd(), ".data", `${name}.json`);
  const read = async (): Promise<Record<string, string>> => {
    try {
      return JSON.parse(await fs.readFile(file, "utf8"));
    } catch {
      return {};
    }
  };
  const write = async (data: Record<string, string>) => {
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.writeFile(file, JSON.stringify(data, null, 2), "utf8");
  };
  return {
    async get(field) {
      return (await read())[field] ?? null;
    },
    async set(field, value) {
      const data = await read();
      data[field] = value;
      await write(data);
    },
    async setNx(field, value) {
      const data = await read();
      if (field in data) return false;
      data[field] = value;
      await write(data);
      return true;
    },
    async del(field) {
      const data = await read();
      if (!(field in data)) return false;
      delete data[field];
      await write(data);
      return true;
    },
    all: read,
  };
}

export function hash(name: string): Hash {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  if (url && token) return redisHash(url, token, name);
  if (process.env.NODE_ENV !== "production") return fileHash(name);
  throw new Error("Almacén de datos no configurado (faltan las variables de Redis en Vercel)");
}
