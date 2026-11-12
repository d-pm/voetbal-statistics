import type { Wedstrijd } from "./wedstrijden";

// De rangschikking van de competitie, uitgerekend uit de uitslagen.

export type Standrij = {
  team: string; // afkorting
  teamNaam: string;
  gespeeld: number;
  punten: number;
  doelsaldo: number;
  gemaakt: number;
};

/**
 * Rekent de stand uit met alle afgelopen wedstrijden vóór een speeldag.
 * 3 punten voor winst, 1 voor gelijk. Bij gelijke punten: eerst doelsaldo, dan gemaakte goals.
 */
export function berekenStand(wedstrijden: Wedstrijd[], voorSpeeldag: number): Standrij[] {
  const rijen = new Map<string, Standrij>();
  function rij(team: string, teamNaam: string) {
    if (!rijen.has(team)) {
      rijen.set(team, { team, teamNaam, gespeeld: 0, punten: 0, doelsaldo: 0, gemaakt: 0 });
    }
    return rijen.get(team)!;
  }

  for (const w of wedstrijden) {
    const thuis = rij(w.thuis, w.thuisNaam);
    const uit = rij(w.uit, w.uitNaam);
    const telt = w.status === "afgelopen" && w.speeldag !== null && w.speeldag < voorSpeeldag;
    if (!telt || w.thuisScore === null || w.uitScore === null) {
      continue;
    }
    for (const [team, voor, tegen] of [
      [thuis, w.thuisScore, w.uitScore],
      [uit, w.uitScore, w.thuisScore],
    ] as const) {
      team.gespeeld += 1;
      team.gemaakt += voor;
      team.doelsaldo += voor - tegen;
      team.punten += voor > tegen ? 3 : voor === tegen ? 1 : 0;
    }
  }

  return [...rijen.values()].sort(
    (a, b) => b.punten - a.punten || b.doelsaldo - a.doelsaldo || b.gemaakt - a.gemaakt || a.teamNaam.localeCompare(b.teamNaam),
  );
}
