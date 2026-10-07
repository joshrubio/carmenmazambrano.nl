import fs from "fs/promises";
import path from "path";

// Almacenamiento del repositorio: GitHub en producción; con
// PUBLISH_MODE=local (solo en desarrollo) escribe directamente en el disco,
// para probar el flujo de publicación sin tocar GitHub ni Vercel.
const GH_API = "https://api.github.com";
const owner = () => process.env.GITHUB_OWNER!;
const repo = () => process.env.GITHUB_REPO!;
const branch = () => process.env.GITHUB_BRANCH ?? "master";

const isLocal = () =>
  process.env.PUBLISH_MODE === "local" && process.env.NODE_ENV !== "production";

const localPath = (p: string) => {
  const root = process.cwd();
  const full = path.resolve(root, p);
  if (!full.startsWith(root + path.sep)) throw new Error(`Ruta no permitida: ${p}`);
  return full;
};

function ghHeaders() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN!}`,
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

export async function ghGet(p: string): Promise<{ content: string; sha: string }> {
  if (isLocal()) {
    const data = await fs.readFile(localPath(p));
    return { content: data.toString("base64"), sha: "local" };
  }
  const res = await fetch(
    `${GH_API}/repos/${owner()}/${repo()}/contents/${p}?ref=${branch()}`,
    { headers: ghHeaders(), cache: "no-store" }
  );
  if (!res.ok) throw new Error(`GitHub GET ${p}: ${res.status}`);
  return res.json();
}

async function ghPut(p: string, data: Buffer, message: string, sha?: string) {
  if (isLocal()) {
    const full = localPath(p);
    await fs.mkdir(path.dirname(full), { recursive: true });
    await fs.writeFile(full, data);
    return;
  }
  const body: Record<string, string> = { message, content: data.toString("base64"), branch: branch() };
  if (sha) body.sha = sha;
  const res = await fetch(`${GH_API}/repos/${owner()}/${repo()}/contents/${p}`, {
    method: "PUT",
    headers: ghHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`GitHub PUT ${p}: ${res.status} ${await res.text()}`);
}

export function ghPutText(p: string, text: string, message: string, sha?: string) {
  return ghPut(p, Buffer.from(text, "utf8"), message, sha);
}

export async function ghPutBinary(p: string, data: Buffer, message: string) {
  let sha: string | undefined;
  try {
    sha = (await ghGet(p)).sha;
  } catch {}
  return ghPut(p, data, message, sha);
}
