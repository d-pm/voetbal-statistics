import { cacheLife } from "next/cache";

const FPL_URL = "https://fantasy.premierleague.com/api/bootstrap-static/";

export type Positie = "GKP" | "DEF" | "MID" | "FWD";

export type Speler = {
  id: number; // vaste FPL-code: blijft hetzelfde over seizoenen
  naam: string;
  team: string; // afkorting, bv. "ARS"
  teamNaam: string;
  positie: Positie;
  leeftijd: number | null;
  nieuws: string; // blessures, schorsingen, ...
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

export type Scoutingdata = {
  spelers: Speler[];
  seizoen: string; // "2026/27"
  speeldag: number | null;
  bijgewerktOp: string; // tijdstip waarop de data opgehaald werd
};

// Alleen de velden van de FPL API die we gebruiken
type FplData = {
  events: { id: number; deadline_time: string; is_current: boolean }[];
  teams: { id: number; name: string; short_name: string }[];
  element_types: { id: number; singular_name_short: Positie }[];
  elements: {
    code: number;
    web_name: string;
    team: number;
    element_type: number;
    birth_date: string | null;
    news: string;
    minutes: number;
    goals_scored: number;
    assists: number;
    expected_goals: string; // komt binnen als tekst, bv. "1.23"
    expected_assists: string;
    tackles: number;
    recoveries: number;
    clearances_blocks_interceptions: number;
    saves: number;
    clean_sheets: number;
  }[];
};

/**
 * Haalt alle Premier League-spelers op.
 *
 * Voorlopig rechtstreeks bij de FPL API, maar alleen op de server. Later lezen we
 * hier uit onze eigen database (Supabase), en de rest van de website blijft hetzelfde.
 *
 * "use cache" + cacheLife("hours"): de website vraagt de data hoogstens ongeveer
 * één keer per uur op, hoeveel bezoekers er ook zijn.
 */
export async function haalSpelersOp(): Promise<Scoutingdata> {
  "use cache";
  cacheLife("hours");

  const antwoord = await fetch(FPL_URL);
  if (!antwoord.ok) {
    throw new Error(`De FPL API antwoordde met status ${antwoord.status}`);
  }
  const data: FplData = await antwoord.json();

  // Opzoektabellen: team-id -> team, positie-id -> "DEF"
  const teams = new Map(data.teams.map((team) => [team.id, team]));
  const posities = new Map(data.element_types.map((pos) => [pos.id, pos.singular_name_short]));
  const nu = new Date();

  const spelers: Speler[] = data.elements.map((p) => {
    const team = teams.get(p.team)!; // "!" = we weten zeker dat het team bestaat
    return {
      id: p.code,
      naam: p.web_name,
      team: team.short_name,
      teamNaam: team.name,
      positie: posities.get(p.element_type)!,
      leeftijd: berekenLeeftijd(p.birth_date, nu),
      nieuws: p.news,
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
    spelers,
    seizoen: `${startjaar}/${String((startjaar + 1) % 100).padStart(2, "0")}`,
    speeldag: data.events.find((event) => event.is_current)?.id ?? null,
    bijgewerktOp: nu.toISOString(),
  };
}

/** "2001-03-24" -> 25. Geeft null terug als de geboortedatum onbekend is. */
function berekenLeeftijd(geboortedatum: string | null, vandaag: Date): number | null {
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
