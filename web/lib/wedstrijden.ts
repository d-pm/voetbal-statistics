import { cacheLife } from "next/cache";
import { haalCompetitieOp } from "./competitie";
import { haalOp, type FplWedstrijd } from "./fpl";

export type Wedstrijd = {
  id: number;
  speeldag: number | null; // null = uitgesteld, nog geen nieuwe datum
  aftrap: string | null; // tijdstip in UTC
  thuis: string; // afkorting, bv. "ARS"
  thuisNaam: string;
  uit: string;
  uitNaam: string;
  thuisScore: number | null;
  uitScore: number | null;
  status: "gepland" | "bezig" | "afgelopen";
};

/** Alle 380 wedstrijden van het seizoen, gespeeld en nog te spelen, in volgorde van aftrap. */
export async function haalWedstrijdenOp(): Promise<Wedstrijd[]> {
  "use cache";
  cacheLife("hours");

  // Promise.all = start beide aanvragen tegelijk en wacht tot ze allebei klaar zijn
  const [wedstrijden, competitie] = await Promise.all([haalOp<FplWedstrijd[]>("fixtures"), haalCompetitieOp()]);
  const teams = new Map(competitie.teams.map((team) => [team.fplId, team]));

  return wedstrijden
    .map((w): Wedstrijd => {
      const thuis = teams.get(w.team_h)!;
      const uit = teams.get(w.team_a)!;
      return {
        id: w.id,
        speeldag: w.event,
        aftrap: w.kickoff_time,
        thuis: thuis.afkorting,
        thuisNaam: thuis.naam,
        uit: uit.afkorting,
        uitNaam: uit.naam,
        thuisScore: w.team_h_score,
        uitScore: w.team_a_score,
        status: w.finished ? "afgelopen" : w.started ? "bezig" : "gepland",
      };
    })
    .sort((a, b) => (a.aftrap ?? "9").localeCompare(b.aftrap ?? "9")); // zonder datum achteraan
}
