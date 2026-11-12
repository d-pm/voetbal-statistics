import type { Positie, Speler } from "./competitie";

// Alles over de cijfers zelf: welke er zijn, hoe ze heten en hoe we ze tonen.
// De tabel, de spelerskaart en het spelersprofiel gebruiken allemaal dit bestand.

export type Statistiek =
  | "minuten"
  | "goals"
  | "assists"
  | "xg"
  | "xa"
  | "tackles"
  | "recoveries"
  | "cbi"
  | "saves"
  | "cleanSheets";

/** Een getal voor elke statistiek. Een speler heeft ze, en één wedstrijd van een speler ook. */
export type Cijfers = Record<Statistiek, number>;

export const KOLOMMEN: { sleutel: Statistiek; label: string; uitleg: string }[] = [
  { sleutel: "minuten", label: "Min", uitleg: "Gespeelde minuten" },
  { sleutel: "goals", label: "G", uitleg: "Goals" },
  { sleutel: "assists", label: "A", uitleg: "Assists" },
  { sleutel: "xg", label: "xG", uitleg: "Verwachte goals" },
  { sleutel: "xa", label: "xA", uitleg: "Verwachte assists" },
  { sleutel: "tackles", label: "Tackles", uitleg: "Tackles" },
  { sleutel: "recoveries", label: "Recov.", uitleg: "Balrecuperaties" },
  { sleutel: "cbi", label: "CBI", uitleg: "Clearances, blocks en interceptions" },
  { sleutel: "saves", label: "Saves", uitleg: "Reddingen" },
  { sleutel: "cleanSheets", label: "CS", uitleg: "Clean sheets" },
];

/** De volledige naam van een statistiek, bv. "Verwachte goals". */
export function uitlegVan(sleutel: Statistiek) {
  return KOLOMMEN.find((kolom) => kolom.sleutel === sleutel)!.uitleg;
}

export const POSITIE_NAMEN: Record<Positie, string> = {
  GKP: "Keeper",
  DEF: "Verdediger",
  MID: "Middenvelder",
  FWD: "Aanvaller",
};

export const POSITIE_MEERVOUD: Record<Positie, string> = {
  GKP: "keepers",
  DEF: "verdedigers",
  MID: "middenvelders",
  FWD: "aanvallers",
};

export type Groep = { titel: string; kolommen: Statistiek[] };
const AANVAL: Groep = { titel: "Aanval", kolommen: ["goals", "assists", "xg", "xa"] };
const VERDEDIGING: Groep = { titel: "Verdediging", kolommen: ["tackles", "recoveries", "cbi", "cleanSheets"] };
const KEEPER: Groep = { titel: "Keeper", kolommen: ["saves"] };

// Welke cijfers we per positie tonen. Wat het belangrijkst is, staat bovenaan.
export const GROEPEN: Record<Positie, Groep[]> = {
  GKP: [KEEPER, VERDEDIGING, AANVAL],
  DEF: [VERDEDIGING, AANVAL],
  MID: [AANVAL, VERDEDIGING],
  FWD: [AANVAL, VERDEDIGING],
};

const heelGetal = new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 0 });
const tweeDecimalen = new Intl.NumberFormat("nl-BE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** De waarde die we tonen en waarop we sorteren: totaal of per 90 minuten. */
export function waarde(cijfers: Cijfers, kolom: Statistiek, per90: boolean) {
  if (!per90 || kolom === "minuten") {
    return cijfers[kolom];
  }
  return cijfers.minuten > 0 ? (cijfers[kolom] / cijfers.minuten) * 90 : 0;
}

/** Getal als tekst: xG, xA en alles per 90 met 2 decimalen, de rest zonder. */
export function formatteer(kolom: Statistiek, getal: number, per90: boolean) {
  const metDecimalen = kolom === "xg" || kolom === "xa" || (per90 && kolom !== "minuten");
  return (metDecimalen ? tweeDecimalen : heelGetal).format(getal);
}

// ---- Vergelijken met spelers op dezelfde positie ----

/** Met minder minuten zeggen cijfers per 90 te weinig: één goede invalbeurt geeft dan een topcijfer. */
export const MIN_MINUTEN_VERGELIJKING = 270;

export type Vergelijking = {
  aantal: number; // met hoeveel spelers we vergelijken
  // percentiel 80 = beter dan 80% van de spelers op zijn positie
  percentielen: Partial<Record<Statistiek, number>>;
};

/**
 * Hoe goed is deze speler per 90 minuten, vergeleken met de anderen op zijn positie?
 * We vergelijken alleen met spelers die genoeg minuten maakten.
 */
export function vergelijk(speler: Speler, spelers: Speler[]): Vergelijking {
  const anderen = spelers.filter(
    (s) => s.positie === speler.positie && s.minuten >= MIN_MINUTEN_VERGELIJKING && s.id !== speler.id,
  );

  const percentielen: Vergelijking["percentielen"] = {};
  if (anderen.length > 0) {
    for (const groep of GROEPEN[speler.positie]) {
      for (const sleutel of groep.kolommen) {
        const eigen = waarde(speler, sleutel, true);
        const lager = anderen.filter((s) => waarde(s, sleutel, true) < eigen).length;
        const gelijk = anderen.filter((s) => waarde(s, sleutel, true) === eigen).length;
        // Wie gelijk staat telt voor de helft mee: zo kom je met een gedeelde plaats in het midden uit
        percentielen[sleutel] = Math.round(((lager + gelijk / 2) / anderen.length) * 100);
      }
    }
  }
  return { aantal: anderen.length, percentielen };
}
