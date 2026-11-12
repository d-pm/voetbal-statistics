import { STANDAARD, schrijfFilters, type Filters } from "./filters";

// Voorbeeldopdrachten om mee te oefenen. Elke opdracht is gewoon een stel filters
// voor de scoutingdatabase. Later komen de echte weekopdrachten uit de database
// (tabel "assignments"), en die zijn voor iedereen dezelfde.

export type Opdracht = {
  sleutel: string;
  club: string; // wat de club zegt
  titel: string;
  filters: Filters;
};

export const OPDRACHTEN: Opdracht[] = [
  {
    sleutel: "balafpakker",
    titel: "Jonge balafpakker",
    club: "We zoeken een verdediger van hoogstens 23 jaar die veel ballen afpakt.",
    filters: { ...STANDAARD, positie: "DEF", maxLeeftijd: 23, alleenFit: true, per90: true, sorteer: "tackles" },
  },
  {
    sleutel: "spits",
    titel: "Spits die kansen krijgt",
    club: "We zoeken een aanvaller die elke wedstrijd voor doel komt.",
    filters: { ...STANDAARD, positie: "FWD", alleenFit: true, per90: true, sorteer: "xg" },
  },
  {
    sleutel: "spelmaker",
    titel: "Creatieve middenvelder",
    club: "We zoeken een middenvelder van hoogstens 25 jaar die kansen creëert.",
    filters: { ...STANDAARD, positie: "MID", maxLeeftijd: 25, alleenFit: true, per90: true, sorteer: "xa" },
  },
  {
    sleutel: "keeper",
    titel: "Keeper die ballen pakt",
    club: "We zoeken een doelman die veel reddingen maakt.",
    filters: { ...STANDAARD, positie: "GKP", alleenFit: true, per90: true, sorteer: "saves" },
  },
];

/** Het adres van de scoutingdatabase met de filters van deze opdracht al ingevuld. */
export function linkNaarKandidaten(opdracht: Opdracht) {
  return `/spelers?${schrijfFilters(opdracht.filters)}`;
}
