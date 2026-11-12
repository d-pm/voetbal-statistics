import type { Positie } from "./competitie";
import { berekenLeeftijd } from "./datum";
import { uitlegVan, type Cijfers, type Statistiek } from "./statistieken";

// De spelregels: welke opdrachten er zijn, hoe je opdracht gekozen wordt en hoe je
// keuze beoordeeld wordt. Dit bestand draait zowel op de server als in de browser.
//
// De soorten opdrachten en hun punten zijn dezelfde als in data/puntentelling.py.
// Pas je hier iets aan, doe het daar dan ook.

export type Soort = "spits" | "spelmaker" | "balafpakker" | "keeper";

export const SOORTEN: Record<
  Soort,
  { titel: string; positie: Positie; punten: Partial<Record<Statistiek, number>>; wens: string; hoofdcijfer: Statistiek }
> = {
  spits: {
    titel: "Een spits die scoort",
    positie: "FWD",
    punten: { goals: 5, xg: 3 },
    wens: "We hebben een aanvaller nodig die de bal erin legt.",
    hoofdcijfer: "xg",
  },
  spelmaker: {
    titel: "Een creatieve middenvelder",
    positie: "MID",
    punten: { assists: 4, xa: 3 },
    wens: "We zoeken een middenvelder die kansen creëert voor de anderen.",
    hoofdcijfer: "xa",
  },
  balafpakker: {
    titel: "Een verdediger die ballen afpakt",
    positie: "DEF",
    punten: { tackles: 1, cbi: 1, recoveries: 0.5 },
    wens: "Onze verdediging lekt. We zoeken iemand die de bal afpakt.",
    hoofdcijfer: "tackles",
  },
  keeper: {
    titel: "Een keeper die de nul houdt",
    positie: "GKP",
    punten: { cleanSheets: 4, saves: 1 },
    wens: "We zoeken een doelman die ballen tegenhoudt.",
    hoofdcijfer: "saves",
  },
};

export type Opdracht = {
  speeldag: number;
  soort: Soort;
  maxLeeftijd: number | null; // null = geen leeftijdsgrens
  geenTopclub: boolean; // de club kan geen speler van een topclub betalen
};

/** Wat we van een speler moeten weten om te zien of hij bij een opdracht past. */
export type Kandidaat = {
  id: number;
  positie: Positie;
  geboortedatum: string | null;
  team: string;
};

/** Alles over een speeldag dat de opdracht mee bepaalt. */
export type Context = {
  speeldag: number;
  deadline: string;
  topclubs: string[]; // afkortingen van de 6 beste teams bij de deadline
};

const MIN_KANDIDATEN = 12; // anders is er te weinig te kiezen

// ---- Toeval dat altijd hetzelfde uitkomt ----

/** Maakt van een tekst een getal. Dezelfde tekst geeft altijd hetzelfde getal. */
function hash(tekst: string) {
  let h = 2166136261;
  for (let i = 0; i < tekst.length; i++) {
    h ^= tekst.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  // Nog eens goed door elkaar schudden: zo lijken "scout:6" en "scout:7" niet op elkaar
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

/** Een reeks "toevallige" getallen tussen 0 en 1 die altijd hetzelfde is voor hetzelfde startgetal. */
function dobbelsteen(startgetal: number) {
  let a = startgetal;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Kiest één van de opties. Een optie met een groter gewicht komt vaker voor. */
function kies<T>(gooi: () => number, opties: [T, number][]): T {
  const totaal = opties.reduce((som, [, gewicht]) => som + gewicht, 0);
  let worp = gooi() * totaal;
  for (const [optie, gewicht] of opties) {
    worp -= gewicht;
    if (worp < 0) {
      return optie;
    }
  }
  return opties[opties.length - 1][0];
}

// ---- De opdracht ----

const SOORT_KANSEN: [Soort, number][] = [
  ["spits", 1],
  ["spelmaker", 1],
  ["balafpakker", 1],
  ["keeper", 0.6], // er zijn minder keepers, dus iets minder vaak
];

/**
 * De soort opdracht van een speeldag. Nooit twee keer na elkaar dezelfde, want dat wordt saai.
 * Daarom lopen we vanaf speeldag 1: is de worp gelijk aan de vorige speeldag, dan gooien we
 * opnieuw zonder die soort.
 */
function bepaalSoort(scoutId: string, speeldag: number) {
  let vorige: Soort | null = null;
  for (let dag = 1; dag <= speeldag; dag++) {
    let soort = kies(dobbelsteen(hash(`${scoutId}:${dag}:soort`)), SOORT_KANSEN);
    if (soort === vorige) {
      const uitsluiten: Soort = vorige;
      soort = kies(
        dobbelsteen(hash(`${scoutId}:${dag}:opnieuw`)),
        SOORT_KANSEN.filter(([optie]) => optie !== uitsluiten),
      );
    }
    vorige = soort;
  }
  return vorige!;
}

/** Past deze speler bij de opdracht? */
export function voldoet(speler: Kandidaat, opdracht: Opdracht, context: Context) {
  if (speler.positie !== SOORTEN[opdracht.soort].positie) {
    return false;
  }
  if (opdracht.geenTopclub && context.topclubs.includes(speler.team)) {
    return false;
  }
  if (opdracht.maxLeeftijd !== null) {
    const leeftijd = berekenLeeftijd(speler.geboortedatum, new Date(context.deadline));
    if (leeftijd === null || leeftijd > opdracht.maxLeeftijd) {
      return false;
    }
  }
  return true;
}

/**
 * Maakt de opdracht van één scout voor één speeldag.
 *
 * Elke scout heeft een eigen nummer (scoutId). Daarmee gooien we de dobbelsteen:
 * zo krijgt iedereen een andere opdracht, maar jij krijgt voor dezelfde speeldag
 * altijd dezelfde, ook als je de pagina opnieuw laadt.
 */
export function maakOpdracht(scoutId: string, context: Context, spelers: Kandidaat[]): Opdracht {
  const gooi = dobbelsteen(hash(`${scoutId}:${context.speeldag}`));

  const opdracht: Opdracht = {
    speeldag: context.speeldag,
    soort: bepaalSoort(scoutId, context.speeldag),
    maxLeeftijd: kies<number | null>(gooi, [
      [null, 4],
      [25, 2.5],
      [23, 2],
      [21, 1.5],
    ]),
    geenTopclub: gooi() < 0.35 && context.topclubs.length > 0,
  };

  // Zijn er te weinig spelers die passen? Dan maken we de opdracht stap voor stap makkelijker.
  const telKandidaten = () => spelers.filter((speler) => voldoet(speler, opdracht, context)).length;
  const ruimer: Record<number, number | null> = { 21: 23, 23: 25, 25: null };
  while (telKandidaten() < MIN_KANDIDATEN && opdracht.maxLeeftijd !== null) {
    opdracht.maxLeeftijd = ruimer[opdracht.maxLeeftijd] ?? null;
  }
  if (telKandidaten() < MIN_KANDIDATEN) {
    opdracht.geenTopclub = false;
  }
  return opdracht;
}

/** De eisen als korte labels, bv. ["Aanvaller", "Hoogstens 23 jaar", "Geen topclub"]. */
export function eisen(opdracht: Opdracht) {
  const lijst = [{ GKP: "Keeper", DEF: "Verdediger", MID: "Middenvelder", FWD: "Aanvaller" }[SOORTEN[opdracht.soort].positie]];
  if (opdracht.maxLeeftijd !== null) lijst.push(`Hoogstens ${opdracht.maxLeeftijd} jaar`);
  if (opdracht.geenTopclub) lijst.push("Geen topclub");
  return lijst;
}

/** Hoe de punten berekend worden, bv. "Goal × 5 · xG × 3". */
export function puntenregel(soort: Soort) {
  return Object.entries(SOORTEN[soort].punten)
    .map(([sleutel, per]) => `${uitlegVan(sleutel as Statistiek)} × ${String(per).replace(".", ",")}`)
    .join(" · ");
}

// ---- De beoordeling ----

/** De punten van één speler in één speeldag, met de uitleg hoe ze berekend zijn. */
export function berekenPunten(cijfers: Cijfers | undefined, soort: Soort) {
  if (!cijfers || cijfers.minuten === 0) {
    return { punten: 0, uitleg: "Speelde niet", speelde: false };
  }
  let punten = 0;
  const delen: string[] = [];
  for (const [sleutel, per] of Object.entries(SOORTEN[soort].punten) as [Statistiek, number][]) {
    const waarde = cijfers[sleutel];
    punten += waarde * per;
    const getal = Number.isInteger(waarde) ? String(waarde) : waarde.toFixed(2).replace(".", ",");
    delen.push(`${getal} ${uitlegVan(sleutel).toLowerCase()} × ${String(per).replace(".", ",")}`);
  }
  return { punten: Math.round(punten * 10) / 10, uitleg: delen.join(" + "), speelde: true };
}

export type Beoordeling = {
  scoutscore: number; // 0 tot 100
  punten: number;
  uitleg: string;
  speelde: boolean;
  plaats: number; // 1 = de beste keuze die je kon maken
  aantal: number; // hoeveel spelers bij de opdracht pasten
  besten: { id: number; punten: number }[]; // de drie beste keuzes
};

/**
 * Hoe goed was je keuze? We vergelijken je speler met álle spelers die bij de opdracht pasten.
 * Scoutscore 80 = je keuze deed het beter dan 80% van hen. Speelde je speler niet, dan is het 0.
 *
 * Zo kun je verschillende opdrachten eerlijk vergelijken: een verdediger haalt veel meer
 * punten dan een spelmaker, maar de scoutscore kijkt alleen naar wie je had kúnnen kiezen.
 */
export function beoordeel(
  keuze: number,
  opdracht: Opdracht,
  context: Context,
  spelers: Kandidaat[],
  uitslag: Record<number, Cijfers>,
): Beoordeling {
  const kandidaten = spelers
    .filter((speler) => voldoet(speler, opdracht, context))
    .map((speler) => ({ id: speler.id, punten: berekenPunten(uitslag[speler.id], opdracht.soort).punten }))
    .sort((a, b) => b.punten - a.punten);

  const jij = berekenPunten(uitslag[keuze], opdracht.soort);
  const anderen = kandidaten.filter((k) => k.id !== keuze);
  const lager = anderen.filter((k) => k.punten < jij.punten).length;
  const gelijk = anderen.filter((k) => k.punten === jij.punten).length;
  const scoutscore =
    !jij.speelde || anderen.length === 0 ? 0 : Math.round(((lager + gelijk / 2) / anderen.length) * 100);

  return {
    scoutscore,
    punten: jij.punten,
    uitleg: jij.uitleg,
    speelde: jij.speelde,
    plaats: anderen.filter((k) => k.punten > jij.punten).length + 1,
    aantal: kandidaten.length,
    besten: kandidaten.slice(0, 3),
  };
}

/** Een woord bij de scoutscore. */
export function oordeel(beoordeling: Pick<Beoordeling, "scoutscore" | "speelde">) {
  if (!beoordeling.speelde) return "Je speler speelde niet";
  if (beoordeling.scoutscore >= 90) return "Topkeuze";
  if (beoordeling.scoutscore >= 70) return "Sterke keuze";
  if (beoordeling.scoutscore >= 45) return "Degelijke keuze";
  return "Dat viel tegen";
}

// ---- Je carrière als scout ----

export const RANGEN = [
  { naam: "Stagiair", vanaf: 0 },
  { naam: "Jeugdscout", vanaf: 30 },
  { naam: "Scout", vanaf: 50 },
  { naam: "Hoofdscout", vanaf: 65 },
  { naam: "Technisch directeur", vanaf: 80 },
];

export const MIN_OPDRACHTEN_VOOR_RANG = 3;

/** Je rang hangt af van je gemiddelde scoutscore, zodra je genoeg opdrachten gedaan hebt. */
export function bepaalRang(scores: number[]) {
  if (scores.length < MIN_OPDRACHTEN_VOOR_RANG) {
    return { rang: RANGEN[0], gemiddelde: null, volgende: RANGEN[1], nogNodig: MIN_OPDRACHTEN_VOOR_RANG - scores.length };
  }
  const gemiddelde = Math.round(scores.reduce((som, score) => som + score, 0) / scores.length);
  const index = RANGEN.findLastIndex((rang) => gemiddelde >= rang.vanaf);
  return { rang: RANGEN[index], gemiddelde, volgende: RANGEN[index + 1] ?? null, nogNodig: 0 };
}
