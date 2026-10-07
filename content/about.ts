// Datos de la página About que no dependen del idioma. Los textos traducibles
// (bio, especialidades, títulos y descripciones de la experiencia, nombres de
// habilidades) viven en src/i18n/dictionaries/*.json bajo la clave `about`.
export const about = {
  name: "Carmen Zambrano",
  phone: "+31 6 30708843",
  email: "carmenmazambrano@gmail.com",
  photo: "/images/carmen-zambrano.webp",
  social: {
    linkedin: "https://www.linkedin.com/in/carmen-zambrano/",
    tiktok: "https://www.tiktok.com/@carmenmazambrano",
  },
  skills: {
    languages: [
      { name: "Spanish", level: "Native", pct: 100 },
      { name: "English", level: "B1", pct: 60 },
      { name: "Dutch", level: "A1", pct: 20 },
    ],
    tools: [
      { name: "Word / Docs", pct: 100 },
      { name: "Canva", pct: 100 },
      { name: "Photography", pct: 100 },
      { name: "Social Networking", pct: 70 },
    ],
  },
  experience: [
    { id: "radio-popular", org: "Radio Popular", location: "Maracaibo, Zulia", from: "Feb 1993", to: "Nov 1993" },
    { id: "la-columna", org: "Diario La Columna", location: "Maracaibo, Zulia", from: "Nov 1994", to: "Jul 1995" },
    { id: "la-prensa-coro", org: "Diario La Prensa de Coro", location: "Coro, Falcón", from: "Jul 1995", to: "Jul 1996" },
    { id: "televisa", org: "Televisa Producciones", location: "Maracaibo, Zulia", from: "Sep 1997", to: "Aug 1998" },
    { id: "casa-cultura", org: "Casa de Cultura de Maracaibo", location: "Maracaibo, Zulia", from: "Jul 1998", to: "Aug 1999" },
    { id: "metropolitano", org: "Diario Metropolitano", location: "Barcelona, Anzoátegui", from: "Jan 2000", to: "Jun 2000" },
    { id: "el-tiempo", org: "Diario El Tiempo", location: "Puerto La Cruz, Anzoátegui", from: "Jul 2000", to: "Dec 2000" },
    { id: "actualidad-empresarial", org: "Revista Actualidad Empresarial", location: "Puerto La Cruz, Anzoátegui", from: "Feb 2000", to: "Aug 2002" },
    { id: "alcaldia-sotillo", org: "Alcaldía del Municipio Juan Antonio Sotillo", location: "Puerto La Cruz, Anzoátegui", from: "Dec 2000", to: "Dec 2014" },
    { id: "zona-educativa", org: "Zona Educativa del Estado Anzoátegui", location: "Barcelona, Anzoátegui", from: "Jan 2003", to: "Jan 2004" },
    { id: "ubv", org: "Universidad Bolivariana de Venezuela", location: "Barcelona, Anzoátegui", from: "Jan 2005", to: "Dec 2010" },
    { id: "iutja", org: "Instituto Universitario de Tecnología José Antonio Anzoátegui", location: "Barcelona, Anzoátegui", from: "Jan 2008", to: "Sep 2010" },
    { id: "corpoelec", org: "CORPOELEC (National Electric Company)", location: "Puerto La Cruz, Anzoátegui", from: "Oct 2010", to: "Jul 2018" },
    { id: "freelance", org: "Freelance", location: "Rotterdam, Netherlands", from: "2023", to: "Present" },
  ],
} as const;
