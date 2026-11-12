import { cacheLife } from "next/cache";
import { haalOp, type FplBasisdata, type FplPositie } from "./fpl";

export type Positie = FplPositie;

/** fit = kan spelen, twijfel = misschien, afwezig = geblesseerd of geschorst */
export type Beschikbaarheid = "fit" | "twijfel" | "afwezig";

export type Speler = {
  id: number; // vaste FPL-code: blijft hetzelfde over seizoenen
  fplId: number; // het nummer van dit seizoen, nodig om zijn wedstrijden op te vragen
  naam: string; // korte naam, bv. "Saka"
  volledigeNaam: string;
  team: string; // afkorting, bv. "ARS"
  teamNaam: string;
  positie: Positie;
  leeftijd: number | null;
  beschikbaarheid: Beschikbaarheid;
  kans: number | null; // kans in % dat hij de volgende speeldag speelt, als FPL die kent
  nieuws: string; // blessures, schorsingen, ... (in het Engels, zoals FPL het geeft)
  basisplaatsen: number;
  minuten: number;
  goals: number;
  assists: number;
  xg: number;
  xa: number;
  tackles: number;
  recoveries: number;
  cbi: number; // clearances, blocks en interceptions
  saves: number;
  cleanSheets: number;
};

export type Team = { fplId: number; afkorting: string; naam: string };

export type Speeldag = {
  nr: number;
  deadline: string; // tijdstip in UTC: daarna begint de speeldag
  afgelopen: boolean;
};

export type Competitie = {
  seizoen: string; // "2026/27"
  huidigeSpeeldag: number | null; // de laatste speeldag die begonnen is
  volgendeSpeeldag: number | null;
  speeldagen: Speeldag[];
  teams: Team[];
  spelers: Speler[];
  bijgewerktOp: string; // tijdstip waarop de data opgehaald werd
};

/**
 * Haalt de hele competitie op: spelers met hun seizoenscijfers, teams en speeldagen.
 *
 * Voorlopig rechtstreeks bij de FPL API. Later lezen we hier uit onze eigen database
 * (Supabase), en de rest van de website blijft hetzelfde.
 *
 * "use cache" + cacheLife("hours"): de website vraagt de data hoogstens ongeveer
 * één keer per uur op, hoeveel bezoekers er ook zijn.
 */
export async function haalCompetitieOp(): Promise<Competitie> {
  "use cache";
  cacheLife("hours");

  const data = await haalOp<FplBasisdata>("bootstrap-static");

  // Opzoektabellen: team-id -> team, positie-id -> "DEF"
  const teams = new Map(data.teams.map((team) => [team.id, team]));
  const posities = new Map(data.element_types.map((pos) => [pos.id, pos.singular_name_short]));
  const nu = new Date();

  const spelers: Speler[] = data.elements
    // "u" = weg bij de club (verkocht of uitgeleend). Die kun je niet meer aanraden.
    .filter((p) => p.status !== "u")
    .map((p) => {
      const team = teams.get(p.team)!; // "!" = we weten zeker dat het team bestaat
      return {
        id: p.code,
        fplId: p.id,
        naam: p.web_name,
        volledigeNaam: `${p.first_name} ${p.second_name}`,
        team: team.short_name,
        teamNaam: team.name,
        positie: posities.get(p.element_type)!,
        leeftijd: berekenLeeftijd(p.birth_date, nu),
        beschikbaarheid: p.status === "a" ? "fit" : p.status === "d" ? "twijfel" : "afwezig",
        kans: p.chance_of_playing_next_round,
        nieuws: p.news,
        basisplaatsen: p.starts,
        minuten: p.minutes,
        goals: p.goals_scored,
        assists: p.assists,
        xg: Number(p.expected_goals),
        xa: Number(p.expected_assists),
        tackles: p.tackles,
        recoveries: p.recoveries,
        cbi: p.clearances_blocks_interceptions,
        saves: p.saves,
        cleanSheets: p.clean_sheets,
      };
    });

  const startjaar = Number(data.events[0].deadline_time.slice(0, 4));

  return {
    seizoen: `${startjaar}/${String((startjaar + 1) % 100).padStart(2, "0")}`,
    huidigeSpeeldag: data.events.find((dag) => dag.is_current)?.id ?? null,
    volgendeSpeeldag: data.events.find((dag) => dag.is_next)?.id ?? null,
    speeldagen: data.events.map((dag) => ({ nr: dag.id, deadline: dag.deadline_time, afgelopen: dag.finished })),
    teams: data.teams.map((team) => ({ fplId: team.id, afkorting: team.short_name, naam: team.name })),
    spelers,
    bijgewerktOp: nu.toISOString(),
  };
}

/** "2001-03-24" -> 25. Geeft null terug als de geboortedatum onbekend is. */
export function berekenLeeftijd(geboortedatum: string | null, vandaag: Date): number | null {
  if (!geboortedatum) {
    return null;
  }
  const [jaar, maand, dag] = geboortedatum.split("-").map(Number);
  let leeftijd = vandaag.getFullYear() - jaar;

  const huidigeMaand = vandaag.getMonth() + 1; // getMonth() telt vanaf 0
  if (huidigeMaand < maand || (huidigeMaand === maand && vandaag.getDate() < dag)) {
    leeftijd -= 1; // dit jaar nog niet jarig geweest
  }
  return leeftijd;
}
