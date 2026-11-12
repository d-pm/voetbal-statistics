"use client";

import { useSyncExternalStore } from "react";

// De klok van de bezoeker, in hele minuten. useSyncExternalStore laat React opnieuw
// tekenen telkens als de minuut verandert. Op de server kennen we de klok van de
// bezoeker niet: daar is het antwoord null.

function elkeHalveMinuut(seintje: () => void) {
  const wekker = setInterval(seintje, 30_000);
  return () => clearInterval(wekker);
}
const minutenNu = () => Math.floor(Date.now() / 60_000);
const opDeServer = () => null;

/** Het aantal minuten sinds 1970, of null op de server. */
export function useMinutenNu() {
  return useSyncExternalStore(elkeHalveMinuut, minutenNu, opDeServer);
}

/** Is dit tijdstip voorbij? null = we weten het nog niet (op de server). */
export function useIsVoorbij(tijdstip: string) {
  const nu = useMinutenNu();
  return nu === null ? null : nu >= Math.floor(new Date(tijdstip).getTime() / 60_000);
}
