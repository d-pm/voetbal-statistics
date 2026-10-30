import type { Positie, Speler } from "./spelers";

// Alles over de cijfers zelf: welke er zijn, hoe ze heten en hoe we ze tonen.
// De tabel en de spelerskaart gebruiken allebei dit bestand.

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

export const POSITIE_NAMEN: Record<Positie, string> = {
  GKP: "Keeper",
  DEF: "Verdediger",
  MID: "Middenvelder",
  FWD: "Aanvaller",
};

const heelGetal = new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 0 });
const tweeDecimalen = new Intl.NumberFormat("nl-BE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** De waarde die we tonen en waarop we sorteren: totaal of per 90 minuten. */
export function waarde(speler: Speler, kolom: Statistiek, per90: boolean) {
  if (!per90 || kolom === "minuten") {
    return speler[kolom];
  }
  return speler.minuten > 0 ? (speler[kolom] / speler.minuten) * 90 : 0;
}

/** Getal als tekst: xG, xA en alles per 90 met 2 decimalen, de rest zonder. */
export function formatteer(kolom: Statistiek, getal: number, per90: boolean) {
  const metDecimalen = kolom === "xg" || kolom === "xa" || (per90 && kolom !== "minuten");
  return (metDecimalen ? tweeDecimalen : heelGetal).format(getal);
}
