// Arranca `next dev` en el puerto 3100 apuntando a los servidores falsos de los tests
// (Redis en :3199 y Resend en :3198). Es el servidor que usan test:subscribe y test:newsletter.
//   npm run dev:test        (en una terminal)   y luego   npm run test:subscribe / test:newsletter
import { spawn } from "node:child_process";

const child = spawn("npx", ["next", "dev", "-p", "3100"], {
  stdio: "inherit",
  shell: true,
  env: {
    ...process.env,
    UPSTASH_REDIS_REST_URL: "http://localhost:3199",
    UPSTASH_REDIS_REST_TOKEN: "test",
    RESEND_API_KEY: "re_test",
    RESEND_API_URL: "http://localhost:3198",
    EMAIL_FROM: "The New Paper <hola@example.test>",
    SITE_URL: "https://web.example.test",
  },
});
child.on("exit", (code) => process.exit(code ?? 0));
