"use client"; // dit onderdeel draait in de browser, want het reageert op klikken en typen

import { useMemo, useState, type ReactNode } from "react";
import type { Positie, Speler } from "@/lib/spelers";

type Statistiek =
  | "minuten"
  | "goals"
  | "assists"
  | "xg"
  | "xa"
  | "tackles"
  | "recoveries"
  | "cbi"
  | "saves"
  | "cleanSheets";

type SorteerKolom = Statistiek | "naam" | "leeftijd";

const KOLOMMEN: { sleutel: Statistiek; label: string; uitleg: string }[] = [
  { sleutel: "minuten", label: "Min", uitleg: "Gespeelde minuten" },
  { sleutel: "goals", label: "G", uitleg: "Goals" },
  { sleutel: "assists", label: "A", uitleg: "Assists" },
  { sleutel: "xg", label: "xG", uitleg: "Verwachte goals" },
  { sleutel: "xa", label: "xA", uitleg: "Verwachte assists" },
  { sleutel: "tackles", label: "Tackles", uitleg: "Tackles" },
  { sleutel: "recoveries", label: "Recov.", uitleg: "Balrecuperaties" },
  { sleutel: "cbi", label: "CBI", uitleg: "Clearances, blocks en interceptions" },
  { sleutel: "saves", label: "Saves", uitleg: "Reddingen" },
  { sleutel: "cleanSheets", label: "CS", uitleg: "Clean sheets" },
];

const POSITIES: { waarde: Positie | "ALLE"; label: string }[] = [
  { waarde: "ALLE", label: "Alle" },
  { waarde: "GKP", label: "Keepers" },
  { waarde: "DEF", label: "Verdedigers" },
  { waarde: "MID", label: "Middenvelders" },
  { waarde: "FWD", label: "Aanvallers" },
];

const MAX_RIJEN = 100; // meer rijen tonen we pas als je erom vraagt

const heelGetal = new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 0 });
const tweeDecimalen = new Intl.NumberFormat("nl-BE", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** De waarde die we tonen en waarop we sorteren: totaal of per 90 minuten. */
function waarde(speler: Speler, kolom: Statistiek, per90: boolean) {
  if (!per90 || kolom === "minuten") {
    return speler[kolom];
  }
  return speler.minuten > 0 ? (speler[kolom] / speler.minuten) * 90 : 0;
}

export function ScoutingTabel({ spelers }: { spelers: Speler[] }) {
  // De filters: elke keer dat er één verandert, tekent React de tabel opnieuw
  const [zoekterm, setZoekterm] = useState("");
  const [positie, setPositie] = useState<Positie | "ALLE">("ALLE");
  const [team, setTeam] = useState("ALLE");
  const [maxLeeftijd, setMaxLeeftijd] = useState("");
  const [minMinuten, setMinMinuten] = useState("270");
  const [per90, setPer90] = useState(false);
  const [sortering, setSortering] = useState<{ kolom: SorteerKolom; aflopend: boolean }>({
    kolom: "xg",
    aflopend: true,
  });
  const [toonAlles, setToonAlles] = useState(false);

  // Alle teams voor de keuzelijst, alfabetisch
  const teams = useMemo(() => {
    const perAfkorting = new Map(spelers.map((s) => [s.team, s.teamNaam]));
    return [...perAfkorting].sort((a, b) => a[1].localeCompare(b[1]));
  }, [spelers]);

  // Filteren en sorteren. useMemo rekent dit alleen opnieuw uit als er iets veranderd is.
  const resultaat = useMemo(() => {
    const zoek = zoekterm.trim().toLowerCase();
    const leeftijdGrens = maxLeeftijd === "" ? null : Number(maxLeeftijd);
    const minutenGrens = Number(minMinuten) || 0;

    const gefilterd = spelers.filter(
      (s) =>
        (zoek === "" || s.naam.toLowerCase().includes(zoek)) &&
        (positie === "ALLE" || s.positie === positie) &&
        (team === "ALLE" || s.team === team) &&
        (leeftijdGrens === null || (s.leeftijd !== null && s.leeftijd <= leeftijdGrens)) &&
        s.minuten >= minutenGrens,
    );

    const richting = sortering.aflopend ? -1 : 1;
    return gefilterd.sort((a, b) => {
      if (sortering.kolom === "naam") {
        return richting * a.naam.localeCompare(b.naam);
      }
      if (sortering.kolom === "leeftijd") {
        if (a.leeftijd === null || b.leeftijd === null) {
          // spelers zonder geboortedatum altijd onderaan
          return (a.leeftijd === null ? 1 : 0) - (b.leeftijd === null ? 1 : 0);
        }
        return richting * (a.leeftijd - b.leeftijd);
      }
      return richting * (waarde(a, sortering.kolom, per90) - waarde(b, sortering.kolom, per90));
    });
  }, [spelers, zoekterm, positie, team, maxLeeftijd, minMinuten, per90, sortering]);

  function sorteerOp(kolom: SorteerKolom) {
    setSortering((huidig) =>
      huidig.kolom === kolom
        ? { kolom, aflopend: !huidig.aflopend } // nog eens klikken = andere richting
        : { kolom, aflopend: kolom !== "naam" }, // getallen: hoogste eerst, namen: A-Z
    );
  }

  const zichtbaar = toonAlles ? resultaat : resultaat.slice(0, MAX_RIJEN);

  return (
    <section>
      {/* ---- Filters ---- */}
      <div className="grid gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-5">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Positie">
          {POSITIES.map((p) => (
            <button
              key={p.waarde}
              type="button"
              onClick={() => setPositie(p.waarde)}
              aria-pressed={positie === p.waarde}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                positie === p.waarde
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Veld label="Zoek op naam" className="col-span-2 sm:col-span-1">
            <input
              type="search"
              value={zoekterm}
              onChange={(e) => setZoekterm(e.target.value)}
              placeholder="bv. Saka"
              className={invoerStijl}
            />
          </Veld>
          <Veld label="Team" className="col-span-2 sm:col-span-1">
            <select value={team} onChange={(e) => setTeam(e.target.value)} className={invoerStijl}>
              <option value="ALLE">Alle teams</option>
              {teams.map(([afkorting, naam]) => (
                <option key={afkorting} value={afkorting}>
                  {naam}
                </option>
              ))}
            </select>
          </Veld>
          <Veld label="Max. leeftijd">
            <input
              type="number"
              inputMode="numeric"
              min={15}
              max={45}
              value={maxLeeftijd}
              onChange={(e) => setMaxLeeftijd(e.target.value)}
              placeholder="geen"
              className={invoerStijl}
            />
          </Veld>
          <Veld label="Min. minuten">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={90}
              value={minMinuten}
              onChange={(e) => setMinMinuten(e.target.value)}
              className={invoerStijl}
            />
          </Veld>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800" role="group" aria-label="Weergave">
            {[
              { aan: false, label: "Totaal" },
              { aan: true, label: "Per 90 min" },
            ].map((optie) => (
              <button
                key={optie.label}
                type="button"
                onClick={() => setPer90(optie.aan)}
                aria-pressed={per90 === optie.aan}
                className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                  per90 === optie.aan
                    ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                    : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                {optie.label}
              </button>
            ))}
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400" aria-live="polite">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">{resultaat.length}</span>{" "}
            {resultaat.length === 1 ? "speler" : "spelers"}
          </p>
        </div>
      </div>

      {/* ---- Tabel ---- */}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[56rem] border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <KolomKop kolom="naam" label="Speler" sortering={sortering} onSorteer={sorteerOp} plakkend />
              <KolomKop kolom="leeftijd" label="Leeftijd" sortering={sortering} onSorteer={sorteerOp} rechts />
              {KOLOMMEN.map((k) => (
                <KolomKop
                  key={k.sleutel}
                  kolom={k.sleutel}
                  label={k.label}
                  uitleg={k.uitleg}
                  sortering={sortering}
                  onSorteer={sorteerOp}
                  rechts
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {zichtbaar.map((s) => (
              <tr
                key={s.id}
                className="group border-b border-zinc-100 last:border-0 hover:bg-emerald-50/60 dark:border-zinc-800/70 dark:hover:bg-emerald-950/30"
              >
                <td className={`sticky left-0 z-10 bg-white px-4 py-2.5 group-hover:bg-emerald-50 dark:bg-zinc-900 dark:group-hover:bg-emerald-950 ${scheidingslijn}`}>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-50">{s.naam}</span>
                    <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[11px] font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {s.team}
                    </span>
                    <span className="text-[11px] font-medium text-zinc-400">{s.positie}</span>
                  </div>
                  {s.nieuws && (
                    <p className="mt-0.5 max-w-[16rem] truncate text-xs text-amber-700 dark:text-amber-400" title={s.nieuws}>
                      ⚠ {s.nieuws}
                    </p>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-zinc-700 dark:text-zinc-300">
                  {s.leeftijd ?? "–"}
                </td>
                {KOLOMMEN.map((k) => {
                  const getal = waarde(s, k.sleutel, per90);
                  const metDecimalen = k.sleutel === "xg" || k.sleutel === "xa" || (per90 && k.sleutel !== "minuten");
                  return (
                    <td
                      key={k.sleutel}
                      className={`px-3 py-2.5 text-right tabular-nums ${
                        sortering.kolom === k.sleutel
                          ? "font-semibold text-emerald-700 dark:text-emerald-400"
                          : "text-zinc-700 dark:text-zinc-300"
                      }`}
                    >
                      {(metDecimalen ? tweeDecimalen : heelGetal).format(getal)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {resultaat.length === 0 && (
          <p className="px-4 py-10 text-center text-zinc-500">Geen spelers gevonden. Pas je filters aan.</p>
        )}
      </div>

      {!toonAlles && resultaat.length > MAX_RIJEN && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setToonAlles(true)}
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Toon alle {resultaat.length} spelers
          </button>
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-zinc-500">
        {KOLOMMEN.filter((k) => k.label !== k.uitleg)
          .map((k) => `${k.label} = ${k.uitleg.toLowerCase()}`)
          .join(" · ")}
      </p>
    </section>
  );
}

// Lijntje rechts van de spelerskolom, die blijft staan als je de tabel opzij scrolt
const scheidingslijn =
  "shadow-[inset_-1px_0_0_var(--color-zinc-200)] dark:shadow-[inset_-1px_0_0_var(--color-zinc-800)]";

const invoerStijl =
  "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-base text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 sm:text-sm dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100";

function Veld({ label, className = "", children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={`grid gap-1 ${className}`}>
      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">{label}</span>
      {children}
    </label>
  );
}

function KolomKop({
  kolom,
  label,
  uitleg,
  sortering,
  onSorteer,
  rechts = false,
  plakkend = false,
}: {
  kolom: SorteerKolom;
  label: string;
  uitleg?: string;
  sortering: { kolom: SorteerKolom; aflopend: boolean };
  onSorteer: (kolom: SorteerKolom) => void;
  rechts?: boolean;
  plakkend?: boolean;
}) {
  const actief = sortering.kolom === kolom;
  return (
    <th
      scope="col"
      aria-sort={actief ? (sortering.aflopend ? "descending" : "ascending") : undefined}
      className={`whitespace-nowrap px-3 py-3 font-semibold ${rechts ? "text-right" : ""} ${
        plakkend ? `sticky left-0 z-20 bg-white pl-4 dark:bg-zinc-900 ${scheidingslijn}` : ""
      }`}
    >
      <button
        type="button"
        onClick={() => onSorteer(kolom)}
        title={uitleg ? `Sorteer op ${uitleg.toLowerCase()}` : `Sorteer op ${label.toLowerCase()}`}
        className={`inline-flex items-center gap-1 uppercase hover:text-zinc-900 dark:hover:text-zinc-100 ${
          actief ? "text-emerald-700 dark:text-emerald-400" : ""
        }`}
      >
        {label}
        <span aria-hidden className={actief ? "" : "opacity-0"}>
          {sortering.aflopend ? "↓" : "↑"}
        </span>
      </button>
    </th>
  );
}
