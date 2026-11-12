"use client";

import { useSyncExternalStore } from "react";

// Jouw scoutcarrière: je eigen scoutnummer, je keuzes en je scores.
//
// Voorlopig bewaren we dit in de browser (localStorage). Het blijft dus staan als je
// de site later opnieuw opent, maar alleen op dit toestel en in deze browser.
// Zodra er accounts zijn (Supabase), verhuist dit naar de database.

export type Keuze = {
  spelerId: number;
  gekozenOp: string; // tijdstip
  scoutscore?: number; // ingevuld zodra de speeldag beoordeeld is
};

export type Carriere = {
  scoutId: string; // jouw eigen nummer: daarmee krijg je je eigen opdrachten
  keuzes: Record<number, Keuze>; // speeldag -> je keuze
};

const SLEUTEL = "voetbal-scout:carriere:v1";
const luisteraars = new Set<() => void>();

// useSyncExternalStore wil telkens precies hetzelfde object terug zolang er niets veranderde
let laatsteTekst: string | null = null;
let laatsteCarriere: Carriere | null = null;

function nieuweCarriere(): Carriere {
  return { scoutId: crypto.randomUUID(), keuzes: {} };
}

function lees(): Carriere | null {
  let tekst: string | null;
  try {
    tekst = localStorage.getItem(SLEUTEL);
    if (tekst === null) {
      // De eerste keer: maak je scoutnummer aan
      tekst = JSON.stringify(nieuweCarriere());
      localStorage.setItem(SLEUTEL, tekst);
    }
  } catch {
    // Opslag geblokkeerd (bv. privévenster): dan speel je zonder te bewaren
    if (!laatsteCarriere) {
      laatsteCarriere = nieuweCarriere();
    }
    return laatsteCarriere;
  }

  if (tekst !== laatsteTekst) {
    laatsteTekst = tekst;
    try {
      laatsteCarriere = JSON.parse(tekst) as Carriere;
    } catch {
      laatsteCarriere = nieuweCarriere(); // kapotte gegevens: begin opnieuw
    }
  }
  return laatsteCarriere;
}

function schrijf(carriere: Carriere) {
  laatsteCarriere = carriere;
  try {
    laatsteTekst = JSON.stringify(carriere);
    localStorage.setItem(SLEUTEL, laatsteTekst);
  } catch {
    // niet bewaard, maar wel bijgewerkt voor deze bezoek
  }
  luisteraars.forEach((luisteraar) => luisteraar());
}

function luister(luisteraar: () => void) {
  luisteraars.add(luisteraar);
  // Ook als je in een ander tabblad een keuze maakt
  window.addEventListener("storage", luisteraar);
  return () => {
    luisteraars.delete(luisteraar);
    window.removeEventListener("storage", luisteraar);
  };
}

/** Je carrière. Op de server (en heel even bij het laden) is die er nog niet: dan krijg je null. */
export function useCarriere() {
  return useSyncExternalStore(luister, lees, () => null);
}

/** Raad een speler aan voor een speeldag (of verander je keuze). */
export function bewaarKeuze(speeldag: number, spelerId: number) {
  const carriere = lees() ?? nieuweCarriere();
  schrijf({
    ...carriere,
    keuzes: { ...carriere.keuzes, [speeldag]: { spelerId, gekozenOp: new Date().toISOString() } },
  });
}

/** Onthoud de scoutscore van een speeldag, zodat het overzicht hem kan tonen. */
export function bewaarScore(speeldag: number, scoutscore: number) {
  const carriere = lees();
  const keuze = carriere?.keuzes[speeldag];
  if (!carriere || !keuze || keuze.scoutscore === scoutscore) {
    return;
  }
  schrijf({ ...carriere, keuzes: { ...carriere.keuzes, [speeldag]: { ...keuze, scoutscore } } });
}
