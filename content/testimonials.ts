// Testimonios de la portada. Cada cita va en su idioma original (como las notas).
//
// IMPORTANTE: los de abajo son DE EJEMPLO y se muestran con la etiqueta "Ejemplo".
// Sustitúyelos por testimonios reales (con permiso de quien los dijo) y borra `sample: true`.
export interface Testimonial {
  quote: string;
  author: string;
  role: string;
  lang: "es" | "en" | "nl";
  sample?: true;
}

export const testimonials: Testimonial[] = [
  {
    quote: "Nos dieron un espacio cercano y cuidado para contar lo que hacemos. Recibimos mensajes de vecinos que no sabían que existíamos.",
    author: "Nombre y apellido",
    role: "Asociación cultural · Róterdam",
    lang: "es",
    sample: true,
  },
  {
    quote: "Een warme, zorgvuldige manier van schrijven. Ons evenement kreeg eindelijk de aandacht die het verdiende.",
    author: "Naam en achternaam",
    role: "Organisator · Rotterdam",
    lang: "nl",
    sample: true,
  },
  {
    quote: "Professional, personal and rooted in the community. Working with The New Paper felt like working with neighbours.",
    author: "Name and surname",
    role: "Local business · Rotterdam",
    lang: "en",
    sample: true,
  },
  {
    quote: "Una publicación con voz propia. Se nota el oficio de quien lleva décadas contando historias.",
    author: "Nombre y apellido",
    role: "Proyecto social · Róterdam",
    lang: "es",
    sample: true,
  },
];
