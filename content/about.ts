export const about = {
  name: "Carmen Zambrano",
  title: "Social Communicator & Journalist",
  location: "Rotterdam, Netherlands",
  phone: "+31 6 30708843",
  email: "carmenmazambrano@gmail.com",
  bio: [
    "I'm a Social Communicator with over 30 years of experience across press, governmental, and corporate journalism — from the newsroom trenches to leading teams in culture, media, and client relations.",
    "My journey spans radio, television, and education, where I've honed a deep understanding of how stories connect people and inspire change. I'm passionate about culture, community, and driving projects that make a lasting impact.",
  ],
  specialties: [
    "Press Journalism",
    "Governmental Communications",
    "Corporate Media",
    "Radio & Television",
    "Cultural Projects",
    "Team Leadership",
  ],
  photo: "/images/carmen-zambrano.png",
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
    {
      title: "Reporter & Writer",
      org: "El Tiempo Newspaper",
      location: "Puerto La Cruz",
      from: "Jan 2001",
      to: "Dec 2002",
      description:
        "Covered local events, culture, and social issues. Contributed weekly articles and assisted in content editing for the print edition.",
    },
    {
      title: "Journalist & Press Writer",
      org: "Municipality of Sotillo",
      location: "Puerto La Cruz, Anzoátegui",
      from: "Jan 2003",
      to: "Dec 2005",
      description:
        "Produced official statements, wrote community reports, and supported internal communication projects for the local government.",
    },
    {
      title: "Culture Coordinator",
      org: "Department of Culture, Anzoátegui State",
      location: "Anzoátegui",
      from: "Jan 2005",
      to: "Dec 2006",
      description:
        "Organized artistic programs and public events. Promoted cultural initiatives and collaborations between local artists and institutions.",
    },
    {
      title: "University Professor",
      org: "Misión Sucre",
      location: "Anzoátegui",
      from: "Jan 2006",
      to: "Dec 2008",
      description:
        "Taught courses on journalism, writing, and media literacy. Supported students in developing research and communication projects.",
    },
    {
      title: "Professor of Writing & Social Communication",
      org: "IUPTJAA University",
      location: "Anzoátegui",
      from: "Jan 2009",
      to: "Dec 2012",
      description:
        "Guided students in content development, editorial structure, and applied communication practices. Courses included Writing, Social Communication, and Project Design.",
    },
    {
      title: "Press Department Writer & Field Journalist",
      org: "CORPOELEC",
      location: "Anzoátegui",
      from: "Jan 2013",
      to: "Dec 2015",
      description:
        "Covered institutional events, drafted internal and external press releases, and managed social media updates.",
    },
    {
      title: "Head of Customer Service Department",
      org: "CORPOELEC",
      location: "Anzoátegui",
      from: "Jan 2016",
      to: "Dec 2018",
      description:
        "Oversaw public assistance channels, managed service reports, and implemented communication strategies for client relations.",
    },
  ],
} as const;
