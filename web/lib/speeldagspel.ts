import { cacheLife } from "next/cache";
import { haalCompetitieOp, type Positie } from "./competitie";
import { haalOp } from "./fpl";
import type { Context } from "./spel";
import { berekenStand } from "./stand";
import type { Cijfers } from "./statistieken";
import { haalWedstrijdenOp } from "./wedstrijden";

// Alles wat de opdrachtpagina van één speeldag nodig heeft:
// - de spelers met hun cijfers van vóór die speeldag (daarmee kies je)
// - de cijfers ín die speeldag (daarmee word je beoordeeld)

type FplLive = {
  elements: {
    id: number;
    stats: {
      minutes: number;
      goals_scored: number;
      assists: number;
      expected_goals: string;
      expected_assists: string;
      tackles: number;
      recoveries: number;
      clearances_blocks_interceptions: number;
      saves: number;
      clean_sheets: number;
    };
  }[];
};

/** Een speler zoals hij er vóór de speeldag voor stond. */
export type Kandidaat = Cijfers & {
  id: number;
  naam: string;
  team: string;
  teamNaam: string;
  positie: Positie;
  geboortedatum: string | null;
  nieuws: string; // alleen bij een speeldag die nog moet beginnen: oud nieuws zegt niets meer
};

export type Speeldagspel = {
  context: Context;
  seizoen: string;
  afgelopen: boolean; // alle wedstrijden gespeeld en nagekeken
  spelers: Kandidaat[];
  uitslag: Record<number, Cijfers> | null; // speler-id -> cijfers in deze speeldag; null = nog niet begonnen
};

const NUL: Cijfers = {
  minuten: 0,
  goals: 0,
  assists: 0,
  xg: 0,
  xa: 0,
  tackles: 0,
  recoveries: 0,
  cbi: 0,
  saves: 0,
  cleanSheets: 0,
};

/** Wat elke speler deed in één speeldag. Sleutel = het FPL-nummer van dit seizoen. */
async function haalSpeeldagCijfersOp(nr: number, afgelopen: boolean): Promise<Record<number, Cijfers>> {
  "use cache";
  // Een afgewerkte speeldag verandert niet meer: die mag lang bewaard worden
  if (afgelopen) {
    cacheLife("weeks");
  } else {
    cacheLife("minutes");
  }

  const data = await haalOp<FplLive>(`event/${nr}/live`);
  const cijfers: Record<number, Cijfers> = {};
  for (const { id, stats } of data.elements) {
    if (stats.minutes > 0) {
      cijfers[id] = {
        minuten: stats.minutes,
        goals: stats.goals_scored,
        assists: stats.assists,
        xg: Number(stats.expected_goals),
        xa: Number(stats.expected_assists),
        tackles: stats.tackles,
        recoveries: stats.recoveries,
        cbi: stats.clearances_blocks_interceptions,
        saves: stats.saves,
        cleanSheets: stats.clean_sheets,
      };
    }
  }
  return cijfers;
}

function telOp(a: Cijfers, b: Cijfers): Cijfers {
  const som = { ...a };
  for (const sleutel of Object.keys(NUL) as (keyof Cijfers)[]) {
    som[sleutel] += b[sleutel];
  }
  return som;
}

/** Geeft null terug als de speeldag niet bestaat. */
export async function haalSpeeldagspelOp(nr: number): Promise<Speeldagspel | null> {
  "use cache";
  cacheLife("hours");

  const [competitie, wedstrijden] = await Promise.all([haalCompetitieOp(), haalWedstrijdenOp()]);
  const speeldag = competitie.speeldagen.find((dag) => dag.nr === nr);
  if (!speeldag) {
    return null;
  }

  // Is de speeldag al begonnen? Dan bestaat er een uitslag (misschien nog voorlopig).
  const begonnen = competitie.huidigeSpeeldag !== null && nr <= competitie.huidigeSpeeldag;

  // De cijfers van vóór deze speeldag: alle eerdere speeldagen opgeteld.
  // Voor de speeldag die nog moet komen zijn dat gewoon de seizoenscijfers.
  let voorAf: Map<number, Cijfers>;
  if (!begonnen) {
    voorAf = new Map(competitie.spelers.map((s) => [s.fplId, s]));
  } else {
    const eerdere = await Promise.all(
      competitie.speeldagen.filter((dag) => dag.nr < nr).map((dag) => haalSpeeldagCijfersOp(dag.nr, dag.afgelopen)),
    );
    voorAf = new Map();
    for (const speeldagCijfers of eerdere) {
      for (const [id, cijfers] of Object.entries(speeldagCijfers)) {
        voorAf.set(Number(id), telOp(voorAf.get(Number(id)) ?? NUL, cijfers));
      }
    }
  }

  const spelers: Kandidaat[] = competitie.spelers.map((s) => {
    const c = voorAf.get(s.fplId) ?? NUL;
    return {
      id: s.id,
      naam: s.naam,
      team: s.team,
      teamNaam: s.teamNaam,
      positie: s.positie,
      geboortedatum: s.geboortedatum,
      nieuws: begonnen ? "" : s.nieuws,
      minuten: c.minuten,
      goals: c.goals,
      assists: c.assists,
      xg: Math.round(c.xg * 100) / 100,
      xa: Math.round(c.xa * 100) / 100,
      tackles: c.tackles,
      recoveries: c.recoveries,
      cbi: c.cbi,
      saves: c.saves,
      cleanSheets: c.cleanSheets,
    };
  });

  let uitslag: Record<number, Cijfers> | null = null;
  if (begonnen) {
    const perFplId = await haalSpeeldagCijfersOp(nr, speeldag.afgelopen);
    uitslag = {};
    for (const s of competitie.spelers) {
      if (perFplId[s.fplId]) {
        uitslag[s.id] = perFplId[s.fplId];
      }
    }
  }

  // De topclubs: de 6 beste teams in de stand op het moment van de deadline
  const topclubs = berekenStand(wedstrijden, nr)
    .filter((rij) => rij.gespeeld > 0)
    .slice(0, 6)
    .map((rij) => rij.team);

  return {
    context: { speeldag: nr, deadline: speeldag.deadline, topclubs },
    seizoen: competitie.seizoen,
    afgelopen: speeldag.afgelopen,
    spelers,
    uitslag,
  };
}
