# Newsletter: configuración y funcionamiento

Guía de referencia del sistema de newsletter de carmenzambrano.nl. Las claves reales **no** van en
este repositorio (es público): se guardan en Vercel (producción) y en `.env.local` (tu equipo).

## Cómo funciona

1. **Alta** (`/[lang]/newsletter` o la banda del footer): la persona queda como *pendiente* y recibe un
   correo de confirmación en su idioma (doble opt-in).
2. **Confirmación** (`/[lang]/confirm`): al pulsar el botón pasa a *confirmada*. Los enlaces valen
   7 días. Abrir el enlace no confirma nada: hace falta pulsar el botón (así los antivirus que
   "visitan" los enlaces no confirman altas por su cuenta).
3. **Envío** (`/admin/newsletter`, solo con sesión de admin): asunto, texto, audiencia (todas / es / en /
   nl), vista previa, correo de prueba y envío. **Solo reciben la newsletter las altas confirmadas.**
4. **Baja**: cada correo lleva el enlace de baja personal y las cabeceras `List-Unsubscribe`
   (un clic, RFC 8058) que exigen Gmail y Yahoo. Quien se da de baja desaparece de la lista.

Los datos (suscriptores y envíos) se guardan en **Redis (Upstash)**, nunca en GitHub.

## Variables de entorno

| Variable | Dónde | Para qué |
|---|---|---|
| `KV_REST_API_URL`, `KV_REST_API_TOKEN` | Vercel (las pone la integración de Upstash) | Base de datos de suscriptores y envíos |
| `RESEND_API_KEY` | Vercel + `.env.local` | Clave de Resend (`re_...`). **Obligatoria en producción** |
| `EMAIL_FROM` | Vercel | Remitente, p. ej. `Carmen Zambrano <hola@carmenzambrano.nl>`. **Obligatoria en producción** y su dominio debe estar verificado en Resend |
| `EMAIL_REPLY_TO` | opcional | Dirección de respuesta (por defecto, el email de `content/about.ts`) |
| `SITE_URL` | Vercel | URL pública para los enlaces de los correos, p. ej. `https://carmenzambrano.nl`. Si falta se usa la del propio despliegue |
| `SESSION_SECRET` | Vercel | Firma los enlaces de baja y confirmación. **Si lo cambias, los enlaces ya enviados dejan de valer** |

Tras cambiar variables en Vercel hay que hacer **Redeploy**.

> Sin `RESEND_API_KEY` o `EMAIL_FROM` en producción, el alta responde con error (no puede enviar la
> confirmación). Configúralas **antes** de publicar estos cambios.

## Puesta en marcha de Resend

1. Cuenta en resend.com → *Domains* → añade `carmenzambrano.nl`.
2. Resend muestra registros DNS (SPF y DKIM): ponlos donde esté registrado el dominio y espera a que
   Resend lo marque como verificado.
3. *API Keys* → crea una clave y guárdala en Vercel (`RESEND_API_KEY`) y, si quieres probar en local,
   en `.env.local`. Nunca la pegues en chats ni en el repo.
4. Define `EMAIL_FROM` con una dirección de ese dominio y `SITE_URL`.
5. Envía una prueba desde `/admin/newsletter` ("Enviar prueba") a tu propio email antes del primer envío real.

Límites: Resend limita las peticiones (el código espera y reintenta solo ante un 429) y el plan
gratuito tiene una cuota diaria de envíos: consulta tu plan en el panel de Resend antes de mandar a
una lista grande. Un envío se parte en lotes de 100 y, si se corta, se puede continuar desde el historial
sin repetir correos.

## Probar en local

- **Modo simulación** (sin `RESEND_API_KEY`, solo fuera de producción): los correos no se envían, se
  guardan como JSON en `.data/outbox/`. Los suscriptores van a `.data/*.json`. La carpeta `.data/` está en
  `.gitignore`.
- **Tests automáticos** (Redis y Resend falsos, no tocan nada real):
  ```bash
  npm run dev:test          # terminal 1: servidor de pruebas en :3100
  npm run test:newsletter   # terminal 2: doble opt-in, envíos, lotes, reanudación, 429...
  npm run test:subscribe    # alta, baja, rate limit, admin
  npm run test:i18n         # diccionarios y rutas
  ```

## Datos que se guardan de cada suscriptor

Email, nombre (opcional), idioma, origen del alta, estado (pendiente/confirmada), fecha del
consentimiento, fecha de confirmación y fecha del último correo de confirmación. La política de
privacidad (`/[lang]/privacy`) describe este tratamiento; si cambias qué se guarda o con qué
proveedores, actualízala.

## Pendiente / mejoras posibles

- Las altas pendientes caducadas no se borran solas (el enlace deja de valer y se limpian al intentar
  confirmar o al volver a apuntarse). Se pueden eliminar a mano en `/contact-list`.
- Gestión de rebotes y quejas de spam (Resend puede avisar por webhook).
- Programar envíos a una hora concreta.
