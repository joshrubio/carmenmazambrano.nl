// Anuncios del carrusel de la portada. Son EJEMPLOS de cómo funciona la publicidad en la web:
// cada uno lleva `sample: true` y se muestra con la etiqueta "Anuncio de ejemplo".
// Cuando sea un anuncio de pago real, se borra `sample`.
//
// Tono editorial: titular en dos líneas (la segunda, en cursiva), un texto corto y un enlace.
// Los textos se escriben en los tres idiomas de la web. Los datos de cada anunciante salen de
// su propia página (consultadas el 5-nov-2026); no se inventan servicios ni cifras.
type L = "es" | "en" | "nl";
type Text = Record<L, string>;

export type AdVisual =
  // Foto o captura. `credit` es el pie de foto (autoría y licencia, o la web de origen).
  | { kind: "image"; src: string; alt: Text; position?: string; credit?: { text: Text; href?: string } }
  // Ilustración dibujada en código (no hay imagen de terceros). Ver AdSlide.
  | { kind: "art"; art: "web"; alt: Text };

export interface Ad {
  id: string;
  advertiser: string;
  // Dirección que se muestra al pie, sin protocolo
  display: string;
  url: string;
  kicker: Text;
  headline: Text;
  emphasis: Text;
  text: Text;
  cta: Text;
  visual: AdVisual;
  sample?: true;
}

export const ads: Ad[] = [
  {
    // joshrubio.es — diseño web y de marca
    id: "josh-rubio",
    advertiser: "Josh D. Rubio",
    display: "joshrubio.es",
    url: "https://joshrubio.es",
    kicker: { es: "Diseño web", en: "Web design", nl: "Webdesign" },
    headline: { es: "Una buena web se lee", en: "A good website reads", nl: "Een goede website leest" },
    emphasis: { es: "como una buena portada.", en: "like a good front page.", nl: "als een goede voorpagina." },
    text: {
      es: "Diseño web y de marca para negocios que quieren que su historia se entienda a la primera.",
      en: "Web and brand design for businesses that want their story understood at a glance.",
      nl: "Webdesign en merkidentiteit voor bedrijven die willen dat hun verhaal in één oogopslag duidelijk is.",
    },
    cta: { es: "Descubre más", en: "Find out more", nl: "Ontdek meer" },
    visual: {
      kind: "art",
      art: "web",
      alt: {
        es: "Ilustración de una página web maquetada como la portada de un periódico, en versión de escritorio y móvil",
        en: "Illustration of a web page laid out like a newspaper front page, on desktop and mobile",
        nl: "Illustratie van een webpagina opgemaakt als een krantenvoorpagina, op desktop en mobiel",
      },
    },
    sample: true,
  },
  {
    // Bibliotheek Rotterdam — página "Studieruimte reserveren in de Centrale": con el carné,
    // se reserva una sala cerrada (sola o en grupo) hasta tres horas, de lunes a sábado.
    id: "bibliotheek-rotterdam",
    advertiser: "Bibliotheek Rotterdam",
    display: "bibliotheek.rotterdam.nl",
    url: "https://www.bibliotheek.rotterdam.nl/studieruimte-reserveren-de-centrale",
    kicker: { es: "Biblioteca de Róterdam", en: "Rotterdam Library", nl: "Bibliotheek Rotterdam" },
    headline: { es: "Tu rincón", en: "Your corner", nl: "Jouw plek" },
    emphasis: { es: "para estudiar.", en: "for studying.", nl: "om te studeren." },
    text: {
      es: "En la Biblioteca Central puedes reservar una sala cerrada, para ti o para tu grupo, hasta tres horas de lunes a sábado. Solo necesitas tu carné de la biblioteca.",
      en: "At the Central Library you can book a closed study room, for yourself or your group, for up to three hours Monday to Saturday. All you need is your library card.",
      nl: "In de Centrale reserveer je een afgesloten studieruimte, voor jezelf of met een groep, van maandag t/m zaterdag tot drie uur. Je hebt alleen je bibliotheekpas nodig.",
    },
    cta: { es: "Reservar una sala", en: "Book a room", nl: "Reserveer een ruimte" },
    visual: {
      kind: "image",
      src: "/images/ads/library-central.webp",
      position: "50% 55%",
      alt: {
        es: "La Biblioteca Central de Róterdam, con sus tubos amarillos, junto al edificio Potlood",
        en: "The Rotterdam Central Library, with its yellow pipes, next to the Potlood building",
        nl: "De Centrale Bibliotheek Rotterdam, met de gele buizen, naast het Potlood",
      },
      credit: {
        text: { es: "Foto: F. Eveleens · CC BY 3.0", en: "Photo: F. Eveleens · CC BY 3.0", nl: "Foto: F. Eveleens · CC BY 3.0" },
        href: "https://commons.wikimedia.org/w/index.php?curid=4495720",
      },
    },
    sample: true,
  },
  {
    // Iglesia Lifepoint (Almería, España) — voluntariado: "áreas como adoración, hospitalidad y alcance"
    id: "iglesia-lifepoint",
    advertiser: "Iglesia Lifepoint",
    display: "iglesialifepoint.com",
    url: "https://iglesialifepoint.com/ministerios/servidores",
    kicker: { es: "Voluntariado", en: "Volunteering", nl: "Vrijwilligerswerk" },
    headline: { es: "¡Haz voluntariado", en: "Volunteer", nl: "Doe vrijwilligerswerk" },
    emphasis: { es: "en España!", en: "in Spain!", nl: "in Spanje!" },
    text: {
      es: "En Almería, en una comunidad que sirve junta. Lifepoint es una iglesia cristiana evangélica, y puedes aportar tus dones en áreas como adoración, hospitalidad y alcance.",
      en: "In Almería, within a community that serves together. Lifepoint is an evangelical Christian church, and you can offer your gifts in areas like worship, hospitality and outreach.",
      nl: "In Almería, in een gemeenschap die samen dient. Lifepoint is een evangelische christelijke kerk, en je kunt je gaven inzetten in gebieden als aanbidding, gastvrijheid en outreach.",
    },
    cta: { es: "Quiero servir", en: "I want to serve", nl: "Ik wil dienen" },
    visual: {
      kind: "image",
      src: "/images/ads/lifepoint-web.webp",
      position: "50% 45%",
      alt: {
        es: "Portada de la web de Iglesia Lifepoint, con un grupo de personas sonriendo en una selfie",
        en: "Home page of the Lifepoint Church website, with a group of people smiling in a selfie",
        nl: "Startpagina van de website van Lifepoint Church, met een groep lachende mensen op een selfie",
      },
      credit: {
        text: { es: "Web de Iglesia Lifepoint", en: "Lifepoint Church website", nl: "Website van Lifepoint Church" },
      },
    },
    sample: true,
  },
];
