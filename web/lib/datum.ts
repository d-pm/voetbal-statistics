// Datums en uren tonen zoals in België: in het Nederlands en in onze tijdzone.
// De FPL API geeft alles in UTC, bv. "2026-11-21T12:30:00Z".

const TIJDZONE = "Europe/Brussels";

const dagEnDatum = new Intl.DateTimeFormat("nl-BE", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: TIJDZONE,
});
const korteDatum = new Intl.DateTimeFormat("nl-BE", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: TIJDZONE,
});
const uur = new Intl.DateTimeFormat("nl-BE", { hour: "2-digit", minute: "2-digit", timeZone: TIJDZONE });
const datumEnUur = new Intl.DateTimeFormat("nl-BE", { dateStyle: "medium", timeStyle: "short", timeZone: TIJDZONE });

/** "zaterdag 21 november" */
export function toonDag(tijdstip: string) {
  return dagEnDatum.format(new Date(tijdstip));
}

/** "za 21 nov" */
export function toonKorteDag(tijdstip: string) {
  return korteDatum.format(new Date(tijdstip));
}

/** "13:30" */
export function toonUur(tijdstip: string) {
  return uur.format(new Date(tijdstip));
}

/** "21 nov 2026, 13:30" */
export function toonDatumEnUur(tijdstip: string) {
  return datumEnUur.format(new Date(tijdstip));
}

/**
 * "2001-03-24" -> 25. Geeft null terug als de geboortedatum onbekend is.
 * We rekenen in UTC, zodat de server en elke browser altijd hetzelfde antwoord geven.
 */
export function berekenLeeftijd(geboortedatum: string | null, vandaag: Date): number | null {
  if (!geboortedatum) {
    return null;
  }
  const [jaar, maand, dag] = geboortedatum.split("-").map(Number);
  let leeftijd = vandaag.getUTCFullYear() - jaar;

  const huidigeMaand = vandaag.getUTCMonth() + 1; // getUTCMonth() telt vanaf 0
  if (huidigeMaand < maand || (huidigeMaand === maand && vandaag.getUTCDate() < dag)) {
    leeftijd -= 1; // dit jaar nog niet jarig geweest
  }
  return leeftijd;
}
