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
