// De enige plek waar de website met de FPL API praat. Hier staat hoe de data
// er bij FPL uitziet. De andere bestanden in lib/ zetten ze om naar onze eigen vorm.
//
// Dit draait alleen op de server: de browser van een bezoeker praat nooit met FPL.

const BASIS_URL = "https://fantasy.premierleague.com/api";

// Zo weet de FPL-server wie er aanklopt. Dat is beleefd bij een API zonder sleutel.
const KOPTEKST = { "User-Agent": "voetbal-statistics (studentenproject, github.com/d-pm/voetbal-statistics)" };

const MAX_WACHTTIJD = 15_000; // milliseconden: daarna geven we het op

/** Vraagt één adres van de FPL API op, bv. "fixtures". */
export async function haalOp<T>(pad: string): Promise<T> {
  const antwoord = await fetch(`${BASIS_URL}/${pad}/`, {
    headers: KOPTEKST,
    signal: AbortSignal.timeout(MAX_WACHTTIJD),
  });
  if (!antwoord.ok) {
    throw new Error(`De FPL API antwoordde met status ${antwoord.status} op "${pad}"`);
  }
  return antwoord.json();
}

// Hieronder: alleen de velden die we gebruiken. FPL stuurt er veel meer.

export type FplPositie = "GKP" | "DEF" | "MID" | "FWD";

/** Wat een speler deed: zo heten de cijfers bij FPL, per seizoen én per wedstrijd. */
type FplCijfers = {
  minutes: number;
  starts: number;
  goals_scored: number;
  assists: number;
  expected_goals: string; // komt binnen als tekst, bv. "1.23"
  expected_assists: string;
  tackles: number;
  recoveries: number;
  clearances_blocks_interceptions: number;
  saves: number;
  clean_sheets: number;
};

export type FplBasisdata = {
  events: {
    id: number;
    deadline_time: string;
    finished: boolean;
    is_current: boolean;
    is_next: boolean;
  }[];
  teams: { id: number; name: string; short_name: string }[];
  element_types: { id: number; singular_name_short: FplPositie }[];
  elements: (FplCijfers & {
    id: number; // verandert elk seizoen
    code: number; // blijft altijd hetzelfde
    web_name: string;
    first_name: string;
    second_name: string;
    team: number;
    element_type: number;
    birth_date: string | null;
    status: string; // a = fit, d = twijfelachtig, i = geblesseerd, s = geschorst, u = weg bij de club
    chance_of_playing_next_round: number | null;
    news: string;
  })[];
};

export type FplWedstrijd = {
  id: number;
  event: number | null; // speeldag, of null als de wedstrijd uitgesteld is
  kickoff_time: string | null;
  started: boolean | null;
  finished: boolean;
  team_h: number;
  team_a: number;
  team_h_score: number | null;
  team_a_score: number | null;
};

export type FplSpelerdetails = {
  // Eén rij per wedstrijd van zijn team, ook als hij niet speelde
  history: (FplCijfers & {
    round: number;
    kickoff_time: string;
    opponent_team: number;
    was_home: boolean;
    team_h_score: number | null;
    team_a_score: number | null;
  })[];
  // De wedstrijden die nog komen
  fixtures: {
    event: number | null;
    kickoff_time: string | null;
    is_home: boolean;
    team_h: number;
    team_a: number;
  }[];
};
