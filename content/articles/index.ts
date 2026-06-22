import type { Article } from "@/lib/articles";

export const articles: Article[] = [
  {
    slug: "periodismo-cultural-rotterdam",
    title: "El periodismo cultural como puente entre comunidades",
    subtitle: "Cómo la narrativa editorial transforma el tejido social de las ciudades",
    category: "Cultura",
    date: "2026-06-15",
    author: "Carmen Zambrano",
    excerpt:
      "En Rotterdam, ciudad de contrastes y migraciones, el periodismo cultural cumple una función que va más allá de la crónica: conecta identidades, preserva memorias y construye comunidad.",
    content: [
      {
        type: "paragraph",
        text: "En Rotterdam, ciudad de contrastes y migraciones, el periodismo cultural cumple una función que va más allá de la crónica: conecta identidades, preserva memorias y construye comunidad.",
      },
      {
        type: "paragraph",
        text: "A lo largo de tres décadas cubriendo la escena cultural en distintos países, he aprendido que las mejores historias no están en los comunicados de prensa, sino en las conversaciones de pasillo, en los ensayos a puerta cerrada, en el silencio antes del telón.",
      },
      {
        type: "pullquote",
        text: "Las mejores historias no están en los comunicados de prensa, sino en el silencio antes del telón.",
      },
      {
        type: "paragraph",
        text: "El desafío actual para el periodismo cultural es mantener esa profundidad en un ecosistema de consumo inmediato. La solución no es competir con la velocidad de las redes sociales, sino ofrecer lo que ellas no pueden: contexto, análisis y memoria.",
      },
    ],
    featured: true,
  },
  {
    slug: "comunicacion-gubernamental-transparencia",
    title: "Comunicación gubernamental y transparencia en la era digital",
    subtitle: "La responsabilidad del comunicador público ante la ciudadanía conectada",
    category: "Política",
    date: "2026-05-28",
    author: "Carmen Zambrano",
    excerpt:
      "La comunicación institucional ha evolucionado radicalmente. Ya no basta con emitir boletines: el ciudadano digital exige diálogo, inmediatez y verificabilidad.",
    content: [
      {
        type: "paragraph",
        text: "La comunicación institucional ha evolucionado radicalmente en la última década. Ya no basta con emitir boletines oficiales o convocar ruedas de prensa semanales.",
      },
      {
        type: "paragraph",
        text: "Durante mis años en periodismo gubernamental, observé una constante: las instituciones que apostaban por la transparencia activa —no la reactiva— construían una relación de confianza que sobrevivía incluso a las crisis.",
      },
      {
        type: "image",
        src: "/images/placeholder-comunicacion.jpg",
        alt: "Sala de prensa gubernamental",
        caption: "Las salas de prensa modernas integran canales digitales y tradicionales.",
      },
      {
        type: "paragraph",
        text: "El comunicador público del siglo XXI debe dominar tanto la narrativa periodística como los datos abiertos. La transparencia no es un gesto político: es una metodología de trabajo.",
      },
    ],
    featured: false,
  },
];
