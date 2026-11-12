import { cacheLife } from "next/cache";
import { haalCompetitieOp, type Speler } from "./competitie";
import { haalOp, type FplSpelerdetails } from "./fpl";
import { vergelijk, type Cijfers, type Vergelijking } from "./statistieken";

/** Wat een speler in één wedstrijd deed. */
export type Wedstrijdcijfers = Cijfers & {
  speeldag: number;
  aftrap: string;
  tegenstander: string; // afkorting
  tegenstanderNaam: string;
  thuis: boolean;
  eigenScore: number | null;
  tegenScore: number | null;
  basis: boolean; // stond hij in de basis?
};

export type KomendeWedstrijd = {
  speeldag: number | null;
  aftrap: string | null;
  tegenstander: string;
  tegenstanderNaam: string;
  thuis: boolean;
};

export type Profiel = {
  speler: Speler;
  wedstrijden: Wedstrijdcijfers[]; // alle wedstrijden van zijn team, ook die waarin hij niet speelde
  komend: KomendeWedstrijd[];
  vergelijking: Vergelijking;
  seizoen: string;
};

/** De wedstrijden van één speler, zoals FPL ze geeft. Per speler apart bewaard, een uur lang. */
async function haalSpelerdetailsOp(fplId: number) {
  "use cache";
  cacheLife("hours");

  const details = await haalOp<FplSpelerdetails>(`element-summary/${fplId}`);
  // We bewaren alleen wat we tonen: zo blijft de cache klein
  return {
    history: details.history.map((w) => ({
      speeldag: w.round,
      aftrap: w.kickoff_time,
      tegenstander: w.opponent_team,
      thuis: w.was_home,
      thuisScore: w.team_h_score,
      uitScore: w.team_a_score,
      basis: w.starts > 0,
      minuten: w.minutes,
      goals: w.goals_scored,
      assists: w.assists,
      xg: Number(w.expected_goals),
      xa: Number(w.expected_assists),
      tackles: w.tackles,
      recoveries: w.recoveries,
      cbi: w.clearances_blocks_interceptions,
      saves: w.saves,
      cleanSheets: w.clean_sheets,
    })),
    fixtures: details.fixtures.map((w) => ({
      speeldag: w.event,
      aftrap: w.kickoff_time,
      thuis: w.is_home,
      tegenstander: w.is_home ? w.team_a : w.team_h,
    })),
  };
}

/**
 * Alles voor de profielpagina van één speler. "id" is zijn vaste FPL-code.
 * Geeft null terug als we de speler niet kennen.
 */
export async function haalProfielOp(id: number): Promise<Profiel | null> {
  const competitie = await haalCompetitieOp();
  const speler = competitie.spelers.find((s) => s.id === id);
  if (!speler) {
    return null;
  }

  const details = await haalSpelerdetailsOp(speler.fplId);
  const teams = new Map(competitie.teams.map((team) => [team.fplId, team]));

  return {
    speler,
    seizoen: competitie.seizoen,
    vergelijking: vergelijk(speler, competitie.spelers),
    wedstrijden: details.history.map(({ tegenstander, thuisScore, uitScore, ...rest }) => ({
      ...rest,
      tegenstander: teams.get(tegenstander)?.afkorting ?? "?",
      tegenstanderNaam: teams.get(tegenstander)?.naam ?? "Onbekend",
      eigenScore: rest.thuis ? thuisScore : uitScore,
      tegenScore: rest.thuis ? uitScore : thuisScore,
    })),
    komend: details.fixtures.slice(0, 5).map((w) => ({
      speeldag: w.speeldag,
      aftrap: w.aftrap,
      thuis: w.thuis,
      tegenstander: teams.get(w.tegenstander)?.afkorting ?? "?",
      tegenstanderNaam: teams.get(w.tegenstander)?.naam ?? "Onbekend",
    })),
  };
}
