// Servidores falsos para los tests de extremo a extremo: Redis REST (Upstash) y Resend.
import http from "node:http";

const readBody = (req) =>
  new Promise((resolve) => {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => resolve(body));
  });

// --- Redis REST: HGET / HSET / HSETNX / HDEL / HGETALL por nombre de hash + /pipeline (rate limit) ---
export async function startMockRedis(port = 3199, token = "test") {
  const hashes = new Map();
  const counters = new Map();
  const calls = [];
  const hash = (name) => {
    if (!hashes.has(name)) hashes.set(name, new Map());
    return hashes.get(name);
  };
  const server = http.createServer(async (req, res) => {
    const body = await readBody(req);
    res.setHeader("Content-Type", "application/json");
    if (req.headers.authorization !== `Bearer ${token}`) {
      res.statusCode = 401;
      return res.end(JSON.stringify({ error: "WRONGPASS" }));
    }
    if (req.url === "/pipeline") {
      const now = Date.now();
      const out = JSON.parse(body).map(([c, key, a, , d, e]) => {
        const cur = counters.get(key);
        const alive = cur && cur.expiresAt > now;
        if (c === "SET") {
          if (e === "NX" && alive) return { result: null };
          counters.set(key, { value: Number(a), expiresAt: now + Number(d) * 1000 });
          return { result: "OK" };
        }
        if (c === "INCR") {
          if (!alive) counters.set(key, { value: 0, expiresAt: Infinity });
          const entry = counters.get(key);
          entry.value++;
          return { result: entry.value };
        }
        if (c === "TTL") return { result: alive ? Math.ceil((cur.expiresAt - now) / 1000) : -2 };
        return { error: `ERR unknown command ${c}` };
      });
      return res.end(JSON.stringify(out));
    }
    const [cmd, name, field, value] = JSON.parse(body);
    calls.push(cmd);
    const h = hash(name);
    if (cmd === "HGET") return res.end(JSON.stringify({ result: h.get(field) ?? null }));
    if (cmd === "HSET") {
      const isNew = !h.has(field);
      h.set(field, value);
      return res.end(JSON.stringify({ result: isNew ? 1 : 0 }));
    }
    if (cmd === "HSETNX") {
      const isNew = !h.has(field);
      if (isNew) h.set(field, value);
      return res.end(JSON.stringify({ result: isNew ? 1 : 0 }));
    }
    if (cmd === "HGETALL") return res.end(JSON.stringify({ result: [...h].flat() }));
    if (cmd === "HDEL") return res.end(JSON.stringify({ result: h.delete(field) ? 1 : 0 }));
    res.statusCode = 400;
    res.end(JSON.stringify({ error: `ERR unknown command ${cmd}` }));
  });
  await new Promise((r) => server.listen(port, r));
  return { hash, calls, close: () => server.close() };
}

// --- Resend: /emails y /emails/batch, con idempotencia y fallos inyectables ---
export async function startMockResend(port = 3198, key = "re_test") {
  const sent = []; // correos realmente "enviados" (los repetidos por idempotencia no cuentan)
  const requests = []; // todas las llamadas recibidas
  const idempotent = new Map(); // Idempotency-Key -> respuesta guardada
  const failAt = new Map(); // nº absoluto de petición -> { status, retryAfter? }
  let total = 0;
  let seq = 0;
  const server = http.createServer(async (req, res) => {
    const raw = await readBody(req);
    res.setHeader("Content-Type", "application/json");
    if (req.headers.authorization !== `Bearer ${key}`) {
      res.statusCode = 401;
      return res.end(JSON.stringify({ name: "restricted_api_key", message: "API key is invalid" }));
    }
    const body = JSON.parse(raw || "null");
    const idemKey = req.headers["idempotency-key"];
    requests.push({ url: req.url, count: Array.isArray(body) ? body.length : 1, idemKey });

    const failure = failAt.get(++total);
    if (failure) {
      res.statusCode = failure.status;
      if (failure.retryAfter) res.setHeader("retry-after", String(failure.retryAfter));
      return res.end(JSON.stringify({ name: "mock_failure", message: `injected ${failure.status}` }));
    }
    if (idemKey && idempotent.has(idemKey)) return res.end(idempotent.get(idemKey)); // sin reenviar

    const make = (e) => {
      sent.push({ ...e, idemKey, endpoint: req.url });
      return `mock-${++seq}`;
    };
    let out;
    if (req.url === "/emails") out = JSON.stringify({ id: make(body) });
    else if (req.url === "/emails/batch") {
      if (!Array.isArray(body) || body.length > 100) {
        res.statusCode = 422;
        return res.end(JSON.stringify({ name: "validation_error", message: "max 100" }));
      }
      out = JSON.stringify({ data: body.map((e) => ({ id: make(e) })) });
    } else {
      res.statusCode = 404;
      return res.end("{}");
    }
    if (idemKey) idempotent.set(idemKey, out);
    res.end(out);
  });
  await new Promise((r) => server.listen(port, r));
  return {
    sent,
    requests,
    // Hace fallar la petición número `nth` a partir de ahora (1 = la siguiente).
    failOn: (nth, status, retryAfter) => failAt.set(total + nth, { status, retryAfter }),
    reset: () => {
      sent.length = 0;
      requests.length = 0;
    },
    close: () => server.close(),
  };
}
