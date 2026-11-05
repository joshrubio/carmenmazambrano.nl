// Voces de la redacción: citas de Carmen y del equipo sobre notas que ya hemos publicado.
// Cada cita se escribe en los tres idiomas de la web y enlaza a su nota (`article` = slug).
//
// `draft: true` (opcional) = cita pendiente de aprobar: se muestra con la etiqueta "Borrador".
type L = "es" | "en" | "nl";
type Text = Record<L, string>;

export interface Voice {
  quote: Text;
  author: string;
  role: Text;
  article?: string;
  draft?: true;
}

const EDITOR_ROLE: Text = { es: "Fundadora y editora", en: "Founder and editor", nl: "Oprichtster en hoofdredacteur" };
const TEAM_ROLE: Text = { es: "Equipo de The New Paper", en: "The New Paper team", nl: "Team van The New Paper" };

export const voices: Voice[] = [
  {
    quote: {
      es: "Cuando una biblioteca se vuelve taller de mujeres de todas las edades y culturas, hay una noticia que no cabe en un titular. Por eso fuimos.",
      en: "When a library becomes a workshop for women of every age and culture, there is a story that does not fit in a headline. That is why we went.",
      nl: "Als een bibliotheek een werkplaats wordt voor vrouwen van alle leeftijden en culturen, is er een verhaal dat niet in een kop past. Daarom gingen we erheen.",
    },
    author: "Carmen Zambrano",
    role: EDITOR_ROLE,
    article: "the-nest-collectief-kunstwerk-vrouwen-rotterdam",
  },
  {
    quote: {
      es: "Que la ciudad ofrezca cursos digitales gratuitos solo sirve si la gente se entera. Para eso existe un medio local: para que la información llegue a quien la necesita.",
      en: "Free digital courses only help if people hear about them. That is what a local paper is for: getting information to the people who need it.",
      nl: "Gratis digitale cursussen helpen alleen als mensen ervan horen. Daar is een lokale krant voor: informatie bij wie haar nodig heeft.",
    },
    author: "Joshue Rubio",
    role: TEAM_ROLE,
    article: "rotterdam-stimuleert-digitale-inclusie",
  },
  {
    quote: {
      es: "Cada semana, gente de medio mundo coincide en un mercado para pedir consejo y darse apoyo. Contarlo es recordarle a la ciudad quién la sostiene.",
      en: "Every week, people from all over the world meet at a market to ask for advice and support one another. Telling that story reminds the city who holds it together.",
      nl: "Elke week komen mensen van over de hele wereld samen op een markt voor advies en onderlinge steun. Dat verhaal vertellen herinnert de stad aan wie haar draagt.",
    },
    author: "Carmen Zambrano",
    role: EDITOR_ROLE,
    article: "rotterdam-zuid-community-ontmoetingspunt-2026",
  },
  {
    quote: {
      es: "Quien llega nuevo a una ciudad necesita saber dónde pedir ayuda con la vivienda y el trabajo. Una buena nota puede ahorrarle semanas.",
      en: "Someone new to a city needs to know where to ask for help with housing and work. A good article can save them weeks.",
      nl: "Wie nieuw is in een stad moet weten waar hij terechtkan voor hulp bij huisvesting en werk. Een goed artikel kan weken besparen.",
    },
    author: "Joshue Rubio",
    role: TEAM_ROLE,
    article: "rotterdam-versterkt-steun-europese-migranten",
  },
  {
    quote: {
      es: "Una tarde de Moederdag con música y mesa compartida entre mujeres de muchas nacionalidades. Después de treinta años contando historias, lo cotidiano sigue emocionándome.",
      en: "A Mother's Day afternoon of music and a shared table among women of many nationalities. After thirty years of telling stories, everyday life still moves me.",
      nl: "Een Moederdagmiddag met muziek en een gedeelde tafel tussen vrouwen van vele nationaliteiten. Na dertig jaar verhalen vertellen ontroert het alledaagse me nog steeds.",
    },
    author: "Carmen Zambrano",
    role: EDITOR_ROLE,
    article: "moederdag-viering-rotterdam-2026",
  },
];
