// Identidad del periódico en un único sitio. Para cambiar el dominio definitivo,
// basta con editar `domain` (y conectarlo en Vercel / verificarlo en el proveedor de correo).
export const site = {
  name: "The New Paper",
  domain: "thenewpaper.nl",
  get url() {
    return `https://${this.domain}`;
  },
} as const;
