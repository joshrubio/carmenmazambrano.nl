import { getDictionary } from "@/i18n/dictionaries";
import { sendEmail, siteUrl } from "./email";
import { renderConfirmEmail } from "./email-templates";
import { putSubscriber, type Subscriber } from "./subscribers";
import { confirmPath } from "./unsubscribe-token";

// Un alta sin confirmar caduca a los 7 días; no se reenvía el correo antes de 10 minutos.
export const CONFIRM_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const RESEND_COOLDOWN_MS = 10 * 60 * 1000;

export const isExpired = (s: Subscriber, now = Date.now()) => now - new Date(s.createdAt).getTime() > CONFIRM_TTL_MS;

export const canResend = (s: Subscriber, now = Date.now()) =>
  !s.confirmationSentAt || now - new Date(s.confirmationSentAt).getTime() >= RESEND_COOLDOWN_MS;

// Envía el correo de confirmación en el idioma de la persona. Solo marca `confirmationSentAt`
// si el envío salió bien, así un fallo no bloquea el siguiente intento.
export async function sendConfirmation(s: Subscriber, requestOrigin: string): Promise<void> {
  const dict = await getDictionary(s.locale);
  const confirmUrl = siteUrl(requestOrigin) + confirmPath(s.email, s.confirmNonce ?? "", s.locale);
  const mail = renderConfirmEmail({ lang: s.locale, dict, name: s.name, confirmUrl });
  await sendEmail({ to: s.email, subject: mail.subject, html: mail.html, text: mail.text });
  await putSubscriber({ ...s, confirmationSentAt: new Date().toISOString() });
}
