import type { Positie, Speler } from "./competitie";
import { KOLOMMEN, waarde, type Statistiek } from "./statistieken";

// De filters van de scoutingdatabase: wat ze zijn, hoe ze in het adres (de URL)
// van de pagina staan, en hoe we er de lijst met spelers mee filteren en sorteren.
//
// Omdat de filters in de URL staan, kun je een zoekopdracht delen of bewaren:
// /spelers?positie=DEF&leeftijd=23&per90=1&sorteer=tackles

export type SorteerKolom = Statistiek | "naam" | "leeftijd";

export type Filters = {
  positie: Positie | "ALLE";
  team: string; // afkorting, of "ALLE"
  maxLeeftijd: number | null; // null = geen grens
  minMinuten: number | null;
  alleenFit: boolean; // verberg wie geblesseerd of geschorst is
  per90: boolean;
  sorteer: SorteerKolom;
  aflopend: boolean; // hoogste eerst
};

export const STANDAARD: Filters = {
  positie: "ALLE",
  team: "ALLE",
  maxLeeftijd: null,
  minMinuten: 270,
  alleenFit: false,
  per90: false,
  sorteer: "xg",
  aflopend: true,
};

const POSITIES: string[] = ["GKP", "DEF", "MID", "FWD"];
const SORTEERKOLOMMEN: string[] = ["naam", "leeftijd", ...KOLOMMEN.map((kolom) => kolom.sleutel)];

/** Getallen sorteren we standaard van hoog naar laag, namen van A tot Z. */
export function standaardAflopend(kolom: SorteerKolom) {
  return kolom !== "naam";
}

function leesGetal(tekst: string | null): number | null {
  if (tekst === null || tekst.trim() === "") {
    return null;
  }
  const getal = Number(tekst);
  return Number.isFinite(getal) && getal >= 0 ? Math.floor(getal) : null;
}

/** "positie=DEF&leeftijd=23" -> filters. Wat ontbreekt of niet klopt, krijgt de standaardwaarde. */
export function leesFilters(zoek: string): Filters {
  const params = new URLSearchParams(zoek);

  const positie = params.get("positie")?.toUpperCase() ?? "";
  const sorteer = params.get("sorteer") ?? "";
  const kolom = SORTEERKOLOMMEN.includes(sorteer) ? (sorteer as SorteerKolom) : STANDAARD.sorteer;
  const volgorde = params.get("volgorde"); // "op" = oplopend, "af" = aflopend

  return {
    positie: POSITIES.includes(positie) ? (positie as Positie) : "ALLE",
    team: params.get("team")?.toUpperCase() || "ALLE",
    maxLeeftijd: leesGetal(params.get("leeftijd")),
    minMinuten: params.has("minuten") ? leesGetal(params.get("minuten")) : STANDAARD.minMinuten,
    alleenFit: params.get("fit") === "1",
    per90: params.get("per90") === "1",
    sorteer: kolom,
    aflopend: volgorde === "op" ? false : volgorde === "af" ? true : standaardAflopend(kolom),
  };
}

/** Filters -> "positie=DEF&leeftijd=23". Standaardwaarden laten we weg, zo blijft de URL kort. */
export function schrijfFilters(filters: Filters): string {
  const params = new URLSearchParams();
  if (filters.positie !== "ALLE") params.set("positie", filters.positie);
  if (filters.team !== "ALLE") params.set("team", filters.team);
  if (filters.maxLeeftijd !== null) params.set("leeftijd", String(filters.maxLeeftijd));
  if (filters.minMinuten !== STANDAARD.minMinuten) params.set("minuten", String(filters.minMinuten ?? 0));
  if (filters.alleenFit) params.set("fit", "1");
  if (filters.per90) params.set("per90", "1");
  if (filters.sorteer !== STANDAARD.sorteer) params.set("sorteer", filters.sorteer);
  if (filters.aflopend !== standaardAflopend(filters.sorteer)) params.set("volgorde", filters.aflopend ? "af" : "op");
  return params.toString();
}

/** Staat er een filter aan? Sorteren en "per 90" tellen niet mee: die verbergen niemand. */
export function isGefilterd(filters: Filters, zoekterm: string) {
  return (
    zoekterm.trim() !== "" ||
    filters.positie !== STANDAARD.positie ||
    filters.team !== STANDAARD.team ||
    filters.maxLeeftijd !== STANDAARD.maxLeeftijd ||
    filters.minMinuten !== STANDAARD.minMinuten ||
    filters.alleenFit !== STANDAARD.alleenFit
  );
}

/** Hoeveel van de verborgen filters (team, leeftijd, minuten, beschikbaar) staan er anders dan standaard? */
export function aantalFilters(filters: Filters) {
  return [
    filters.team !== STANDAARD.team,
    filters.maxLeeftijd !== STANDAARD.maxLeeftijd,
    filters.minMinuten !== STANDAARD.minMinuten,
    filters.alleenFit !== STANDAARD.alleenFit,
  ].filter(Boolean).length;
}

/** "Ødegaard" -> "odegaard": zo vind je een speler ook als je de accenten niet typt. */
export function zonderAccenten(tekst: string) {
  return tekst
    .normalize("NFD") // splitst "é" in "e" + een los accent
    .replace(/[̀-ͯ]/g, "") // gooit de losse accenten weg
    .replace(/ø/gi, "o")
    .replace(/æ/gi, "ae")
    .replace(/ß/g, "ss")
    .replace(/ł/gi, "l")
    .replace(/đ/gi, "d")
    .toLowerCase();
}

/** Geeft de spelers terug die bij de filters en de zoekterm passen, in de gevraagde volgorde. */
export function pasToe(spelers: Speler[], filters: Filters, zoekterm = ""): Speler[] {
  const zoek = zonderAccenten(zoekterm.trim());
  // Zoek je op naam, dan telt het minimum aantal minuten niet: je wilt de speler vinden, ook als hij weinig speelde
  const minuten = zoek === "" ? (filters.minMinuten ?? 0) : 0;

  const gefilterd = spelers.filter(
    (s) =>
      (zoek === "" || zonderAccenten(`${s.naam} ${s.volledigeNaam} ${s.teamNaam}`).includes(zoek)) &&
      (filters.positie === "ALLE" || s.positie === filters.positie) &&
      (filters.team === "ALLE" || s.team === filters.team) &&
      (filters.maxLeeftijd === null || (s.leeftijd !== null && s.leeftijd <= filters.maxLeeftijd)) &&
      (!filters.alleenFit || s.beschikbaarheid !== "afwezig") &&
      s.minuten >= minuten,
  );

  const richting = filters.aflopend ? -1 : 1;
  const kolom = filters.sorteer;
  return gefilterd.sort((a, b) => {
    if (kolom === "naam") {
      return richting * a.naam.localeCompare(b.naam, "nl");
    }
    if (kolom === "leeftijd") {
      if (a.leeftijd === null || b.leeftijd === null) {
        // spelers zonder geboortedatum altijd onderaan
        return (a.leeftijd === null ? 1 : 0) - (b.leeftijd === null ? 1 : 0);
      }
      return richting * (a.leeftijd - b.leeftijd);
    }
    // Bij een gelijke stand: wie het meest speelde eerst, zo blijft de volgorde altijd dezelfde
    return (
      richting * (waarde(a, kolom, filters.per90) - waarde(b, kolom, filters.per90)) || b.minuten - a.minuten
    );
  });
}
