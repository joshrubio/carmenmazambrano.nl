// Anuncios del carrusel de la portada. Son EJEMPLOS de cómo funciona la publicidad en la web:
// cada uno lleva `sample: true` y se muestra con la etiqueta "Anuncio de ejemplo".
// Cuando sea un anuncio de pago real, se borra `sample`.
//
// Los textos se escriben en los tres idiomas de la web. Los datos de cada anunciante salen de
// su propia página (consultadas el 5-nov-2026); no se inventan servicios ni cifras.
type L = "es" | "en" | "nl";
type Text = Record<L, string>;

export type AdVisual =
  // fit "contain": la imagen se ve entera sobre `bg` (para dibujos que no admiten recorte)
  | { kind: "image"; src: string; alt: Text; position?: string; fit?: "cover" | "contain"; bg?: string }
  // Sin imagen de terceros: un panel tipográfico con una palabra grande.
  | { kind: "type"; word: Text; kicker: string };

export interface Ad {
  id: string;
  advertiser: string;
  url: string;
  headline: Text;
  text: Text;
  cta: Text;
  visual: AdVisual;
  sample?: true;
}

export const ads: Ad[] = [
  {
    // joshrubio.es — servicios tomados de su web: diseño UI/UX, identidad de marca y desarrollo web
    id: "josh-rubio",
    advertiser: "Josh D. Rubio · joshrubio.es",
    url: "https://joshrubio.es",
    headline: {
      es: "Diseño web y de marca, a tu medida",
      en: "Web and brand design, made for you",
      nl: "Webdesign en merkidentiteit op maat",
    },
    text: {
      es: "Identidad de marca, diseño UX/UI y desarrollo web. Sitios responsive y atractivos, alineados con tu marca y tus objetivos de negocio.",
      en: "Brand identity, UX/UI design and web development. Responsive, engaging websites aligned with your brand and business goals.",
      nl: "Merkidentiteit, UX/UI-design en webontwikkeling. Responsieve, aantrekkelijke websites die passen bij je merk en zakelijke doelen.",
    },
    cta: { es: "Ver portfolio", en: "View portfolio", nl: "Bekijk portfolio" },
    visual: {
      kind: "image",
      src: "/images/ads/josh-brand-identities.webp",
      fit: "contain",
      bg: "#fbf9f7",
      alt: {
        es: "Sistema de diseño con cinco identidades de marca sobre una base neutra común",
        en: "Design system with five brand identities on a shared neutral base",
        nl: "Designsysteem met vijf merkidentiteiten op een gedeelde neutrale basis",
      },
    },
    sample: true,
  },
  {
    // Bibliotheek Rotterdam — datos de su página "Studieruimte reserveren in de Centrale":
    // reserva con el carné de la biblioteca, hasta tres horas, para estudiar solo o en grupo.
    id: "bibliotheek-rotterdam",
    advertiser: "Bibliotheek Rotterdam",
    url: "https://www.bibliotheek.rotterdam.nl/studieruimte-reserveren-de-centrale",
    headline: {
      es: "Tu sala de estudio, en la Biblioteca Central",
      en: "Your study room at the Central Library",
      nl: "Jouw studieruimte in de Centrale",
    },
    text: {
      es: "¿Estudiar solo o en grupo, en una sala cerrada? Con tu carné de la biblioteca puedes reservarla hasta tres horas.",
      en: "Want to study alone or with a group in a closed room? With your library card you can reserve one for up to three hours.",
      nl: "Wil je individueel of met een groep in een afgesloten ruimte studeren? Met je bibliotheekpas reserveer je er een voor drie uur.",
    },
    cta: { es: "Reservar una sala", en: "Reserve a room", nl: "Reserveer een studieruimte" },
    visual: {
      kind: "type",
      word: { es: "Sala de estudio", en: "Study room", nl: "Studieruimte" },
      kicker: "Bibliotheek Rotterdam · De Centrale",
    },
    sample: true,
  },
  {
    // Iglesia Lifepoint (Almería, España) — voluntariado: "áreas como adoración, hospitalidad y alcance"
    id: "iglesia-lifepoint",
    advertiser: "Iglesia Lifepoint · Almería, España",
    url: "https://iglesialifepoint.com/ministerios/servidores",
    headline: {
      es: "Sirve con tus dones en Almería",
      en: "Serve with your gifts in Almería",
      nl: "Dien met je gaven in Almería",
    },
    text: {
      es: "En Lifepoint puedes ser voluntario en áreas como adoración, hospitalidad y alcance. «Servir no es solo una tarea, ¡es un privilegio!»",
      en: "At Lifepoint you can volunteer in areas like worship, hospitality and outreach. “Serving is not just a task, it is a privilege!”",
      nl: "Bij Lifepoint kun je vrijwilliger worden in gebieden als aanbidding, gastvrijheid en outreach. “Dienen is niet alleen een taak, het is een voorrecht!”",
    },
    cta: { es: "Quiero servir", en: "I want to serve", nl: "Ik wil dienen" },
    visual: {
      kind: "image",
      src: "/images/ads/lifepoint-hands.webp",
      position: "50% 62%",
      alt: {
        es: "Manos unidas al atardecer",
        en: "Hands joined together at sunset",
        nl: "Samengevoegde handen bij zonsondergang",
      },
    },
    sample: true,
  },
];
