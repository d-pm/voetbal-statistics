"use client"; // dit onderdeel draait in de browser, want het reageert op klikken en typen

import { useMemo, useState, type ReactNode } from "react";
import type { Positie, Speler } from "@/lib/spelers";
import { KOLOMMEN, POSITIE_NAMEN, formatteer, waarde, type Statistiek } from "@/lib/statistieken";
import { PijlOmlaag, PijlRechts, PijlenOpNeer, Vergrootglas, Volgorde, Waarschuwing } from "./iconen";
import { SegmentKeuze } from "./segment-keuze";
import { SpelerSheet } from "./speler-sheet";
import { lijnErboven } from "./stijl";

type SorteerKolom = Statistiek | "naam" | "leeftijd";
type Sortering = { kolom: SorteerKolom; aflopend: boolean };

const POSITIES: { waarde: Positie | "ALLE"; label: string; kort: string }[] = [
  { waarde: "ALLE", label: "Alle", kort: "Alle" },
  { waarde: "GKP", label: "Keepers", kort: "GKP" },
  { waarde: "DEF", label: "Verdedigers", kort: "DEF" },
  { waarde: "MID", label: "Middenvelders", kort: "MID" },
  { waarde: "FWD", label: "Aanvallers", kort: "FWD" },
];

const MAX_RIJEN = 100; // meer rijen tonen we pas als je erom vraagt

export function ScoutingTabel({ spelers }: { spelers: Speler[] }) {
  // De filters: elke keer dat er één verandert, tekent React de tabel opnieuw
  const [zoekterm, setZoekterm] = useState("");
  const [positie, setPositie] = useState<Positie | "ALLE">("ALLE");
  const [team, setTeam] = useState("ALLE");
  const [maxLeeftijd, setMaxLeeftijd] = useState("");
  const [minMinuten, setMinMinuten] = useState("270");
  const [per90, setPer90] = useState(false);
  const [sortering, setSortering] = useState<Sortering>({ kolom: "xg", aflopend: true });
  const [toonAlles, setToonAlles] = useState(false);
  const [gekozenId, setGekozenId] = useState<number | null>(null); // de speler waarvan de kaart open is

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
  const gekozen = spelers.find((s) => s.id === gekozenId) ?? null;

  // Op een gsm toont elke rij één cijfer: het cijfer waarop je sorteert
  const getoond: Statistiek =
    sortering.kolom === "naam" || sortering.kolom === "leeftijd" ? "minuten" : sortering.kolom;
  const getoondLabel = KOLOMMEN.find((k) => k.sleutel === getoond)!.label;

  return (
    <section>
      {/* ---- Filters ---- */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <label className="relative flex h-10 items-center rounded-[10px] bg-vulling has-focus-visible:ring-2 has-focus-visible:ring-accent/50">
          <Vergrootglas className="pointer-events-none absolute left-2.5 size-4 text-secundair" />
          <span className="sr-only">Zoek op naam</span>
          <input
            type="search"
            value={zoekterm}
            onChange={(e) => setZoekterm(e.target.value)}
            placeholder="Zoek een speler"
            className="h-full w-full bg-transparent pl-8 pr-3 text-[17px] outline-none placeholder:text-secundair sm:text-[15px]"
          />
        </label>

        <SegmentKeuze
          label="Positie"
          className="lg:w-[36rem]"
          opties={POSITIES.map((p) => ({
            waarde: p.waarde,
            uitleg: p.label,
            label: (
              <>
                <span className="sm:hidden">{p.kort}</span>
                <span className="hidden sm:inline">{p.label}</span>
              </>
            ),
          }))}
          gekozen={positie}
          onKies={setPositie}
        />

        <div className="grid overflow-hidden rounded-xl bg-kaart sm:grid-cols-3">
          <FilterRij label="Team">
            <select
              value={team}
              onChange={(e) => setTeam(e.target.value)}
              className={`${waardeStijl} appearance-none truncate [text-align-last:right]`}
            >
              <option value="ALLE">Alle teams</option>
              {teams.map(([afkorting, naam]) => (
                <option key={afkorting} value={afkorting}>
                  {naam}
                </option>
              ))}
            </select>
            <PijlenOpNeer className="pointer-events-none size-3.5 shrink-0 text-secundair" />
          </FilterRij>
          <FilterRij label="Max. leeftijd">
            <input
              type="number"
              inputMode="numeric"
              min={15}
              max={45}
              value={maxLeeftijd}
              onChange={(e) => setMaxLeeftijd(e.target.value)}
              placeholder="Geen"
              className={waardeStijl}
            />
          </FilterRij>
          <FilterRij label="Min. minuten">
            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={90}
              value={minMinuten}
              onChange={(e) => setMinMinuten(e.target.value)}
              className={waardeStijl}
            />
          </FilterRij>
        </div>

        <SegmentKeuze
          label="Weergave"
          className="lg:w-[16rem]"
          opties={[
            { waarde: false, label: "Totaal" },
            { waarde: true, label: "Per 90 min" },
          ]}
          gekozen={per90}
          onKies={setPer90}
        />
      </div>

      {/* ---- Aantal en sorteren ---- */}
      <div className="mt-6 flex min-h-9 items-center justify-between gap-3 px-1 pb-1.5">
        <p className="text-[13px] font-semibold text-secundair" aria-live="polite">
          {resultaat.length} {resultaat.length === 1 ? "speler" : "spelers"}
        </p>

        {/* Op een gsm kies je hier waarop je sorteert. In de tabel klik je op een kolom. */}
        <div className="flex items-center md:hidden">
          <label className="relative flex items-center text-accent">
            <span className="sr-only">Sorteer op</span>
            <select
              value={sortering.kolom}
              onChange={(e) => sorteerOp(e.target.value as SorteerKolom)}
              className="appearance-none bg-transparent py-1 pr-5 text-base font-semibold outline-none [text-align-last:right]"
            >
              <option value="naam">Naam</option>
              <option value="leeftijd">Leeftijd</option>
              {KOLOMMEN.map((k) => (
                <option key={k.sleutel} value={k.sleutel}>
                  {k.uitleg}
                </option>
              ))}
            </select>
            <PijlenOpNeer className="pointer-events-none absolute right-0 size-3.5" />
          </label>
          <button
            type="button"
            onClick={() => setSortering((huidig) => ({ ...huidig, aflopend: !huidig.aflopend }))}
            aria-label="Volgorde omdraaien"
            className="ml-1 grid size-9 place-items-center rounded-full text-accent transition-colors active:bg-vulling"
          >
            <Volgorde
              className={`size-4 transition-transform duration-300 motion-reduce:transition-none ${
                sortering.aflopend ? "" : "rotate-180"
              }`}
            />
          </button>
        </div>
      </div>

      {resultaat.length === 0 ? (
        <div className="grid place-items-center rounded-2xl bg-kaart px-6 py-14 text-center">
          <Vergrootglas className="size-8 text-tertiair" />
          <p className="mt-3 text-[17px] font-semibold">Geen spelers gevonden</p>
          <p className="mt-1 text-[15px] text-secundair">Pas je filters aan of zoek op een andere naam.</p>
        </div>
      ) : (
        <>
          {/* ---- Lijst, op een gsm ---- */}
          <ul className="overflow-hidden rounded-2xl bg-kaart md:hidden">
            {zichtbaar.map((s) => (
              <li key={s.id} className={lijnErboven}>
                <button
                  type="button"
                  onClick={() => setGekozenId(s.id)}
                  className="flex w-full items-center gap-3 py-2.5 pl-4 pr-3 text-left transition-colors active:bg-kaart-druk"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[17px] font-semibold tracking-[-0.022em]">{s.naam}</span>
                    <span className="block truncate text-[13px] text-secundair">
                      {s.team} · {POSITIE_NAMEN[s.positie]}
                      {s.leeftijd !== null && ` · ${s.leeftijd} jaar`}
                    </span>
                    {s.nieuws && (
                      <span className="mt-0.5 flex items-center gap-1 text-[13px] text-waarschuwing">
                        <Waarschuwing className="size-3.5 shrink-0" />
                        <span className="truncate">{s.nieuws}</span>
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block text-[17px] font-semibold tabular-nums">
                      {formatteer(getoond, waarde(s, getoond, per90), per90)}
                    </span>
                    <span className="block text-[11px] text-secundair">
                      {getoondLabel}
                      {per90 && getoond !== "minuten" && " /90"}
                    </span>
                  </span>
                  <PijlRechts className="size-3.5 shrink-0 text-tertiair" />
                </button>
              </li>
            ))}
          </ul>

          {/* ---- Tabel, vanaf een tablet ---- */}
          <div className="hidden overflow-x-auto rounded-2xl bg-kaart md:block lg:overflow-clip">
            <table className="w-full min-w-[56rem] border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
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
                  // Klik op een rij (of op de naam) om de kaart van de speler te openen
                  <tr key={s.id} onClick={() => setGekozenId(s.id)} className="group cursor-pointer">
                    <td className={`${cel} sticky left-0 z-10 pl-5 pr-3 ${scheidingslijn}`}>
                      <button type="button" className="block max-w-[15rem] text-left outline-none focus-visible:underline">
                        <span className="block text-[15px] font-semibold tracking-[-0.01em]">{s.naam}</span>
                        <span className="block text-xs text-secundair">
                          {s.team} · {POSITIE_NAMEN[s.positie]}
                        </span>
                        {s.nieuws && (
                          <span className="mt-0.5 flex items-center gap-1 text-xs text-waarschuwing" title={s.nieuws}>
                            <Waarschuwing className="size-3 shrink-0" />
                            <span className="truncate">{s.nieuws}</span>
                          </span>
                        )}
                      </button>
                    </td>
                    <td
                      className={`${cel} px-3 text-right tabular-nums ${sortering.kolom === "leeftijd" ? gesorteerd : ""}`}
                    >
                      {s.leeftijd ?? "–"}
                    </td>
                    {KOLOMMEN.map((k) => (
                      <td
                        key={k.sleutel}
                        className={`${cel} px-3 text-right tabular-nums ${sortering.kolom === k.sleutel ? gesorteerd : ""}`}
                      >
                        {formatteer(k.sleutel, waarde(s, k.sleutel, per90), per90)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!toonAlles && resultaat.length > MAX_RIJEN && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={() => setToonAlles(true)}
            className="h-11 rounded-full bg-kaart px-5 text-[15px] font-semibold text-accent transition-[opacity,transform] duration-100 active:scale-[0.97] active:opacity-70"
          >
            Toon alle {resultaat.length} spelers
          </button>
        </div>
      )}

      <p className="mt-4 hidden px-1 text-xs leading-relaxed text-secundair md:block">
        {KOLOMMEN.filter((k) => k.label !== k.uitleg)
          .map((k) => `${k.label} = ${k.uitleg.toLowerCase()}`)
          .join(" · ")}
      </p>

      <SpelerSheet speler={gekozen} onSluit={() => setGekozenId(null)} />
    </section>
  );
}

// Elke cel: lijntje erboven, iets lichter als je erover gaat, donkerder als je klikt
const cel =
  "border-t border-lijn bg-kaart py-2.5 transition-colors duration-100 group-first:border-t-0 group-hover:bg-kaart-hover group-active:bg-kaart-druk";

// De kolom waarop je sorteert: vet, met een zacht groen vlak erachter
const gesorteerd = "font-semibold bg-[image:linear-gradient(var(--color-accent-zacht),var(--color-accent-zacht))]";

// Lijntje rechts van de spelerskolom, die blijft staan als je de tabel opzij scrolt
const scheidingslijn = "shadow-[inset_-1px_0_0_var(--color-lijn)] lg:shadow-none";

// De waarde rechts in een filterrij, zoals in de Instellingen van een iPhone
const waardeStijl =
  "min-w-0 flex-1 bg-transparent text-right text-[17px] tabular-nums text-secundair outline-none placeholder:text-secundair sm:text-[15px]";

// Lijntje tussen de filterrijen: liggend op een gsm, staand naast elkaar op een groter scherm
const lijnTussenFilters =
  "not-first:before:absolute not-first:before:top-0 not-first:before:right-0 not-first:before:left-4 not-first:before:h-px not-first:before:bg-lijn sm:not-first:before:top-2.5 sm:not-first:before:bottom-2.5 sm:not-first:before:left-0 sm:not-first:before:right-auto sm:not-first:before:h-auto sm:not-first:before:w-px";

function FilterRij({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label
      className={`relative flex h-11 items-center gap-2 pl-4 pr-3 transition-colors has-focus-visible:bg-kaart-hover ${lijnTussenFilters}`}
    >
      <span className="shrink-0 text-[17px] sm:text-[15px]">{label}</span>
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
  sortering: Sortering;
  onSorteer: (kolom: SorteerKolom) => void;
  rechts?: boolean;
  plakkend?: boolean;
}) {
  const actief = sortering.kolom === kolom;
  return (
    <th
      scope="col"
      aria-sort={actief ? (sortering.aflopend ? "descending" : "ascending") : undefined}
      // De koprij blijft bovenaan staan als je scrolt, doorschijnend zoals de bovenbalk
      className={`whitespace-nowrap border-b border-lijn bg-kaart/85 py-3 text-xs font-semibold text-secundair backdrop-blur-xl lg:top-12 ${
        rechts ? "px-3 text-right" : "pl-5 pr-3 text-left"
      } ${plakkend ? `sticky left-0 z-30 ${scheidingslijn}` : "lg:sticky lg:z-20"}`}
    >
      <button
        type="button"
        onClick={() => onSorteer(kolom)}
        title={uitleg ? `Sorteer op ${uitleg.toLowerCase()}` : `Sorteer op ${label.toLowerCase()}`}
        className={`inline-flex items-center gap-0.5 rounded outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent/50 ${
          rechts ? "flex-row-reverse" : ""
        } ${actief ? "text-accent" : "hover:text-primair"}`}
      >
        {label}
        <PijlOmlaag
          className={`size-3 transition-transform duration-200 motion-reduce:transition-none ${actief ? "" : "invisible"} ${
            actief && !sortering.aflopend ? "rotate-180" : ""
          }`}
        />
      </button>
    </th>
  );
}
