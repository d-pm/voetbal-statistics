"use client"; // dit onderdeel draait in de browser, want het reageert op klikken en typen

import { useMemo, useState, type ReactNode } from "react";
import type { Positie, Speler } from "@/lib/competitie";
import {
  STANDAARD,
  aantalFilters,
  isGefilterd,
  pasToe,
  standaardAflopend,
  type Filters,
  type SorteerKolom,
} from "@/lib/filters";
import {
  KOLOMMEN,
  MIN_MINUTEN_VERGELIJKING,
  POSITIE_NAMEN,
  formatteer,
  waarde,
  type Statistiek,
} from "@/lib/statistieken";
import { useUrlFilters } from "./gebruik-url-filters";
import { PijlOmlaag, PijlRechts, PijlenOpNeer, Schuifjes, Vergrootglas, Volgorde, Waarschuwing } from "./iconen";
import { Nieuws } from "./nieuws";
import { Schakelaar } from "./schakelaar";
import { SegmentKeuze } from "./segment-keuze";
import { Sheet } from "./sheet";
import { SpelerSheet } from "./speler-sheet";
import { lijnErboven } from "./stijl";

const POSITIES: { waarde: Positie | "ALLE"; label: string; kort: string }[] = [
  { waarde: "ALLE", label: "Alle", kort: "Alle" },
  { waarde: "GKP", label: "Keepers", kort: "GKP" },
  { waarde: "DEF", label: "Verdedigers", kort: "DEF" },
  { waarde: "MID", label: "Middenvelders", kort: "MID" },
  { waarde: "FWD", label: "Aanvallers", kort: "FWD" },
];

const MAX_RIJEN = 100; // meer rijen tonen we pas als je erom vraagt

/** De scoutingdatabase. De filters staan in de URL, zodat je een zoekopdracht kunt delen. */
export function Scouting({ spelers }: { spelers: Speler[] }) {
  const [filters, wijzig, vanBuitenaf] = useUrlFilters();
  // "key": kom je via een link bij een andere zoekopdracht, dan begint de tabel opnieuw.
  // Zo blijft er geen oude zoekterm staan die alle spelers verbergt.
  return <ScoutingTabel key={vanBuitenaf} spelers={spelers} filters={filters} onWijzig={wijzig} />;
}

/**
 * Dezelfde tabel met de standaardfilters. Die staat al in de pagina die de server
 * stuurt, zodat je meteen spelers ziet terwijl de browser de echte versie klaarzet.
 */
export function ScoutingBijLaden({ spelers }: { spelers: Speler[] }) {
  return <ScoutingTabel spelers={spelers} filters={STANDAARD} onWijzig={() => {}} />;
}

function ScoutingTabel({
  spelers,
  filters,
  onWijzig,
}: {
  spelers: Speler[];
  filters: Filters;
  onWijzig: (wijziging: Partial<Filters>) => void;
}) {
  // Wat alleen voor dit moment telt, staat niet in de URL maar in gewone state
  const [zoekterm, setZoekterm] = useState("");
  const [toonAlles, setToonAlles] = useState(false);
  const [gekozenId, setGekozenId] = useState<number | null>(null); // de speler waarvan de kaart open is
  const [filtersOpen, setFiltersOpen] = useState(false); // de filters op een gsm

  // Alle teams voor de keuzelijst, alfabetisch
  const teams = useMemo(() => {
    const perAfkorting = new Map(spelers.map((s) => [s.team, s.teamNaam]));
    return [...perAfkorting].sort((a, b) => a[1].localeCompare(b[1]));
  }, [spelers]);

  // Filteren en sorteren. useMemo rekent dit alleen opnieuw uit als er iets veranderd is.
  const resultaat = useMemo(() => pasToe(spelers, filters, zoekterm), [spelers, filters, zoekterm]);

  function sorteerOp(kolom: SorteerKolom) {
    onWijzig(
      filters.sorteer === kolom
        ? { aflopend: !filters.aflopend } // nog eens klikken = andere richting
        : { sorteer: kolom, aflopend: standaardAflopend(kolom) },
    );
  }

  function wisFilters() {
    setZoekterm("");
    // sorteren en "per 90" laten we staan: die verbergen niemand
    onWijzig({
      positie: STANDAARD.positie,
      team: STANDAARD.team,
      maxLeeftijd: STANDAARD.maxLeeftijd,
      minMinuten: STANDAARD.minMinuten,
      alleenFit: STANDAARD.alleenFit,
    });
  }

  const { per90 } = filters;
  const zichtbaar = toonAlles ? resultaat : resultaat.slice(0, MAX_RIJEN);
  const gekozen = spelers.find((s) => s.id === gekozenId) ?? null;
  const gefilterd = isGefilterd(filters, zoekterm);
  const aantalAan = aantalFilters(filters);
  // Per 90 met weinig minuten: één goede invalbeurt geeft dan al een topcijfer
  const per90Onbetrouwbaar = per90 && (filters.minMinuten ?? 0) < MIN_MINUTEN_VERGELIJKING;

  // Team, leeftijd, minuten en beschikbaarheid. Op een computer staan ze op de pagina,
  // op een gsm in een sheet: zo zie je daar meteen spelers.
  function filterVelden(achtergrond: string) {
    return (
      <>
        <FilterRij label="Team" achtergrond={achtergrond}>
          <select
            value={filters.team}
            onChange={(e) => onWijzig({ team: e.target.value })}
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
        <FilterRij label="Max. leeftijd" achtergrond={achtergrond}>
          <input
            type="number"
            inputMode="numeric"
            min={15}
            max={45}
            value={filters.maxLeeftijd ?? ""}
            onChange={(e) => onWijzig({ maxLeeftijd: naarGetal(e.target.value) })}
            placeholder="Geen"
            className={waardeStijl}
          />
        </FilterRij>
        <FilterRij label="Min. minuten" achtergrond={achtergrond}>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            step={90}
            value={filters.minMinuten ?? ""}
            onChange={(e) => onWijzig({ minMinuten: naarGetal(e.target.value) })}
            placeholder="0"
            className={waardeStijl}
          />
        </FilterRij>
        <FilterRij label="Alleen beschikbaar" uitleg="Verbergt wie geblesseerd of geschorst is" achtergrond={achtergrond}>
          <span className="flex-1" />
          <Schakelaar aan={filters.alleenFit} onWissel={(alleenFit) => onWijzig({ alleenFit })} />
        </FilterRij>
      </>
    );
  }

  // Op een gsm toont elke rij één cijfer: het cijfer waarop je sorteert
  const getoond: Statistiek =
    filters.sorteer === "naam" || filters.sorteer === "leeftijd" ? "minuten" : filters.sorteer;
  const getoondLabel = KOLOMMEN.find((k) => k.sleutel === getoond)!.label;

  return (
    <section>
      {/* ---- Filters ---- */}
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_36rem]">
        <label className="relative flex h-10 items-center rounded-[10px] bg-vulling has-focus-visible:ring-2 has-focus-visible:ring-accent/50">
          <Vergrootglas className="pointer-events-none absolute left-2.5 size-4 text-secundair" />
          <span className="sr-only">Zoek op naam of team</span>
          <input
            type="search"
            value={zoekterm}
            onChange={(e) => setZoekterm(e.target.value)}
            placeholder="Zoek een speler of team"
            className="h-full w-full bg-transparent pl-8 pr-3 text-[17px] outline-none placeholder:text-secundair sm:text-[15px]"
          />
        </label>

        <SegmentKeuze
          label="Positie"
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
          gekozen={filters.positie}
          onKies={(positie) => onWijzig({ positie })}
        />
      </div>

      {/* De lijntjes tussen de vakjes zijn de achtergrond die door de kiertjes (gap-px) schijnt */}
      <div className="mt-3 hidden gap-px overflow-hidden rounded-xl bg-lijn md:grid md:grid-cols-2 lg:grid-cols-4">
        {filterVelden("bg-kaart")}
      </div>

      {/* Op een gsm: een knop voor de filters, naast Totaal / Per 90 */}
      <div className="mt-3 flex gap-3 md:hidden">
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          aria-label={aantalAan > 0 ? `Filters, ${aantalAan} aan` : "Filters"}
          className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[9px] px-3 text-[13px] font-semibold outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-accent/50 active:opacity-60 ${
            aantalAan > 0 ? "bg-accent-zacht text-accent" : "bg-vulling"
          }`}
        >
          <Schuifjes className="size-4" />
          Filters
          {aantalAan > 0 && (
            <span className="grid size-5 place-items-center rounded-full bg-accent text-[11px] tabular-nums text-op-accent">
              {aantalAan}
            </span>
          )}
        </button>
        <SegmentKeuze
          label="Weergave"
          className="flex-1"
          opties={[
            { waarde: false, label: "Totaal" },
            { waarde: true, label: "Per 90 min" },
          ]}
          gekozen={per90}
          onKies={(keuze) => onWijzig({ per90: keuze })}
        />
      </div>

      {/* ---- Weergave, aantal en sorteren ---- */}
      <div className="mt-3 flex flex-col gap-3 md:mt-5 md:flex-row md:items-center md:justify-between">
        <div className="hidden md:order-2 md:block md:w-64">
          <SegmentKeuze
            label="Weergave"
            opties={[
              { waarde: false, label: "Totaal" },
              { waarde: true, label: "Per 90 min" },
            ]}
            gekozen={per90}
            onKies={(keuze) => onWijzig({ per90: keuze })}
          />
        </div>

        <div className="flex min-h-9 items-center justify-between gap-3 px-1">
          <p className="flex items-center gap-3 text-[13px] font-semibold text-secundair">
            <span aria-live="polite" className="whitespace-nowrap">
              {resultaat.length} {resultaat.length === 1 ? "speler" : "spelers"}
            </span>
            {/* Op een gsm staat "Wis filters" in de filtersheet: hier is daar geen plaats voor */}
            {gefilterd && (
              <button
                type="button"
                onClick={wisFilters}
                className="hidden whitespace-nowrap rounded text-accent md:inline outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-accent/50 active:opacity-50"
              >
                Wis filters
              </button>
            )}
          </p>

          {/* Op een gsm kies je hier waarop je sorteert. In de tabel klik je op een kolom. */}
          <div className="flex items-center md:hidden">
            <label className="relative flex items-center text-accent">
              <span className="sr-only">Sorteer op</span>
              <select
                value={filters.sorteer}
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
              onClick={() => onWijzig({ aflopend: !filters.aflopend })}
              aria-label="Volgorde omdraaien"
              className="ml-1 grid size-9 place-items-center rounded-full text-accent transition-colors active:bg-vulling"
            >
              <Volgorde
                className={`size-4 transition-transform duration-300 motion-reduce:transition-none ${
                  filters.aflopend ? "" : "rotate-180"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {per90Onbetrouwbaar && (
        <p className="mb-2 flex gap-1.5 px-1 text-[13px] leading-snug text-waarschuwing">
          <Waarschuwing className="mt-px size-3.5 shrink-0" />
          <span>
            Met minder dan {MIN_MINUTEN_VERGELIJKING} minuten zeggen cijfers per 90 weinig: één goede invalbeurt geeft
            al een topcijfer.{" "}
            <button
              type="button"
              onClick={() => onWijzig({ minMinuten: MIN_MINUTEN_VERGELIJKING })}
              className="rounded font-semibold underline underline-offset-2 outline-none focus-visible:ring-2 focus-visible:ring-accent/50 active:opacity-50"
            >
              Zet op {MIN_MINUTEN_VERGELIJKING}
            </button>
          </span>
        </p>
      )}

      <div className="mt-1.5">
        {resultaat.length === 0 ? (
          <div className="grid place-items-center rounded-2xl bg-kaart px-6 py-14 text-center">
            <Vergrootglas className="size-8 text-tertiair" />
            <p className="mt-3 text-[17px] font-semibold">Geen spelers gevonden</p>
            <p className="mt-1 text-[15px] text-secundair">Niemand past bij al je filters samen.</p>
            <button type="button" onClick={wisFilters} className={`mt-5 ${knop}`}>
              Wis filters
            </button>
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
                      <Nieuws speler={s} className="mt-0.5 text-[13px]" />
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
                    <KolomKop kolom="naam" label="Speler" filters={filters} onSorteer={sorteerOp} plakkend />
                    <KolomKop kolom="leeftijd" label="Leeftijd" filters={filters} onSorteer={sorteerOp} rechts />
                    {KOLOMMEN.map((k) => (
                      <KolomKop
                        key={k.sleutel}
                        kolom={k.sleutel}
                        label={k.label}
                        uitleg={k.uitleg}
                        filters={filters}
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
                          <Nieuws speler={s} className="mt-0.5 text-xs" />
                        </button>
                      </td>
                      <td
                        className={`${cel} px-3 text-right tabular-nums ${filters.sorteer === "leeftijd" ? gesorteerd : ""}`}
                      >
                        {s.leeftijd ?? "–"}
                      </td>
                      {KOLOMMEN.map((k) => (
                        <td
                          key={k.sleutel}
                          className={`${cel} px-3 text-right tabular-nums ${filters.sorteer === k.sleutel ? gesorteerd : ""}`}
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
      </div>

      {!toonAlles && resultaat.length > MAX_RIJEN && (
        <div className="mt-4 flex justify-center">
          <button type="button" onClick={() => setToonAlles(true)} className={knop}>
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

      {/* De filters op een gsm. Het aantal spelers op de knop verandert mee terwijl je kiest. */}
      <Sheet
        open={filtersOpen}
        onSluit={() => setFiltersOpen(false)}
        titelId="filters-titel"
        sluitTekst="Klaar"
        kop={
          <h2 id="filters-titel" className="pt-0.5 text-[22px] font-bold tracking-[-0.02em]">
            Filters
          </h2>
        }
      >
        <div className="grid gap-px overflow-hidden rounded-xl bg-lijn">{filterVelden("bg-vlak")}</div>
        {aantalAan > 0 && (
          <button type="button" onClick={wisFilters} className="mt-3 h-11 w-full text-[17px] font-semibold text-accent outline-none active:opacity-50">
            Wis filters
          </button>
        )}
        <button
          type="button"
          onClick={() => setFiltersOpen(false)}
          className="mt-3 flex h-12 w-full items-center justify-center rounded-xl bg-accent text-[17px] font-semibold text-op-accent outline-none transition-[opacity,transform] duration-100 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-kaart active:scale-[0.98] active:opacity-80"
        >
          Toon {resultaat.length} {resultaat.length === 1 ? "speler" : "spelers"}
        </button>
      </Sheet>
    </section>
  );
}

/** Wat je in een getalvakje typt -> een getal, of null als het vakje leeg is. */
function naarGetal(tekst: string) {
  return tekst === "" ? null : Math.max(0, Math.floor(Number(tekst)));
}

const knop =
  "h-11 rounded-full bg-kaart px-5 text-[15px] font-semibold text-accent outline-none transition-[opacity,transform] duration-100 focus-visible:ring-2 focus-visible:ring-accent/50 active:scale-[0.97] active:opacity-70";

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

function FilterRij({
  label,
  uitleg,
  achtergrond,
  children,
}: {
  label: string;
  uitleg?: string;
  achtergrond: string; // bg-kaart op de pagina, bg-vlak in de sheet
  children: ReactNode;
}) {
  return (
    <label
      title={uitleg}
      className={`flex h-11 items-center gap-2 pl-4 pr-3 transition-colors has-focus-visible:bg-kaart-hover ${achtergrond}`}
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
  filters,
  onSorteer,
  rechts = false,
  plakkend = false,
}: {
  kolom: SorteerKolom;
  label: string;
  uitleg?: string;
  filters: Filters;
  onSorteer: (kolom: SorteerKolom) => void;
  rechts?: boolean;
  plakkend?: boolean;
}) {
  const actief = filters.sorteer === kolom;
  return (
    <th
      scope="col"
      aria-sort={actief ? (filters.aflopend ? "descending" : "ascending") : undefined}
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
            actief && !filters.aflopend ? "rotate-180" : ""
          }`}
        />
      </button>
    </th>
  );
}
