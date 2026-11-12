"use client";

import { useSyncExternalStore } from "react";

// Onthoudt de laatste zoekopdracht in de scoutingdatabase, bv. "/spelers?positie=DEF".
// Zo brengen de knop "‹ Spelers" op een profiel en de tab "Spelers" je terug naar je
// eigen lijst, en niet naar een lege. Het staat in sessionStorage: dat vergeet de
// browser vanzelf als je het tabblad sluit.

const SLEUTEL = "laatste-zoekopdracht";
const STANDAARD = "/spelers";
const luisteraars = new Set<() => void>();

export function onthoudZoekopdracht(adres: string) {
  try {
    sessionStorage.setItem(SLEUTEL, adres);
  } catch {
    // sessionStorage kan geblokkeerd zijn, bv. in een privévenster. Dan onthouden we gewoon niets.
  }
  luisteraars.forEach((luisteraar) => luisteraar());
}

function luister(luisteraar: () => void) {
  luisteraars.add(luisteraar);
  return () => {
    luisteraars.delete(luisteraar);
  };
}

function lees() {
  try {
    return sessionStorage.getItem(SLEUTEL) ?? STANDAARD;
  } catch {
    return STANDAARD;
  }
}

/** Het adres van de laatste zoekopdracht. Op de server (en de eerste keer) is dat gewoon /spelers. */
export function useLaatsteZoekopdracht() {
  return useSyncExternalStore(luister, lees, () => STANDAARD);
}
